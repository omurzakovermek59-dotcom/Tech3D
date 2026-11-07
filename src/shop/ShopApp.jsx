import { useEffect, useLayoutEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useMatch, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import useToast from '../hooks/useToast.js';
import Toast from '../components/shared/Toast.jsx';
import AuthPage from '../components/shop/AuthPage.jsx';
import Cart from '../components/shop/Cart.jsx';
import Catalog from '../components/shop/Catalog.jsx';
import Checkout from '../components/shop/Checkout.jsx';
import ContactButtons from '../components/shop/ContactButtons.jsx';
import ContactPage from '../components/shop/ContactPage.jsx';
import Favorites from '../components/shop/Favorites.jsx';
import Footer from '../components/shop/Footer.jsx';
import Header from '../components/shop/Header.jsx';
import Hero from '../components/shop/Hero.jsx';
import OrderSuccess from '../components/shop/OrderSuccess.jsx';
import OrderHistory from '../components/shop/OrderHistory.jsx';
import ParticleBackground from '../components/shop/ParticleBackground.jsx';
import ProductDetails from '../components/shop/ProductDetails.jsx';
import Story from '../components/shop/Story.jsx';
import { useLanguage } from '../i18n/language.jsx';
import { auth, isFirebaseConfigured } from '../firebase.js';
import { subscribeToFavorites, subscribeToProducts, subscribeToStoreSettings, toggleFavorite } from '../services/store.js';
import useShopState from './useShopState.js';

function readTheme() {
  try {
    return localStorage.getItem('t3d:theme') === 'studio' ? 'studio' : 'original';
  } catch {
    return 'original';
  }
}

export default function ShopApp() {
  const [toast, showToast] = useToast();
  const shop = useShopState(showToast);
  const { language, t } = useLanguage();
  const [theme, setTheme] = useState(readTheme);
  const location = useLocation();
  const routerNavigate = useNavigate();
  const [user, setUser] = useState(null);
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [favoriteError, setFavoriteError] = useState('');
  const [storeSettings, setStoreSettings] = useState({});
  const [storeSettingsError, setStoreSettingsError] = useState('');
  const navigate = path => {
    routerNavigate(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const setShopProducts = shop.setProducts;
  useEffect(() => {
    if (!auth) return undefined;
    return onAuthStateChanged(auth, nextUser => {
      setUser(nextUser);
      setFavoriteIds([]);
      setFavoriteError('');
      setFavoriteLoading(Boolean(nextUser && !nextUser.isAnonymous && isFirebaseConfigured));
    });
  }, []);
  useEffect(() => {
    if (!user || user.isAnonymous || !isFirebaseConfigured) return undefined;
    return subscribeToFavorites(user.uid, ids => {
      setFavoriteIds(ids);
      setFavoriteLoading(false);
    }, error => {
      console.error('Unable to load favorites:', error);
      setFavoriteError(language === 'ru' ? 'Избранное недоступно. Проверьте правила Firestore.' : 'Тандалгандар жеткиликсиз. Firestore эрежелерин текшериңиз.');
      setFavoriteLoading(false);
    });
  }, [user, language]);
  useEffect(() => {
    if (!isFirebaseConfigured) return undefined;
    return subscribeToProducts(products => setShopProducts(products), error => {
      console.error('Unable to load public catalog:', error);
      showToast(language === 'ru' ? 'Не удалось обновить каталог.' : 'Каталогты жаңыртуу мүмкүн болгон жок.');
    });
  }, [language, setShopProducts, showToast]);
  useEffect(() => {
    if (!isFirebaseConfigured) return undefined;
    return subscribeToStoreSettings(settings => {
      setStoreSettings(settings);
      setStoreSettingsError('');
    }, error => {
      console.error('Unable to load public store location:', error);
      setStoreSettingsError(language === 'ru'
        ? 'Не удалось загрузить контактные данные магазина.'
        : 'Дүкөндүн байланыш маалыматын жүктөө мүмкүн болгон жок.');
    });
  }, [language]);
  const handleFavorite = async productId => {
    if (!user || user.isAnonymous) {
      navigate('/login?next=%2Ffavorites');
      return;
    }
    try {
      await toggleFavorite(user.uid, productId, favoriteIds.includes(productId));
    } catch (error) {
      console.error('Unable to update favorite:', error);
      setFavoriteError(language === 'ru' ? 'Не удалось сохранить избранное. Проверьте Firebase.' : 'Тандалган товар сакталган жок. Firebase жөндөөлөрүн текшериңиз.');
    }
  };
  const checkout = () => {
    shop.setCartOpen(false);
    navigate('/checkout');
  };
  const completeOrder = orderId => {
    shop.setCart([]);
    navigate(`/order-success?id=${encodeURIComponent(orderId)}`);
  };
  const routeUrl = new URL(`${location.pathname}${location.search}`, window.location.origin);
  const routePath = routeUrl.pathname;
  const storeName = String(storeSettings.siteName || '').trim() || 'Мой телефон';
  const productMatch = useMatch('/product/:id');
  const selectedProduct = productMatch
    ? shop.products.find(product => product.id === productMatch.params.id)
    : null;
  useEffect(() => {
    const title = selectedProduct
      ? `${selectedProduct.name} — ${storeName}`
      : routePath === '/contacts'
        ? `${t('footer.contact')} — ${storeName}`
      : `${storeName} — смартфондор дүкөнү`;
    document.title = title;
    const description = document.querySelector('meta[name="description"]');
    if (description) description.content = selectedProduct?.desc || (routePath === '/contacts'
      ? `${t('footer.contact')} — ${storeName}`
      : `${storeName} — заманбап смартфондор, ыңгайлуу тандоо жана сапаттуу тейлөө.`);
  }, [routePath, location.search, selectedProduct, storeName, t]);
  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.lang = language;
    try {
      localStorage.setItem('t3d:theme', theme);
    } catch {
      // Keep the selected appearance for the current page if storage is unavailable.
    }
  }, [theme, language]);
  return <>
    <ParticleBackground />
    <Header
      cartCount={shop.cartCount}
      onOpenCart={() => shop.setCartOpen(true)}
      theme={theme}
      onToggleTheme={() => setTheme(current => current === 'original' ? 'studio' : 'original')}
      user={user}
      onNavigate={navigate}
      onLogout={() => {
        if (!auth || !window.confirm(t('auth.logoutConfirm'))) return;
        signOut(auth).catch(error => {
          console.error('Unable to sign out:', error);
          showToast(language === 'ru' ? 'Не удалось выйти из аккаунта.' : 'Аккаунттан чыгуу ишке ашкан жок.');
        });
      }}
      favoriteCount={favoriteIds.length}
      storeName={storeName}
    />
    <main>
      <Routes>
        <Route path="/" element={<>
          {favoriteError && <p className="inline-error" role="alert">{favoriteError}</p>}
          <Hero storeName={storeName} />
          <Story />
          <Catalog
            products={shop.products}
            brand={shop.brand}
            setBrand={shop.setBrand}
            memory={shop.memory}
            setMemory={shop.setMemory}
            onAdd={shop.addToCart}
            favoriteIds={favoriteIds}
            onFavorite={handleFavorite}
            onView={id => navigate(`/product/${encodeURIComponent(id)}`)}
          />
        </>} />
        <Route path="/contacts" element={<ContactPage settings={storeSettings} settingsError={storeSettingsError} storeName={storeName} />} />
        <Route path="/product/:id" element={<ProductDetails product={selectedProduct} user={user?.isAnonymous ? null : user} onNavigate={navigate} onFavorite={handleFavorite} isFavorite={selectedProduct ? favoriteIds.includes(selectedProduct.id) : false} onAdd={shop.addToCart} whatsappNumber={storeSettings.orderWhatsappNumber || storeSettings.whatsappNumber || storeSettings.phone} />} />
        <Route path="/login" element={<AuthPage mode="login" onNavigate={navigate} />} />
        <Route path="/register" element={<AuthPage mode="register" onNavigate={navigate} />} />
        <Route path="/orders" element={<OrderHistory user={user?.isAnonymous ? null : user} onNavigate={navigate} />} />
        <Route path="/favorites" element={<Favorites user={user?.isAnonymous ? null : user} products={shop.products} favoriteIds={favoriteIds} onFavorite={handleFavorite} onNavigate={navigate} error={favoriteError} loading={favoriteLoading} memory={shop.memory} setMemory={shop.setMemory} onAdd={shop.addToCart} />} />
        <Route path="/checkout" element={!user || user.isAnonymous
          ? <AuthPage mode="login" onNavigate={navigate} nextPath="/checkout" />
          : <Checkout cart={shop.cart} user={user} onSuccess={completeOrder} onNavigate={navigate} />} />
        <Route path="/order-success" element={<OrderSuccess orderId={routeUrl.searchParams.get('id') || ''} onNavigate={navigate} />} />
        <Route path="/index.html" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </main>
    {routePath !== '/contacts' && <Footer settings={storeSettings} settingsError={storeSettingsError} storeName={storeName} />}
    <ContactButtons settings={storeSettings} storeName={storeName} />
    <Cart cart={shop.cart} products={shop.products} setCart={shop.setCart} isOpen={shop.cartOpen} onClose={() => shop.setCartOpen(false)} onCheckout={checkout} onToast={showToast} />
    <Toast message={toast} />
  </>;
}
