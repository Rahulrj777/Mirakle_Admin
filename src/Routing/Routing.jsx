import { Routes, Route, Navigate } from "react-router-dom"
import AdminBannerUpload from "../Pages/AdminBannerUpload"
import AdminProductUpload from "../Pages/AdminProductUplode"
import LoginPage from "../Componenets/LoginPage"
import SignUpPage from "../Componenets/SignUpPage"
import AuthGuard from "../Componenets/AuthGuard" 

const Routing = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      
      <Route path="/admin/banners" element={<AuthGuard><AdminBannerUpload /></AuthGuard>} />
      <Route path="/admin/products" element={<AuthGuard><AdminProductUpload /></AuthGuard>} />
      
      <Route path="/" element={localStorage.getItem("authToken")
        ? <Navigate to="/admin/banners" replace />
        : <Navigate to="/login" replace />}
      />
    </Routes>
  )
}

export default Routing
