import { useState } from 'react';
import { getIdTokenResult, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../../firebase.js';
import { useLanguage } from '../../i18n/language.jsx';
import { ADMIN_EMAIL } from '../../admin/constants.js';
import AdminControls from '../shared/AdminControls.jsx';

export default function Login({ onLogin, theme, onToggleTheme, authMessage }) {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async event => {
    event.preventDefault();
    setError('');
    if (!isFirebaseConfigured || !auth) {
      setError(t('admin.firebaseRequired'));
      return;
    }
    setBusy(true);
    try {
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const token = await getIdTokenResult(credential.user, true);
      if (token.claims.email !== ADMIN_EMAIL) {
        await signOut(auth);
        setError(t('admin.accessDenied'));
        return;
      }
      onLogin();
    } catch (failure) {
      console.error('Admin authentication failed:', failure);
      setError(t('admin.passwordWrong'));
    } finally {
      setBusy(false);
    }
  };
  return <section className="login">
    <form className="glass login-box" onSubmit={submit}>
      <a href="/" className="logo">Мой телефон</a>
      <AdminControls theme={theme} onToggleTheme={onToggleTheme} />
      <h2>{t('admin.loginTitle')}</h2>
      {authMessage && <p className="err" role="alert">{authMessage}</p>}
      <input name="email" type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder={ADMIN_EMAIL} autoComplete="username" required />
      <input name="password" type="password" value={password} onChange={event => setPassword(event.target.value)} placeholder={t('admin.password')} autoComplete="current-password" required />
      {error && <p className="err" role="alert">{error}</p>}
      <button className="btn" disabled={busy}>{busy ? t('auth.loading') : t('admin.login')}</button>
      <a className="back" href="index.html">← {t('admin.returnShop')}</a>
    </form>
  </section>;
}
