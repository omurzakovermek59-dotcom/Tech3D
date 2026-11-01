import { useLanguage } from '../../i18n/language.jsx';

export default function AdminControls({ theme, onToggleTheme }) {
  const { language, setLanguage, t } = useLanguage();
  return <div className="admin-controls">
    <button
      type="button"
      className="admin-language-toggle"
      onClick={() => setLanguage(current => current === 'ky' ? 'ru' : 'ky')}
      aria-label={t('language.switch')}
      title={t('language.switch')}
    >{language === 'ky' ? 'RU' : 'KG'}</button>
    <button
      type="button"
      className="admin-theme-toggle"
      onClick={onToggleTheme}
      aria-label={theme === 'original' ? t('theme.light') : t('theme.original')}
      title={theme === 'original' ? t('theme.lightTitle') : t('theme.originalTitle')}
    >{theme === 'original' ? '◐' : '◑'}</button>
  </div>;
}
