import { createRoot } from 'react-dom/client';
import { LanguageProvider } from './i18n/language.jsx';
import App from './App.jsx';
import '../style.css';

createRoot(document.getElementById('root')).render(
  <LanguageProvider>
    <App />
  </LanguageProvider>
);
