// AdminBannerUpload.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import SparkMD5 from 'spark-md5';
import { API_BASE } from "../utils/api";
import ProductPickerModal from './ProductPickerModal';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AdminBannerUpload = () => {
  const [banners, setBanners] = useState([]);
  const [type, setType] = useState('slider');
  const [image, setImage] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [editingBanner, setEditingBanner] = useState(null);
  const [disableSelect, setDisableSelect] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/banners`);
      setBanners(res.data);
    } catch (err) {
      console.error("Failed to fetch banners", err);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file?.type.startsWith('image/')) {
      toast.error('Only image files allowed');
      return;
    }
    setImage(file);
    setDisableSelect(true);
  };

  const resetForm = () => {
    setImage(null);
    setType('slider');
    setSelectedProducts([]);
    setEditingBanner(null);
    setDisableSelect(false);
    document.getElementById('banner-file').value = '';
  };

  const handleUpload = async () => {
    if (type === 'top-selling' || type === 'product-type') {
      if (selectedProducts.length === 0) return toast.error("Select at least one product");
    } else {
      if (!image) return toast.error("Image is required");
    }

    const formData = new FormData();
    formData.append('type', type);

    if (type === 'top-selling' || type === 'product-type') {
      formData.append('productIds', JSON.stringify(selectedProducts.map(p => p._id)));
    } else {
      const hash = await computeFileHash(image);
      formData.append('image', image);
      formData.append('hash', hash);
    }

    try {
      if (editingBanner) {
        await axios.put(`${API_BASE}/api/banners/${editingBanner._id}`, formData);
        toast.success('Banner updated successfully');
      } else {
        await axios.post(`${API_BASE}/api/banners/upload`, formData);
        toast.success('Banner uploaded successfully');
      }
      fetchBanners();
      resetForm();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    }
  };

  const computeFileHash = (file) => {
    return new Promise((resolve, reject) => {
      const spark = new SparkMD5.ArrayBuffer();
      const reader = new FileReader();
      reader.onload = (e) => {
        spark.append(e.target.result);
        resolve(spark.end());
      };
      reader.onerror = () => reject('Read error');
      reader.readAsArrayBuffer(file);
    });
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Admin Banner Upload Panel</h2>

      <select
        value={type}
        onChange={(e) => setType(e.target.value)}
        className="border p-2 w-full mb-4"
        disabled={disableSelect || editingBanner}
      >
        <option value="slider">Main Swiper Banner</option>
        <option value="side">Side Banner</option>
        <option value="offer">Offer Banner</option>
        <option value="top-selling">Top Selling</option>
        <option value="product-type">Special Product</option>
      </select>

      {(type === 'top-selling' || type === 'product-type') ? (
        <>
          <button
            onClick={() => setShowProductModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded mb-4"
          >
            {selectedProducts.length > 0 ? `Change Products (${selectedProducts.length})` : 'Select Products'}
          </button>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {selectedProducts.map((prod) => (
              <div key={prod._id} className="border p-2 rounded">
                <img src={`${API_BASE}${prod.images.others[0]}`} className="w-full h-28 object-cover rounded" />
                <p className="text-sm mt-1">{prod.title}</p>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <input id="banner-file" type="file" accept="image/*" onChange={handleImageChange} className="mb-4" />
          {image && (
            <div className="aspect-[3/2] w-full mb-4">
              <img src={URL.createObjectURL(image)} className="w-full h-full object-cover rounded" />
            </div>
          )}
        </>
      )}

      <div className="flex gap-2 mt-2">
        <button
          onClick={handleUpload}
          className={`text-white px-4 py-2 rounded ${editingBanner ? 'bg-orange-500' : 'bg-green-600'}`}
        >
          {editingBanner ? 'Update Banner' : 'Upload Banner'}
        </button>
        <button onClick={resetForm} className="bg-gray-400 text-white px-4 py-2 rounded">
          Cancel
        </button>
      </div>

      {/* PRODUCT SELECT MODAL */}
      {showProductModal && (
        <ProductPickerModal
          onClose={() => setShowProductModal(false)}
          selected={selectedProducts}
          setSelected={setSelectedProducts}
          max={type === 'top-selling' ? 6 : 10}
        />
      )}
    </div>
  );
};

export default AdminBannerUpload;
