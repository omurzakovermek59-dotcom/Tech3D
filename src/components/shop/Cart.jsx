import { useEffect, useState } from 'react';
import { fmt, Store } from '../../data.js';
import { memoryText, productText, useLanguage } from '../../i18n/language.jsx';

export default function Cart({ cart, setCart, isOpen, onClose, onToast }) {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const products = Store.products();
  const itemName = item => productText({ id: item.pid, name: item.name }, 'name', t);
  const itemMemory = item => memoryText(item.mem, t);
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  useEffect(() => {
    try { localStorage.setItem('t3d:cart', JSON.stringify(cart)); } catch { /* Cart stays available in memory. */ }
  }, [cart]);
  const changeQuantity = (item, delta) => {
    const product = products.find(value => value.id === item.pid);
    const inCart = cart.filter(value => value.pid === item.pid).reduce((sum, value) => sum + value.qty, 0);
    if (delta > 0 && product && inCart >= product.stock) {
      onToast(t('cart.stockLimit', { count: product.stock }));
      return;
    }
    setCart(current => current.map(value => value.key === item.key ? { ...value, qty: value.qty + delta } : value).filter(value => value.qty > 0));
  };
  const submitOrder = () => {
    const customer = name.trim();
    const customerPhone = phone.trim();
    if (customer.length < 2 || customerPhone.replace(/\D/g, '').length < 9) {
      onToast(t('cart.validation'));
      return;
    }
    const orders = Store.orders();
    const id = `№${orders.length + 1001}`;
    const order = {
      id,
      date: new Date().toISOString(),
      name: customer,
      phone: customerPhone,
      items: cart.map(item => ({ pid: item.pid, name: itemName(item), mem: itemMemory(item), price: item.price, qty: item.qty })),
      total,
      status: 'new'
    };
    Store.saveOrders([order, ...orders]);
    const lines = cart.map((item, index) => `${index + 1}. ${itemName(item)} (${itemMemory(item)}) × ${item.qty} = ${fmt(item.price * item.qty)}`);
    const message = `${t('cart.orderMessage', { id })}\n\n${t('cart.customerName')}: ${customer}\n${t('cart.customerPhone')}: ${customerPhone}\n\n${lines.join('\n')}\n\n${t('cart.total')} ${fmt(total)}\n\n${t('cart.deliveryAddress')}`;
    window.open(`https://wa.me/${Store.settings().wa}?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
    setCart([]);
    onClose();
    onToast(t('cart.success', { id }));
  };
  return <>
    <div className={`overlay${isOpen ? ' show' : ''}`} onClick={onClose} />
    <aside className={`drawer glass${isOpen ? ' open' : ''}`} aria-label={t('cart.title')} aria-hidden={!isOpen}>
      <div className="dhead"><h3>{t('cart.title')}</h3><button className="ibtn" onClick={onClose} aria-label={t('cart.close')}>✕</button></div>
      <ul className="clist">
        {cart.length ? cart.map(item => <li className="item" key={item.key}>
          <div><b>{itemName(item)}</b><small>{itemMemory(item)}</small><small>{fmt(item.price)}</small></div>
          <div className="qty"><button onClick={() => changeQuantity(item, -1)} aria-label={t('cart.decrease')}>−</button><span>{item.qty}</span><button onClick={() => changeQuantity(item, 1)} aria-label={t('cart.increase')}>+</button></div>
        </li>) : <li className="none">{t('cart.empty')}</li>}
      </ul>
      <div className="dfoot">
        <input value={name} onChange={event => setName(event.target.value)} placeholder={t('cart.name')} autoComplete="name" />
        <input value={phone} onChange={event => setPhone(event.target.value)} placeholder={t('cart.phone')} inputMode="tel" autoComplete="tel" />
        <div className="total"><span>{t('cart.total')}</span><strong>{fmt(total)}</strong></div>
        <button className="btn wa" onClick={submitOrder} disabled={!cart.length}>{t('cart.order')}</button>
        <button className="btn ghost" onClick={() => setCart([])}>{t('cart.clear')}</button>
      </div>
    </aside>
  </>;
}
