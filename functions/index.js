const { createHmac, createHash, randomInt, timingSafeEqual } = require('node:crypto');
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { FieldValue, getFirestore, Timestamp } = require('firebase-admin/firestore');
const { defineSecret } = require('firebase-functions/params');
const { HttpsError, onCall } = require('firebase-functions/v2/https');
const { setGlobalOptions } = require('firebase-functions/v2');

initializeApp();
setGlobalOptions({ region: 'us-central1', maxInstances: 10 });

const db = getFirestore();
const resendApiKey = defineSecret('RESEND_API_KEY');
const otpHmacSecret = defineSecret('OTP_HMAC_SECRET');
const emailFrom = defineSecret('EMAIL_FROM');
const telegramBotToken = defineSecret('TELEGRAM_BOT_TOKEN');
const telegramChatId = defineSecret('TELEGRAM_CHAT_ID');
const CODE_TTL_MS = 10 * 60 * 1000;
const SEND_COOLDOWN_MS = 60 * 1000;
const MAX_EMAIL_CODES_PER_DAY = 5;
const MAX_IP_CODES_PER_DAY = 30;
const MAX_VERIFY_ATTEMPTS = 5;
const MAX_TELEGRAM_ORDERS_PER_IP_PER_DAY = 50;

function normalizeEmail(value) {
  if (typeof value !== 'string') throw new HttpsError('invalid-argument', 'Enter a valid email address.');
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new HttpsError('invalid-argument', 'Enter a valid email address.');
  }
  return email;
}

function codeDigest(email, code) {
  return createHmac('sha256', otpHmacSecret.value()).update(`${email}:${code}`).digest('hex');
}

function digestMatches(actual, expected) {
  const actualBuffer = Buffer.from(actual, 'hex');
  const expectedBuffer = Buffer.from(expected, 'hex');
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

function hashValue(value) {
  return createHash('sha256').update(value).digest('hex');
}

async function sendCodeEmail(email, code) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey.value()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: emailFrom.value(),
      to: [email],
      subject: 'Tech3D sign-in code',
      text: `Your Tech3D sign-in code is ${code}. It expires in 10 minutes. If you did not request this code, you can ignore this email.`,
      html: `<p>Your Tech3D sign-in code is:</p><p style="font-size:28px;font-weight:bold;letter-spacing:6px">${code}</p><p>This code expires in 10 minutes. If you did not request it, you can ignore this email.</p>`
    })
  });
  if (!response.ok) throw new Error(`Email provider returned HTTP ${response.status}.`);
}

exports.requestEmailCode = onCall({
  secrets: [resendApiKey, otpHmacSecret, emailFrom]
}, async request => {
  const email = normalizeEmail(request.data?.email);
  const emailHash = hashValue(email);
  const ip = request.rawRequest.ip || 'unknown';
  const ipHash = hashValue(ip);
  const now = Date.now();
  const day = new Date(now).toISOString().slice(0, 10);
  const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
  const challengeRef = db.collection('emailLoginChallenges').doc(emailHash);
  const emailRateRef = db.collection('emailLoginRateLimits').doc(emailHash);
  const ipRateRef = db.collection('emailLoginIpRateLimits').doc(ipHash);

  const reservation = await db.runTransaction(async transaction => {
    const [challengeSnapshot, emailRateSnapshot, ipRateSnapshot] = await Promise.all([
      transaction.get(challengeRef),
      transaction.get(emailRateRef),
      transaction.get(ipRateRef)
    ]);
    const emailRate = emailRateSnapshot.data() || {};
    const ipRate = ipRateSnapshot.data() || {};
    const emailCount = emailRate.day === day ? emailRate.count || 0 : 0;
    const ipCount = ipRate.day === day ? ipRate.count || 0 : 0;
    const lastSentAt = emailRate.lastSentAt || 0;

    if (now - lastSentAt < SEND_COOLDOWN_MS
      || emailCount >= MAX_EMAIL_CODES_PER_DAY
      || ipCount >= MAX_IP_CODES_PER_DAY) return false;

    transaction.set(emailRateRef, {
      day,
      count: emailCount + 1,
      lastSentAt: now
    });
    transaction.set(ipRateRef, { day, count: ipCount + 1 });
    transaction.set(challengeRef, {
      codeHash: codeDigest(email, code),
      expiresAt: Timestamp.fromMillis(now + CODE_TTL_MS),
      attempts: 0
    });
    return true;
  });

  if (!reservation) {
    throw new HttpsError('resource-exhausted', 'Please wait before requesting another code.');
  }

  try {
    await sendCodeEmail(email, code);
  } catch (error) {
    await db.runTransaction(async transaction => {
      const snapshot = await transaction.get(challengeRef);
      if (snapshot.data()?.codeHash === codeDigest(email, code)) transaction.delete(challengeRef);
    });
    console.error('Unable to deliver sign-in code:', error.message);
    throw new HttpsError('unavailable', 'Unable to send a sign-in code right now.');
  }

  return { sent: true };
});

