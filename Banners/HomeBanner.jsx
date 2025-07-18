import { useState } from "react";
import axios from "axios";
import { API_BASE } from "../src/utils/api";

const HomeBanner = ({ fetchBanners }) => {
  const [image, setImage] = useState(null);

  const handleImageChange = (e) => {
    setImage(e.target.files[0]);
  };

  const handleSubmit = async () => {
    if (!image) return alert("Select an image first");
    const formData = new FormData();
    formData.append("type", "homebanner");
    formData.append("image", image);

    try {
      await axios.post(`${API_BASE}/api/banners/upload`, formData);
      alert("Home banner uploaded");
      fetchBanners();
      setImage(null);
    } catch (err) {
      console.error("Error uploading home banner:", err);
    }
  };

  return (
    <div>
      <input type="file" accept="image/*" onChange={handleImageChange} />
      {image && <img src={URL.createObjectURL(image)} className="w-full h-64 mt-2 object-cover" />}
      <button onClick={handleSubmit}>Upload Home Banner</button>
    </div>
  );
};

export default HomeBanner;
