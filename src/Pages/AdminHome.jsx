import React from 'react';
import { Link } from 'react-router-dom';

const AdminHome = () => {
  return (
    <div className="max-w-md mx-auto p-6 mt-10 bg-white shadow rounded text-center">
      <h1 className="text-2xl font-bold mb-6">Admin Panel</h1>

      <div className="flex flex-col gap-4">
        <Link
          to="/admin/banners"
          className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
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
    </div>
  );
};

export default AdminHome;
