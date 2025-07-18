import { useState } from "react";
import axios from "axios";
import { API_BASE } from "../src/utils/api";

const OfferBanner = ({ fetchBanners }) => {
  const [image, setImage] = useState(null);
  const [title, setTitle] = useState("");

  const handleSubmit = async () => {
    if (!image || !title) return alert("Fill all fields");
    const formData = new FormData();
    formData.append("type", "offer");
    formData.append("image", image);
    formData.append("title", title);

    try {
      await axios.post(`${API_BASE}/api/banners/upload`, formData);
      alert("Offer banner uploaded");
      fetchBanners();
      setTitle("");
      setImage(null);
    } catch (err) {
      console.error("Error uploading offer banner:", err);
    }
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Offer Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="mb-2"
      />
      <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files[0])} />
      {image && <img src={URL.createObjectURL(image)} className="w-full h-64 mt-2 object-cover" />}
      <button onClick={handleSubmit}>Upload Offer Banner</button>
    </div>
  );
};

export default OfferBanner;
