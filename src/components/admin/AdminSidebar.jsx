import { useLanguage } from '../../i18n/language.jsx';
import { Link } from 'react-router-dom';
import AdminControls from '../shared/AdminControls.jsx';

export default function AdminSidebar({ activeTab, newOrderCount, onChangeTab, onLogout, theme, onToggleTheme, storeName = 'Мой телефон' }) {
  const { t } = useLanguage();
  const tabs = [
    ['dash', `📊 ${t('admin.dashboard')}`],
    ['prod', `📱 ${t('admin.products')}`],
    ['ord', `🧾 ${t('admin.orders')}`],
    ['reviews', `⭐ ${t('admin.reviews')}`],
    ['set', `⚙ ${t('admin.settings')}`]
  ];
  return <aside className="side glass">
    <Link to="/" className="logo">{storeName}</Link>
    <AdminControls theme={theme} onToggleTheme={onToggleTheme} />
    <nav>
      {tabs.map(([id, label]) => <button key={id} className={activeTab === id ? 'on' : ''} onClick={() => onChangeTab(id)}>
        {label}{id === 'ord' && <b className="badge2">{newOrderCount || ''}</b>}
      </button>)}
    </nav>
    <Link className="back" to="/">← {t('admin.shop')}</Link>
    <button className="back" onClick={onLogout}>{t('admin.logout')}</button>
  </aside>;
}