exports.verifyEmailCode = onCall({
  secrets: [otpHmacSecret]
}, async request => {
  const email = normalizeEmail(request.data?.email);
  const code = request.data?.code;
  if (typeof code !== 'string' || !/^\d{6}$/.test(code)) {
    throw new HttpsError('invalid-argument', 'Enter the six-digit code.');
  }

  const emailHash = hashValue(email);
  const challengeRef = db.collection('emailLoginChallenges').doc(emailHash);
  const now = Date.now();
  const verified = await db.runTransaction(async transaction => {
    const snapshot = await transaction.get(challengeRef);
    if (!snapshot.exists) return 'missing';
    const challenge = snapshot.data();
    if (challenge.expiresAt.toMillis() <= now) {
      transaction.delete(challengeRef);
      return 'expired';
    }
    if (challenge.attempts >= MAX_VERIFY_ATTEMPTS) {
      transaction.delete(challengeRef);
      return 'locked';
    }
    if (!digestMatches(codeDigest(email, code), challenge.codeHash)) {
      const attempts = challenge.attempts + 1;
      if (attempts >= MAX_VERIFY_ATTEMPTS) transaction.delete(challengeRef);
      else transaction.update(challengeRef, { attempts });
      return 'invalid';
    }
    transaction.delete(challengeRef);
    return 'verified';
  });

  if (verified !== 'verified') {
    throw new HttpsError('unauthenticated', 'The code is invalid or expired. Request a new one.');
  }

  const auth = getAuth();
  let user;
  try {
    user = await auth.getUserByEmail(email);
    if (!user.emailVerified) user = await auth.updateUser(user.uid, { emailVerified: true });
  } catch (error) {
    if (error.code !== 'auth/user-not-found') throw error;
    user = await auth.createUser({ email, emailVerified: true });
  }
  const customToken = await auth.createCustomToken(user.uid);
  return { token: customToken };
});

