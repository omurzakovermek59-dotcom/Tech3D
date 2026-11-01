import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../../i18n/language.jsx';
import CountUp from './CountUp.jsx';

export default function Hero({ products }) {
  const { language, t } = useLanguage();
  const ru = language === 'ru';
  const phone = products.find(product => product.id === 'ip17');
  const modelUrl = phone?.modelUrl || phone?.model || '';
  const validModelUrl = /^https?:\/\//i.test(modelUrl) || modelUrl.startsWith('/');
  const modelRef = useRef(null);
  const [modelState, setModelState] = useState(validModelUrl ? 'loading' : 'missing');
  const [autoRotate, setAutoRotate] = useState(true);

  useEffect(() => {
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateRotation = () => setAutoRotate(!motionPreference.matches);
    updateRotation();
    motionPreference.addEventListener('change', updateRotation);
    return () => motionPreference.removeEventListener('change', updateRotation);
  }, []);

  useEffect(() => {
    if (!validModelUrl) {
      setModelState(modelUrl ? 'failed' : 'missing');
      return undefined;
    }

    let active = true;
    setModelState('loading');
    import('@google/model-viewer').catch(error => {
      console.error('Unable to load the iPhone 3D viewer:', error);
      if (active) setModelState('failed');
    });
    return () => { active = false; };
  }, [modelUrl, validModelUrl]);

  useEffect(() => {
    const viewer = modelRef.current;
    if (!viewer || !modelUrl) return undefined;
    const loaded = () => setModelState('ready');
    const failed = () => setModelState('failed');
    viewer.addEventListener('load', loaded);
    viewer.addEventListener('error', failed);
    return () => {
      viewer.removeEventListener('load', loaded);
      viewer.removeEventListener('error', failed);
    };
  }, [modelUrl]);

  return <>
    <section className="hero" id="home">
      <div className="hero-text">
        <p className="chip glass"><i className="live" /> {t('hero.badge')}</p>
        <h1>{t('hero.title')}</h1>
        <p className="lead">{t('hero.lead')}</p>
        <div className="cta"><a href="#phones" className="btn mag">{t('hero.catalog')}</a><a href="#story" className="btn ghost mag">{t('hero.how')}</a></div>
        <div className="stats">
          <div><CountUp value={1000} suffix="+" /><span>{t('hero.customers')}</span></div>
          <div><CountUp value={24} suffix={t('hero.deliverySuffix')} /><span>{t('hero.delivery')}</span></div>
          <div><CountUp value={12} suffix={t('hero.installmentSuffix')} /><span>{t('hero.installments')}</span></div>
        </div>
      </div>
      <div className="hero-product">
        <div className="hero-product-glow" />
        {validModelUrl
          ? <model-viewer
              ref={modelRef}
              className="hero-model"
              src={modelUrl}
              alt={ru ? 'iPhone 17 Pro Max, чёрный цвет' : 'iPhone 17 Pro Max, кара түс'}
              auto-rotate={autoRotate ? '' : undefined}
              rotation-per-second="18deg"
              camera-controls
              touch-action="pan-y"
              interaction-prompt="none"
              shadow-intensity="1"
              loading="eager"
            />
          : <p className="hero-model-message" role="status">{ru ? 'Добавьте GLB-модель в панели администратора' : '3D модель файлын админ панелинен кошуңуз'}</p>}
        {modelState === 'loading' && <p className="hero-model-status" role="status">{ru ? 'Загрузка 3D-модели…' : '3D модель жүктөлүүдө…'}</p>}
        {modelState === 'failed' && <p className="hero-model-status" role="alert">{ru ? 'Не удалось открыть 3D-модель. Проверьте ссылку на GLB.' : '3D модель ачылган жок. GLB шилтемесин текшериңиз.'}</p>}
        <p className="hero-product-caption"><b>iPhone 17 Pro Max</b><span>{ru ? 'АВТОВРАЩЕНИЕ · ПЕРЕТАЩИТЕ ДЛЯ ПОВОРОТА' : 'ӨЗҮ АЙЛАНАТ · СҮЙРӨП АЙЛАНТЫҢЫЗ'}</span></p>
      </div>
    </section>
    <div className="marquee" aria-hidden="true"><div>{['iPhone', 'Samsung', 'Xiaomi', 'Pixel', t('brand.warranty'), t('brand.delivery'), 'iPhone', 'Samsung', 'Xiaomi', 'Pixel', t('brand.warranty'), t('brand.delivery')].map((brand, index) => <span key={index}>{brand}</span>)}</div></div>
  </>;
}
