import { subscribeToFavorites } from '../../services/store.js';
import ProductCard from './ProductCard.jsx';
import { useLanguage } from '../../i18n/language.jsx';

export default function Favorites({ user, products, favoriteIds, onFavorite, onNavigate, error, loading, memory, setMemory, onAdd }) {
  const { language } = useLanguage();
  const ru = language === 'ru';
  const favorites = products.filter(product => favoriteIds.includes(product.id));
  return <section className="section route-page">
    <button className="text-button" onClick={() => onNavigate('/')}>← {ru ? 'В магазин' : 'Дүкөнгө'}</button>
    <h1>{ru ? 'Избранное' : 'Тандалгандар'}</h1>
    {error && <p className="err" role="alert">{error}</p>}
    {!user ? <div className="empty-state glass"><p>{ru ? 'Войдите, чтобы просматривать личный список избранного.' : 'Жеке тандалгандар тизмесин көрүү үчүн аккаунтка кириңиз.'}</p><button className="btn" onClick={() => onNavigate('/login')}>{ru ? 'Войти' : 'Кирүү'}</button></div>
      : loading ? <p className="note">{ru ? 'Загрузка избранного…' : 'Тандалгандар жүктөлүүдө…'}</p>
        : favorites.length ? <div className="grid">{favorites.map(product => <ProductCard key={product.id} product={product} memoryIndex={memory[product.id] || 0} onSelectMemory={(selected, index) => setMemory(current => ({ ...current, [selected.id]: index }))} onAdd={onAdd} onFavorite={onFavorite} isFavorite onView={() => onNavigate(`/product/${encodeURIComponent(product.id)}`)} />)}</div>
        : <p className="empty">{ru ? 'В избранном пока нет товаров.' : 'Тандалгандар тизмеси азырынча бош.'}</p>}
  </section>;
}
