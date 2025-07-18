import { useState } from "react";
import axios from "axios";
import { API_BASE } from "../utils/api";

const ProductTypeBanner = () => {
  const [productTitle, setProductTitle] = useState("");
  const [price, setPrice] = useState("");
  const [oldPrice, setOldPrice] = useState("");
  const [discountPercent, setDiscountPercent] = useState("");
  const [size, setSize] = useState("");
  const [productType, setProductType] = useState("");
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image || !productTitle || !price || !productType || !size) {
      alert("Please fill all required fields.");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("productTitle", productTitle);
      formData.append("price", price);
      formData.append("oldPrice", oldPrice);
      formData.append("discountPercent", discountPercent);
      formData.append("size", size);
      formData.append("productType", productType);
      formData.append("image", image);

      const res = await axios.post(`${API_BASE}/api/product-type-banners`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      alert("Product Type Banner uploaded successfully!");
      // Reset form
      setProductTitle("");
      setPrice("");
      setOldPrice("");
      setDiscountPercent("");
      setSize("");
      setProductType("");
      setImage(null);
      setPreviewUrl(null);
    } catch (err) {
      console.error(err);
      alert("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6 bg-white rounded shadow max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-2">Upload Product Type Banner</h2>

      <input
        type="text"
        placeholder="Product Title"
        value={productTitle}
        onChange={(e) => setProductTitle(e.target.value)}
        className="border p-2 w-full"
        required
      />
      <input
        type="number"
        placeholder="Price"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        className="border p-2 w-full"
        required
      />
      <input
        type="number"
        placeholder="Old Price"
        value={oldPrice}
        onChange={(e) => setOldPrice(e.target.value)}
        className="border p-2 w-full"
      />
      <input
        type="number"
        placeholder="Discount Percent"
        value={discountPercent}
        onChange={(e) => setDiscountPercent(e.target.value)}
        className="border p-2 w-full"
      />
      <input
        type="text"
        placeholder="Size (e.g., 500ml, 1kg)"
        value={size}
        onChange={(e) => setSize(e.target.value)}
        className="border p-2 w-full"
        required
      />
      <input
        type="text"
        placeholder="Product Type (e.g., Health, Beverage)"
        value={productType}
        onChange={(e) => setProductType(e.target.value)}
        className="border p-2 w-full"
        required
      />

      <input type="file" accept="image/*" onChange={handleImageChange} className="border p-2 w-full" />
      {previewUrl && (
        <img src={previewUrl} alt="Preview" className="w-40 h-24 object-cover rounded border" />
      )}

      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        disabled={uploading}
      >
        {uploading ? "Uploading..." : "Upload Banner"}
      </button>
    </form>
  );
};

export default ProductTypeBanner;
