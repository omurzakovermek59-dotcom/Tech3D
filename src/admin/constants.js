export const ADMIN_EMAIL = 'omurzakovermek280@gmail.com';
export const STATUS = { new: 'Жаңы', confirmed: 'Тастыкталды', processing: 'Даярдалууда', done: 'Жеткирилди', cancel: 'Жокко чыгарылды' };
export const isSold = order => order.status === 'confirmed' || order.status === 'processing' || order.status === 'done';
export const EMPTY_PRODUCT = { name: '', brand: '', category: '', desc: '', base: '', old: '', stock: '1', mem: '256ГБ:0', color1: '#7a3cff', color2: '#22e4ff', modelUrl: '' };
