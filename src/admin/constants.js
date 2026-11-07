export const ADMIN_EMAIL = 'admin@256.kg';
export const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || ADMIN_EMAIL)
  .split(',')
  .map(email => email.trim().toLowerCase())
  .filter(Boolean);
export const isAdminEmail = email => typeof email === 'string'
  && ADMIN_EMAILS.includes(email.trim().toLowerCase());
export const STATUS = { new: 'Жаңы', confirmed: 'Тастыкталды', processing: 'Даярдалууда', done: 'Жеткирилди', cancel: 'Жокко чыгарылды' };
export const isSold = order => order.status === 'confirmed' || order.status === 'processing' || order.status === 'done';
export const EMPTY_PRODUCT = {
  name: '', brand: '', category: '', desc: '', base: '', old: '', stock: '1',
  mem: '256ГБ:0', color1: '#7a3cff', color2: '#22e4ff', modelUrl: '',
  image: '', gallery: [], colors: [],
  specs: { ram: '', storage: '', screen: '', camera: '', battery: '', processor: '' }
};
