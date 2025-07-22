import { useNavigate } from "react-router-dom";

const AdminLayout = ({ children }) => {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("adminToken");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar - Fixed */}
      <aside className="w-60 fixed top-0 left-0 h-full bg-white text-gray-800 p-6 space-y-6 border-r border-gray-200 shadow-md">
        <h2 className="text-2xl font-bold mb-4">Admin Panel</h2>
        <button onClick={() => navigate("/admin")} className="text-left hover:bg-gray-100 p-2 rounded w-full">
          Dashboard
        </button>
        <button onClick={() => navigate("/admin/products")} className="text-left hover:bg-gray-100 p-2 rounded w-full">
          Products
        </button>
        <button onClick={() => navigate("/admin/banners")} className="text-left hover:bg-gray-100 p-2 rounded w-full">
          Banners
        </button>
        <button onClick={logout} className="mt-auto text-left bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 w-full">
          Logout
        </button>
      </aside>

      {/* Main Content */}
      <div className="flex-1 ml-60 flex flex-col min-h-screen">
        {/* Top Navbar */}
        <header className="flex justify-between items-center bg-white p-4 shadow">
          <h1 className="text-xl font-bold">Welcome Admin</h1>
        </header>

        {/* Page Content */}
        <main className="p-6 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
