import { useState } from 'react';
import { Store } from '../../data.js';
import { useLanguage } from '../../i18n/language.jsx';
import AdminControls from '../shared/AdminControls.jsx';

export default function Login({ onLogin, theme, onToggleTheme }) {
  const { t } = useLanguage();
  const [password, setPassword] = useState('');
  const [invalid, setInvalid] = useState(false);
  const submit = event => {
    event.preventDefault();
    if (password === Store.settings().pass) {
      try { sessionStorage.setItem('t3d-adm', '1'); } catch { /* The current tab can still stay authenticated. */ }
      onLogin();
    } else {
      setInvalid(true);
      event.currentTarget.elements.password.select();
    }
  };
  return <section className="login">
    <form className="glass login-box" onSubmit={submit}>
      <a href="#" className="logo">Tech<span>3D</span></a>
      <AdminControls theme={theme} onToggleTheme={onToggleTheme} />
      <h2>{t('admin.loginTitle')}</h2>
      <input name="password" type="password" value={password} onChange={event => setPassword(event.target.value)} placeholder={t('admin.password')} autoComplete="current-password" required />
      {invalid && <p className="err">{t('admin.passwordWrong')}</p>}
      <button className="btn">{t('admin.login')}</button>
      <a className="back" href="index.html">← {t('admin.returnShop')}</a>
    </form>
  </section>;
}
