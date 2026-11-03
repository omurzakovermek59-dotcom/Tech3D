import { useLanguage } from '../../i18n/language.jsx';
import StoreLocation from './StoreLocation.jsx';

export default function Footer({ settings, settingsError }) {
  const { t } = useLanguage();
  return <footer className="footer glass" id="contacts">
    <div><a href="#home" className="logo">Мой телефон</a><p>{t('footer.tagline')}</p></div>
    <StoreLocation settings={settings} settingsError={settingsError} />
    <div className="social"><h4>{t('footer.social')}</h4><a href="https://instagram.com" target="_blank" rel="noopener noreferrer">Instagram</a><a href="https://t.me" target="_blank" rel="noopener noreferrer">Telegram</a><a href="/admin">{t('nav.admin')}</a></div>
    <p className="copy">© 2026 Мой телефон. {t('footer.rights')}</p>
  </footer>;
}
