import { Navigate } from "react-router-dom"

const AuthGuard = ({ children }) => {
  const token = localStorage.getItem("authToken")
  window.location.href = "/login"; 
  if (!token) {
    return <Navigate to="/login" replace />
  }
  return children
}

export default AuthGuard
