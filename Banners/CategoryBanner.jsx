import { useState } from "react";
import axios from "axios";
import { API_BASE } from "../src/utils/api";

const CategoryBanner = ({ fetchBanners, availableProductTypes }) => {
  const [title, setTitle] = useState("");
  const [image, setImage] = useState(null);
  const [selectedCategoryType, setSelectedCategoryType] = useState("");

  const handleSubmit = async () => {
    if (!title || !image || !selectedCategoryType) return alert("Fill all fields");

    const formData = new FormData();
    formData.append("type", "category");
    formData.append("title", title);
    formData.append("categoryType", selectedCategoryType);
    formData.append("image", image);

    try {
      await axios.post(`${API_BASE}/api/banners/upload`, formData);
      alert("Category banner uploaded");
      fetchBanners();
      setTitle("");
      setImage(null);
      setSelectedCategoryType("");
    } catch (err) {
      console.error("Error uploading category banner:", err);
    }
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Category Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="mb-2"
      />
      <select
        value={selectedCategoryType}
        onChange={(e) => setSelectedCategoryType(e.target.value)}
        className="mb-2"
      >
        <option value="">Select Category Type</option>
        {availableProductTypes.map((type, i) => (
          <option key={i} value={type}>{type}</option>
        ))}
      </select>
      <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files[0])} />
      {image && <img src={URL.createObjectURL(image)} className="w-full h-64 mt-2 object-cover" />}
      <button onClick={handleSubmit}>Upload Category Banner</button>
    </div>
  );
};

export default CategoryBanner;
