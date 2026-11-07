import StoreLocation from './StoreLocation.jsx';
import { useLanguage } from '../../i18n/language.jsx';
import { Link } from 'react-router-dom';
import { normalizeSocialLink } from '../../utils/social.js';

export default function ContactPage({ settings, settingsError, storeName }) {
  const { t } = useLanguage();
  const instagramLink = normalizeSocialLink('instagram', settings?.instagramLink);
  const telegramLink = normalizeSocialLink('telegram', settings?.telegramLink);

  return <section className="contact-page">
    <h1>{t('footer.contact')}</h1>
    <p className="contact-page-intro">{storeName}</p>
    <StoreLocation settings={settings} settingsError={settingsError} />
    <div className="contact-page-info glass">
      <div>
        <Link to="/" className="logo">{storeName}</Link>
        <p>{t('footer.tagline')}</p>
      </div>
      <div className="social">
        <h4>{t('footer.social')}</h4>
        {instagramLink && <a href={instagramLink} target="_blank" rel="noopener noreferrer">Instagram</a>}
        {telegramLink && <a href={telegramLink} target="_blank" rel="noopener noreferrer">Telegram</a>}
      </div>
    </div>
  </section>;
}
