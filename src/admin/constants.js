export const STATUS = { new: 'Жаңы', confirmed: 'Тастыкталды', done: 'Жеткирилди', cancel: 'Жокко чыгарылды' };
export const isSold = order => order.status === 'confirmed' || order.status === 'done';
export const EMPTY_PRODUCT = { name: '', brand: '', desc: '', base: '', old: '', stock: '1', mem: '256ГБ:0', color1: '#7a3cff', color2: '#22e4ff' };

export function readAuthenticated() {
  try { return sessionStorage.getItem('t3d-adm') === '1'; } catch { return false; }
}
