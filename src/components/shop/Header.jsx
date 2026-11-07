import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../i18n/language.jsx';

export default function Header({ cartCount, onOpenCart, theme, onToggleTheme, user, onNavigate, onLogout, favoriteCount = 0, storeName = 'Мой телефон' }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [failedPhotoUrl, setFailedPhotoUrl] = useState('');
  const accountMenuRef = useRef(null);
  const { language, setLanguage, t } = useLanguage();
  const photoURL = user?.photoURL || user?.providerData?.find(provider => provider.photoURL)?.photoURL || '';
  useEffect(() => {
    if (!menuOpen) return undefined;
    const closeOnOutsideClick = event => {
      if (!accountMenuRef.current?.contains(event.target)) setMenuOpen(false);
    };
    const closeOnEscape = event => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [menuOpen]);
  return <header className="nav glass">
    <Link to="/" className="logo">{storeName}</Link>
    <nav className={`links${menuOpen ? ' open' : ''}`} onClick={() => setMenuOpen(false)}>
      <Link to="/">{t('nav.home')}</Link><a href="/#story">{t('nav.process')}</a><a href="/#phones">{t('nav.phones')}</a><Link to="/contacts">{t('nav.contact')}</Link>
      {user && !user.isAnonymous && <Link to="/orders">{t('orders.title')}</Link>}
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
        ? <div className="account-menu-wrap" ref={accountMenuRef}>
          <button className="account-avatar" type="button" onClick={() => setMenuOpen(open => !open)} aria-label={t('auth.accountMenu')} aria-expanded={menuOpen} aria-haspopup="menu">
            {photoURL && failedPhotoUrl !== photoURL
              ? <img src={photoURL} alt="" referrerPolicy="no-referrer" onError={() => setFailedPhotoUrl(photoURL)} />
              : <span aria-hidden="true">{(user.displayName || user.email || '?').slice(0, 1).toUpperCase()}</span>}
          </button>
          {menuOpen && <div className="account-menu glass" role="menu">
            <span className="account-menu-email">{user.email}</span>
            <Link to="/orders" role="menuitem" onClick={() => setMenuOpen(false)}>{t('orders.title')}</Link>
            <button type="button" role="menuitem" onClick={() => { setMenuOpen(false); onLogout(); }}>{t('auth.logout')}</button>
          </div>}
        </div>
        : <button className="ibtn" onClick={() => onNavigate('/login')} aria-label={t('auth.login')} title={t('auth.login')}>♙</button>}
      <button className="ibtn" onClick={onOpenCart} aria-label={t('nav.cart')}>🛒<b className="badge">{cartCount}</b></button>
      <button className="ibtn burger" onClick={() => setMenuOpen(open => !open)} aria-label={t('nav.menu')}>☰</button>
    </div>
  </header>;
}
