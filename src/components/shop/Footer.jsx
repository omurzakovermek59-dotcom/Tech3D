import { Link } from 'react-router-dom';
import { useLanguage } from '../../i18n/language.jsx';
import { formatPhoneNumber, isValidPhoneNumber, normalizePhoneNumber, whatsappUrl } from '../../utils/phone.js';
import { normalizeSocialLink } from '../../utils/social.js';

export default function Footer({ settings = {}, settingsError = '', storeName = 'Мой телефон' }) {
  const { t } = useLanguage();
  const phone = normalizePhoneNumber(settings.phone);
  const formattedPhone = formatPhoneNumber(settings.phone);
  const whatsappNumber = isValidPhoneNumber(settings.whatsappNumber) ? settings.whatsappNumber : settings.phone;
  const whatsappLink = whatsappUrl(whatsappNumber);
  const address = String(settings.address || '').trim();
  const instagramLink = normalizeSocialLink('instagram', settings.instagramLink);
  const telegramLink = normalizeSocialLink('telegram', settings.telegramLink);
  const whatsappContactLink = whatsappLink
    ? `${whatsappLink}?text=${encodeURIComponent(t('footer.whatsappMessage'))}`
    : '';
  const hasContact = phone || whatsappLink || address;
  const hasSocialLinks = instagramLink || telegramLink;

  return <footer className="footer glass" id="contacts">
    <div className="footer-info">
      <Link to="/" className="logo">{storeName}</Link>
      <p>{t('footer.tagline')}</p>
      {hasContact && <div className="footer-contact">
        <h4>{t('footer.contact')}</h4>
        {phone && <p>{t('footer.phone')}: <a href={`tel:${phone}`}>{formattedPhone}</a></p>}
        {whatsappLink && <p><a href={whatsappLink} target="_blank" rel="noopener noreferrer">WhatsApp</a></p>}
        {address && <p>{t('location.address')}: {address}</p>}
      </div>}
      {settingsError && <p className="err" role="alert">{settingsError}</p>}
    </div>
    <div className="footer-aside">
      {hasSocialLinks && <div className="social footer-social">
        <h4>{t('footer.social')}</h4>
        {instagramLink && <a href={instagramLink} target="_blank" rel="noopener noreferrer">Instagram</a>}
        {telegramLink && <a href={telegramLink} target="_blank" rel="noopener noreferrer">Telegram</a>}
      </div>}
      <div className="footer-help">
        <h4>{t('footer.helpTitle')}</h4>
        <p>{t('footer.helpText')}</p>
        <div className="footer-actions">
          {whatsappContactLink && <a className="btn footer-whatsapp" href={whatsappContactLink} target="_blank" rel="noopener noreferrer">{t('footer.writeWhatsapp')}</a>}
          <a className="btn ghost footer-catalog" href="#phones">{t('footer.catalogLink')}</a>
        </div>
      </div>
    </div>
  </footer>;
}
