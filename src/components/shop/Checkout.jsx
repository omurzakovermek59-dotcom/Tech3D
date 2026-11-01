import { useRef, useState } from 'react';
import { signInAnonymously } from 'firebase/auth';
import { fmt } from '../../data.js';
import { auth } from '../../firebase.js';
import { createOrder } from '../../services/store.js';
import { memoryText, useLanguage } from '../../i18n/language.jsx';

export default function Checkout({ cart, user, onSuccess, onNavigate }) {
  const { language, t } = useLanguage();
  const ru = language === 'ru';
  const [name, setName] = useState(user?.displayName || '');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const orderId = useRef(`T3D-${crypto.randomUUID()}`);
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  const submit = async event => {
    event.preventDefault();
    setError('');
    const digits = phone.replace(/\D/g, '');
    if (name.trim().length < 2 || name.trim().length > 100 || digits.length < 9 || phone.trim().length > 30
      || address.trim().length < 5 || address.trim().length > 500 || comment.trim().length > 500
      || cart.length === 0 || cart.length > 30) {
      setError(ru ? 'Проверьте имя, телефон, адрес и товары в заказе.' : 'Атыңызды, телефонду, даректи жана товарларды текшериңиз.');
      return;
    }
    if (!auth) {
      setError(ru ? 'Firebase не настроен, заказ не сохранён.' : 'Firebase туташкан эмес, заказ сакталган жок.');
      return;
    }
    setBusy(true);
    try {
      const orderUser = user || (await signInAnonymously(auth)).user;
      const details = {
        customerName: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        comment: comment.trim(),
        date: new Date().toISOString(),
        items: cart.map(item => ({
          productId: item.pid,
          name: item.name,
          variant: item.mem,
          unitPrice: item.price,
          quantity: item.qty
        })),
        total
      };
      await createOrder(orderUser.uid, orderId.current, details);
      onSuccess(orderId.current);
    } catch (failure) {
      console.error('Unable to create order:', failure);
      setError(ru
        ? 'Заказ не сохранён. Проверьте Anonymous-вход Firebase, базу Firestore и опубликованные правила; корзина не очищена.'
        : 'Заказ сакталган жок. Firebase Anonymous кирүүсүн, Firestore базасын жана жарыяланган эрежелерди текшериңиз; себет тазаланган жок.');
    } finally {
      setBusy(false);
    }
  };

  return <section className="section checkout-page">
    <button className="text-button" onClick={() => onNavigate('/')}>← {ru ? 'В магазин' : 'Дүкөнгө'}</button>
    <h1>{ru ? 'Оформление заказа' : 'Заказды тариздөө'}</h1>
    {cart.length === 0 ? <p className="empty">{ru ? 'Корзина пуста.' : 'Себет бош.'}</p> : <div className="checkout-layout">
      <form className="glass account-box checkout-form" onSubmit={submit}>
        <label>{ru ? 'Имя и фамилия' : 'Аты-жөнү'}<input value={name} onChange={event => setName(event.target.value)} autoComplete="name" minLength="2" maxLength="100" required /></label>
        <label>{ru ? 'Телефон' : 'Телефон номери'}<input type="tel" value={phone} onChange={event => setPhone(event.target.value)} inputMode="tel" autoComplete="tel" minLength="9" maxLength="30" required /></label>
        <label>{ru ? 'Адрес доставки' : 'Жеткирүү дареги'}<input value={address} onChange={event => setAddress(event.target.value)} autoComplete="street-address" minLength="5" maxLength="500" required /></label>
        <label>{ru ? 'Комментарий (необязательно)' : 'Комментарий (милдеттүү эмес)'}<textarea value={comment} onChange={event => setComment(event.target.value)} maxLength="500" rows="3" /></label>
        {error && <p className="err" role="alert">{error}</p>}
        <button className="btn" disabled={busy}>{busy ? (ru ? 'Сохранение…' : 'Сакталууда…') : (ru ? 'Подтвердить заказ' : 'Заказды ырастоо')}</button>
      </form>
      <div className="glass order-summary">
        <h2>{ru ? 'Ваш заказ' : 'Заказыңыз'}</h2>
        {cart.map(item => <div className="order-line" key={item.key}><span>{item.name} ({memoryText(item.mem, t)}) × {item.qty}</span><b>{fmt(item.price * item.qty)}</b></div>)}
        <div className="total"><span>{ru ? 'Итого' : 'Жалпы сумма'}</span><strong>{fmt(total)}</strong></div>
      </div>
    </div>}
  </section>;
}
