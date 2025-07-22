import AdminLayout from "../Componenets/AdminLayout";
import { Link } from "react-router-dom";

const AdminHome = () => {
  return (
    <AdminLayout>
      <h2 className="text-2xl font-bold mb-6">Dashboard</h2>

      <div className="flex gap-4">
        <Link
          to="/admin/banners"
          className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 transition"
        >
          Manage Banners
        </Link>

        <Link
          to="/admin/products"
          className="bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700 transition"
        >
          Manage Products
        </Link>
      </div>
    </AdminLayout>
  );
};

export default AdminHome;
