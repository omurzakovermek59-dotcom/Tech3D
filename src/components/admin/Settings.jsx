import { isFirebaseConfigured } from '../../firebase.js';
import { useLanguage } from '../../i18n/language.jsx';

export default function Settings() {
  const { t } = useLanguage();
  return <section>
    <h2>{t('admin.settings')}</h2>
    <div className="glass pnl"><p>{isFirebaseConfigured ? t('admin.firebaseConnected') : t('admin.firebaseRequired')}</p><p className="note">{t('admin.localOnlyNote')}</p></div>
  </section>;
}
