import { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../../firebase.js';
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
  const { language } = useLanguage();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const register = mode === 'register';
  const ru = language === 'ru';

  const submit = async event => {
    event.preventDefault();
    setError('');
    if (!isFirebaseConfigured || !auth) {
      setError(ru ? 'Firebase не настроен. Заполните .env.local по образцу .env.example.' : 'Firebase туташкан эмес. .env.example үлгүсү боюнча .env.local толтуруңуз.');
      return;
    }
    if (register && name.trim().length < 2) {
      setError(ru ? 'Имя должно содержать не менее 2 символов.' : 'Аты кеминде 2 белгиден турушу керек.');
      return;
    }
    setBusy(true);
    try {
      if (register) {
        const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await updateProfile(credential.user, { displayName: name.trim() });
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
      const requestedPath = new URLSearchParams(window.location.search).get('next') || nextPath;
      const redirectPath = requestedPath.startsWith('/') && !requestedPath.startsWith('//') ? requestedPath : '/';
      onNavigate(redirectPath);
    } catch (authFailure) {
      setError(authError(authFailure, language));
    } finally {
      setBusy(false);
    }
  };

  return <section className="account-page">
    <form className="glass account-box" onSubmit={submit}>
      <a href="/" className="logo">Tech<span>3D</span></a>
      <h1>{register ? (ru ? 'Создать аккаунт' : 'Аккаунт түзүү') : (ru ? 'Вход в аккаунт' : 'Аккаунтка кирүү')}</h1>
      <p className="sub">{ru ? 'Войдите, чтобы пользоваться избранным и отзывами.' : 'Тандалгандарды жана пикирлерди колдонуу үчүн кириңиз.'}</p>
      {register && <label>{ru ? 'Имя' : 'Атыңыз'}<input value={name} onChange={event => setName(event.target.value)} autoComplete="name" required minLength="2" /></label>}
      <label>{ru ? 'Электронная почта' : 'Электрондук почта'}<input type="email" value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" required /></label>
      <label>{ru ? 'Пароль' : 'Сырсөз'}<input type="password" value={password} onChange={event => setPassword(event.target.value)} autoComplete={register ? 'new-password' : 'current-password'} minLength="6" required /></label>
      {error && <p className="err" role="alert">{error}</p>}
      <button className="btn" disabled={busy}>{busy ? (ru ? 'Загрузка…' : 'Жүктөлүүдө…') : (register ? (ru ? 'Зарегистрироваться' : 'Катталуу') : (ru ? 'Войти' : 'Кирүү'))}</button>
      <p>{register ? (ru ? 'Уже есть аккаунт?' : 'Аккаунтуңуз барбы?') : (ru ? 'Нет аккаунта?' : 'Аккаунтуңуз жокпу?')} <button type="button" className="text-button" onClick={() => {
        const next = new URLSearchParams(window.location.search).get('next') || nextPath;
        onNavigate(`${register ? '/login' : '/register'}?next=${encodeURIComponent(next)}`);
      }}>{register ? (ru ? 'Войти' : 'Кирүү') : (ru ? 'Регистрация' : 'Катталуу')}</button></p>
      <button type="button" className="text-button" onClick={() => onNavigate('/')}>{ru ? 'Вернуться в магазин' : 'Дүкөнгө кайтуу'}</button>
    </form>
  </section>;
}
