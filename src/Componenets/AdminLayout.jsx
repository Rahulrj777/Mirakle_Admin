import { useNavigate, useLocation } from "react-router-dom";

const AdminLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const logout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("adminToken");
    localStorage.removeItem("user");
    navigate("/login");
  };

  // Helper to check active path
  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar - Fixed */}
      <aside className="w-60 fixed top-0 left-0 h-full bg-white text-gray-800 p-6 space-y-6 border-r border-gray-200 shadow-md">
        <h2 className="text-2xl font-bold mb-4">Admin Panel</h2>

        <button
          onClick={() => navigate("/admin/banners")}
          className={`text-left p-2 rounded w-full ${
            isActive("/admin/banners") ? "bg-gray-200 font-semibold" : "hover:bg-gray-100"
          }`}
        >
          Banners
        </button>

        <button
          onClick={() => navigate("/admin/products")}
          className={`text-left p-2 rounded w-full ${
            isActive("/admin/products") ? "bg-gray-200 font-semibold" : "hover:bg-gray-100"
          }`}
        >
          Products
        </button>

        <button
          onClick={logout}
          className="mt-auto text-left bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 w-full"
        >
          Logout
        </button>
      </aside>
    </div>
  );
};

export default AdminLayout;
