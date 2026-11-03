import { useEffect, useState } from 'react';
import { isFirebaseConfigured } from '../../firebase.js';
import { useLanguage } from '../../i18n/language.jsx';
import { saveStoreSettings, subscribeToStoreSettings } from '../../services/store.js';

const EMPTY_SETTINGS = { name: '', address: '', latitude: '', longitude: '', mapUrl: '', phone: '' };

export default function Settings({ onToast }) {
  const { t } = useLanguage();
  const [settings, setSettings] = useState(EMPTY_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
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
  const update = event => setSettings(current => ({ ...current, [event.target.name]: event.target.value }));
  const save = async event => {
    event.preventDefault();
    setError('');
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
        <label>{t('location.name')}<input name="name" value={settings.name} onChange={update} maxLength="120" /></label>
        <label>{t('location.address')}<input name="address" value={settings.address} onChange={update} maxLength="300" /></label>
        <div className="row2">
          <label>{t('location.latitude')}<input name="latitude" type="number" step="any" min="-90" max="90" value={settings.latitude} onChange={update} /></label>
          <label>{t('location.longitude')}<input name="longitude" type="number" step="any" min="-180" max="180" value={settings.longitude} onChange={update} /></label>
        </div>
        <label>{t('location.mapUrl')}<input name="mapUrl" type="url" value={settings.mapUrl} onChange={update} placeholder="https://2gis.kg/..." /></label>
        <label>{t('footer.phone')}<input name="phone" type="tel" value={settings.phone} onChange={update} maxLength="40" /></label>
        {error && <p className="err" role="alert">{error}</p>}
        <button className="btn" disabled={saving || loading || !isFirebaseConfigured}>{saving ? t('location.saving') : t('admin.save')}</button>
      </form>
      <p className="note">{t('admin.localOnlyNote')}</p>
    </div>
  </section>;
}
