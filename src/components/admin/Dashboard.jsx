import { fmt } from '../../data.js';
import { isSold } from '../../admin/constants.js';
import { useLanguage } from '../../i18n/language.jsx';

export default function Dashboard({ products, orders }) {
  const { t } = useLanguage();
  const fresh = orders.filter(order => order.status === 'new').length;
  const revenue = orders.filter(isSold).reduce((sum, order) => sum + order.total, 0);
  const low = products.filter(product => product.stock <= 3);
  const days = [...Array(7)].map((_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - 6 + index);
    return date;
  });
  const values = days.map(date => orders.filter(order => isSold(order) && new Date(order.date).toDateString() === date.toDateString()).reduce((sum, order) => sum + order.total, 0));
  const max = Math.max(...values, 1);
  return <section>
    <h2>{t('admin.dashboard')}</h2>
    <div className="kpis">
      {[[t('admin.revenue'), fmt(revenue)], [t('admin.allOrders'), orders.length], [t('admin.newOrders'), fresh], [t('admin.lowStock'), low.length]].map(([label, value]) => <div className="kpi glass" key={label}><span>{label}</span><b>{value}</b></div>)}
    </div>
    <div className="two">
      <div className="glass pnl"><h3>{t('admin.revenue7days')}</h3><div className="chart">{days.map((date, index) => <div key={date.toISOString()} title={fmt(values[index])}><i style={{ height: `${values[index] / max * 140}px` }} />{date.getDate()}.{String(date.getMonth() + 1).padStart(2, '0')}</div>)}</div></div>
      <div className="glass pnl"><h3>{t('admin.lowStockProducts')}</h3><ul className="low">{low.length ? low.map(product => <li key={product.id}><span>{product.name}</span><b>{t('admin.stockUnits', { count: product.stock })}</b></li>) : <li>{t('admin.stockEnough')}</li>}</ul></div>
    </div>
  </section>;
}
