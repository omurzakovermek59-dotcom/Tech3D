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
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadString } from 'firebase/storage';
import { SEED } from '../data.js';
import { db, storage } from '../firebase.js';

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
  const numberOrFallback = (value, fallback) => {
    if (value === undefined || value === null || value === '') return fallback;
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  };
  const memories = Array.isArray(data.mem) && data.mem.length
    ? data.mem
    : Array.isArray(data.memoryVariants) && data.memoryVariants.length
      ? data.memoryVariants
      : seed?.mem || [['Стандарт', 0]];

  return {
    ...seed,
    ...data,
    id: document.id,
    name: data.name || seed?.name || '',
    brand: data.brand || seed?.brand || '',
    category: data.category || seed?.category || data.brand || seed?.brand || '',
    desc: data.desc || seed?.desc || '',
    base: numberOrFallback(data.base, seed?.base ?? 0),
    old: numberOrFallback(data.old, seed?.old ?? 0),
    stock: numberOrFallback(data.stock, seed?.stock ?? 0),
    mem: memories,
    c: Array.isArray(data.c) && data.c.length ? data.c : seed?.c || ['#7a3cff', '#22e4ff'],
    image: data.image || seed?.image || '',
    gallery: Array.isArray(data.gallery) ? data.gallery : [],
    colors: Array.isArray(data.colors) ? data.colors : []
  };
}

export function subscribeToProducts(onChange, onError) {
  const database = requireDatabase();
  return onSnapshot(collection(database, 'products'), snapshot => {
    onChange(snapshot.docs.map(normalizeProduct));
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
  const existing = await getDocs(collection(database, 'products'));
  if (!existing.empty) return;
  const seedProducts = products.some(product => product.image?.startsWith('data:image/'))
    ? await Promise.all(products.map(async product => ({
      ...product,
      image: product.image?.startsWith('data:image/')
        ? await uploadProductImage(product.image, product.id)
        : product.image || ''
    })))
    : products;
  const marker = doc(database, 'system', 'catalog');
  await runTransaction(database, async transaction => {
    const markerSnapshot = await transaction.get(marker);
    if (markerSnapshot.exists()) return;
    const references = seedProducts.map(product => doc(database, 'products', product.id));
    const snapshots = await Promise.all(references.map(reference => transaction.get(reference)));
    if (snapshots.some(snapshot => snapshot.exists())) {
      transaction.set(marker, { initializedAt: serverTimestamp() });
      return;
    }
    seedProducts.forEach((product, index) => transaction.set(references[index], product));
    transaction.set(marker, { initializedAt: serverTimestamp() });
  });
}

async function uploadProductImage(data, productId) {
  if (!storage) throw new Error('Firebase Storage is not configured.');
  const imageRef = ref(storage, `product-images/${productId}/${crypto.randomUUID()}.webp`);
  await uploadString(imageRef, data, 'data_url');
  return getDownloadURL(imageRef);
}

export async function saveAdminProduct(product) {
  const database = requireDatabase();
  const uploadIfNeeded = image => image?.startsWith('data:image/')
    ? uploadProductImage(image, product.id)
    : Promise.resolve(image || '');
  const image = await uploadIfNeeded(product.image);
  const gallery = await Promise.all((product.gallery || []).map(uploadIfNeeded));
  const colors = await Promise.all((product.colors || []).map(async color => ({
    ...color,
    image: await uploadIfNeeded(color.image)
  })));
  const savedProduct = { ...product, image, gallery, colors };
  await setDoc(doc(database, 'products', product.id), { ...savedProduct, updatedAt: serverTimestamp() });
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
