import { useEffect, useLayoutEffect, useState } from 'react';
import { Store } from '../data.js';
import useToast from '../hooks/useToast.js';
import Toast from '../components/shared/Toast.jsx';
import Dashboard from '../components/admin/Dashboard.jsx';
import Login from '../components/admin/Login.jsx';
import Orders from '../components/admin/Orders.jsx';
import Products from '../components/admin/Products.jsx';
import Settings from '../components/admin/Settings.jsx';
import AdminSidebar from '../components/admin/AdminSidebar.jsx';
import { useLanguage } from '../i18n/language.jsx';
import { readAuthenticated } from './constants.js';

function readTheme() {
  try {
    return localStorage.getItem('t3d:theme') === 'studio' ? 'studio' : 'original';
  } catch {
    return 'original';
  }
}

export default function AdminApp() {
  const { language, t } = useLanguage();
  const [authenticated, setAuthenticated] = useState(readAuthenticated);
  const [theme, setTheme] = useState(readTheme);
  const [tab, setTab] = useState('dash');
  const [products, setProducts] = useState(() => Store.products());
  const [orders, setOrders] = useState(() => Store.orders());
  const [toast, showToast] = useToast(2200);
  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.lang = language;
    document.title = t('admin.documentTitle');
    try {
      localStorage.setItem('t3d:theme', theme);
    } catch {
      // Keep the selected appearance for this page when storage is unavailable.
    }
  }, [theme, language, t]);
  useEffect(() => {
    document.body.classList.add('adm-body');
    const refresh = () => {
      if (!readAuthenticated()) return;
      setProducts(Store.products());
      setOrders(Store.orders());
    };
    window.addEventListener('storage', refresh);
    return () => {
      document.body.classList.remove('adm-body');
      window.removeEventListener('storage', refresh);
    };
  }, []);
  const logout = () => {
    try { sessionStorage.removeItem('t3d-adm'); } catch { /* Continue logout in this view. */ }
    setAuthenticated(false);
    setTab('dash');
  };
  const refreshOrdersAndProducts = nextOrders => {
    setProducts(Store.products());
    setOrders(nextOrders || Store.orders());
  };
  const resetData = () => {
    setProducts(Store.products());
    setOrders(Store.orders());
  };
  const onToggleTheme = () => setTheme(current => current === 'original' ? 'studio' : 'original');
  if (!authenticated) return <><Login theme={theme} onToggleTheme={onToggleTheme} onLogin={() => setAuthenticated(true)} /><Toast message={toast} /></>;
  return <>
    <div className="adm">
      <AdminSidebar activeTab={tab} newOrderCount={orders.filter(order => order.status === 'new').length} onChangeTab={setTab} onLogout={logout} theme={theme} onToggleTheme={onToggleTheme} />
      <main className="adm-main">
        {tab === 'dash' && <Dashboard products={products} orders={orders} />}
        {tab === 'prod' && <Products products={products} onSave={setProducts} onToast={showToast} />}
        {tab === 'ord' && <Orders orders={orders} onUpdate={refreshOrdersAndProducts} onToast={showToast} />}
        {tab === 'set' && <Settings onToast={showToast} onReset={resetData} />}
      </main>
    </div>
    <Toast message={toast} />
  </>;
}
