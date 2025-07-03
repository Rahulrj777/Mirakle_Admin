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
  }, [type]); // fetch on type change

  const fetchBanners = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/banners?type=${type}`);
      setBanners(res.data);
    } catch (err) {
      console.error("Failed to fetch banners", err);
      toast.error("Failed to fetch banners");
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
    document.getElementById('banner-file')?.value = '';
    fetchBanners();
  };

  const handleUpload = async () => {
    if ((type === 'top-selling' || type === 'product-type') && selectedProducts.length === 0) {
      return toast.error("Select at least one product");
    }

    if ((type === 'slider' || type === 'offer') && !image) {
      return toast.error("Image is required");
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

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE}/api/banners/${id}`);
      toast.success("Deleted successfully");
      fetchBanners();
    } catch (err) {
      toast.error("Delete failed");
    }
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
        <option value="offer">Offer Banner</option>
        <option value="top-selling">Most Selling Products</option>
        <option value="product-type">Special Products</option>
      </select>

      {(type === 'top-selling' || type === 'product-type') ? (
        <>
          <button
            onClick={() => setShowProductModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded mb-4"
          >
            {selectedProducts.length > 0
              ? `Change Products (${selectedProducts.length})`
              : 'Select Products'}
          </button>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {selectedProducts.map((prod) => (
              <div key={prod._id} className="border p-2 rounded">
                <img
                  src={`${API_BASE}${prod.images.others[0]}`}
                  className="w-full h-28 object-cover rounded"
                />
                <p className="text-sm mt-1">{prod.title}</p>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <input
            id="banner-file"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="mb-4"
          />
          {image && (
            <div className="aspect-[3/2] w-full mb-4">
              <img
                src={URL.createObjectURL(image)}
                className="w-full h-full object-cover rounded"
              />
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

      {showProductModal && (
        <ProductPickerModal
          onClose={() => setShowProductModal(false)}
          selected={selectedProducts}
          setSelected={setSelectedProducts}
          max={type === 'top-selling' ? 6 : 10}
        />
      )}

      {/* Uploaded Banner Section */}
      <h2 className="text-xl font-semibold mt-10 mb-4">Uploaded Banners</h2>
      <div className="grid md:grid-cols-3 gap-4">
        {banners.map((banner) => (
          <div key={banner._id} className="border p-2 rounded shadow relative">
            {banner.imageUrl && (
              <img
                src={`${API_BASE}${banner.imageUrl}`}
                className="w-full h-32 object-cover rounded mb-2"
              />
            )}

            {banner.productIds && banner.productIds.length > 0 && (
              <ul className="text-sm text-gray-700 space-y-1">
                {banner.products?.map((p) => (
                  <li key={p._id} className="text-xs">• {p.title}</li>
                ))}
              </ul>
            )}

            <button
              onClick={() => handleDelete(banner._id)}
              className="absolute top-1 right-1 text-white bg-red-500 px-2 py-1 rounded text-xs"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminBannerUpload;
