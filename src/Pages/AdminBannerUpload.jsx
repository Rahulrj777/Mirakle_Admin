import { useState, useEffect } from 'react';
const API_BASE = "https://mirakle-website-server.onrender.com";
import axios from 'axios';
import SparkMD5 from 'spark-md5';
import { API_BASE } from "../utils/api"; 

const AdminBannerUpload = () => {
  const [image, setImage] = useState(null);
  const [type, setType] = useState('slider');
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [weightValue, setWeightValue] = useState('');
  const [weightUnit, setWeightUnit] = useState('g');
  const [banners, setBanners] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingBanner, setEditingBanner] = useState(null);
  const [oldPrice, setOldPrice] = useState('');
  const [discountPercent, setDiscountPercent] = useState('');

  const computeFileHash = (file) => {
    return new Promise((resolve, reject) => {
      const chunkSize = 2097152;
      const spark = new SparkMD5.ArrayBuffer();
      const fileReader = new FileReader();
      let cursor = 0;

      fileReader.onload = (e) => {
        spark.append(e.target.result);
        cursor += chunkSize;
        if (cursor < file.size) {
          readNext();
        } else {
          resolve(spark.end());
        }
      };

      fileReader.onerror = () => reject('File reading error');

      function readNext() {
        const slice = file.slice(cursor, cursor + chunkSize);
        fileReader.readAsArrayBuffer(slice);
      }

      readNext();
    });
  };

  const fetchBanners = async () => {
    const res = await axios.get(`${API_BASE}/api/banners`);
    setBanners(res.data);
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Only image files are allowed');
      return;
    }
    setImage(file);
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
    document.getElementById('banner-file').value = '';
  };

  const handleUpload = async () => {
    if (type === 'all') {
      alert("Cannot upload when 'Show All' is selected");
      return;
    }

    if (!title.trim()) {
      alert('Please enter a name/title');
      return;
    }

    if (type === 'product-type') {
      if (!price || !weightValue || !weightUnit) {
        alert('Please enter price and weight for product-type');
        return;
      }
    }

    const formData = new FormData();
    formData.append('type', type);
    formData.append('title', title.trim());

    if (type === 'product-type') {
      formData.append('price', price);
      formData.append('weightValue', weightValue);
      formData.append('weightUnit', weightUnit);
      formData.append("oldPrice", oldPrice);
      formData.append("discountPercent", discountPercent);
    }

    if (editingBanner) {
      if (image) {
        const hash = await computeFileHash(image);
        formData.append('image', image);
        formData.append('hash', hash);
      }

      try {
        await axios.put(`${API_BASE}/api/banners/${editingBanner._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        fetchBanners();
        resetForm();
        setTimeout(() => alert('Banner updated successfully'), 200);
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to update banner');
      }
    } else {
      if (!image) {
        alert('Please select an image');
        return;
      }

      const hash = await computeFileHash(image);
      const existing = banners.find(b => b.hash === hash && b.type === type);
      if (existing) {
        alert('This image already exists in the selected type.');
        return;
      }

      formData.append('image', image);
      formData.append('hash', hash);

      try {
        await axios.post(`${API_BASE}/api/banners/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        alert('Banner uploaded successfully');
        fetchBanners();
        resetForm();
      } catch (err) {
        alert(err.response?.data?.message || 'Upload failed');
      }
    }
  };

  const handleEdit = (banner) => {
    setEditingBanner(banner);
    setType(banner.type);
    setTitle(banner.title || '');
    setPrice(banner.price || '');
    setWeightValue(banner.weight?.value || '');
    setWeightUnit(banner.weight?.unit || 'g');
    setOldPrice(banner.oldPrice || '');
    setDiscountPercent(banner.discountPercent || '');
    setImage(null);
    document.getElementById('banner-file').value = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE}/api/banners/${id}`);
      fetchBanners();
    } catch (err) {
      alert('Failed to delete');
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Admin Banner Upload Panel</h2>

      <select
        value={type}
        onChange={(e) => setType(e.target.value)}
        className={`border p-2 w-full mb-4 ${editingBanner ? 'bg-gray-100 cursor-not-allowed' : ''}`}
        disabled={!!editingBanner}
      >
        <option value="all">Show All (View Only)</option>
        <option value="slider">Banner</option>
        <option value="side">Top Selling Product's</option>
        <option value="offer">Offer Zone</option>
        <option value="product-type">Our Special Product's</option>
      </select>

      {type !== 'all' && (
        <div className="bg-white shadow p-4 rounded mb-6">
          <input
            type="text"
            placeholder="Enter Name / Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mb-2 p-2 border w-full"
          />

          {type === 'product-type' && (
            <>
              <input type="number" placeholder="Price" value={price} onChange={(e) => setPrice(e.target.value)} className="mb-2 p-2 border w-full" />
              <input type="number" placeholder="Old Price" value={oldPrice} onChange={(e) => setOldPrice(e.target.value)} className="mb-2 p-2 border w-full" />
              <input type="number" placeholder="Discount %" value={discountPercent} onChange={(e) => setDiscountPercent(e.target.value)} className="mb-2 p-2 border w-full" />
              <div className="flex gap-2 mb-2">
                <input type="number" placeholder="Weight" value={weightValue} onChange={(e) => setWeightValue(e.target.value)} className="p-2 border w-full" />
                <select value={weightUnit} onChange={(e) => setWeightUnit(e.target.value)} className="p-2 border">
                  <option value="g">g</option>
                  <option value="ml">ml</option>
                  <option value="li">li</option>
                </select>
              </div>
            </>
          )}

          <input id="banner-file" type="file" accept="image/*" onChange={handleImageChange} className="mb-4" />
          {image && (
            <img src={URL.createObjectURL(image)} alt="Preview" className="mb-4 w-full h-64 object-cover rounded border" />
          )}

          <div className="flex gap-2">
            <button
              onClick={handleUpload}
              className={`text-white px-4 py-2 rounded ${editingBanner ? 'bg-orange-500' : 'bg-green-600'}`}
            >
              {editingBanner ? 'Update Banner' : 'Upload Banner'}
            </button>
            {editingBanner && (
              <button onClick={resetForm} className="bg-gray-400 text-white px-4 py-2 rounded">
                Cancel
              </button>
            )}
          </div>
        </div>
      )}

      <input
        type="text"
        placeholder="Search by Product name"
        className="p-2 border w-full mb-4"
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        {banners
          .filter(b => {
            const matchesType = type === 'all' || b.type === type;
            const matchesSearch = b.title?.toLowerCase().includes(searchTerm.toLowerCase());
            const isValid = b.type === 'product-type' ? b.price > 0 : true;
            return matchesType && matchesSearch && isValid;
          })
          .map((banner) => (
            <div key={banner._id} className="border p-3 rounded shadow relative">
              <div className="relative">
                <img src={`${API_BASE}${banner.imageUrl}`} alt={banner.type} className="w-full h-40 object-cover rounded mb-2" />
                {banner.discountPercent > 0 && (
                  <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md">
                    {banner.discountPercent}% OFF
                  </span>
                )}
              </div>
              <div className="text-sm text-center font-medium mt-1">{banner.title}</div>

              {(banner.type === 'product-type' || banner.price > 0) && (
                <div className="text-center text-sm mt-1">
                  <span className="text-green-700 font-semibold">
                    ₹ {parseFloat(banner.price || 0).toFixed(0)}
                  </span>
                  {banner.oldPrice > 0 && (
                    <span className="text-gray-400 line-through ml-2 text-xs">
                      ₹ {parseFloat(banner.oldPrice).toFixed(0)}
                    </span>
                  )}
                </div>
              )}

              {banner.weight?.value > 0 && (
                <div className="text-gray-500 text-center text-xs">
                  {banner.weight.value} {banner.weight.unit}
                </div>
              )}

              <div className="flex justify-between mt-3">
                <button onClick={() => handleEdit(banner)} className="bg-yellow-500 text-white px-3 py-1 text-sm rounded">Edit</button>
                <button onClick={() => handleDelete(banner._id)} className="bg-red-500 text-white px-3 py-1 text-sm rounded">Delete</button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default AdminBannerUpload;
