import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../../i18n/language.jsx';

export default function ProductGallery({ images, selectedImage, onSelect, alt }) {
  const { t } = useLanguage();
  const [zoomed, setZoomed] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const touchStart = useRef(null);
  const currentIndex = Math.max(0, images.indexOf(selectedImage));
  const showPrevious = () => onSelect(images[(currentIndex - 1 + images.length) % images.length]);
  const showNext = () => onSelect(images[(currentIndex + 1) % images.length]);

  useEffect(() => setImageFailed(false), [selectedImage]);
  useEffect(() => {
    if (!zoomed) return undefined;
    const closeOnEscape = event => {
      if (event.key === 'Escape') setZoomed(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [zoomed]);

  if (!images.length || !selectedImage) return null;
  const swipe = event => {
    if (touchStart.current === null) return;
    const distance = event.changedTouches[0].clientX - touchStart.current;
    if (Math.abs(distance) > 40 && images.length > 1) {
      if (distance < 0) showNext();
      else showPrevious();
    }
    touchStart.current = null;
  };
  return <div className="product-gallery">
    <div
      className="product-gallery-main"
      onTouchStart={event => { touchStart.current = event.touches[0].clientX; }}
      onTouchEnd={swipe}
    >
      <button type="button" className="gallery-image-button" onClick={() => setZoomed(true)} aria-label={t('location.zoomImage')}>
        {imageFailed
          ? <span className="gallery-image-error">{t('location.imageUnavailable')}</span>
          : <img src={selectedImage} alt={alt} onError={() => setImageFailed(true)} />}
      </button>
      {images.length > 1 && <>
        <button type="button" className="gallery-arrow previous" onClick={showPrevious} aria-label={t('location.previousImage')}>‹</button>
        <button type="button" className="gallery-arrow next" onClick={showNext} aria-label={t('location.nextImage')}>›</button>
      </>}
    </div>
    {images.length > 1 && <div className="gallery-thumbnails" aria-label={t('location.gallery')}>
      {images.map((image, index) => <button
        type="button"
        key={`${image}-${index}`}
        className={`gallery-thumbnail${image === selectedImage ? ' selected' : ''}`}
        onClick={() => onSelect(image)}
        aria-label={`${t('location.gallery')} ${index + 1}`}
        aria-pressed={image === selectedImage}
      ><img src={image} alt="" loading="lazy" /></button>)}
    </div>}
    {zoomed && <div className="gallery-lightbox" role="dialog" aria-modal="true" aria-label={alt} onClick={() => setZoomed(false)}>
      <button type="button" className="gallery-close" onClick={() => setZoomed(false)} aria-label={t('location.closeImage')}>×</button>
      <img src={selectedImage} alt={alt} onClick={event => event.stopPropagation()} />
    </div>}
  </div>;
}
