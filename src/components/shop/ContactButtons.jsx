import { useLanguage } from '../../i18n/language.jsx';
import { isValidPhoneNumber, whatsappUrl } from '../../utils/phone.js';
import { normalizeSocialLink } from '../../utils/social.js';

export default function ContactButtons({ settings = {}, storeName = 'Мой телефон' }) {
  const { t } = useLanguage();
  const whatsappNumber = isValidPhoneNumber(settings.whatsappNumber) ? settings.whatsappNumber : settings.phone;
  const whatsappLink = whatsappUrl(whatsappNumber);
  const telegramLink = normalizeSocialLink('telegram', settings.telegramLink)
    || `https://t.me/share/url?url=${encodeURIComponent(window.location.origin)}&text=${encodeURIComponent('Заказ из магазина Мой телефон')}`;

  return <aside className="contact-buttons" aria-label={t('contact.title')}>
    {whatsappLink && <a className="contact-button whatsapp" href={`${whatsappLink}?text=${encodeURIComponent(`Здравствуйте! Хочу оформить заказ в магазине «${storeName}».`)}`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" title="WhatsApp">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 3.5A11.8 11.8 0 0 0 12.1 0C5.5 0 .2 5.3.2 11.9c0 2.1.6 4.1 1.6 5.8L0 24l6.5-1.7a12 12 0 0 0 5.6 1.4h.1c6.6 0 11.9-5.3 11.9-11.9 0-3.1-1.3-6.1-3.6-8.3ZM12.1 21.7a9.8 9.8 0 0 1-5-1.4l-.4-.2-3.8 1 1-3.7-.3-.4a9.8 9.8 0 1 1 8.5 4.7Zm5.4-7.3c-.3-.2-1.7-.9-2-.9s-.5-.2-.7.2-.8.9-1 1.1-.4.2-.7.1a8.1 8.1 0 0 1-2.4-1.5 9 9 0 0 1-1.7-2.1c-.2-.3 0-.5.2-.7l.5-.6.2-.5v-.5c0-.2-.7-1.6-.9-2.2-.3-.5-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4s-1 1-1 2.4 1 2.8 1.1 3c.2.2 2 3.1 4.8 4.3.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.5-.1 1.7-.7 1.9-1.4.2-.7.2-1.3.1-1.4-.1-.2-.3-.3-.6-.4Z"/></svg>
    </a>}
    <a className="contact-button telegram" href={telegramLink} target="_blank" rel="noopener noreferrer" aria-label="Telegram" title="Telegram">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m23.5 2.2-3.6 19.1c-.3 1.4-1.1 1.7-2.2 1.1l-6-4.4-2.9 2.8c-.3.3-.5.5-1 .5l.4-6.1L19.3 5c.5-.4-.1-.7-.7-.3L5.1 13.3l-5.9-1.9c-1.3-.4-1.3-1.3.3-1.9L22.4.3c1.1-.4 2 .3 1.1 1.9Z"/></svg>
    </a>
  </aside>;
}
