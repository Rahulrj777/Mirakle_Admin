"use client"

import { Routes, Route, Navigate } from "react-router-dom"
import AdminHome from "../Pages/AdminHome"
import AdminBannerUpload from "../Pages/AdminBannerUpload"
import AdminProductUpload from "../Pages/AdminProductUplode"
import LoginPage from "../components/LoginPage"
import SignUpPage from "../components/SignUpPage"
import AuthGuard from "../components/AuthGuard" 

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
      <Route
        path="/admin/banners"
        element={
          <AuthGuard>
            <AdminBannerUpload />
          </AuthGuard>
        }
      />
      <Route
        path="/admin/products"
        element={
          <AuthGuard>
            <AdminProductUpload />
          </AuthGuard>
        }
      />
      <Route
        path="/"
        element={
          localStorage.getItem("authToken") ? <Navigate to="/admin" replace /> : <Navigate to="/login" replace />
        }
      />
    </Routes>
  )
}

export default Routing
