import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE } from "../utils/api"; 

const AdminProductUpload = () => {
  const [name, setName] = useState('');
  const [variants, setVariants] = useState([
    { sizeValue: '', sizeUnit: 'ml', price: '', discountPercent: '', finalPrice: '', stock: '' },
  ]);
  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [removedImages, setRemovedImages] = useState([]);
  const [products, setProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [detailsList, setDetailsList] = useState([{ key: '', value: '' }]);
  const [description, setDescription] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/products/all-products`);
      setProducts(res.data);
    } catch (err) {
      console.error('Fetch error:', err);
    }
  };

  const resetForm = () => {
    setName('');
    setVariants([
      { sizeValue: '', sizeUnit: 'ml', price: '', discountPercent: '', finalPrice: '', stock: '' },
    ]);
    setImages([]);
    setExistingImages([]);
    setRemovedImages([]);
    setEditingProduct(null);
    setDetailsList([{ key: '', value: '' }]);
    setDescription('');
    const fileInput = document.getElementById('product-images');
    if (fileInput) fileInput.value = '';
  };

  const handleImageChange = (e) => {
    setImages([...images, ...Array.from(e.target.files)]);
  };

  const handleImageRemove = (imgPath) => {
    setRemovedImages(prev => [...prev, imgPath]);
    setExistingImages(prev => prev.filter(img => img !== imgPath));
  };

  const removeNewImage = (index) => {
    const copy = [...images];
    copy.splice(index, 1);
    setImages(copy);
  };

  const handleVariantChange = (index, field, value) => {
    setVariants(prev => {
      const updated = [...prev];
      updated[index][field] = value;

      const price = parseFloat(updated[index].price);
      const discount = parseFloat(updated[index].discountPercent);
      if (!isNaN(price) && !isNaN(discount)) {
        updated[index].finalPrice = (price - (price * discount / 100)).toFixed(2);
      } else {
        updated[index].finalPrice = '';
      }

      return updated;
    });
  };

  const addVariant = () => {
    setVariants([...variants, {
      sizeValue: '', sizeUnit: 'ml', price: '', discountPercent: '', finalPrice: '', stock: ''
    }]);
  };

  const removeVariant = (i) => {
    const copy = [...variants];
    copy.splice(i, 1);
    setVariants(copy);
  };

  const handleDetailChange = (index, field, value) => {
    const copy = [...detailsList];
    copy[index][field] = value;
    setDetailsList(copy);
  };

  const addDetailField = () => {
    setDetailsList([...detailsList, { key: '', value: '' }]);
  };

  const removeDetailField = (index) => {
    const copy = [...detailsList];
    copy.splice(index, 1);
    setDetailsList(copy);
  };

  const handleSubmit = async () => {
    if (!name || variants.some(v => !v.sizeValue || !v.price)) {
      alert('Product name and current price are required');
      return;
    }

    const preparedVariants = variants.map(v => ({
      size: `${v.sizeValue}${v.sizeUnit}`,
      price: parseFloat(v.price),
      discountPercent: parseFloat(v.discountPercent),
      stock: parseInt(v.stock),
    }));

    // ✅ Convert detailsList array to object
    const detailsObject = {};
    detailsList.forEach(item => {
      if (item.key && item.value) {
        detailsObject[item.key] = item.value;
      }
    });

    const formData = new FormData();
    formData.append('name', name);
    formData.append('variants', JSON.stringify(preparedVariants));
    formData.append('description', description); // ✅ added
    formData.append('details', JSON.stringify(detailsObject)); // ✅ added

    images.forEach((img) => formData.append('images', img));

    if (editingProduct) {
      formData.append('removedImages', JSON.stringify(removedImages));
    }

    try {
      if (editingProduct) {
        await axios.put(`${API_BASE}/api/products/${editingProduct._id}`, formData);
        alert('Product updated');
      } else {
        await axios.post(`${API_BASE}/api/products/upload-product`, formData);
        alert('Product uploaded');
      }
      resetForm();
      fetchProducts();
    } catch (err) {
      console.error('Upload error:', err.response?.data || err.message);
      alert(err.response?.data?.message || 'Upload failed');
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setName(product.title);
    const parsedVariants = product.variants.map(v => {
      const match = v.size.match(/^([\d.]+)([a-zA-Z]+)$/);
      if (!match) return null;
      const [, sizeValue, sizeUnit] = match;
      return {
        sizeValue,
        sizeUnit,
        price: v.price,
        discountPercent: v.discountPercent || '',
        finalPrice: v.price - (v.price * (v.discountPercent || 0) / 100),
        stock: v.stock,
      };
    }).filter(Boolean);
    setVariants(parsedVariants);
    setExistingImages(product.images?.others || []);
    setDetailsList(Object.entries(product.details || {}).map(([key, value]) => ({ key, value })));
    setDescription(product.description || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE}/api/products/${id}`);
      fetchProducts();
    } catch (err) {
      alert('Delete failed');
    }
  };

  const toggleStock = async (id, currentStatus) => {
    try {
      await axios.put(`${API_BASE}/api/products/${id}/toggle-stock`, {
        isOutOfStock: !currentStatus,
      });
      fetchProducts();
    } catch (err) {
      alert('Stock update failed');
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">{editingProduct ? 'Edit Product' : 'Upload Product'}</h2>

      <input type="text" placeholder="Product Name" value={name} onChange={(e) => setName(e.target.value)} className="p-2 border w-full mb-4" />

      {variants.map((variant, i) => (
        <div key={i} className="grid grid-cols-7 gap-2 mb-2">
          <input
            type="number"
            placeholder="Size Value"
            value={variant.sizeValue}
            onChange={(e) => handleVariantChange(i, 'sizeValue', e.target.value)}
            className="p-2 border"
          />
          <select
            value={variant.sizeUnit}
            onChange={(e) => handleVariantChange(i, 'sizeUnit', e.target.value)}
            className="p-2 border"
          >
            <option value="ml">ml</option>
            <option value="li">li</option>
            <option value="g">g</option>
          </select>
          <input
            type="number"
            placeholder="Price"
            value={variant.price}
            onChange={(e) => handleVariantChange(i, 'price', e.target.value)}
            className="p-2 border"
          />
          <input
            type="number"
            placeholder="Discount %"
            value={variant.discountPercent}
            onChange={(e) => handleVariantChange(i, 'discountPercent', e.target.value)}
            className="p-2 border"
          />
          <input
            type="text"
            value={variant.finalPrice}
            placeholder="Final Price"
            readOnly
            className="p-2 border bg-gray-100"
          />
          <input
            type="number"
            placeholder="Stock"
            value={variant.stock}
            onChange={(e) => handleVariantChange(i, 'stock', e.target.value)}
            className="p-2 border"
          />
          {variants.length > 1 && (
            <button onClick={() => removeVariant(i)} className="text-red-500">Remove</button>
          )}
        </div>
      ))}
      <button onClick={addVariant} className="bg-blue-600 text-white px-3 py-1 mt-2 rounded">+ Add Variant</button>

      <h3 className="text-lg font-semibold mt-6 mb-2">Product Details</h3>
      {detailsList.map((item, index) => (
        <div key={index} className="grid grid-cols-3 gap-2 mb-2">
          <input
            type="text"
            placeholder="Label (e.g., Brand)"
            value={item.key}
            onChange={(e) => handleDetailChange(index, 'key', e.target.value)}
            className="p-2 border"
          />
          <input
            type="text"
            placeholder="Value (e.g., Mirakle)"
            value={item.value}
            onChange={(e) => handleDetailChange(index, 'value', e.target.value)}
            className="p-2 border"
          />
          {detailsList.length > 1 && (
            <button onClick={() => removeDetailField(index)} className="text-red-500">Remove</button>
          )}
        </div>
      ))}
      <button onClick={addDetailField} className="bg-blue-500 text-white px-3 py-1 rounded mb-4">
        + Add Detail
      </button>

      <textarea
        rows="5"
        placeholder="Enter product description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full border p-2"
      />

      <input id="product-images" type="file" multiple accept="image/*" onChange={handleImageChange} className="mt-4" />

      {images.length > 0 && (
        <div className="grid grid-cols-4 gap-2 mt-4">
          {images.map((img, i) => (
            <div key={i} className="relative">
              <img src={URL.createObjectURL(img)} className="w-full h-24 object-cover rounded" />
              <button onClick={() => removeNewImage(i)} className="absolute top-0 right-0 bg-red-500 text-white text-xs px-1">X</button>
            </div>
          ))}
        </div>
      )}

      {existingImages.length > 0 && (
        <div className="grid grid-cols-4 gap-2 mt-4">
          {existingImages.map((img, i) => (
            <div key={i} className="relative">
              <img src={`${API_BASE}${img}`} className="w-full h-24 object-cover rounded" />
              <button onClick={() => handleImageRemove(img)} className="absolute top-0 right-0 bg-red-500 text-white text-xs px-1">X</button>
            </div>
          ))}
        </div>
      )}

      <button onClick={handleSubmit} className={`mt-6 ${editingProduct ? 'bg-orange-500' : 'bg-green-600'} text-white px-4 py-2 rounded`}>
        {editingProduct ? 'Update Product' : 'Upload Product'}
      </button>
      {editingProduct && (
        <button onClick={resetForm} className="ml-4 bg-gray-500 text-white px-4 py-2 rounded">Cancel</button>
      )}

      <h2 className="text-xl font-semibold mt-10 mb-4">All Products</h2>
      <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="p-2 border w-full mb-4" />
      <div className="grid md:grid-cols-3 gap-4">
        {products.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase())).map(product => (
          <div key={product._id} className="border p-4 rounded shadow">
            <img
              src={
                product?.images?.others?.[0]
                  ? `${API_BASE}${product.images.others[0]}`
                  : 'https://via.placeholder.com/150'
              }
              alt={product.title}
              className="w-full h-40 object-cover mb-2 rounded"
            />
            <h3 className="text-lg font-bold">{product.title}</h3>
            {product.variants?.map((v, i) => (
              <p key={i} className="text-sm">{v.size} - ₹{v.price} ({v.discountPercent || 0}% off)</p>
            ))}
            <div className="flex gap-2 mt-3">
              <button onClick={() => handleEdit(product)} className="bg-yellow-500 text-white px-3 py-1 rounded">Edit</button>
              <button onClick={() => handleDelete(product._id)} className="bg-red-500 text-white px-3 py-1 rounded">Delete</button>
              <button onClick={() => toggleStock(product._id, product.isOutOfStock)} className="bg-blue-500 text-white px-3 py-1 rounded">
                {product.isOutOfStock ? 'Set In Stock' : 'Set Out of Stock'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminProductUpload;
