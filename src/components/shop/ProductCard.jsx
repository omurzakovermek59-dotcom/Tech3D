import { fmt } from '../../data.js';
import { memoryText, productText, useLanguage } from '../../i18n/language.jsx';

export default function ProductCard({ product, memoryIndex, onSelectMemory, onAdd, onFavorite, isFavorite, onView }) {
  const { t } = useLanguage();
  const item = product && typeof product === 'object' ? product : {};
  const memoryOptions = Array.isArray(item.mem)
    ? item.mem
    : Array.isArray(item.memoryVariants) ? item.memoryVariants : [];
  const memories = memoryOptions.length
    ? memoryOptions.map(option => {
      const name = Array.isArray(option) ? option[0] : option?.name;
      const extraPrice = Array.isArray(option) ? option[1] : option?.price;
      const parsedPrice = Number(extraPrice);
      return [name || 'Стандарт', Number.isFinite(parsedPrice) ? parsedPrice : 0];
    })
    : [['Стандарт', 0]];
  const colors = Array.isArray(item.c) ? item.c : [];
  const productColors = Array.isArray(item.colors) ? item.colors : [];
  const gallery = Array.isArray(item.gallery) ? item.gallery : [];
  const image = item.image || gallery.find(value => typeof value === 'string' && value) || '';
  const selectedIndex = Number.isInteger(memoryIndex) ? memoryIndex : 0;
  const index = Math.min(Math.max(0, selectedIndex), memories.length - 1);
  const memoryPrice = memories[index][1];
  const basePrice = Number(item.base) || 0;
  const price = basePrice + memoryPrice;
  const old = (Number(item.old) || basePrice) + memoryPrice;
  const discount = Number.isFinite(price) && Number.isFinite(old) && old > 0 ? Math.round((1 - price / old) * 100) : 0;
  const stock = Number(item.stock) || 0;
  return <article className="card glass reveal in">
    {stock <= 0 ? <span className="tagl out">{t('product.soldOut')}</span> : stock <= 3 ? <span className="tagl warn">{t('product.lowStock', { count: stock })}</span> : discount > 0 ? <span className="tagl">-{discount}%</span> : null}
    <button type="button" className={`favorite-button${isFavorite ? ' selected' : ''}`} onClick={() => onFavorite(item.id)} aria-label={isFavorite ? t('favorites.remove') : t('favorites.add')} aria-pressed={isFavorite}>♥</button>
    <div className="pic">{image
      ? <>
        <button className="product-preview-trigger" type="button" onClick={onView} aria-label={t('product.details')}><img className="product-photo" src={image} alt={productText(item, 'name', t)} onError={event => {
          event.currentTarget.hidden = true;
          const fallback = event.currentTarget.closest('.pic')?.querySelector('.image-fallback');
          if (fallback) fallback.hidden = false;
        }} /></button>
        <div className="mini image-fallback" hidden style={{ '--c1': colors[0] || '#7a3cff', '--c2': colors[1] || '#22e4ff' }} />
      </>
      : <div className="mini" style={{ '--c1': colors[0] || '#7a3cff', '--c2': colors[1] || '#22e4ff' }} />}
    </div>
    <button className="product-title" type="button" onClick={onView}>{productText(item, 'name', t)}</button><p className="desc">{productText(item, 'desc', t)}</p>
    <div className="prices"><span className="now">{fmt(price)}</span>{old > price && <span className="old">{fmt(old)}</span>}</div>
    <div className="mem">{memories.map(([name], optionIndex) => <button key={`${name}-${optionIndex}`} className={`tag${optionIndex === index ? ' sel' : ''}`} onClick={() => onSelectMemory(item, optionIndex)}>{memoryText(name, t)}</button>)}</div>
    <div className="product-card-actions"><button className="btn" disabled={stock <= 0} onClick={() => productColors.length ? onView() : onAdd(item, index)}>{stock <= 0 ? t('product.soldOut') : productColors.length ? t('product.chooseOptions') : t('product.add')}</button><button type="button" className="btn ghost details-button" onClick={onView}>{t('product.details')}</button></div>
  </article>;
}
