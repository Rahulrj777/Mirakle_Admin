import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE } from "../utils/api";
import ProductPickerModal from "./ProductPickerModal";

const AdminBannerUpload = () => {
  const [type, setType] = useState("slider");
  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [removedImages, setRemovedImages] = useState([]);
  const [banners, setBanners] = useState([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/banners`);
      setBanners(res.data);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  const handleImageChange = (e) => {
    setImages([...images, ...Array.from(e.target.files)]);
  };

  const removeNewImage = (index) => {
    const copy = [...images];
    copy.splice(index, 1);
    setImages(copy);
  };

  const handleImageRemove = (imgPath) => {
    setRemovedImages((prev) => [...prev, imgPath]);
    setExistingImages((prev) => prev.filter((img) => img !== imgPath));
  };

  const resetForm = () => {
    setType("slider");
    setImages([]);
    setExistingImages([]);
    setRemovedImages([]);
    setSelectedProducts([]);
    const fileInput = document.getElementById("banner-images");
    if (fileInput) fileInput.value = "";
  };

  const handleSubmit = async () => {
    if (images.length === 0) {
      alert("Please select at least one image.");
      return;
    }

    const formData = new FormData();
    formData.append("type", type);
    images.forEach((img) => formData.append("images", img));
    formData.append(
      "products",
      JSON.stringify(selectedProducts.map((p) => p._id))
    );

    try {
      const res = await axios.post(`${API_BASE}/api/banners/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("✅ Banner uploaded");
      fetchBanners();
      resetForm();
    } catch (err) {
      console.error("❌ Upload error:", err.response?.data || err.message);
      alert(err.response?.data?.message || "Upload failed");
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE}/api/banners/${id}`);
      fetchBanners();
    } catch (err) {
      alert("Delete failed");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Upload Banner</h2>

      <select
        value={type}
        onChange={(e) => setType(e.target.value)}
        className="p-2 border mb-4 w-full"
      >
        <option value="slider">Main Slider Banner</option>
        <option value="side">Side Banner</option>
        <option value="offer">Offer Banner</option>
        <option value="product-type">Product Type Banner</option>
      </select>

      <input
        id="banner-images"
        type="file"
        multiple
        accept="image/*"
        onChange={handleImageChange}
        className="mb-4"
      />

      <div className="mb-4">
        <button
          onClick={() => setShowProductModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          + Select Products
        </button>
      </div>

      {selectedProducts.length > 0 && (
        <div className="mb-4">
          <p className="font-semibold mb-2">Selected Products:</p>
          <ul className="list-disc ml-6">
            {selectedProducts.map((p) => (
              <li key={p._id}>{p.title}</li>
            ))}
          </ul>
        </div>
      )}

      {images.length > 0 && (
        <div className="grid grid-cols-4 gap-2 mb-4">
          {images.map((img, i) => (
            <div key={i} className="relative">
              <img
                src={URL.createObjectURL(img)}
                className="w-full h-24 object-cover rounded"
              />
              <button
                onClick={() => removeNewImage(i)}
                className="absolute top-0 right-0 bg-red-500 text-white text-xs px-1"
              >
                X
              </button>
            </div>
          ))}
        </div>
      )}

      {existingImages.length > 0 && (
        <div className="grid grid-cols-4 gap-2 mb-4">
          {existingImages.map((img, i) => (
            <div key={i} className="relative">
              <img
                src={`${API_BASE}${img}`}
                className="w-full h-24 object-cover rounded"
              />
              <button
                onClick={() => handleImageRemove(img)}
                className="absolute top-0 right-0 bg-red-500 text-white text-xs px-1"
              >
                X
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={handleSubmit}
        className="bg-green-600 text-white px-4 py-2 rounded"
      >
        Upload Banner
      </button>

      {showProductModal && (
        <ProductPickerModal
          onClose={() => setShowProductModal(false)}
          selected={selectedProducts}
          setSelected={setSelectedProducts}
          max={6}
        />
      )}

      <h2 className="text-xl font-semibold mt-10 mb-4">All Banners</h2>
      <input
        type="text"
        placeholder="Search..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="p-2 border w-full mb-4"
      />

      <div className="grid md:grid-cols-3 gap-4">
        {banners
          .filter((b) =>
            b?.products?.some((p) =>
              p.title.toLowerCase().includes(searchTerm.toLowerCase())
            )
          )
          .map((banner) => (
            <div key={banner._id} className="border p-4 rounded shadow">
              {banner?.imageUrl && (
                <img
                  src={`${API_BASE}${banner.imageUrl}`}
                  className="w-full h-40 object-cover mb-2 rounded"
                />
              )}
              <p className="text-sm text-gray-500 capitalize mb-2">
                Type: {banner.type}
              </p>
              {banner?.products?.length > 0 && (
                <>
                  <p className="font-semibold mb-1">Linked Products:</p>
                  <ul className="text-sm list-disc ml-5">
                    {banner.products.map((p) => (
                      <li key={p._id}>{p.title}</li>
                    ))}
                  </ul>
                </>
              )}
              <button
                onClick={() => handleDelete(banner._id)}
                className="mt-3 bg-red-500 text-white px-3 py-1 rounded"
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
