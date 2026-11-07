import { useEffect, useLayoutEffect, useState } from 'react';
import { getIdTokenResult, onAuthStateChanged, signOut } from 'firebase/auth';
import { Store } from '../data.js';
import { auth, isFirebaseConfigured } from '../firebase.js';
import useToast from '../hooks/useToast.js';
import Toast from '../components/shared/Toast.jsx';
import Dashboard from '../components/admin/Dashboard.jsx';
import Login from '../components/admin/Login.jsx';
import Orders from '../components/admin/Orders.jsx';
import Products from '../components/admin/Products.jsx';
import Reviews from '../components/admin/Reviews.jsx';
import Settings from '../components/admin/Settings.jsx';
import AdminSidebar from '../components/admin/AdminSidebar.jsx';
import { useLanguage } from '../i18n/language.jsx';
import { initializeProductsIfEmpty, subscribeToOrders, subscribeToProducts, subscribeToStoreSettings } from '../services/store.js';
import { isAdminEmail } from './constants.js';

function readTheme() {
  try {
    return localStorage.getItem('t3d:theme') === 'studio' ? 'studio' : 'original';
  } catch {
    return 'original';
  }
}

export default function AdminApp() {
  const { language, t } = useLanguage();
  const [authenticated, setAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [authMessage, setAuthMessage] = useState('');
  const [theme, setTheme] = useState(readTheme);
  const [tab, setTab] = useState('dash');
  const [products, setProducts] = useState(() => Store.products());
  const [orders, setOrders] = useState([]);
  const [storeName, setStoreName] = useState('Мой телефон');
  const [dataError, setDataError] = useState('');
  const [toast, showToast] = useToast(2200);
  useEffect(() => {
    if (!isFirebaseConfigured) return undefined;
    return subscribeToStoreSettings(settings => {
      setStoreName(String(settings.siteName || '').trim() || 'Мой телефон');
    }, error => {
      console.error('Unable to load site name:', error);
    });
  }, []);
  useEffect(() => {
    if (!auth) {
      setAuthLoading(false);
      setAuthMessage(t('admin.firebaseRequired'));
      return undefined;
    }
    return onAuthStateChanged(auth, async user => {
      setAuthLoading(true);
      if (!user) {
        setAuthenticated(false);
        setAuthLoading(false);
        return;
      }
      try {
        const token = await getIdTokenResult(user, true);
        if (isAdminEmail(token.claims.email)) {
          setAuthenticated(true);
          setAuthMessage('');
        } else {
          await signOut(auth);
          setAuthenticated(false);
          setAuthMessage(t('admin.accessDenied'));
        }
      } catch (error) {
        console.error('Unable to verify administrator role:', error);
        setAuthenticated(false);
        setAuthMessage(t('admin.accessDenied'));
      } finally {
        setAuthLoading(false);
      }
    });
  }, [t]);
  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.lang = language;
    document.title = `${storeName} — ${t('admin.loginTitle')}`;
    try {
      localStorage.setItem('t3d:theme', theme);
    } catch {
      // Keep the selected appearance for this page when storage is unavailable.
    }
  }, [theme, language, t, storeName]);
  useEffect(() => {
    document.body.classList.add('adm-body');
    return () => {
      document.body.classList.remove('adm-body');
    };
  }, []);
  useEffect(() => {
    if (!authenticated || !isFirebaseConfigured) return undefined;
    let active = true;
    let stopProducts = () => {};
    let stopOrders = () => {};
    initializeProductsIfEmpty(Store.products()).then(() => {
      if (!active) return;
      stopProducts = subscribeToProducts(setProducts, error => {
        console.error('Unable to load admin products:', error);
        setDataError(t('admin.loadFailed'));
        showToast(t('admin.loadFailed'));
      });
      stopOrders = subscribeToOrders(setOrders, error => {
        console.error('Unable to load admin orders:', error);
        setDataError(t('admin.loadFailed'));
        showToast(t('admin.loadFailed'));
      });
    }).catch(error => {
      console.error('Unable to initialize admin catalog:', error);
      setDataError(t('admin.loadFailed'));
      showToast(t('admin.loadFailed'));
    });
    return () => {
      active = false;
      stopProducts();
      stopOrders();
    };
  }, [authenticated, showToast, t]);
  const logout = async () => {
    if (auth) await signOut(auth);
    setAuthenticated(false);
    setTab('dash');
  };
  const onToggleTheme = () => setTheme(current => current === 'original' ? 'studio' : 'original');
  if (authLoading) return <section className="login"><div className="glass login-box">{t('auth.loading')}</div></section>;
  if (!authenticated) return <><Login theme={theme} onToggleTheme={onToggleTheme} onLogin={() => setAuthenticated(true)} authMessage={authMessage || (!isFirebaseConfigured ? t('admin.firebaseRequired') : '')} storeName={storeName} /><Toast message={toast} /></>;
  return <>
    <div className="adm">
      <AdminSidebar activeTab={tab} newOrderCount={orders.filter(order => order.status === 'new').length} onChangeTab={setTab} onLogout={logout} theme={theme} onToggleTheme={onToggleTheme} storeName={storeName} />
      <main className="adm-main">
        {dataError && <p className="err" role="alert">{dataError}</p>}
        {tab === 'dash' && <Dashboard products={products} orders={orders} />}
        {tab === 'prod' && <Products products={products} onSave={setProducts} onToast={showToast} />}
        {tab === 'ord' && <Orders orders={orders} onToast={showToast} />}
        {tab === 'reviews' && <Reviews onToast={showToast} />}
        {tab === 'set' && <Settings onToast={showToast} />}
      </main>
    </div>
    <Toast message={toast} />
  </>;
}
