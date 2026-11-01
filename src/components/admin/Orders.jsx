import React from 'react';
import { fmt } from '../../data.js';
import { STATUS } from '../../admin/constants.js';
import { deleteAdminOrder, setAdminOrderStatus } from '../../services/store.js';
import { useLanguage } from '../../i18n/language.jsx';

export default function Orders({ orders, onToast }) {
  const { t, language } = useLanguage();
  const changeStatus = async (order, status) => {
    try {
      await setAdminOrderStatus(order.id, status);
      onToast(t('admin.statusUpdated'));
    } catch (error) {
      console.error('Unable to update order status:', error);
      onToast(t('admin.statusUpdateFailed'));
    }
  };
  const remove = async order => {
    if (!window.confirm(t('admin.deleteOrderConfirm'))) return;
    try {
      await deleteAdminOrder(order.id);
      onToast(t('admin.orderDeleted'));
    } catch (error) {
      console.error('Unable to delete order:', error);
      onToast(t('admin.orderDeleteFailed'));
    }
  };
  const downloadCsv = () => {
    const quote = value => `"${String(value).replace(/"/g, '""')}"`;
    const rows = [
      [t('admin.csvNumber'), t('admin.csvDate'), t('admin.csvName'), t('admin.csvPhone'), t('admin.order'), t('admin.total'), t('admin.status')],
      ...orders.map(order => [order.id, order.date || order.createdAt?.toDate?.().toISOString() || '', order.customerName || order.name, order.phone, order.items.map(item => `${item.name} ${item.variant || item.mem || ''} x${item.quantity || item.qty}`).join('; '), order.total, t(`admin.status.${order.status}`)])
    ];
    const url = URL.createObjectURL(new Blob(['\ufeff' + rows.map(row => row.map(quote).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = language === 'ru' ? 'zakazy.csv' : 'buyrutmalar.csv';
    link.click();
    URL.revokeObjectURL(url);
  };
  return <section>
    <div className="bar"><h2>{t('admin.orders')}</h2><button className="btn ghost" onClick={downloadCsv}>{t('admin.downloadCsv')}</button></div>
    <div className="tbl glass"><table><thead><tr><th>{t('admin.orderNumberDate')}</th><th>{t('admin.customer')}</th><th>{t('admin.order')}</th><th>{t('admin.total')}</th><th>{t('admin.status')}</th><th /></tr></thead>
      <tbody>{orders.map(order => <tr key={order.id}>
        <td><b>{order.id}</b><br /><small>{new Date(order.date || order.createdAt?.toDate?.() || Date.now()).toLocaleString(language === 'ru' ? 'ru-RU' : 'ky-KG', { dateStyle: 'short', timeStyle: 'short' })}</small></td>
        <td>{order.customerName || order.name}<br /><a href={`https://wa.me/${order.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">{order.phone}</a><br /><small>{order.address}</small></td>
        <td>{order.items.map((item, index) => <React.Fragment key={`${item.productId || item.pid}-${index}`}>{index > 0 && <br />}{item.name} ({item.variant || item.mem}) × {item.quantity || item.qty}</React.Fragment>)}</td>
        <td><b>{fmt(order.total)}</b></td>
        <td><select className={`st-${order.status}`} value={order.status} onChange={event => changeStatus(order, event.target.value)}>{Object.keys(STATUS).map(key => <option key={key} value={key}>{t(`admin.status.${key}`)}</option>)}</select></td>
        <td><button className="mbtn del" onClick={() => remove(order)}>{t('admin.delete')}</button></td>
      </tr>)}</tbody>
    </table></div>
    {!orders.length && <p className="empty">{t('admin.noOrders')}</p>}
  </section>;
}
