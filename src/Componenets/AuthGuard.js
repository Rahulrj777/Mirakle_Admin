import { Navigate } from "react-router-dom"

const AuthGuard = ({ children }) => {
  const token = localStorage.getItem("authToken")
  if (!token) {
    // Redirect to login if no token is found
    return <Navigate to="/login" replace />
  }
  return children
}

export default AuthGuard
