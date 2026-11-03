import { useEffect } from 'react';
import { fmt } from '../../data.js';
import { memoryText, productText, useLanguage } from '../../i18n/language.jsx';

export default function Cart({ cart, products, setCart, isOpen, onClose, onCheckout, onToast }) {
  const { t } = useLanguage();
  const itemName = item => productText({ id: item.pid, name: item.name }, 'name', t);
  const itemMemory = item => [memoryText(item.mem, t), item.color].filter(Boolean).join(' · ');
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
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
        <div className="total"><span>{t('cart.total')}</span><strong>{fmt(total)}</strong></div>
        <button className="btn wa" onClick={onCheckout} disabled={!cart.length}>{t('cart.order')}</button>
        <button className="btn ghost" onClick={() => setCart([])}>{t('cart.clear')}</button>
      </div>
    </aside>
  </>;
}
