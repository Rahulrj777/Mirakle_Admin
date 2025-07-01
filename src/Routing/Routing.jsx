import { Routes, Route } from 'react-router-dom';
import AdminHome from '../Pages/AdminHome';
import AdminBannerUpload from '../Pages/AdminBannerUpload';
import AdminProductUpload from '../Pages/AdminProductUplode';

const Routing = () => {
  return (
    <Routes>
        <Route path="/" element={<AdminHome />} />

        <Route path="/admin" element={<AdminHome/>} />
        <Route path="/admin/banners" element={<AdminBannerUpload/>} />
        <Route path="/admin/products" element={<AdminProductUpload/>} />
    </Routes>
  );
};

export default Routing;
