export const SEED = [
  { id: 'ip17', brand: 'Apple', name: 'iPhone 17 Pro Max', desc: '6.9" экран, A19 Pro чипи, титан корпус', base: 129900, old: 149900, stock: 8, mem: [['256ГБ', 0], ['512ГБ', 20000], ['1ТБ', 40000]], c: ['#ff7a3d', '#7a3cff'], image: '/images/iphone17-orange-transparent.png' },
  { id: 's26', brand: 'Samsung', name: 'Samsung S26 Ultra', desc: '6.9" Dynamic AMOLED, 200МП AI-камера', base: 119900, old: 139900, stock: 5, mem: [['256ГБ', 0], ['512ГБ', 15000], ['1ТБ', 35000]], c: ['#22e4ff', '#7a3cff'] },
  { id: 'xm14', brand: 'Xiaomi', name: 'Xiaomi 14 Ultra', desc: 'Leica камерасы, 90Вт тез кубаттоо', base: 84900, old: 99900, stock: 3, mem: [['256ГБ', 0], ['512ГБ', 10000]], c: ['#ff3fd0', '#1e8bff'] },
  { id: 'px11', brand: 'Google', name: 'Pixel 11 Pro', desc: 'Таза Android, эң мыкты AI-сүрөттөр', base: 99900, old: 109900, stock: 6, mem: [['256ГБ', 0], ['512ГБ', 12000]], c: ['#b6ff3c', '#1e8bff'] },
  { id: 'a56', brand: 'Samsung', name: 'Galaxy A56', desc: 'Орто класс, AMOLED 120Гц, 5000мАч', base: 39900, old: 44900, stock: 14, mem: [['128ГБ', 0], ['256ГБ', 5000]], c: ['#7a3cff', '#ff3fd0'] },
  { id: 'rn14', brand: 'Xiaomi', name: 'Redmi Note 14 Pro', desc: '200МП камера, 67Вт кубаттоо', base: 29900, old: 33900, stock: 0, mem: [['128ГБ', 0], ['256ГБ', 4000]], c: ['#22e4ff', '#b6ff3c'] }
];

export const fmt = value => Number(value).toLocaleString('ru-RU').replace(/\u00a0/g, ' ') + ' сом';

function read(key, fallback) {
  try {
    const value = localStorage.getItem(`t3d:${key}`);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(`t3d:${key}`, JSON.stringify(value));
  } catch {
    // Storage may be disabled or full; the current view remains usable.
  }
}

export const Store = {
  products: () => read('products', SEED),
  saveProducts: products => write('products', products),
  orders: () => read('orders', []),
  saveOrders: orders => write('orders', orders),
  settings: () => ({ wa: '996XXXXXXXXX', ...read('settings', {}) }),
  saveSettings: settings => write('settings', settings)
};

export const memToStr = memory => (Array.isArray(memory) ? memory : [])
  .filter(option => Array.isArray(option) && option[0] != null)
  .map(([name, price]) => `${name}:${price ?? 0}`)
  .join(', ');

export function strToMem(value) {
  const memories = value.split(',').map(item => item.trim()).filter(Boolean).map(item => {
    const [name, price] = item.split(':');
    return [name.trim(), Math.max(0, Number.parseInt(price, 10) || 0)];
  });
  return memories.length ? memories : [['Стандарт', 0]];
}
