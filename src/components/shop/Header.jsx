import { useState } from 'react';
import { useLanguage } from '../../i18n/language.jsx';

export default function Header({ cartCount, onOpenCart, theme, onToggleTheme, user, onNavigate, onLogout, favoriteCount = 0 }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  return <header className="nav glass">
    <a href="/" className="logo">Мой телефон</a>
    <nav className={`links${menuOpen ? ' open' : ''}`} onClick={() => setMenuOpen(false)}>
      <a href="/">{t('nav.home')}</a><a href="/#story">{t('nav.process')}</a><a href="/#phones">{t('nav.phones')}</a><a href="/#contacts">{t('nav.contact')}</a>
    </nav>
    <div className="tools">
      <button
        className="language-toggle"
        type="button"
        onClick={() => setLanguage(current => current === 'ky' ? 'ru' : 'ky')}
        aria-label={t('language.switch')}
        title={t('language.switch')}
      >{language === 'ky' ? 'RU' : 'KG'}</button>
      <button
        className="theme-toggle"
        type="button"
        onClick={onToggleTheme}
        aria-label={theme === 'original' ? t('theme.light') : t('theme.original')}
        title={theme === 'original' ? t('theme.lightTitle') : t('theme.originalTitle')}
      ><span aria-hidden="true">{theme === 'original' ? '◐' : '◑'}</span></button>
      <button className="ibtn" onClick={() => onNavigate('/favorites')} aria-label={t('favorites.title')} title={t('favorites.title')}>♥<b className="badge">{favoriteCount}</b></button>
      {user && !user.isAnonymous
        ? <><button className="account-name" onClick={() => onNavigate('/favorites')} title={user.email}>{user.displayName || user.email}</button><button className="ibtn" onClick={onLogout} aria-label={t('auth.logout')} title={t('auth.logout')}>↪</button></>
        : <button className="ibtn" onClick={() => onNavigate('/login')} aria-label={t('auth.login')} title={t('auth.login')}>♙</button>}
      <button className="ibtn" onClick={onOpenCart} aria-label={t('nav.cart')}>🛒<b className="badge">{cartCount}</b></button>
      <button className="ibtn burger" onClick={() => setMenuOpen(open => !open)} aria-label={t('nav.menu')}>☰</button>
    </div>
  </header>;
}
