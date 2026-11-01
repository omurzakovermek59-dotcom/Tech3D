import { fmt } from '../../data.js';
import { memoryText, productText, useLanguage } from '../../i18n/language.jsx';

export default function ProductCard({ product, memoryIndex, onSelectMemory, onAdd, onFavorite, isFavorite, onView }) {
  const { t } = useLanguage();
  const index = Math.min(memoryIndex, Math.max(0, product.mem.length - 1));
  const memoryPrice = product.mem[index]?.[1] || 0;
  const price = product.base + memoryPrice;
  const old = (product.old || product.base) + memoryPrice;
  const discount = Math.round((1 - price / old) * 100);
  return <article className="card glass reveal in">
    {product.stock <= 0 ? <span className="tagl out">{t('product.soldOut')}</span> : product.stock <= 3 ? <span className="tagl warn">{t('product.lowStock', { count: product.stock })}</span> : discount > 0 ? <span className="tagl">-{discount}%</span> : null}
    <button type="button" className={`favorite-button${isFavorite ? ' selected' : ''}`} onClick={() => onFavorite(product.id)} aria-label={isFavorite ? t('favorites.remove') : t('favorites.add')} aria-pressed={isFavorite}>♥</button>
    <div className="pic">{product.image
      ? <button className="product-preview-trigger" type="button" onClick={onView} aria-label={t('product.details')}><img className="product-photo" src={product.image} alt={productText(product, 'name', t)} /></button>
      : <div className="mini" style={{ '--c1': product.c[0], '--c2': product.c[1] }} />}
    </div>
    <button className="product-title" type="button" onClick={onView}>{productText(product, 'name', t)}</button><p className="desc">{productText(product, 'desc', t)}</p>
    <div className="prices"><span className="now">{fmt(price)}</span>{old > price && <span className="old">{fmt(old)}</span>}</div>
    <div className="mem">{product.mem.map(([name], optionIndex) => <button key={name} className={`tag${optionIndex === index ? ' sel' : ''}`} onClick={() => onSelectMemory(product, optionIndex)}>{memoryText(name, t)}</button>)}</div>
    <div className="product-card-actions"><button className="btn" disabled={product.stock <= 0} onClick={() => onAdd(product, index)}>{product.stock <= 0 ? t('product.soldOut') : t('product.add')}</button><button type="button" className="btn ghost details-button" onClick={onView}>{t('product.details')}</button></div>
  </article>;
}
