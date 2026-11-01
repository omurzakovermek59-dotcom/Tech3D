import { createRoot } from 'react-dom/client';
import { LanguageProvider } from './i18n/language.jsx';
import ShopApp from './shop/ShopApp.jsx';
import '../style.css';

createRoot(document.getElementById('root')).render(
  <LanguageProvider>
    <ShopApp />
  </LanguageProvider>
);
