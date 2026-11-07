import { useEffect, useState } from 'react';
import { isFirebaseConfigured } from '../../firebase.js';
import { useLanguage } from '../../i18n/language.jsx';
import { saveStoreSettings, subscribeToStoreSettings } from '../../services/store.js';
import { isValidPhoneNumber } from '../../utils/phone.js';

const EMPTY_SETTINGS = { name: '', siteName: '', address: '', latitude: '', longitude: '', mapUrl: '', phone: '', whatsappNumber: '', orderWhatsappNumber: '', instagramLink: '', telegramLink: '' };

export default function Settings({ onToast }) {
  const { t } = useLanguage();
  const [settings, setSettings] = useState(EMPTY_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [phoneErrors, setPhoneErrors] = useState({});
  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      setError(t('admin.firebaseRequired'));
      return undefined;
    }
    return subscribeToStoreSettings(value => {
      setSettings({ ...EMPTY_SETTINGS, ...value });
      setLoading(false);
      setError('');
    }, failure => {
      console.error('Unable to load store location:', failure);
      setLoading(false);
      setError(t('admin.loadFailed'));
    });
  }, [t]);
  const update = event => {
    const { name, value } = event.target;
    setSettings(current => ({ ...current, [name]: value }));
    setPhoneErrors(current => current[name]
      ? { ...current, [name]: value.trim() && !isValidPhoneNumber(value) ? t('contact.phoneValidation') : '' }
      : current);
  };
  const save = async event => {
    event.preventDefault();
    setError('');
    const nextPhoneErrors = ['phone', 'whatsappNumber', 'orderWhatsappNumber'].reduce((errors, name) => {
      if (settings[name].trim() && !isValidPhoneNumber(settings[name])) errors[name] = t('contact.phoneValidation');
      return errors;
    }, {});
    setPhoneErrors(nextPhoneErrors);
    if (Object.keys(nextPhoneErrors).length) return;
    setSaving(true);
    try {
      await saveStoreSettings({
        ...settings,
        latitude: String(settings.latitude ?? '').trim(),
        longitude: String(settings.longitude ?? '').trim()
      });
      onToast(t('location.saved'));
    } catch (failure) {
      console.error('Unable to save store location:', failure);
      setError(t('location.saveFailed'));
    } finally {
      setSaving(false);
    }
  };
  return <section>
    <h2>{t('admin.settings')}</h2>
    <div className="glass pnl">
      <h3>{t('location.adminTitle')}</h3>
      <p>{isFirebaseConfigured ? t('admin.firebaseConnected') : t('admin.firebaseRequired')}</p>
      {loading && <p className="note" role="status">{t('auth.loading')}</p>}
      <form className="location-admin-form" onSubmit={save}>
        <label>{t('admin.siteName')}<input name="siteName" value={settings.siteName} onChange={update} maxLength="120" placeholder={t('hero.title')} /></label>
        <label>{t('location.name')}<input name="name" value={settings.name} onChange={update} maxLength="120" /></label>
        <label>{t('location.address')}<input name="address" value={settings.address} onChange={update} maxLength="300" /></label>
        <div className="row2">
          <label>{t('location.latitude')}<input name="latitude" type="number" step="any" min="-90" max="90" value={settings.latitude} onChange={update} /></label>
          <label>{t('location.longitude')}<input name="longitude" type="number" step="any" min="-180" max="180" value={settings.longitude} onChange={update} /></label>
        </div>
        <label>{t('location.mapUrl')}<input name="mapUrl" type="url" value={settings.mapUrl} onChange={update} placeholder="https://2gis.kg/..." /></label>
        <label>{t('footer.phone')}<input name="phone" type="tel" inputMode="tel" autoComplete="tel" value={settings.phone} onChange={update} maxLength="40" aria-invalid={Boolean(phoneErrors.phone)} aria-describedby={phoneErrors.phone ? 'phone-error' : undefined} />{phoneErrors.phone && <span className="err" id="phone-error" role="alert">{phoneErrors.phone}</span>}</label>
        <label>{t('contact.whatsappNumber')}<input name="whatsappNumber" type="tel" inputMode="tel" autoComplete="tel" value={settings.whatsappNumber} onChange={update} maxLength="40" placeholder="+996555000000" aria-invalid={Boolean(phoneErrors.whatsappNumber)} aria-describedby={phoneErrors.whatsappNumber ? 'whatsapp-error' : undefined} />{phoneErrors.whatsappNumber && <span className="err" id="whatsapp-error" role="alert">{phoneErrors.whatsappNumber}</span>}</label>
        <label>{t('admin.orderWhatsappNumber')}<input name="orderWhatsappNumber" type="tel" inputMode="tel" autoComplete="tel" value={settings.orderWhatsappNumber} onChange={update} maxLength="40" placeholder="+996555123456" aria-invalid={Boolean(phoneErrors.orderWhatsappNumber)} aria-describedby={phoneErrors.orderWhatsappNumber ? 'order-whatsapp-error' : undefined} />{phoneErrors.orderWhatsappNumber && <span className="err" id="order-whatsapp-error" role="alert">{phoneErrors.orderWhatsappNumber}</span>}</label>
        <label>{t('contact.instagramLink')}<input name="instagramLink" type="text" value={settings.instagramLink} onChange={update} maxLength="120" placeholder="@username же https://instagram.com/username" /></label>
        <label>{t('contact.telegramLink')}<input name="telegramLink" type="text" value={settings.telegramLink} onChange={update} maxLength="120" placeholder="@username же https://t.me/username" /></label>
        {error && <p className="err" role="alert">{error}</p>}
        <button className="btn" disabled={saving || loading || !isFirebaseConfigured}>{saving ? t('location.saving') : t('admin.save')}</button>
      </form>
      <p className="note">{t('admin.localOnlyNote')}</p>
    </div>
  </section>;
}
