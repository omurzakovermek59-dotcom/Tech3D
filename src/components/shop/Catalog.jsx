import { useEffect, useState } from 'react';
import { productText, useLanguage } from '../../i18n/language.jsx';
import ProductCard from './ProductCard.jsx';

export default function Catalog({ products, brand, setBrand, memory, setMemory, onAdd, favoriteIds, onFavorite, onView }) {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('default');
  const brands = [t('catalog.all'), ...new Set(products.map(product => product.category || product.brand))];
  const visible = products
    .filter(product => brand === 'Баары' || brand === 'Все' || brand === t('catalog.all') || (product.category || product.brand) === brand)
    .filter(product => productText(product, 'name', t).toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()))
    .sort((left, right) => sort === 'low'
      ? left.base - right.base
      : sort === 'high' ? right.base - left.base : 0);
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
    <div className="catalog-tools">
      <label className="search-field"><span className="visually-hidden">{t('catalog.search')}</span><input value={search} onChange={event => setSearch(event.target.value)} placeholder={t('catalog.search')} type="search" /></label>
      <label><span className="visually-hidden">{t('catalog.sort')}</span><select value={sort} onChange={event => setSort(event.target.value)}>
        <option value="default">{t('catalog.sort')}</option>
        <option value="low">{t('catalog.sortLow')}</option>
        <option value="high">{t('catalog.sortHigh')}</option>
      </select></label>
    </div>
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
        onFavorite={onFavorite}
        isFavorite={favoriteIds.includes(product.id)}
        onView={() => onView(product.id)}
      />)}
    </div>
    {visible.length === 0 && <p className="empty">{search ? t('catalog.noResults') : t('catalog.empty')}</p>}
  </section>;
}
