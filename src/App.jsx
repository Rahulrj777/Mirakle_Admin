import { Navigate } from "react-router-dom"
import Routing from "./Routing/Routing"

const AuthGuard = ({ children }) => {
  const token = localStorage.getItem("authToken");
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <>
      <Routing />
    </>
  )
}

export default App
