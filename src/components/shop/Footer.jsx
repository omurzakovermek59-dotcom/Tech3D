import { useLanguage } from '../../i18n/language.jsx';

export default function Footer() {
  const { t } = useLanguage();
  return <footer className="footer glass" id="contacts">
    <div><a href="#home" className="logo">Tech<span>3D</span></a><p>{t('footer.tagline')}</p></div>
    <div><h4>{t('footer.contact')}</h4><p>{t('footer.address')}</p><p>{t('footer.phone')}: +996 555 00 00 00</p><p>{t('footer.hours')}</p></div>
    <div className="social"><h4>{t('footer.social')}</h4><a href="https://instagram.com" target="_blank" rel="noopener noreferrer">Instagram</a><a href="https://t.me" target="_blank" rel="noopener noreferrer">Telegram</a><a href="/admin">{t('nav.admin')}</a></div>
    <p className="copy">© 2026 Tech3D. {t('footer.rights')}</p>
  </footer>;
}
