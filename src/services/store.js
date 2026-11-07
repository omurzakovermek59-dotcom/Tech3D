import {
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { SEED, Store } from '../data.js';
import { db } from '../firebase.js';

function requireDatabase() {
  if (!db) throw new Error('Firebase is not configured. Add the VITE_FIREBASE_* variables first.');
  return db;
}

export function subscribeToFavorites(uid, onChange, onError) {
  const database = requireDatabase();
  return onSnapshot(collection(database, 'users', uid, 'favorites'), snapshot => {
    onChange(snapshot.docs.map(item => item.id));
  }, onError);
}

export async function toggleFavorite(uid, productId, isFavorite) {
  const database = requireDatabase();
  const reference = doc(database, 'users', uid, 'favorites', productId);
  if (isFavorite) await deleteDoc(reference);
  else await setDoc(reference, { productId, createdAt: serverTimestamp() });
}

export async function saveUserPhone(uid, phone) {
  const database = requireDatabase();
  await setDoc(doc(database, 'users', uid, 'profile', 'contact'), { phone });
}

export function subscribeToUserOrders(uid, onChange, onError) {
  const database = requireDatabase();
  const ordersQuery = query(collection(database, 'orders'), where('uid', '==', uid));
  return onSnapshot(ordersQuery, snapshot => {
    const orders = snapshot.docs.map(item => ({ id: item.id, ...item.data() }));
    orders.sort((left, right) => {
      const timestamp = order => order.createdAt?.toMillis?.() ?? new Date(order.date || 0).getTime();
      return timestamp(right) - timestamp(left);
    });
    onChange(orders);
  }, onError);
}

export async function createOrder(uid, orderId, details) {
  const database = requireDatabase();
  const reference = doc(database, 'orders', orderId);
  await setDoc(reference, {
    ...details,
    uid,
    id: orderId,
    status: 'new',
    createdAt: serverTimestamp()
  });
  return orderId;
}

export async function loadReviews(productId) {
  const database = requireDatabase();
  const reviewsQuery = query(
    collection(database, 'products', productId, 'reviews'),
    orderBy('createdAt', 'desc')
  );
  const result = await getDocs(reviewsQuery);
  return result.docs.map(item => ({ id: item.id, ...item.data() }));
}

export async function saveReview(uid, productId, review) {
  const database = requireDatabase();
  await setDoc(doc(database, 'products', productId, 'reviews', uid), {
    ...review,
    uid,
    createdAt: serverTimestamp()
  });
}

export async function deleteReview(uid, productId) {
  const database = requireDatabase();
  await deleteDoc(doc(database, 'products', productId, 'reviews', uid));
}

function normalizeProduct(document) {
  const data = document.data();
  const seed = SEED.find(product => product.id === document.id);
  const firstValue = (...values) => values.find(value => value !== undefined && value !== null && value !== '');
  const numberOrFallback = (value, fallback) => {
    if (value === undefined || value === null || value === '') return fallback;
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  };
  const rawMemories = Array.isArray(data.mem) && data.mem.length
    ? data.mem
    : data.memoryVariants;
  const memoryOptions = Array.isArray(rawMemories)
    ? rawMemories
    : rawMemories && typeof rawMemories === 'object'
      ? ['name', 'memory', 'label'].some(key => key in rawMemories)
        ? [rawMemories]
        : Object.values(rawMemories)
      : [];
  const memories = memoryOptions.map(option => {
    const name = Array.isArray(option)
      ? option[0]
      : firstValue(option?.name, option?.memory, option?.label);
    const price = Array.isArray(option)
      ? option[1]
      : firstValue(option?.price, option?.additionalPrice);
    return typeof name === 'string' && name.trim()
      ? [name.trim(), numberOrFallback(price, 0)]
      : null;
  }).filter(Boolean);
  const name = firstValue(data.name, data.title, seed?.name);

  if (typeof name !== 'string' || !name.trim()) return null;

  const colors = (Array.isArray(data.colors) ? data.colors : []).map(color => {
    const images = Array.isArray(color.images)
      ? color.images.filter(image => typeof image === 'string' && image)
      : typeof color.image === 'string' && color.image ? [color.image] : [];
    const mainImage = firstValue(color.mainImage, color.image, images[0], '') || '';
    return {
      name: typeof color.name === 'string' ? color.name : '',
      hex: /^#[\da-f]{6}$/i.test(color.hex || color.value || '') ? color.hex || color.value : '#777777',
      images: [...new Set([mainImage, ...images].filter(Boolean))],
      mainImage
    };
  });

  return {
    ...seed,
    ...data,
    id: document.id,
    name: name.trim(),
    brand: firstValue(data.brand, seed?.brand, '') || '',
    category: firstValue(data.category, seed?.category, data.brand, seed?.brand, '') || '',
    desc: firstValue(data.desc, data.description, seed?.desc, '') || '',
    base: numberOrFallback(firstValue(data.base, data.price, data.basePrice), seed?.base ?? 0),
    old: numberOrFallback(firstValue(data.old, data.oldPrice), seed?.old ?? 0),
    stock: numberOrFallback(firstValue(data.stock, data.stockQuantity), seed?.stock ?? 0),
    mem: memories.length ? memories : seed?.mem || [['Стандарт', 0]],
    c: Array.isArray(data.c) && data.c.length ? data.c : seed?.c || ['#7a3cff', '#22e4ff'],
    image: firstValue(data.image, data.imageUrl, seed?.image, '') || '',
    modelUrl: firstValue(data.modelUrl, data.model3dUrl, '') || '',
    gallery: Array.isArray(data.gallery) ? data.gallery : [],
    colors,
    specs: data.specs || data.characteristics || seed?.specs || {}
  };
}

function productForFirestore(product) {
  const memories = Array.isArray(product.mem) ? product.mem : [];
  return {
    ...product,
    mem: memories.map(option => {
      if (Array.isArray(option)) return { name: option[0] || '', price: option[1] ?? 0 };
      return option;
    })
  };
}

export function subscribeToProducts(onChange, onError) {
  const database = requireDatabase();
  return onSnapshot(collection(database, 'products'), { includeMetadataChanges: true }, snapshot => {
    if (snapshot.metadata.fromCache || snapshot.metadata.hasPendingWrites) return;
    const products = snapshot.docs.map(normalizeProduct).filter(Boolean);
    const catalog = products.length ? products : SEED;
    Store.saveProducts(catalog);
    onChange(catalog);
  }, onError);
}

export function subscribeToStoreSettings(onChange, onError) {
  const database = requireDatabase();
  return onSnapshot(doc(database, 'system', 'storeSettings'), snapshot => {
    onChange(snapshot.exists() ? snapshot.data() : {});
  }, onError);
}

export async function saveStoreSettings(settings) {
  const database = requireDatabase();
  await setDoc(doc(database, 'system', 'storeSettings'), {
    ...settings,
    updatedAt: serverTimestamp()
  });
}

export function subscribeToOrders(onChange, onError) {
  const database = requireDatabase();
  const ordersQuery = query(collection(database, 'orders'), orderBy('createdAt', 'desc'));
  return onSnapshot(ordersQuery, snapshot => {
    onChange(snapshot.docs.map(item => ({ id: item.id, ...item.data() })));
  }, onError);
}

export async function initializeProductsIfEmpty(products) {
  const database = requireDatabase();
  const cachedProducts = Array.isArray(products)
    ? products.filter(product => product && typeof product === 'object' && typeof (product.name || product.title) === 'string' && (product.name || product.title).trim())
    : [];
  const productsById = new Map(SEED.map(product => [product.id, product]));
  cachedProducts.forEach(product => {
    if (product.id) productsById.set(product.id, product);
  });
  const catalogProducts = [...productsById.values()];
  const marker = doc(database, 'system', 'catalog');
  await runTransaction(database, async transaction => {
    const markerSnapshot = await transaction.get(marker);
    if (markerSnapshot.data()?.seedVersion === 2) return;
    const firestoreProducts = catalogProducts.map(productForFirestore);
    const references = firestoreProducts.map(product => doc(database, 'products', product.id));
    const snapshots = await Promise.all(references.map(reference => transaction.get(reference)));
    firestoreProducts.forEach((product, index) => {
      if (!snapshots[index].exists()) transaction.set(references[index], product);
    });
    transaction.set(marker, {
      ...(markerSnapshot.data() || {}),
      initializedAt: markerSnapshot.data()?.initializedAt || serverTimestamp(),
      seedVersion: 2
    });
  });
}

function operationError(operation, error) {
  const detail = error instanceof Error ? error.message : String(error);
  const wrapped = new Error(`${operation}: ${detail}`);
  wrapped.code = error?.code;
  wrapped.cause = error;
  return wrapped;
}

function waitForFirestoreWrite(write) {
  let timeout;
  return Promise.race([
    write,
    new Promise((_, reject) => {
      timeout = setTimeout(() => {
        reject(new Error('Save timed out after 30 seconds. Check Firestore access and network connection.'));
      }, 30000);
    })
  ]).finally(() => clearTimeout(timeout));
}

export async function saveAdminProduct(product) {
  const database = requireDatabase();
  const savedProduct = {
    ...product,
    image: product.image || '',
    gallery: Array.isArray(product.gallery) ? product.gallery : [],
    colors: (Array.isArray(product.colors) ? product.colors : []).map(color => {
      const images = [...new Set([
        ...(Array.isArray(color.images) ? color.images : color.image ? [color.image] : []),
        color.mainImage || color.image || ''
      ].filter(Boolean))];
      const mainImage = color.mainImage || color.image || images[0] || '';
      return {
        name: color.name || '',
        hex: /^#[\da-f]{6}$/i.test(color.hex || color.value || '') ? color.hex || color.value : '#777777',
        images,
        mainImage
      };
    })
  };
  const documentSize = new TextEncoder().encode(JSON.stringify(productForFirestore(savedProduct))).length;
  if (documentSize > 900 * 1024) {
    throw new Error('Product images exceed the Firestore document limit. Use fewer or smaller images.');
  }
  try {
    await waitForFirestoreWrite(setDoc(doc(database, 'products', product.id), {
      ...productForFirestore(savedProduct),
      updatedAt: serverTimestamp()
    }));
  } catch (error) {
    throw operationError('Cloud Firestore', error);
  }
  return savedProduct;
}

export async function deleteAdminProduct(productId) {
  await deleteDoc(doc(requireDatabase(), 'products', productId));
}

export async function setAdminOrderStatus(orderId, status) {
  const database = requireDatabase();
  const orderRef = doc(database, 'orders', orderId);
  await runTransaction(database, async transaction => {
    const orderSnapshot = await transaction.get(orderRef);
    if (!orderSnapshot.exists()) throw new Error('Order not found.');
    const order = orderSnapshot.data();
    const wasSold = order.stockApplied === true;
    const shouldBeSold = ['confirmed', 'processing', 'done'].includes(status);
    const quantities = new Map();
    order.items.forEach(item => {
      const productId = item.productId || item.pid;
      quantities.set(productId, (quantities.get(productId) || 0) + (item.quantity || item.qty || 0));
    });
    if ((shouldBeSold && !wasSold) || (status === 'cancel' && wasSold)) {
      const productIds = [...quantities.keys()];
      const productRefs = productIds.map(productId => doc(database, 'products', productId));
      const productSnapshots = await Promise.all(productRefs.map(reference => transaction.get(reference)));
      productSnapshots.forEach((snapshot, index) => {
        if (!snapshot.exists()) return;
        const quantity = quantities.get(productIds[index]);
        const stock = snapshot.data().stock || 0;
        if (status !== 'cancel' && stock < quantity) throw new Error(`Not enough stock for ${productIds[index]}.`);
        const nextStock = status === 'cancel' ? stock + quantity : Math.max(0, stock - quantity);
        transaction.update(snapshot.ref, { stock: nextStock });
      });
    }
    transaction.update(orderRef, {
      status,
      stockApplied: shouldBeSold || (wasSold && status !== 'cancel'),
      updatedAt: serverTimestamp()
    });
  });
}

export async function deleteAdminOrder(orderId) {
  await deleteDoc(doc(requireDatabase(), 'orders', orderId));
}

export async function loadAllReviews() {
  const database = requireDatabase();
  const result = await getDocs(collectionGroup(database, 'reviews'));
  return result.docs.map(item => ({
    id: item.id,
    productId: item.ref.parent.parent?.id,
    ...item.data()
  }));
}

export async function deleteAdminReview(review) {
  await deleteDoc(doc(requireDatabase(), 'products', review.productId, 'reviews', review.id));
}
