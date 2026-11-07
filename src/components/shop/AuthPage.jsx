import { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithCustomToken, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../../firebase.js';
import { saveUserPhone } from '../../services/store.js';
import { requestEmailLoginCode, verifyEmailLoginCode } from '../../services/emailCode.js';
import { signInWithGoogle } from '../../utils/googleAuth.js';
import { useLanguage } from '../../i18n/language.jsx';

function authError(error, language) {
  const messages = language === 'ru'
    ? {
      'auth/email-already-in-use': 'Этот адрес электронной почты уже зарегистрирован.',
      'auth/invalid-email': 'Введите корректный адрес электронной почты.',
      'auth/invalid-credential': 'Неверная почта или пароль.',
      'auth/weak-password': 'Пароль должен содержать не менее 6 символов.',
      'auth/too-many-requests': 'Слишком много попыток. Попробуйте позже.'
    }
    : {
      'auth/email-already-in-use': 'Бул электрондук почта катталган.',
      'auth/invalid-email': 'Туура электрондук почта жазыңыз.',
      'auth/invalid-credential': 'Электрондук почта же сырсөз туура эмес.',
      'auth/weak-password': 'Сырсөз кеминде 6 белгиден турушу керек.',
      'auth/too-many-requests': 'Аракет өтө көп болду. Кийинчерээк кайталаңыз.'
    };
  return messages[error.code] || (language === 'ru' ? 'Не удалось выполнить вход. Проверьте настройки Firebase.' : 'Кирүү ишке ашкан жок. Firebase жөндөөлөрүн текшериңиз.');
}

export default function AuthPage({ mode, onNavigate, nextPath = '/' }) {
  const { language, t } = useLanguage();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [emailCodeMode, setEmailCodeMode] = useState(false);
  const [emailCodeSent, setEmailCodeSent] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const register = mode === 'register';
  const ru = language === 'ru';
  const checkoutLogin = nextPath === '/checkout'
    || new URLSearchParams(window.location.search).get('next') === '/checkout';
  const redirectAfterLogin = () => {
    const requestedPath = new URLSearchParams(window.location.search).get('next') || nextPath;
    const redirectPath = requestedPath.startsWith('/') && !requestedPath.startsWith('//') ? requestedPath : '/';
    onNavigate(redirectPath);
  };

  const loginWithEmailCode = async () => {
    setError('');
    setNotice('');
    if (!isFirebaseConfigured || !auth) {
      setError(ru ? 'Firebase не настроен.' : 'Firebase жөндөлгөн эмес.');
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
        await signInWithCustomToken(auth, token);
        redirectAfterLogin();
      }
    } catch (authFailure) {
      console.error('Email-code sign-in failed:', authFailure);
      setError(authFailure.code === 'functions/resource-exhausted'
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
      setError(ru ? 'Firebase не настроен. Заполните .env.local по образцу .env.example.' : 'Firebase туташкан эмес. .env.example үлгүсү боюнча .env.local толтуруңуз.');
      return;
    }
    const phoneDigits = phone.replace(/\D/g, '');
    if (register && (name.trim().length < 2 || phoneDigits.length < 9 || phone.trim().length > 30)) {
      setError(ru ? 'Укажите имя и корректный номер телефона.' : 'Атыңызды жана туура телефон номерин жазыңыз.');
      return;
    }
    setBusy(true);
    try {
      if (register) {
        const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await updateProfile(credential.user, { displayName: name.trim() });
        await saveUserPhone(credential.user.uid, phone.trim());
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
      redirectAfterLogin();
    } catch (authFailure) {
      setError(authError(authFailure, language));
    } finally {
      setBusy(false);
    }
  };
  const loginWithGoogle = async () => {
    setError('');
    setNotice('');
    if (!isFirebaseConfigured || !auth) {
      setError(ru ? 'Firebase не настроен.' : 'Firebase жөндөлгөн эмес.');
      return;
    }
    setBusy(true);
    try {
      await signInWithGoogle(auth);
      redirectAfterLogin();
    } catch (authFailure) {
      console.error('Google sign-in failed:', authFailure);
      setError(t('auth.googleFailed'));
    } finally {
      setBusy(false);
    }
  };
  return <section className="account-page">
    <form className="glass account-box" onSubmit={submit}>
      <a href="/" className="logo">Tech<span>3D</span></a>
      <h1>{register ? (ru ? 'Создать аккаунт' : 'Аккаунт түзүү') : (ru ? 'Вход в аккаунт' : 'Аккаунтка кирүү')}</h1>
      <p className="sub">{checkoutLogin ? t('checkout.loginRequired') : (ru ? 'Войдите, чтобы пользоваться избранным и отзывами.' : 'Тандалгандарды жана пикирлерди колдонуу үчүн кириңиз.')}</p>
      {register && <label>{ru ? 'Имя' : 'Атыңыз'}<input value={name} onChange={event => setName(event.target.value)} autoComplete="name" required minLength="2" /></label>}
      {register && <label>{ru ? 'Телефон' : 'Телефон номери'}<input type="tel" value={phone} onChange={event => setPhone(event.target.value)} inputMode="tel" autoComplete="tel" required minLength="9" maxLength="30" /></label>}
      <label>{ru ? 'Электронная почта' : 'Электрондук почта'}<input type="email" value={email} onChange={event => { setEmail(event.target.value); setEmailCodeSent(false); }} autoComplete="email" required /></label>
      {register || !emailCodeMode
        ? <label>{ru ? 'Пароль' : 'Сырсөз'}<input type="password" value={password} onChange={event => setPassword(event.target.value)} autoComplete={register ? 'new-password' : 'current-password'} minLength="6" required /></label>
        : emailCodeSent && <label>{t('auth.emailCode')}<input type="text" value={emailCode} onChange={event => setEmailCode(event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength="6" required /></label>}
      {error && <p className="err" role="alert">{error}</p>}
      {notice && <p className="note" role="status">{notice}</p>}
      <button className="btn" disabled={busy}>{busy ? (ru ? 'Загрузка…' : 'Жүктөлүүдө…') : (register ? (ru ? 'Зарегистрироваться' : 'Катталуу') : emailCodeMode ? emailCodeSent ? t('auth.emailCodeVerify') : t('auth.emailCodeSend') : (ru ? 'Войти' : 'Кирүү'))}</button>
      <button type="button" className="btn ghost google-login" onClick={loginWithGoogle} disabled={busy || !isFirebaseConfigured}><span aria-hidden="true">G</span>{t('auth.googleLogin')}</button>
      {!register && <button type="button" className="text-button" disabled={busy} onClick={() => { setEmailCodeMode(current => !current); setEmailCodeSent(false); setEmailCode(''); setError(''); setNotice(''); }}>{emailCodeMode ? t('auth.usePassword') : t('auth.useEmailCode')}</button>}
      <p>{register ? (ru ? 'Уже есть аккаунт?' : 'Аккаунтуңуз барбы?') : (ru ? 'Нет аккаунта?' : 'Аккаунтуңуз жокпу?')} <button type="button" className="text-button" onClick={() => {
        const next = new URLSearchParams(window.location.search).get('next') || nextPath;
        onNavigate(`${register ? '/login' : '/register'}?next=${encodeURIComponent(next)}`);
      }}>{register ? (ru ? 'Войти' : 'Кирүү') : (ru ? 'Регистрация' : 'Катталуу')}</button></p>
      <button type="button" className="text-button" onClick={() => onNavigate('/')}>{ru ? 'Вернуться в магазин' : 'Дүкөнгө кайтуу'}</button>
    </form>
  </section>;
}
