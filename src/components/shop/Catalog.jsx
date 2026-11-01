import { useEffect } from 'react';
import { useLanguage } from '../../i18n/language.jsx';
import ProductCard from './ProductCard.jsx';

export default function Catalog({ products, brand, setBrand, memory, setMemory, onAdd }) {
  const { t } = useLanguage();
  const brands = [t('catalog.all'), ...new Set(products.map(product => product.brand))];
  const visible = products.filter(product => brand === 'Баары' || brand === 'Все' || product.brand === brand);
  useEffect(() => {
    const reveal = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        reveal.unobserve(entry.target);
      }
    }), { threshold: 0.15 });
    document.querySelectorAll('.reveal').forEach(element => reveal.observe(element));
    return () => reveal.disconnect();
  }, [products, brand]);
  const tilt = event => {
    if (event.pointerType === 'touch') return;
    const card = event.target.closest('.card');
    if (!card) return;
    const bounds = card.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width;
    const y = (event.clientY - bounds.top) / bounds.height;
    card.style.setProperty('--gx', `${x * 100}%`);
    card.style.setProperty('--gy', `${y * 100}%`);
    card.style.transform = `rotateY(${(x - 0.5) * 14}deg) rotateX(${-(y - 0.5) * 14}deg) scale(1.03)`;
  };
  const untilt = event => {
    const card = event.target.closest('.card');
    if (card && !card.contains(event.relatedTarget)) card.style.transform = '';
  };
  return <section className="section" id="phones">
    <h2 className="reveal">{t('catalog.title')}</h2><p className="sub reveal">{t('catalog.subtitle')}</p>
    <div className="chips">{brands.map(item => {
      const allSelected = item === t('catalog.all') && (brand === 'Баары' || brand === 'Все');
      return <button key={item} className={`chip2${allSelected || item === brand ? ' on' : ''}`} onClick={() => setBrand(allSelected ? 'Баары' : item)}>{item}</button>;
    })}</div>
    <div className="grid" onPointerMove={tilt} onPointerOut={untilt}>
      {visible.map(product => <ProductCard
        key={product.id}
        product={product}
        memoryIndex={memory[product.id] || 0}
        onSelectMemory={(selectedProduct, index) => setMemory(current => ({ ...current, [selectedProduct.id]: index }))}
        onAdd={onAdd}
      />)}
    </div>
    {visible.length === 0 && <p className="empty">{t('catalog.empty')}</p>}
  </section>;
}
