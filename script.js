'use strict';
const state = { cart: DB.get('cart', []), brand: 'Баары', mem: {}, products: Store.products() };

/* ================= Эффекттер ================= */
// 1. Курсорду ээрчиген жарык
addEventListener('pointermove', e => {
  document.documentElement.style.setProperty('--mx', e.clientX + 'px');
  document.documentElement.style.setProperty('--my', e.clientY + 'px');
});
// 2. Бөлүкчөлөр (муштумдан качат, жакындары сызык менен байланат)
(() => {
  const c = $('#fx'), x = c.getContext('2d'); let w, h, P = [], m = { x: -999, y: -999 };
  const rs = () => { w = c.width = innerWidth; h = c.height = innerHeight;
    P = Array.from({ length: Math.min(80, w / 16 | 0) }, () => ({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35 })); };
  addEventListener('resize', rs); rs();
  addEventListener('pointermove', e => { m.x = e.clientX; m.y = e.clientY; });
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  (function loop() {
    x.clearRect(0, 0, w, h);
    P.forEach((p, i) => {
      const dx = p.x - m.x, dy = p.y - m.y, d = Math.hypot(dx, dy);
      if (d < 120) { p.x += dx / d * 1.6; p.y += dy / d * 1.6; }
      p.x = (p.x + p.vx + w) % w; p.y = (p.y + p.vy + h) % h;
      x.fillStyle = 'rgba(182,255,60,.8)'; x.fillRect(p.x, p.y, 2, 2);
      for (let j = i + 1; j < P.length; j++) {
        const q = P[j], dd = Math.hypot(p.x - q.x, p.y - q.y);
        if (dd < 120) { x.strokeStyle = `rgba(122,60,255,${.35 * (1 - dd / 120)})`; x.beginPath(); x.moveTo(p.x, p.y); x.lineTo(q.x, q.y); x.stroke(); }
      }
    });
    requestAnimationFrame(loop);
  })();
})();
// 3. Башкы сөз сөздөр боюнча чыгат
$('#h1').innerHTML = $('#h1').textContent.split(' ').map((s, i) => `<span class="w" style="--i:${i}">${s}</span>`).join(' ');
// 4. Сандар өсүп чыгат
$$('[data-count]').forEach(el => {
  const to = +el.dataset.count, t0 = performance.now();
  (function step(t) { const k = Math.min((t - t0) / 1600, 1); el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))) + (k === 1 ? el.dataset.suf : ''); if (k < 1) requestAnimationFrame(step); })(t0);
});
// 5. Магнитсыман баскычтар
$$('.mag').forEach(b => {
  b.addEventListener('pointermove', e => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .2}px,${(e.clientY - r.top - r.height / 2) * .3}px)`; });
  b.addEventListener('pointerleave', () => b.style.transform = '');
});
// 6. Скролл менен өзгөргөн тарых (телефон түсү жана экраны)
const COLORS = { 1: '#ff7a3d', 2: '#22e4ff', 3: '#b6ff3c' };
const stepIO = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  const s = e.target.dataset.s;
  $$('.step').forEach(x => x.classList.toggle('on', x === e.target));
  $('#stage').dataset.step = s; $('#phone').style.setProperty('--pc', COLORS[s]);
}), { rootMargin: '-45% 0px -45% 0px' });
$$('.step').forEach(s => stepIO.observe(s));
const revIO = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); revIO.unobserve(e.target); } }), { threshold: .15 });
$$('.reveal').forEach(el => revIO.observe(el));

/* ================= Каталог ================= */
const priceOf = p => p.base + p.mem[state.mem[p.id] || 0][1];
const oldOf = p => (p.old || p.base) + p.mem[state.mem[p.id] || 0][1];

function renderHeroWin() {
  const ps = state.products.filter(p => p.stock > 0).slice(0, 3);
  $('#winList').innerHTML = ps.map(p => `<li><i style="--c1:${esc(p.c[0])};--c2:${esc(p.c[1])}"></i><b>${esc(p.name)}</b><em>${fmt(p.base)}</em></li>`).join('');
  $('#winStock').textContent = `Кампада: ${state.products.reduce((s, p) => s + p.stock, 0)} телефон`;
}
function renderCatalog() {
  const brands = ['Баары', ...new Set(state.products.map(p => p.brand))];
  $('#chips').innerHTML = brands.map(b => `<button class="chip2 ${b === state.brand ? 'on' : ''}" data-b="${esc(b)}">${esc(b)}</button>`).join('');
  const list = state.products.filter(p => state.brand === 'Баары' || p.brand === state.brand);
  $('#empty').hidden = list.length > 0;
  $('#grid').innerHTML = list.map(p => {
    const mi = state.mem[p.id] || 0, off = Math.round((1 - priceOf(p) / oldOf(p)) * 100);
    const tag = p.stock <= 0 ? '<span class="tagl out">Түгөндү</span>' : p.stock <= 3 ? `<span class="tagl warn">Аз калды: ${p.stock}</span>` : off > 0 ? `<span class="tagl">-${off}%</span>` : '';
    return `<article class="card glass reveal in" data-id="${esc(p.id)}">${tag}
      <div class="pic"><div class="mini" style="--c1:${esc(p.c[0])};--c2:${esc(p.c[1])}"></div></div>
      <h3>${esc(p.name)}</h3><p class="desc">${esc(p.desc || '')}</p>
      <div class="prices"><span class="now">${fmt(priceOf(p))}</span>${oldOf(p) > priceOf(p) ? `<span class="old">${fmt(oldOf(p))}</span>` : ''}</div>
      <div class="mem">${p.mem.map((x, i) => `<button class="tag ${i === mi ? 'sel' : ''}" data-act="mem" data-i="${i}">${esc(x[0])}</button>`).join('')}</div>
      <button class="btn" data-act="add" ${p.stock <= 0 ? 'disabled' : ''}>${p.stock <= 0 ? 'Түгөндү' : 'Себетке кошуу'}</button></article>`;
  }).join('');
}
$('#chips').addEventListener('click', e => { const b = e.target.closest('[data-b]'); if (b) { state.brand = b.dataset.b; renderCatalog(); } });
$('#grid').addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b) return;
  const p = state.products.find(x => x.id === b.closest('.card').dataset.id);
  if (b.dataset.act === 'mem') { state.mem[p.id] = +b.dataset.i; renderCatalog(); }
  if (b.dataset.act === 'add') addToCart(p);
});
$('#grid').addEventListener('pointermove', e => {
  if (e.pointerType === 'touch') return;
  const c = e.target.closest('.card'); if (!c) return;
  const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
  c.style.setProperty('--gx', x * 100 + '%'); c.style.setProperty('--gy', y * 100 + '%');
  c.style.transform = `rotateY(${(x - .5) * 14}deg) rotateX(${-(y - .5) * 14}deg) scale(1.03)`;
});
$('#grid').addEventListener('pointerout', e => { const c = e.target.closest('.card'); if (c) c.style.transform = ''; });

/* ================= Себет жана буйрутма ================= */
const toast = m => { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 2400); };
function addToCart(p) {
  const mi = state.mem[p.id] || 0, key = `${p.id}|${mi}`, f = state.cart.find(i => i.key === key);
  const inCart = state.cart.filter(i => i.pid === p.id).reduce((s, i) => s + i.qty, 0);
  if (inCart >= p.stock) return toast(`Кампада ${p.stock} дана гана бар`);
  f ? f.qty++ : state.cart.push({ key, pid: p.id, name: p.name, mem: p.mem[mi][0], price: priceOf(p), qty: 1 });
  renderCart(); const b = $('#cartCount'); b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump');
  toast(`${p.name} себетке кошулду`);
}
function renderCart() {
  $('#cartList').innerHTML = state.cart.length ? state.cart.map(i => `<li class="item"><div><b>${esc(i.name)}</b><small>${esc(i.mem)}</small><small>${fmt(i.price)}</small></div>
    <div class="qty" data-key="${esc(i.key)}"><button data-d="-1" aria-label="Азайтуу">−</button><span>${i.qty}</span><button data-d="1" aria-label="Көбөйтүү">+</button></div></li>`).join('')
    : '<li class="none">Себетиңиз бош. Каталогдон смартфон тандаңыз.</li>';
  const total = state.cart.reduce((s, i) => s + i.price * i.qty, 0);
  $('#total').textContent = fmt(total); $('#cartCount').textContent = state.cart.reduce((s, i) => s + i.qty, 0);
  $('#orderBtn').disabled = !state.cart.length; DB.set('cart', state.cart);
}
$('#cartList').addEventListener('click', e => {
  const b = e.target.closest('button[data-d]'); if (!b) return;
  const it = state.cart.find(i => i.key === b.parentElement.dataset.key), p = state.products.find(x => x.id === it.pid);
  const inCart = state.cart.filter(i => i.pid === it.pid).reduce((s, i) => s + i.qty, 0);
  if (+b.dataset.d > 0 && p && inCart >= p.stock) return toast(`Кампада ${p.stock} дана гана бар`);
  it.qty += +b.dataset.d; if (it.qty <= 0) state.cart = state.cart.filter(i => i !== it); renderCart();
});
$('#clearBtn').addEventListener('click', () => { state.cart = []; renderCart(); });

$('#orderBtn').addEventListener('click', () => {
  const name = $('#cName').value.trim(), phone = $('#cPhone').value.trim();
  if (name.length < 2 || phone.replace(/\D/g, '').length < 9) return toast('Атыңызды жана телефон номериңизди толтуруңуз');
  const total = state.cart.reduce((s, i) => s + i.price * i.qty, 0), orders = Store.orders();
  const id = '№' + String(orders.length + 1001);
  orders.unshift({ id, date: new Date().toISOString(), name, phone, items: state.cart.map(i => ({ pid: i.pid, name: i.name, mem: i.mem, price: i.price, qty: i.qty })), total, status: 'new' });
  Store.saveOrders(orders);
  const lines = state.cart.map((i, n) => `${n + 1}. ${i.name} (${i.mem}) × ${i.qty} = ${fmt(i.price * i.qty)}`);
  const msg = `Саламатсызбы! Tech3D дүкөнүнөн буйрутма ${id}\n\nАты: ${name}\nТелефон: ${phone}\n\n${lines.join('\n')}\n\nЖалпы сумма: ${fmt(total)}\n\nЖеткирүү дарегим:`;
  window.open(`https://wa.me/${Store.settings().wa}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
  state.cart = []; renderCart(); openCart(false); toast(`Буйрутма ${id} кабыл алынды. Рахмат!`);
});

const drawer = $('#drawer'), overlay = $('#overlay');
const openCart = o => { drawer.classList.toggle('open', o); overlay.classList.toggle('show', o); };
$('#cartBtn').addEventListener('click', () => openCart(true));
$('#closeCart').addEventListener('click', () => openCart(false));
overlay.addEventListener('click', () => openCart(false));
addEventListener('keydown', e => e.key === 'Escape' && openCart(false));
$('#burger').addEventListener('click', () => $('#links').classList.toggle('open'));
$('#links').addEventListener('click', () => $('#links').classList.remove('open'));

// Админ панелинде өзгөртүү киргизилсе, дүкөн ошол замат жаңырат
addEventListener('storage', () => { state.products = Store.products(); renderCatalog(); renderHeroWin(); });

renderHeroWin(); renderCatalog(); renderCart();
