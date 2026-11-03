import { useEffect, useRef, useState } from 'react';
import { fmt } from '../../data.js';
import { deleteReview, loadReviews, saveReview } from '../../services/store.js';
import { memoryText, productText, useLanguage } from '../../i18n/language.jsx';
import ProductGallery from './ProductGallery.jsx';

export default function ProductDetails({ product, user, onNavigate, onFavorite, isFavorite, onAdd }) {
  const { language, t } = useLanguage();
  const ru = language === 'ru';
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [reviewError, setReviewError] = useState('');
  const [modelFailed, setModelFailed] = useState(false);
  const [modelLoading, setModelLoading] = useState(Boolean(product?.modelUrl));
  const [memoryIndex, setMemoryIndex] = useState(0);
  const [selectedColorIndex, setSelectedColorIndex] = useState(null);
  const [selectedImage, setSelectedImage] = useState('');
  const [showModel, setShowModel] = useState(false);
  const [colorError, setColorError] = useState('');
  const modelRef = useRef(null);
  const modelUrl = product?.modelUrl || product?.model || '';

  useEffect(() => {
    if (!product) return undefined;
    let active = true;
    setMemoryIndex(0);
    setSelectedColorIndex(null);
    setSelectedImage(product.image || product.gallery?.[0] || product.colors?.find(color => color.image)?.image || '');
    setShowModel(false);
    setColorError('');
    setLoadingReviews(true);
    setReviews([]);
    setReviewError('');
    setComment('');
    setRating(5);
    loadReviews(product.id)
      .then(items => { if (active) setReviews(items); })
      .catch(error => {
        console.error('Unable to load reviews:', error);
        if (active) setReviewError(ru ? 'Отзывы недоступны. Проверьте конфигурацию Firebase.' : 'Пикирлерди жүктөө мүмкүн болгон жок. Firebase жөндөөлөрүн текшериңиз.');
      })
      .finally(() => { if (active) setLoadingReviews(false); });
    return () => { active = false; };
  }, [product?.id, ru]);
  useEffect(() => {
    if (!modelUrl) return undefined;
    let active = true;
    setModelLoading(true);
    setModelFailed(false);
    import('@google/model-viewer').catch(error => {
      console.error('Unable to load 3D viewer:', error);
      if (active) {
        setModelLoading(false);
        setModelFailed(true);
      }
    });
    return () => { active = false; };
  }, [modelUrl]);
  useEffect(() => {
    const viewer = modelRef.current;
    if (!viewer || !modelUrl) return undefined;
    const loaded = () => setModelLoading(false);
    const failed = () => {
      setModelLoading(false);
      setModelFailed(true);
    };
    viewer.addEventListener('load', loaded);
    viewer.addEventListener('error', failed);
    return () => {
      viewer.removeEventListener('load', loaded);
      viewer.removeEventListener('error', failed);
    };
  }, [modelUrl]);

  const submitReview = async event => {
    event.preventDefault();
    setReviewError('');
    if (!user) {
      onNavigate('/login');
      return;
    }
    if (!comment.trim()) {
      setReviewError(ru ? 'Напишите комментарий.' : 'Комментарий жазыңыз.');
      return;
    }
    try {
      await saveReview(user.uid, product.id, {
        rating,
        comment: comment.trim(),
        authorName: user.displayName || (ru ? 'Покупатель' : 'Кардар')
      });
      setComment('');
      setReviews(await loadReviews(product.id));
    } catch (error) {
      console.error('Unable to save review:', error);
      setReviewError(ru ? 'Не удалось сохранить отзыв. Проверьте доступ к Firestore.' : 'Пикир сакталган жок. Firestore уруксатын текшериңиз.');
    }
  };

  const removeReview = async () => {
    try {
      await deleteReview(user.uid, product.id);
      setReviews(await loadReviews(product.id));
    } catch (error) {
      console.error('Unable to delete review:', error);
      setReviewError(ru ? 'Не удалось удалить отзыв.' : 'Пикирди өчүрүү мүмкүн болгон жок.');
    }
  };

  const ownReview = reviews.find(review => review.uid === user?.uid);
  useEffect(() => {
    if (ownReview) setRating(ownReview.rating);
  }, [ownReview?.uid, ownReview?.rating]);
  if (!product) return <section className="section"><p className="empty">{ru ? 'Товар не найден.' : 'Товар табылган жок.'}</p></section>;
  const memory = product.mem?.[memoryIndex] || product.mem?.[0] || ['', 0];
  const price = product.base + memory[1];
  const average = reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;
  const validModelUrl = /^https?:\/\//i.test(modelUrl) || modelUrl.startsWith('/');
  const colors = (product.colors || []).filter(color => color.name);
  const selectedColor = selectedColorIndex === null ? null : colors[selectedColorIndex];
  const images = [...new Set([product.image, ...(product.gallery || []), ...colors.map(color => color.image)].filter(Boolean))];
  const specifications = [
    ['ram', product.specs?.ram],
    ['storage', product.specs?.storage],
    ['screen', product.specs?.screen],
    ['camera', product.specs?.camera],
    ['battery', product.specs?.battery],
    ['processor', product.specs?.processor]
  ].filter(([, value]) => value);
  const addToCart = () => {
    if (colors.length && !selectedColor) {
      setColorError(t('location.selectColor'));
      return;
    }
    onAdd(product, memoryIndex, selectedColor?.name || '');
  };
  return <section className="section route-page">
    <button className="text-button" onClick={() => onNavigate('/')}>← {ru ? 'В каталог' : 'Каталогго'}</button>
    <article className="glass product-detail">
      <div className="model-stage">
        {modelUrl && validModelUrl && !modelFailed && (showModel || !images.length) ? <>
          {modelLoading && <p className="model-loading" role="status">{ru ? 'Загрузка 3D-модели…' : '3D модель жүктөлүүдө…'}</p>}
          <model-viewer ref={modelRef} src={modelUrl} alt={productText(product, 'name', t)} camera-controls touch-action="pan-y" interaction-prompt="auto" loading="eager">
          </model-viewer>
        </> : images.length
          ? <ProductGallery images={images} selectedImage={images.includes(selectedImage) ? selectedImage : images[0]} onSelect={setSelectedImage} alt={productText(product, 'name', t)} />
          : <div className="mini detail-mini" style={{ '--c1': product.c[0], '--c2': product.c[1] }} />}
        {modelUrl && validModelUrl && images.length > 0 && !modelFailed && <div className="product-view-toggle">
          <button type="button" className={`tag${!showModel ? ' sel' : ''}`} onClick={() => setShowModel(false)}>{t('location.gallery')}</button>
          <button type="button" className={`tag${showModel ? ' sel' : ''}`} onClick={() => setShowModel(true)}>{t('location.model')}</button>
        </div>}
        {(modelFailed || (modelUrl && !validModelUrl)) && <p className="note">{ru ? '3D-модель недоступна — показано обычное изображение.' : '3D модель жеткиликсиз — кадимки сүрөт көрсөтүлдү.'}</p>}
      </div>
      <div className="detail-info">
        <p className="sub">{product.brand}</p>
        <h1>{productText(product, 'name', t)}</h1>
        <p>{productText(product, 'desc', t)}</p>
        <p className="prices"><span className="now">{fmt(price)}</span></p>
        <div className="mem">{product.mem?.map(([name], index) => <button key={name} className={`tag${index === memoryIndex ? ' sel' : ''}`} onClick={() => setMemoryIndex(index)}>{memoryText(name, t)}</button>)}</div>
        {colors.length > 0 && <div className="product-color-picker">
          <h3>{t('location.color')}{selectedColor ? `: ${selectedColor.name}` : ''}</h3>
          <div className="product-colors">{colors.map((color, index) => <button
            type="button"
            className={`product-color-option${index === selectedColorIndex ? ' selected' : ''}`}
            key={`${color.name}-${index}`}
            onClick={() => {
              setSelectedColorIndex(index);
              setColorError('');
              if (color.image) setSelectedImage(color.image);
              setShowModel(false);
            }}
            aria-label={color.name}
            aria-pressed={index === selectedColorIndex}
          ><i style={{ backgroundColor: color.value || '#777' }} /><span>{color.name}</span></button>)}</div>
          {colorError && <p className="err" role="alert">{colorError}</p>}
        </div>}
        <div className="detail-actions">
          <button className="btn ghost" onClick={() => onFavorite(product.id)}>{isFavorite ? (ru ? '♥ В избранном' : '♥ Тандалгандарда') : (ru ? '♡ В избранное' : '♡ Тандалгандарга')}</button>
          <button className="btn" disabled={product.stock <= 0} onClick={addToCart}>{product.stock <= 0 ? t('product.soldOut') : t('product.add')}</button>
        </div>
        <p className="rating-summary">★ {average ? average.toFixed(1) : '—'} <span>({reviews.length} {ru ? 'отзывов' : 'пикир'})</span></p>
      </div>
    </article>
    {specifications.length > 0 && <section className="product-specifications">
      <h2>{t('location.specifications')}</h2>
      <dl>{specifications.map(([key, value]) => <div key={key}><dt>{t(`location.${key}`)}</dt><dd>{value}</dd></div>)}</dl>
    </section>}
    <section className="reviews">
      <h2>{ru ? 'Отзывы покупателей' : 'Кардарлардын пикирлери'}</h2>
      {loadingReviews && <p className="note">{ru ? 'Загрузка отзывов…' : 'Пикирлер жүктөлүүдө…'}</p>}
      {reviewError && <p className="err" role="alert">{reviewError}</p>}
      {!loadingReviews && reviews.map(review => <article className="review glass" key={review.id}>
        <div><b>{review.authorName || (ru ? 'Покупатель' : 'Кардар')}</b><span className="review-stars">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span></div>
        <small>{review.createdAt?.toDate ? review.createdAt.toDate().toLocaleDateString(ru ? 'ru-RU' : 'ky-KG') : ''}</small>
        <p>{review.comment}</p>
        {review.uid === user?.uid && <button className="text-button" onClick={removeReview}>{ru ? 'Удалить мой отзыв' : 'Менин пикирди өчүрүү'}</button>}
      </article>)}
      {!loadingReviews && !reviews.length && <p className="note">{ru ? 'Пока нет отзывов.' : 'Азырынча пикир жок.'}</p>}
      {!user ? <button className="btn ghost" onClick={() => onNavigate('/login')}>{ru ? 'Войдите, чтобы оставить отзыв' : 'Пикир калтыруу үчүн кириңиз'}</button>
        : <form className="glass review-form" onSubmit={submitReview}>
          <h3>{ownReview ? (ru ? 'Изменить свой отзыв' : 'Өз пикириңизди өзгөртүү') : (ru ? 'Оставить отзыв' : 'Пикир калтыруу')}</h3>
          <label>{ru ? 'Оценка' : 'Баалоо'}<select value={rating} onChange={event => setRating(Number(event.target.value))}>{[5, 4, 3, 2, 1].map(value => <option value={value} key={value}>{value} ★</option>)}</select></label>
          <label>{ru ? 'Комментарий' : 'Комментарий'}<textarea value={comment || ownReview?.comment || ''} onChange={event => setComment(event.target.value)} maxLength="2000" rows="4" required /></label>
          <button className="btn">{ru ? 'Сохранить отзыв' : 'Пикирди сактоо'}</button>
        </form>}
    </section>
  </section>;
}
