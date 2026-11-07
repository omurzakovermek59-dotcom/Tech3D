import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getIdTokenResult, signInWithCustomToken, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../../firebase.js';
import { signInWithGoogle } from '../../utils/googleAuth.js';
import { requestEmailLoginCode, verifyEmailLoginCode } from '../../services/emailCode.js';
import { useLanguage } from '../../i18n/language.jsx';
import { ADMIN_EMAIL, isAdminEmail } from '../../admin/constants.js';
import AdminControls from '../shared/AdminControls.jsx';

export default function Login({ onLogin, theme, onToggleTheme, authMessage, storeName = 'Мой телефон' }) {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [emailCodeMode, setEmailCodeMode] = useState(false);
  const [emailCodeSent, setEmailCodeSent] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const finishLogin = async user => {
    const token = await getIdTokenResult(user, true);
    if (!isAdminEmail(token.claims.email)) {
      await signOut(auth);
      setError(t('admin.accessDenied'));
      return;
    }
    onLogin();
  };
  const loginWithEmailCode = async () => {
    setError('');
    setNotice('');
    if (!isFirebaseConfigured || !auth) {
      setError(t('admin.firebaseRequired'));
      return;
    }
    if (!email.trim()) {
      setError(t('auth.emailRequired'));
      return;
    }
    setBusy(true);
    try {
      if (!emailCodeSent) {
        await requestEmailLoginCode(email.trim());
        setEmailCodeSent(true);
        setNotice(t('auth.emailCodeSent'));
      } else {
        const token = await verifyEmailLoginCode(email.trim(), emailCode);
        const credential = await signInWithCustomToken(auth, token);
        await finishLogin(credential.user);
      }
    } catch (failure) {
      console.error('Admin email-code sign-in failed:', failure);
      setError(failure.code === 'functions/resource-exhausted'
        ? t('auth.emailCodeRateLimit')
        : t('auth.emailCodeFailed'));
    } finally {
      setBusy(false);
    }
  };
  const submit = async event => {
    event.preventDefault();
    setError('');
    setNotice('');
    if (emailCodeMode) {
      await loginWithEmailCode();
      return;
    }
    if (!isFirebaseConfigured || !auth) {
      setError(t('admin.firebaseRequired'));
      return;
    }
    setBusy(true);
    try {
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      await finishLogin(credential.user);
    } catch (failure) {
      console.error('Admin authentication failed:', failure);
      setError(t('admin.passwordWrong'));
    } finally {
      setBusy(false);
    }
  };
  const loginWithGoogle = async () => {
    setError('');
    setNotice('');
    if (!isFirebaseConfigured || !auth) {
      setError(t('admin.firebaseRequired'));
      return;
    }
    setBusy(true);
    try {
      const credential = await signInWithGoogle(auth);
      await finishLogin(credential.user);
    } catch (failure) {
      console.error('Admin Google authentication failed:', failure);
      setError(t('auth.googleFailed'));
    } finally {
      setBusy(false);
    }
  };
  return <section className="login">
    <form className="glass login-box" onSubmit={submit}>
      <Link to="/" className="logo">{storeName}</Link>
      <AdminControls theme={theme} onToggleTheme={onToggleTheme} />
      <h2>{t('admin.loginTitle')}</h2>
      {authMessage && <p className="err" role="alert">{authMessage}</p>}
      <input name="email" type="email" value={email} onChange={event => { setEmail(event.target.value); setEmailCodeSent(false); }} placeholder={ADMIN_EMAIL} autoComplete="username" required />
      {!emailCodeMode
        ? <input name="password" type="password" value={password} onChange={event => setPassword(event.target.value)} placeholder={t('admin.password')} autoComplete="current-password" required />
        : emailCodeSent && <input name="emailCode" type="text" value={emailCode} onChange={event => setEmailCode(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder={t('auth.emailCode')} inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength="6" required />}
      {error && <p className="err" role="alert">{error}</p>}
      {notice && <p className="note" role="status">{notice}</p>}
      <button className="btn" disabled={busy}>{busy ? t('auth.loading') : emailCodeMode ? emailCodeSent ? t('auth.emailCodeVerify') : t('auth.emailCodeSend') : t('admin.login')}</button>
      <button className="btn ghost" type="button" onClick={loginWithGoogle} disabled={busy || !isFirebaseConfigured}>{t('auth.googleLogin')}</button>
      <button className="text-button" type="button" disabled={busy} onClick={() => { setEmailCodeMode(current => !current); setEmailCodeSent(false); setEmailCode(''); setError(''); setNotice(''); }}>{emailCodeMode ? t('auth.usePassword') : t('auth.useEmailCode')}</button>
      <Link className="back" to="/admin">← {t('admin.returnShop')}</Link>
    </form>
  </section>;
}
