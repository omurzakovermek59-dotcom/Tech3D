import { useLanguage } from '../../i18n/language.jsx';
import CountUp from './CountUp.jsx';
import PhoneModelCanvas from './PhoneModelCanvas.jsx';

export default function Hero({ storeName = '' }) {
  const { language, t } = useLanguage();

  return <>
    <section className="hero" id="home">
      <div className="hero-text">
        <p className="chip glass"><i className="live" /> {t('hero.badge')}</p>
        <h1>{storeName || t('hero.title')}</h1>
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
        <PhoneModelCanvas alt={language === 'ru' ? '3D-модель iPhone 17 Pro Max' : 'iPhone 17 Pro Max 3D модели'} />
        <p className="hero-product-caption"><b>iPhone 17 Pro Max</b><span>{language === 'ru' ? 'АВТОВРАЩЕНИЕ · ПЕРЕТАЩИТЕ ДЛЯ ПОВОРОТА' : 'ӨЗҮ АЙЛАНАТ · СҮЙРӨП АЙЛАНТЫҢЫЗ'}</span></p>
      </div>
    </section>
    <div className="marquee" aria-hidden="true"><div>{['iPhone', 'Samsung', 'Xiaomi', 'Pixel', t('brand.warranty'), t('brand.delivery'), 'iPhone', 'Samsung', 'Xiaomi', 'Pixel', t('brand.warranty'), t('brand.delivery')].map((brand, index) => <span key={index}>{brand}</span>)}</div></div>
  </>;
}
