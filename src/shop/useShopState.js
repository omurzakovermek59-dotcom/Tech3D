import { useEffect, useState } from 'react';
import { Store } from '../data.js';
import { productText, useLanguage } from '../i18n/language.jsx';

function readCart() {
  try { return JSON.parse(localStorage.getItem('t3d:cart') || '[]'); } catch { return []; }
}

export default function useShopState(showToast) {
  const { t } = useLanguage();
  const [products, setProducts] = useState(() => Store.products());
  const [cart, setCart] = useState(readCart);
  const [brand, setBrand] = useState('Баары');
  const [memory, setMemory] = useState({});
  const [cartOpen, setCartOpen] = useState(false);
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  useEffect(() => {
    const updateProducts = () => setProducts(Store.products());
    const pointerMove = event => {
      document.documentElement.style.setProperty('--mx', `${event.clientX}px`);
      document.documentElement.style.setProperty('--my', `${event.clientY}px`);
    };
    const keyDown = event => { if (event.key === 'Escape') setCartOpen(false); };
    const magnetMove = event => {
      const button = event.currentTarget;
      const bounds = button.getBoundingClientRect();
      button.style.transform = `translate(${(event.clientX - bounds.left - bounds.width / 2) * 0.2}px,${(event.clientY - bounds.top - bounds.height / 2) * 0.3}px)`;
    };
    const resetMagnet = event => { event.currentTarget.style.transform = ''; };
    window.addEventListener('storage', updateProducts);
    window.addEventListener('pointermove', pointerMove);
    window.addEventListener('keydown', keyDown);
    const magnets = document.querySelectorAll('.mag');
    magnets.forEach(button => {
      button.addEventListener('pointermove', magnetMove);
      button.addEventListener('pointerleave', resetMagnet);
    });
    return () => {
      window.removeEventListener('storage', updateProducts);
      window.removeEventListener('pointermove', pointerMove);
      window.removeEventListener('keydown', keyDown);
      magnets.forEach(button => {
        button.removeEventListener('pointermove', magnetMove);
        button.removeEventListener('pointerleave', resetMagnet);
      });
    };
  }, []);

  const addToCart = (product, index) => {
    const memoryOption = product.mem[index] || product.mem[0];
    const productName = productText(product, 'name', t);
    const key = `${product.id}|${index}`;
    const inCart = cart.filter(item => item.pid === product.id).reduce((sum, item) => sum + item.qty, 0);
    if (inCart >= product.stock) {
      showToast(t('cart.stockLimit', { count: product.stock }));
      return;
    }
    setCart(current => {
      const existing = current.find(item => item.key === key);
      return existing
        ? current.map(item => item.key === key ? { ...item, qty: item.qty + 1 } : item)
        : [...current, { key, pid: product.id, name: productName, mem: memoryOption[0], price: product.base + memoryOption[1], qty: 1 }];
    });
    showToast(t('toast.added', { name: productName }));
  };

  return {
    products, setProducts, cart, setCart, brand, setBrand, memory, setMemory,
    cartOpen, setCartOpen, cartCount, addToCart
  };
}
