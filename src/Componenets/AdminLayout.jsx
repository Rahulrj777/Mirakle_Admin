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
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
        <aside className="w-60 bg-white text-gray-800 p-6 space-y-6 flex flex-col border-r border-gray-200 fixed">
            <h2 className="text-2xl font-bold mb-4">Admin Panel</h2>
            <button onClick={() => navigate("/admin")} className="text-left hover:bg-gray-100 p-2 rounded">
                Dashboard
            </button>
            <button onClick={() => navigate("/admin/products")} className="text-left hover:bg-gray-100 p-2 rounded">
                Products
            </button>
            <button onClick={() => navigate("/admin/banners")} className="text-left hover:bg-gray-100 p-2 rounded">
                Banners
            </button>
        </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Navbar */}
        <header className="flex justify-between items-center bg-white p-4 shadow">
          <h1 className="text-xl font-bold">Welcome Admin</h1>
          <button onClick={logout} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
            Logout
          </button>
        </header>

        {/* Page Content */}
        <main className="p-6 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
