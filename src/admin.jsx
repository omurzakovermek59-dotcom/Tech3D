import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import AdminApp from './admin/AdminApp.jsx';
import { LanguageProvider } from './i18n/language.jsx';
import '../style.css';

createRoot(document.getElementById('root')).render(
  <LanguageProvider>
    <BrowserRouter>
      <AdminApp />
    </BrowserRouter>
  </LanguageProvider>
);
