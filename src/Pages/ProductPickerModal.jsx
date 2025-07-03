import { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE } from '../utils/api';

const ProductPickerModal = ({ onClose, selected, setSelected, max = 6 }) => {
  const [allProducts, setAllProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/products/all-products`);
      setAllProducts(res.data);
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  const handleToggle = (product) => {
    const exists = selected.find(p => p._id === product._id);
    if (exists) {
      setSelected(selected.filter(p => p._id !== product._id));
    } else {
      if (selected.length >= max) return alert(`You can select maximum ${max} products.`);
      setSelected([...selected, product]);
    }
  };

  const isSelected = (id) => selected.some(p => p._id === id);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-4xl rounded-lg shadow p-6 overflow-y-auto max-h-[90vh]">
        <h2 className="text-xl font-bold mb-4">Select Products</h2>

        <input
          type="text"
          placeholder="Search product..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="p-2 border w-full mb-4"
        />

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {allProducts
            .filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()))
            .map(product => (
              <div
                key={product._id}
                className={`border rounded p-2 cursor-pointer transition hover:shadow-lg relative ${isSelected(product._id) ? 'ring-2 ring-green-500' : ''}`}
                onClick={() => handleToggle(product)}
              >
                <img
                  src={`${API_BASE}${product.images.others[0]}`}
                  alt={product.title}
                  className="w-full h-28 object-cover rounded"
                />
                <p className="text-sm mt-2 font-medium text-center">{product.title}</p>
                {isSelected(product._id) && (
                  <span className="absolute top-1 right-1 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">Selected</span>
                )}
              </div>
            ))}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="bg-gray-500 text-white px-4 py-2 rounded">Done</button>
        </div>
      </div>
    </div>
  );
};

export default ProductPickerModal;