function escapeTelegramHtml(value, maximumLength = 200) {
  return String(value || '').slice(0, maximumLength).replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

function formatSom(value) {
  return Number(value).toLocaleString('ru-RU').replace(/\u00a0/g, ' ');
}

function telegramOrderMessages(order) {
  const itemMessages = order.items.map(item => [
      `📱 <b>Товар:</b> ${escapeTelegramHtml(item.name, 120)}`,
      `🎨 <b>Цвет:</b> ${escapeTelegramHtml(item.color || '—', 80)}`,
      `💾 <b>Память:</b> ${escapeTelegramHtml(item.memory || item.variant || '—', 80)}`,
      `💰 <b>Цена:</b> ${formatSom(item.unitPrice * item.quantity)} сом${item.quantity > 1 ? ` (×${item.quantity})` : ''}`
  ].join('\n'));
  const customerLines = [
    `👤 <b>Покупатель:</b> ${escapeTelegramHtml(order.customerName, 100)}`,
    `📞 <b>Телефон:</b> ${escapeTelegramHtml(order.phone)}`,
    `💰 <b>Итого:</b> ${formatSom(order.total)} сом`
  ];
  if (order.address) customerLines.push(`📍 <b>Адрес:</b> ${escapeTelegramHtml(order.address, 150)}`);
  if (order.comment) customerLines.push(`💬 <b>Комментарий:</b> ${escapeTelegramHtml(order.comment, 150)}`);

  const messages = [];
  let current = ['📦 <b>Новый заказ в Tech3D!</b>'];
  for (const itemMessage of itemMessages) {
    const candidate = [...current, itemMessage, ...customerLines].join('\n\n');
    if (candidate.length > 4000 && current.length > 1) {
      messages.push([...current, ...customerLines].join('\n\n'));
      current = ['📦 <b>Новый заказ в Tech3D! (продолжение)</b>'];
    }
    current.push(itemMessage);
  }
  messages.push([...current, ...customerLines].join('\n\n'));
  return messages;
}

async function sendTelegramMessage(order) {
  for (const text of telegramOrderMessages(order)) {
    let response;
    try {
      response = await fetch(`https://api.telegram.org/bot${telegramBotToken.value()}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(10000),
        body: JSON.stringify({
          chat_id: telegramChatId.value(),
          text,
          parse_mode: 'HTML',
          disable_web_page_preview: true
        })
      });
    } catch (failure) {
      console.error('Unable to reach Telegram Bot API:', failure.name || 'unknown');
      throw new HttpsError('unavailable', 'Telegram notification could not be delivered.');
    }
    let result;
    try {
      result = await response.json();
    } catch {
      result = null;
    }
    if (!response.ok || result?.ok !== true) {
      const description = typeof result?.description === 'string'
        ? result.description.slice(0, 250)
        : 'No error description returned.';
      console.error('Telegram Bot API rejected the message:', {
        status: response.status,
        errorCode: result?.error_code || null,
        description
      });
      throw new HttpsError('unavailable', `Telegram rejected the message (${response.status}): ${description}`);
    }
  }
}

async function limitTelegramOrders(request) {
  const ipHash = hashValue(request.rawRequest.ip || 'unknown');
  const day = new Date().toISOString().slice(0, 10);
  const rateRef = db.collection('telegramOrderRateLimits').doc(ipHash);
  const allowed = await db.runTransaction(async transaction => {
    const snapshot = await transaction.get(rateRef);
    const data = snapshot.data() || {};
    const count = data.day === day ? data.count || 0 : 0;
    if (count >= MAX_TELEGRAM_ORDERS_PER_IP_PER_DAY) return false;
    transaction.set(rateRef, {
      day,
      count: count + 1,
      expiresAt: Timestamp.fromMillis(Date.now() + 2 * 24 * 60 * 60 * 1000)
    });
    return true;
  });
  if (!allowed) throw new HttpsError('resource-exhausted', 'Too many orders. Please try again tomorrow.');
}

function validCustomerDetails(customerName, phone) {
  return typeof customerName === 'string'
    && customerName.trim().length >= 2
    && customerName.trim().length <= 100
    && typeof phone === 'string'
    && phone.trim().length >= 9
    && phone.trim().length <= 30
    && /^\+?[\d\s().-]+$/.test(phone.trim())
    && phone.replace(/\D/g, '').length >= 9;
}

async function deliverOrderNotification(orderRef, order) {
  const claim = await db.runTransaction(async transaction => {
    const snapshot = await transaction.get(orderRef);
    const current = snapshot.data();
    if (current?.telegramSentAt) return 'sent';
    if (current?.telegramSendingUntil?.toMillis() > Date.now()) return 'sending';
    transaction.update(orderRef, {
      telegramSendingUntil: Timestamp.fromMillis(Date.now() + 60 * 1000)
    });
    return 'claimed';
  });
  if (claim === 'sent') return { sent: true };
  if (claim === 'sending') {
    throw new HttpsError('aborted', 'Order notification is already being sent.');
  }
  try {
    await sendTelegramMessage(order);
    await orderRef.update({
      telegramSentAt: Timestamp.now(),
      telegramSendingUntil: FieldValue.delete()
    });
  } catch (failure) {
    try {
      await orderRef.update({ telegramSendingUntil: FieldValue.delete() });
    } catch (releaseFailure) {
      console.error('Unable to release Telegram order notification lock:', releaseFailure.code || 'unknown');
    }
    throw failure;
  }
  return { sent: true };
}

exports.notifyTelegramOrder = onCall({
  secrets: [telegramBotToken, telegramChatId]
}, async request => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in to notify the store about this order.');
  const orderId = request.data?.orderId;
  if (typeof orderId !== 'string' || !/^T3D-[\w-]{10,80}$/.test(orderId)) {
    throw new HttpsError('invalid-argument', 'Invalid order identifier.');
  }
  const orderRef = db.collection('orders').doc(orderId);
  const orderSnapshot = await orderRef.get();
  if (!orderSnapshot.exists || orderSnapshot.data().uid !== request.auth.uid) {
    throw new HttpsError('not-found', 'Order not found.');
  }
  const order = orderSnapshot.data();
  if (!validCustomerDetails(order.customerName, order.phone)
    || !Array.isArray(order.items)
    || order.items.length === 0
    || order.items.length > 30) {
    throw new HttpsError('invalid-argument', 'Order details are invalid.');
  }
  if (order.telegramSentAt) return { sent: true };
  const items = await verifyOrderItems(order.items);
  const total = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const verifiedOrder = { ...order, items, total };
  await limitTelegramOrders(request);
  await orderRef.update({ items, total });
  return deliverOrderNotification(orderRef, verifiedOrder);
});

function parseCatalogOptions(value) {
  const options = Array.isArray(value)
    ? value
    : value && typeof value === 'object'
      ? ['name', 'memory', 'label'].some(key => key in value)
        ? [value]
        : Object.values(value)
      : [];
  return options.map(option => {
    if (Array.isArray(option)) return { name: option[0], price: Number(option[1] || 0) };
    return {
      name: option?.name || option?.memory || option?.label,
      price: Number(option?.price ?? option?.additionalPrice ?? 0)
    };
  }).filter(option => typeof option.name === 'string' && option.name.trim());
}

async function getVerifiedCatalogItem(productId, memory, color, quantity) {
  const productSnapshot = await db.collection('products').doc(productId).get();
  if (!productSnapshot.exists) throw new HttpsError('not-found', 'This product is no longer available.');
  const product = productSnapshot.data();
  const name = String(product.name || product.title || '').trim();
  const basePrice = Number(product.base ?? product.price ?? product.basePrice);
  const stock = Number(product.stock ?? product.stockQuantity ?? 0);
  if (!name || name.length > 200 || !Number.isFinite(basePrice) || basePrice < 0
    || !Number.isInteger(stock) || stock < quantity) {
    throw new HttpsError('failed-precondition', 'This product is no longer available in the requested quantity.');
  }
  const rawMemoryOptions = Array.isArray(product.mem) && product.mem.length
    ? product.mem
    : product.memoryVariants;
  const memoryOptions = parseCatalogOptions(rawMemoryOptions);
  const memoryOption = memoryOptions.find(option => option.name.trim() === memory);
  if (!memoryOption || !Number.isFinite(memoryOption.price) || memoryOption.price < 0) {
    throw new HttpsError('invalid-argument', 'Choose a valid memory option.');
  }
  const colors = Array.isArray(product.colors)
    ? product.colors.filter(option => typeof option?.name === 'string' && option.name.trim())
    : [];
  if ((colors.length && !colors.some(option => option.name.trim() === color))
    || (!colors.length && color !== '')) {
    throw new HttpsError('invalid-argument', 'Choose a valid color.');
  }
  return {
    productId,
    name,
    memory,
    color,
    variant: [memory, color].filter(Boolean).join(' · '),
    unitPrice: basePrice + memoryOption.price,
    quantity
  };
}

async function verifyOrderItems(items) {
  const verifiedItems = [];
  for (const item of items) {
    if (!item || typeof item.productId !== 'string'
      || !/^[\w-]{1,120}$/.test(item.productId)
      || typeof item.memory !== 'string'
      || item.memory.length > 80
      || typeof (item.color || '') !== 'string'
      || (item.color || '').length > 80
      || !Number.isInteger(item.quantity)
      || item.quantity < 1
      || item.quantity > 100) {
      throw new HttpsError('invalid-argument', 'Order item details are invalid.');
    }
    verifiedItems.push(await getVerifiedCatalogItem(
      item.productId,
      item.memory,
      item.color || '',
      item.quantity
    ));
  }
  return verifiedItems;
}

exports.sendQuickTelegramOrder = onCall({
  secrets: [telegramBotToken, telegramChatId]
}, async request => {
  const { requestId, productId, memory, color, customerName, phone } = request.data || {};
  if (typeof productId !== 'string' || !/^[\w-]{1,120}$/.test(productId)
    || typeof requestId !== 'string' || !/^T3D-[\w-]{10,80}$/.test(requestId)
    || typeof memory !== 'string' || memory.length > 80
    || typeof color !== 'string' || color.length > 80
    || !validCustomerDetails(customerName, phone)) {
    throw new HttpsError('invalid-argument', 'Enter a valid name, phone number, and product option.');
  }

  const orderRef = db.collection('orders').doc(requestId);
  const existingSnapshot = await orderRef.get();
  if (existingSnapshot.exists) {
    const existing = existingSnapshot.data();
    const existingItem = existing.items?.[0];
    if (existing.customerName !== customerName.trim()
      || existing.phone !== phone.trim()
      || existingItem?.productId !== productId
      || existingItem?.memory !== memory
      || (existingItem?.color || '') !== color) {
      throw new HttpsError('already-exists', 'This order identifier is already in use.');
    }
    if (existing.telegramSentAt) return { sent: true, orderId: requestId };
    await limitTelegramOrders(request);
    await deliverOrderNotification(orderRef, existing);
    return { sent: true, orderId: requestId };
  }

  const item = await getVerifiedCatalogItem(productId, memory, color, 1);
  await limitTelegramOrders(request);
  const price = item.unitPrice;
  const order = {
    uid: request.auth?.uid || 'guest',
    id: requestId,
    status: 'new',
    createdAt: Timestamp.now(),
    date: new Date().toISOString(),
    customerName: customerName.trim(),
    phone: phone.trim(),
    address: '',
    comment: '',
    items: [item],
    total: price
  };
  await orderRef.create(order);
  await deliverOrderNotification(orderRef, order);
  return { sent: true, orderId: requestId };
});
