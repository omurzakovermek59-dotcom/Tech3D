'use strict';
const STATUS = { new: 'Жаңы', confirmed: 'Тастыкталды', done: 'Жеткирилди', cancel: 'Жокко чыгарылды' };
const toast = m => { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 2200); };
const ok = () => { try { return sessionStorage.getItem('t3d-adm') === '1'; } catch { return false; } };

/* ===== Кирүү ===== */
function enter() { $('#login').hidden = true; $('#app').hidden = false; renderAll(); }
$('#loginForm').addEventListener('submit', e => {
  e.preventDefault();
  if ($('#pass').value === Store.settings().pass) { try { sessionStorage.setItem('t3d-adm', '1'); } catch { /* ignore */ } enter(); }
  else { $('#err').hidden = false; $('#pass').select(); }
});
$('#logout').addEventListener('click', () => { try { sessionStorage.removeItem('t3d-adm'); } catch { /* ignore */ } location.reload(); });
$('#tabs').addEventListener('click', e => {
  const b = e.target.closest('[data-t]'); if (!b) return;
  $$('#tabs button').forEach(x => x.classList.toggle('on', x === b));
  ['dash', 'prod', 'ord', 'set'].forEach(t => $('#t-' + t).hidden = t !== b.dataset.t);
});

/* ===== Башкы бет ===== */
const sold = o => o.status === 'confirmed' || o.status === 'done';
function renderDash() {
  const orders = Store.orders(), prods = Store.products();
  const rev = orders.filter(sold).reduce((s, o) => s + o.total, 0), fresh = orders.filter(o => o.status === 'new').length;
  const low = prods.filter(p => p.stock <= 3);
  $('#kpis').innerHTML = [['Киреше', fmt(rev)], ['Бардык буйрутма', orders.length], ['Жаңы буйрутма', fresh], ['Аз калган товар', low.length]]
    .map(k => `<div class="kpi glass"><span>${k[0]}</span><b>${k[1]}</b></div>`).join('');
  const days = [...Array(7)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() - 6 + i); return d; });
  const vals = days.map(d => orders.filter(o => sold(o) && new Date(o.date).toDateString() === d.toDateString()).reduce((s, o) => s + o.total, 0));
  const max = Math.max(...vals, 1);
  $('#chart').innerHTML = days.map((d, i) => `<div title="${fmt(vals[i])}"><i style="height:${vals[i] / max * 140}px"></i>${d.getDate()}.${String(d.getMonth() + 1).padStart(2, '0')}</div>`).join('');
  $('#low').innerHTML = low.length ? low.map(p => `<li><span>${esc(p.name)}</span><b>${p.stock} дана</b></li>`).join('') : '<li>Баары жетиштүү</li>';
  $('#newCount').textContent = fresh || '';
}

/* ===== Товарлар ===== */
function renderProds() {
  $('#prodBody').innerHTML = Store.products().map(p => `<tr><td><b>${esc(p.name)}</b><br><small>${esc(memToStr(p.mem))}</small></td><td>${esc(p.brand)}</td>
    <td>${fmt(p.base)}</td><td>${p.old ? fmt(p.old) : '—'}</td><td class="${p.stock <= 3 ? 'st-cancel' : ''}">${p.stock}</td>
    <td><button class="mbtn" data-e="${esc(p.id)}">Оңдоо</button><button class="mbtn del" data-d="${esc(p.id)}">Өчүрүү</button></td></tr>`).join('');
}
let editId = null;
const dlg = $('#dlg');
function openForm(p) {
  editId = p ? p.id : null; $('#dTitle').textContent = p ? 'Товарды оңдоо' : 'Жаңы товар';
  const v = p || { name: '', brand: '', desc: '', base: '', old: '', stock: 1, mem: [['256ГБ', 0]], c: ['#7a3cff', '#22e4ff'] };
  $('#fName').value = v.name; $('#fBrand').value = v.brand; $('#fDesc').value = v.desc || ''; $('#fBase').value = v.base; $('#fOld').value = v.old || '';
  $('#fStock').value = v.stock; $('#fMem').value = memToStr(v.mem); $('#fC1').value = v.c[0]; $('#fC2').value = v.c[1]; dlg.showModal();
}
$('#addProd').addEventListener('click', () => openForm(null));
$('#dCancel').addEventListener('click', () => dlg.close());
$('#pForm').addEventListener('submit', () => {
  if (dlg.returnValue !== 'ok' && document.activeElement?.value !== 'ok') { /* Enter баскычы да сактайт */ }
  const list = Store.products();
  const item = { id: editId || 'p' + Date.now().toString(36), name: $('#fName').value.trim(), brand: $('#fBrand').value.trim(), desc: $('#fDesc').value.trim(),
    base: +$('#fBase').value, old: +$('#fOld').value || 0, stock: Math.max(0, +$('#fStock').value | 0), mem: strToMem($('#fMem').value), c: [$('#fC1').value, $('#fC2').value] };
  const i = list.findIndex(p => p.id === editId);
  i > -1 ? list[i] = item : list.push(item);
  Store.saveProducts(list); renderAll(); toast('Товар сакталды. Дүкөндө ошол замат көрүнөт');
});
$('#prodBody').addEventListener('click', e => {
  const ed = e.target.closest('[data-e]'), del = e.target.closest('[data-d]');
  if (ed) openForm(Store.products().find(p => p.id === ed.dataset.e));
  if (del && confirm('Бул товарды өчүрөсүзбү?')) { Store.saveProducts(Store.products().filter(p => p.id !== del.dataset.d)); renderAll(); toast('Товар өчүрүлдү'); }
});

