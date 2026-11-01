import { fmt } from '../../data.js';
import { productText, useLanguage } from '../../i18n/language.jsx';
import CountUp from './CountUp.jsx';

export default function Hero({ products }) {
  const { t } = useLanguage();
  const featured = products.filter(product => product.stock > 0).slice(0, 3);
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
      <div className="win glass" aria-hidden="true">
        <div className="win-bar"><i /><i /><i /><span>{t('hero.catalogWindow')}</span></div>
        <ul>{featured.map(product => <li key={product.id}><i style={{ '--c1': product.c[0], '--c2': product.c[1] }} /><b>{productText(product, 'name', t)}</b><em>{fmt(product.base)}</em></li>)}</ul>
        <div className="win-foot"><span>{t('hero.stock', { count: products.reduce((sum, product) => sum + product.stock, 0) })}</span><span className="live" /></div>
      </div>
    </section>
    <div className="marquee" aria-hidden="true"><div>{['iPhone', 'Samsung', 'Xiaomi', 'Pixel', t('brand.warranty'), t('brand.delivery'), 'iPhone', 'Samsung', 'Xiaomi', 'Pixel', t('brand.warranty'), t('brand.delivery')].map((brand, index) => <span key={index}>{brand}</span>)}</div></div>
  </>;
}
