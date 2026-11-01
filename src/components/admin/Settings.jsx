import { useEffect, useState } from 'react';
import { SEED, Store } from '../../data.js';
import { useLanguage } from '../../i18n/language.jsx';

export default function Settings({ onToast, onReset }) {
  const { t } = useLanguage();
  const [settings, setSettings] = useState(() => Store.settings());
  useEffect(() => setSettings(Store.settings()), []);
  const save = event => {
    event.preventDefault();
    const next = { wa: settings.wa.trim(), pass: settings.pass };
    Store.saveSettings(next);
    setSettings(next);
    onToast(t('admin.settingsSaved'));
  };
  const reset = () => {
    if (!window.confirm(t('admin.demoResetConfirm'))) return;
    Store.saveProducts(SEED);
    Store.saveOrders([]);
    onReset();
    onToast(t('admin.resetDone'));
  };
  return <section>
    <h2>{t('admin.settings')}</h2>
    <form className="glass pnl form" onSubmit={save}>
      <label>{t('admin.whatsappNumber')}<input value={settings.wa} onChange={event => setSettings(current => ({ ...current, wa: event.target.value }))} required pattern="[0-9]{9,15}" /></label>
      <label>{t('admin.adminPassword')}<input value={settings.pass} onChange={event => setSettings(current => ({ ...current, pass: event.target.value }))} required minLength="4" /></label>
      <button className="btn">{t('admin.save')}</button><button type="button" className="btn ghost" onClick={reset}>{t('admin.resetDemo')}</button>
    </form>
    <p className="note">{t('admin.localOnlyNote')}</p>
  </section>;
}
