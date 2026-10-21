'use strict';
/* Дүкөн жана админ панели ортоктошкон маалымат катмары (localStorage) */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const fmt = n => Number(n).toLocaleString('ru-RU').replace(/\u00a0/g, ' ') + ' сом';
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const DB = {
  get(k, d) { try { const v = localStorage.getItem('t3d:' + k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem('t3d:' + k, JSON.stringify(v)); } catch { /* ignore */ } }
};
const SEED = [
  { id: 'ip17', brand: 'Apple', name: 'iPhone 17 Pro Max', desc: '6.9" экран, A19 Pro чипи, титан корпус', base: 129900, old: 149900, stock: 8, mem: [['256ГБ', 0], ['512ГБ', 20000], ['1ТБ', 40000]], c: ['#ff7a3d', '#7a3cff'] },
  { id: 's26', brand: 'Samsung', name: 'Samsung S26 Ultra', desc: '6.9" Dynamic AMOLED, 200МП AI-камера', base: 119900, old: 139900, stock: 5, mem: [['256ГБ', 0], ['512ГБ', 15000], ['1ТБ', 35000]], c: ['#22e4ff', '#7a3cff'] },
  { id: 'xm14', brand: 'Xiaomi', name: 'Xiaomi 14 Ultra', desc: 'Leica камерасы, 90Вт тез кубаттоо', base: 84900, old: 99900, stock: 3, mem: [['256ГБ', 0], ['512ГБ', 10000]], c: ['#ff3fd0', '#1e8bff'] },
  { id: 'px11', brand: 'Google', name: 'Pixel 11 Pro', desc: 'Таза Android, эң мыкты AI-сүрөттөр', base: 99900, old: 109900, stock: 6, mem: [['256ГБ', 0], ['512ГБ', 12000]], c: ['#b6ff3c', '#1e8bff'] },
  { id: 'a56', brand: 'Samsung', name: 'Galaxy A56', desc: 'Орто класс, AMOLED 120Гц, 5000мАч', base: 39900, old: 44900, stock: 14, mem: [['128ГБ', 0], ['256ГБ', 5000]], c: ['#7a3cff', '#ff3fd0'] },
  { id: 'rn14', brand: 'Xiaomi', name: 'Redmi Note 14 Pro', desc: '200МП камера, 67Вт кубаттоо', base: 29900, old: 33900, stock: 0, mem: [['128ГБ', 0], ['256ГБ', 4000]], c: ['#22e4ff', '#b6ff3c'] }
];
const Store = {
  products: () => DB.get('products', SEED), saveProducts: p => DB.set('products', p),
  orders: () => DB.get('orders', []), saveOrders: o => DB.set('orders', o),
  settings: () => ({ wa: '996XXXXXXXXX', pass: '2010', ...DB.get('settings', {}) }), saveSettings: s => DB.set('settings', s)
};
const memToStr = m => m.map(x => x[0] + ':' + x[1]).join(', ');
const strToMem = s => {
  const r = s.split(',').map(x => x.trim()).filter(Boolean).map(x => { const [n, p] = x.split(':'); return [n.trim(), Math.max(0, parseInt(p) || 0)]; });
  return r.length ? r : [['Стандарт', 0]];
};
