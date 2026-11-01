import { useLanguage } from '../../i18n/language.jsx';

export default function OrderSuccess({ orderId, onNavigate }) {
  const { language } = useLanguage();
  const ru = language === 'ru';
  return <section className="section success-page">
    <div className="glass success-card">
      <div className="success-mark">✓</div>
      <h1>{ru ? 'Заказ принят' : 'Заказ кабыл алынды'}</h1>
      <p>{ru ? 'Номер заказа' : 'Заказ номери'}: <b>{orderId}</b></p>
      <button className="btn" onClick={() => onNavigate('/')}>{ru ? 'Вернуться в магазин' : 'Дүкөнгө кайтуу'}</button>
    </div>
  </section>;
}
