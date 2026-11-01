import { useEffect, useLayoutEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import useToast from '../hooks/useToast.js';
import Toast from '../components/shared/Toast.jsx';
import AuthPage from '../components/shop/AuthPage.jsx';
import Cart from '../components/shop/Cart.jsx';
import Catalog from '../components/shop/Catalog.jsx';
import Checkout from '../components/shop/Checkout.jsx';
import Footer from '../components/shop/Footer.jsx';
import Favorites from '../components/shop/Favorites.jsx';
import Header from '../components/shop/Header.jsx';
import Hero from '../components/shop/Hero.jsx';
import OrderSuccess from '../components/shop/OrderSuccess.jsx';
import ParticleBackground from '../components/shop/ParticleBackground.jsx';
import ProductDetails from '../components/shop/ProductDetails.jsx';
import Story from '../components/shop/Story.jsx';
import { useLanguage } from '../i18n/language.jsx';
import { auth, isFirebaseConfigured } from '../firebase.js';
import { subscribeToFavorites, subscribeToProducts, toggleFavorite } from '../services/store.js';
import useShopState from './useShopState.js';

function currentRoute() {
  return `${window.location.pathname}${window.location.search}`;
}

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
  const { language } = useLanguage();
  const [theme, setTheme] = useState(readTheme);
  const [route, setRoute] = useState(currentRoute);
  const [user, setUser] = useState(null);
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [favoriteError, setFavoriteError] = useState('');
  const navigate = path => {
    window.history.pushState({}, '', path);
    setRoute(currentRoute());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const setShopProducts = shop.setProducts;
  useEffect(() => {
    const handlePopState = () => setRoute(currentRoute());
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
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
  const routeUrl = new URL(route, window.location.origin);
  const routePath = routeUrl.pathname;
  useEffect(() => {
    if (routePath === '/admin') window.location.replace('/admin.html');
  }, [routePath]);
  const selectedProduct = routePath.startsWith('/product/')
    ? shop.products.find(product => product.id === decodeURIComponent(routePath.slice('/product/'.length)))
    : null;
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
      onLogout={() => auth && signOut(auth).catch(error => {
        console.error('Unable to sign out:', error);
        showToast(language === 'ru' ? 'Не удалось выйти из аккаунта.' : 'Аккаунттан чыгуу ишке ашкан жок.');
      })}
      favoriteCount={favoriteIds.length}
    />
    <main>
    {routePath === '/login' || routePath === '/register'
      ? <AuthPage mode={routePath.slice(1)} onNavigate={navigate} />
      : routePath === '/favorites'
        ? <Favorites user={user?.isAnonymous ? null : user} products={shop.products} favoriteIds={favoriteIds} onFavorite={handleFavorite} onNavigate={navigate} error={favoriteError} loading={favoriteLoading} memory={shop.memory} setMemory={shop.setMemory} onAdd={shop.addToCart} />
        : routePath === '/checkout'
          ? <Checkout cart={shop.cart} user={user} onSuccess={completeOrder} onNavigate={navigate} />
          : routePath === '/order-success'
            ? <OrderSuccess orderId={routeUrl.searchParams.get('id') || ''} onNavigate={navigate} />
            : routePath.startsWith('/product/')
              ? <ProductDetails product={selectedProduct} user={user?.isAnonymous ? null : user} onNavigate={navigate} onFavorite={handleFavorite} isFavorite={selectedProduct ? favoriteIds.includes(selectedProduct.id) : false} onAdd={shop.addToCart} />
              : <>
                {favoriteError && <p className="inline-error" role="alert">{favoriteError}</p>}
                <Hero products={shop.products} />
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
              </>}
    </main>
    <Footer />
    <Cart cart={shop.cart} products={shop.products} setCart={shop.setCart} isOpen={shop.cartOpen} onClose={() => shop.setCartOpen(false)} onCheckout={checkout} onToast={showToast} />
    <Toast message={toast} />
  </>;
}
