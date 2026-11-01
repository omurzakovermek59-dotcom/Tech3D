import { useLayoutEffect, useState } from 'react';
import useToast from '../hooks/useToast.js';
import Toast from '../components/shared/Toast.jsx';
import Cart from '../components/shop/Cart.jsx';
import Catalog from '../components/shop/Catalog.jsx';
import Footer from '../components/shop/Footer.jsx';
import Header from '../components/shop/Header.jsx';
import Hero from '../components/shop/Hero.jsx';
import ParticleBackground from '../components/shop/ParticleBackground.jsx';
import Story from '../components/shop/Story.jsx';
import { useLanguage } from '../i18n/language.jsx';
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
  const { language } = useLanguage();
  const [theme, setTheme] = useState(readTheme);
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
    />
    <main>
      <Hero products={shop.products} />
      <Story />
      <Catalog
        products={shop.products}
        brand={shop.brand}
        setBrand={shop.setBrand}
        memory={shop.memory}
        setMemory={shop.setMemory}
        onAdd={shop.addToCart}
      />
    </main>
    <Footer />
    <Cart cart={shop.cart} setCart={shop.setCart} isOpen={shop.cartOpen} onClose={() => shop.setCartOpen(false)} onToast={showToast} />
    <Toast message={toast} />
  </>;
}
