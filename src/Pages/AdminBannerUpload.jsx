// AdminBannerUpload.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import SparkMD5 from 'spark-md5';
import { API_BASE } from "../utils/api";
import ProductPickerModal from './ProductPickerModal';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AdminBannerUpload = () => {
  const [image, setImage] = useState(null);
  const [type, setType] = useState('slider');
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [oldPrice, setOldPrice] = useState('');
  const [discountPercent, setDiscountPercent] = useState('');
  const [weightValue, setWeightValue] = useState('');
  const [weightUnit, setWeightUnit] = useState('g');
  const [banners, setBanners] = useState([]);
  const [editingBanner, setEditingBanner] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/banners`);
      setBanners(res.data);
    } catch (err) {
      toast.error("Failed to fetch banners");
    }
  };

  const computeFileHash = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      const spark = new SparkMD5.ArrayBuffer();
      reader.onload = e => {
        spark.append(e.target.result);
        resolve(spark.end());
      };
      reader.onerror = () => reject("File reading failed");
      reader.readAsArrayBuffer(file);
    });
  };

  const handleUpload = async () => {
    if (!title.trim()) return toast.error("Enter banner title");

    const formData = new FormData();
    formData.append("type", type);
    formData.append("title", title);
    if (type === 'product-type') {
      formData.append('price', price);
      formData.append('oldPrice', oldPrice);
      formData.append('discountPercent', discountPercent);
      formData.append('weightValue', weightValue);
      formData.append('weightUnit', weightUnit);
    }

    if (['top-selling', 'product-type'].includes(type)) {
      if (selectedProducts.length === 0) return toast.error("Select at least one product");
      formData.append("productIds", JSON.stringify(selectedProducts.map(p => p._id)));
    } else {
      if (!image) return toast.error("Please select an image");
      const hash = await computeFileHash(image);
      formData.append("image", image);
      formData.append("hash", hash);
    }

    try {
      if (editingBanner) {
        await axios.put(`${API_BASE}/api/banners/${editingBanner._id}`, formData);
        toast.success("Banner updated");
      } else {
        await axios.post(`${API_BASE}/api/banners/upload`, formData);
        toast.success("Banner uploaded");
      }
      resetForm();
      fetchBanners();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    }
  };

  const handleEdit = (banner) => {
    setEditingBanner(banner);
    setTitle(banner.title || '');
    setPrice(banner.price || '');
    setOldPrice(banner.oldPrice || '');
    setDiscountPercent(banner.discountPercent || '');
    setWeightValue(banner.weight?.value || '');
    setWeightUnit(banner.weight?.unit || 'g');
    setSelectedProducts(banner.products || []);
    setType(banner.type);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE}/api/banners/${id}`);
      fetchBanners();
      toast.success("Deleted");
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  const resetForm = () => {
    setImage(null);
    setTitle('');
    setPrice('');
    setOldPrice('');
    setDiscountPercent('');
    setWeightValue('');
    setWeightUnit('g');
    setEditingBanner(null);
    setSelectedProducts([]);
    document.getElementById('banner-file')?.value = '';
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file?.type.startsWith('image/')) {
      toast.error("Only image files allowed");
      return;
    }
    setImage(file);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Admin Banner Upload Panel</h2>

      <select value={type} onChange={(e) => setType(e.target.value)} className="w-full border p-2 mb-4">
        <option value="slider">Main Swiper Banner</option>
        <option value="side">Side Banner</option>
        <option value="offer">Offer Zone</option>
        <option value="top-selling">Top Selling Products</option>
        <option value="product-type">Special Products</option>
      </select>

      <input type="text" placeholder="Title / Name" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border p-2 mb-2" />

      {type === 'product-type' && (
        <>
          <input type="number" placeholder="Price" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full border p-2 mb-2" />
          <input type="number" placeholder="Old Price" value={oldPrice} onChange={(e) => setOldPrice(e.target.value)} className="w-full border p-2 mb-2" />
          <input type="number" placeholder="Discount %" value={discountPercent} onChange={(e) => setDiscountPercent(e.target.value)} className="w-full border p-2 mb-2" />
          <div className="flex gap-2 mb-2">
            <input type="number" placeholder="Weight" value={weightValue} onChange={(e) => setWeightValue(e.target.value)} className="w-full border p-2" />
            <select value={weightUnit} onChange={(e) => setWeightUnit(e.target.value)} className="p-2 border">
              <option value="g">g</option>
              <option value="ml">ml</option>
              <option value="li">li</option>
            </select>
          </div>
        </>
      )}

      {['top-selling', 'product-type'].includes(type) ? (
        <>
          <button onClick={() => setShowProductModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded mb-4">
            {selectedProducts.length ? `Change Products (${selectedProducts.length})` : 'Select Products'}
          </button>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
            {selectedProducts.map((p) => (
              <div key={p._id} className="border p-2 rounded">
                <img src={`${API_BASE}${p.images.others[0]}`} className="w-full h-24 object-cover rounded" />
                <p className="text-sm mt-1">{p.title}</p>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <input id="banner-file" type="file" accept="image/*" onChange={handleImageChange} className="mb-4" />
          {image && <img src={URL.createObjectURL(image)} alt="preview" className="w-full h-64 object-cover rounded mb-4" />}
        </>
      )}

      <div className="flex gap-2 mb-6">
        <button onClick={handleUpload} className={`text-white px-4 py-2 rounded ${editingBanner ? 'bg-orange-500' : 'bg-green-600'}`}>
          {editingBanner ? 'Update Banner' : 'Upload Banner'}
        </button>
        {editingBanner && (
          <button onClick={resetForm} className="bg-gray-500 text-white px-4 py-2 rounded">Cancel</button>
        )}
      </div>

      <input
        type="text"
        placeholder="Search by title"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full border p-2 mb-4"
      />

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        {banners
          .filter(b => b.title?.toLowerCase().includes(searchTerm.toLowerCase()))
          .map((banner) => (
            <div key={banner._id} className="border p-3 rounded shadow relative">
              {banner.imageUrl && (
                <img src={`${API_BASE}${banner.imageUrl}`} alt="Banner" className="w-full h-40 object-cover rounded mb-2" />
              )}
              <div className="text-center font-medium">{banner.title}</div>
              {banner.price && <div className="text-center text-green-600">₹ {banner.price}</div>}
              {banner.weight?.value && <div className="text-center text-xs text-gray-600">{banner.weight.value} {banner.weight.unit}</div>}
              <div className="flex justify-between mt-2">
                <button onClick={() => handleEdit(banner)} className="bg-yellow-500 text-white px-3 py-1 text-sm rounded">Edit</button>
                <button onClick={() => handleDelete(banner._id)} className="bg-red-600 text-white px-3 py-1 text-sm rounded">Delete</button>
              </div>
            </div>
          ))}
      </div>

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