/* ===== Буйрутмалар ===== */
function renderOrders() {
  const orders = Store.orders();
  $('#ordEmpty').hidden = orders.length > 0;
  $('#ordBody').innerHTML = orders.map(o => `<tr><td><b>${esc(o.id)}</b><br><small>${new Date(o.date).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' })}</small></td>
    <td>${esc(o.name)}<br><a href="https://wa.me/${esc(o.phone.replace(/\D/g, ''))}" target="_blank" rel="noopener">${esc(o.phone)}</a></td>
    <td>${o.items.map(i => `${esc(i.name)} (${esc(i.mem)}) × ${i.qty}`).join('<br>')}</td><td><b>${fmt(o.total)}</b></td>
    <td><select data-s="${esc(o.id)}" class="st-${o.status}">${Object.entries(STATUS).map(([k, v]) => `<option value="${k}" ${k === o.status ? 'selected' : ''}>${v}</option>`).join('')}</select></td>
    <td><button class="mbtn del" data-x="${esc(o.id)}">Өчүрүү</button></td></tr>`).join('');
}
$('#ordBody').addEventListener('change', e => {
  const sel = e.target.closest('[data-s]'); if (!sel) return;
  const orders = Store.orders(), o = orders.find(x => x.id === sel.dataset.s), prods = Store.products();
  o.status = sel.value;
  // Тастыкталганда кампадан алат, жокко чыкканда кайтарат
  if (sold(o) && !o.stockApplied) { o.items.forEach(i => { const p = prods.find(x => x.id === i.pid); if (p) p.stock = Math.max(0, p.stock - i.qty); }); o.stockApplied = true; }
  if (o.status === 'cancel' && o.stockApplied) { o.items.forEach(i => { const p = prods.find(x => x.id === i.pid); if (p) p.stock += i.qty; }); o.stockApplied = false; }
  Store.saveOrders(orders); Store.saveProducts(prods); renderAll(); toast('Абалы жаңыртылды');
});
$('#ordBody').addEventListener('click', e => {
  const x = e.target.closest('[data-x]');
  if (x && confirm('Буйрутманы өчүрөсүзбү?')) { Store.saveOrders(Store.orders().filter(o => o.id !== x.dataset.x)); renderAll(); }
});
$('#csv').addEventListener('click', () => {
  const q = s => `"${String(s).replace(/"/g, '""')}"`;
  const rows = [['Номер', 'Дата', 'Аты', 'Телефон', 'Заказ', 'Сумма', 'Абалы'], ...Store.orders().map(o => [o.id, o.date, o.name, o.phone, o.items.map(i => `${i.name} ${i.mem} x${i.qty}`).join('; '), o.total, STATUS[o.status]])];
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['\ufeff' + rows.map(r => r.map(q).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' }));
  a.download = 'buyrutmalar.csv'; a.click(); URL.revokeObjectURL(a.href);
});

/* ===== Жөндөөлөр ===== */
function renderSettings() { const s = Store.settings(); $('#sWa').value = s.wa; $('#sPass').value = s.pass; }
$('#setForm').addEventListener('submit', e => { e.preventDefault(); Store.saveSettings({ wa: $('#sWa').value.trim(), pass: $('#sPass').value }); toast('Жөндөөлөр сакталды'); });
$('#reset').addEventListener('click', () => { if (confirm('Бардык товар жана буйрутмалар демо абалына кайтат. Улантасызбы?')) { Store.saveProducts(SEED); Store.saveOrders([]); renderAll(); toast('Калыбына келди'); } });

function renderAll() { renderDash(); renderProds(); renderOrders(); renderSettings(); }
addEventListener('storage', () => ok() && renderAll());
if (ok()) enter();
