import { Routes, Route, Navigate } from "react-router-dom";
import AdminHome from "../Pages/AdminHome";
import AdminProductUpload from "../Pages/AdminProductUplode";
import LoginPage from "../Componenets/LoginPage";
import SignUpPage from "../Componenets/SignUpPage";
import AuthGuard from "../Componenets/AuthGuard";

// Import all 4 banner components
import HomeBanner from "../Pages/Banners/HomeBanner";
import OfferBanner from "../Pages/Banners/OfferBanner";
import CategoryBanner from "../Pages/Banners/CategoryBanner";
import ProductTypeBanner from "../Pages/Banners/ProductTypeBanner";
import AllBannersDisplay from "../Pages/AllBannersDisplay";

const Routing = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />

      {/* Protected Admin Routes */}
      <Route
        path="/admin"
        element={
          <AuthGuard>
            <AdminHome />
          </AuthGuard>
        }
      />

      {/* Separated Banner Management Routes */}

      <Route path="/admin/banners" element={<AllBannersDisplay />} />

      <Route
        path="/admin/banners/home"
        element={
          <AuthGuard>
            <HomeBanner />
          </AuthGuard>
        }
      />
      <Route
        path="/admin/banners/offer"
        element={
          <AuthGuard>
            <OfferBanner />
          </AuthGuard>
        }
      />
      <Route
        path="/admin/banners/category"
        element={
          <AuthGuard>
            <CategoryBanner />
          </AuthGuard>
        }
      />
      <Route
        path="/admin/banners/product-type"
        element={
          <AuthGuard>
            <ProductTypeBanner />
          </AuthGuard>
        }
      />

      {/* Product management */}
      <Route
        path="/admin/products"
        element={
          <AuthGuard>
            <AdminProductUpload />
          </AuthGuard>
        }
      />

      {/* Default route */}
      <Route
        path="/"
        element={
          localStorage.getItem("authToken") ? (
            <Navigate to="/admin" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
};

export default Routing;
