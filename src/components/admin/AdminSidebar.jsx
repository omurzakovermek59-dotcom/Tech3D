import { useLanguage } from '../../i18n/language.jsx';
import AdminControls from '../shared/AdminControls.jsx';

export default function AdminSidebar({ activeTab, newOrderCount, onChangeTab, onLogout, theme, onToggleTheme }) {
  const { t } = useLanguage();
  const tabs = [
    ['dash', `📊 ${t('admin.dashboard')}`],
    ['prod', `📱 ${t('admin.products')}`],
    ['ord', `🧾 ${t('admin.orders')}`],
    ['reviews', `⭐ ${t('admin.reviews')}`],
    ['set', `⚙ ${t('admin.settings')}`]
  ];
  return <aside className="side glass">
    <a href="/" className="logo">Мой телефон</a>
    <AdminControls theme={theme} onToggleTheme={onToggleTheme} />
    <nav>
      {tabs.map(([id, label]) => <button key={id} className={activeTab === id ? 'on' : ''} onClick={() => onChangeTab(id)}>
        {label}{id === 'ord' && <b className="badge2">{newOrderCount || ''}</b>}
      </button>)}
    </nav>
    <a className="back" href="index.html">← {t('admin.shop')}</a>
    <button className="back" onClick={onLogout}>{t('admin.logout')}</button>
  </aside>;
}
