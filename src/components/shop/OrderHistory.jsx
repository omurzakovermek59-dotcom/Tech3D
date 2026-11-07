import { useEffect, useState } from 'react';
import { fmt } from '../../data.js';
import { subscribeToUserOrders } from '../../services/store.js';
import { useLanguage } from '../../i18n/language.jsx';

function orderDate(order, language) {
  const date = order.createdAt?.toDate?.() || new Date(order.date || '');
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleString(language === 'ru' ? 'ru-RU' : 'ky-KG');
}

export default function OrderHistory({ user, onNavigate }) {
  const { language, t } = useLanguage();
  const ru = language === 'ru';
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(Boolean(user));
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || user.isAnonymous) {
      setOrders([]);
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    setError('');
    return subscribeToUserOrders(user.uid, nextOrders => {
      setOrders(nextOrders);
      setLoading(false);
    }, failure => {
      console.error('Unable to load order history:', failure);
      setError(ru ? 'Не удалось загрузить заказы. Проверьте правила Firestore.' : 'Заказ тарыхын жүктөө мүмкүн болгон жок. Firestore эрежелерин текшериңиз.');
      setLoading(false);
    });
  }, [user, ru]);

  return <section className="section route-page order-history">
    <button className="text-button" onClick={() => onNavigate('/')}>← {ru ? 'В магазин' : 'Дүкөнгө'}</button>
    <h1>{t('orders.title')}</h1>
    {!user || user.isAnonymous
      ? <div className="empty-state glass"><p>{ru ? 'Войдите, чтобы просматривать историю заказов.' : 'Заказ тарыхын көрүү үчүн аккаунтка кириңиз.'}</p><button className="btn" onClick={() => onNavigate('/login?next=%2Forders')}>{t('auth.login')}</button></div>
      : loading
        ? <p className="note" role="status">{ru ? 'Загрузка заказов…' : 'Заказдар жүктөлүүдө…'}</p>
        : error
          ? <p className="err" role="alert">{error}</p>
          : orders.length
            ? <div className="order-history-list">{orders.map(order => <article className="glass order-history-card" key={order.id}>
              <div className="order-history-heading"><div><h2>{ru ? 'Заказ' : 'Заказ'} #{order.id}</h2><time>{orderDate(order, language)}</time></div><b className="order-status">{t(`admin.status.${order.status || 'new'}`)}</b></div>
              <ul>{(Array.isArray(order.items) ? order.items : []).map((item, index) => <li key={`${item.productId || item.name}-${index}`}><span>{item.name}{item.variant ? ` · ${item.variant}` : ''} × {item.quantity || item.qty || 1}</span><b>{fmt((Number(item.unitPrice ?? item.price) || 0) * (Number(item.quantity || item.qty) || 1))}</b></li>)}</ul>
              <div className="order-history-total"><span>{ru ? 'Итого' : 'Жалпы сумма'}</span><b>{fmt(order.total)}</b></div>
            </article>)}</div>
            : <p className="empty">{ru ? 'У вас пока нет заказов.' : 'Азырынча заказдарыңыз жок.'}</p>}
  </section>;
}
