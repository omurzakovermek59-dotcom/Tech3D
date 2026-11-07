import { BrowserRouter, Route, Routes } from 'react-router-dom';
import AdminApp from './admin/AdminApp.jsx';
import ShopApp from './shop/ShopApp.jsx';

export default function App() {
  return <BrowserRouter>
    <Routes>
      <Route path="/admin/*" element={<AdminApp />} />
      <Route path="/*" element={<ShopApp />} />
    </Routes>
  </BrowserRouter>;
}
