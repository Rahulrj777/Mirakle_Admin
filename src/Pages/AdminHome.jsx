import { Link } from 'react-router-dom';

const AdminHome = () => {
  return (
    <div className="max-w-md mx-auto p-6 mt-10 bg-white shadow rounded text-center">
      <h1 className="text-2xl font-bold mb-6">Admin Panel</h1>

      <div className="flex flex-col gap-4">
        <Link
          to="/admin/banners"
          className="bg-pink-600 text-white py-2 rounded hover:bg-pink-700 transition"
        >
          Manage Banners
        </Link>

        <Link
          to="/admin/products"
          className="bg-green-600 text-white py-2 rounded hover:bg-green-700 transition"
        >
          Manage Products
        </Link>
      </div>
      <h1 className="text-2xl font-bold mb-6">
        Admin Panel <span className="text-sm text-gray-500">(v2)</span>
      </h1>
    </div>
  );
};

export default AdminHome;
