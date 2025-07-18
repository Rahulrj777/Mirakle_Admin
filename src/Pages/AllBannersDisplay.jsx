import { useEffect, useState } from "react";
import axios from "axios";

const AllBannersDisplay = () => {
  const [homeBanners, setHomeBanners] = useState([]);
  const [offerBanners, setOfferBanners] = useState([]);
  const [categoryBanners, setCategoryBanners] = useState([]);
  const [productTypeBanners, setProductTypeBanners] = useState([]);

  useEffect(() => {
    fetchAllBanners();
  }, []);

  const fetchAllBanners = async () => {
    try {
      const homeRes = await axios.get("/api/home-banners");
      setHomeBanners(Array.isArray(homeRes.data) ? homeRes.data : []);
    } catch (err) {
      console.error("Failed to fetch home banners", err.response?.data || err.message);
    }

    try {
      const offerRes = await axios.get("/api/offer-banners");
      setOfferBanners(Array.isArray(offerRes.data) ? offerRes.data : []);
    } catch (err) {
      console.error("Failed to fetch offer banners", err.response?.data || err.message);
    }

    try {
      const categoryRes = await axios.get("/api/category-banners");
      setCategoryBanners(Array.isArray(categoryRes.data) ? categoryRes.data : []);
    } catch (err) {
      console.error("Failed to fetch category banners", err.response?.data || err.message);
    }

    try {
      const productTypeRes = await axios.get("/api/product-type-banners");
      setProductTypeBanners(Array.isArray(productTypeRes.data) ? productTypeRes.data : []);
    } catch (err) {
      console.error("Failed to fetch product type banners", err.response?.data || err.message);
    }
  };

  const Section = ({ title, banners, render }) => (
    <section className="mb-10">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      {banners.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {banners.map(render)}
        </div>
      ) : (
        <p className="text-gray-500 text-sm">No {title.toLowerCase()} found.</p>
      )}
    </section>
  );

  return (
    <div className="p-6 max-w-screen-xl mx-auto">
      {/* Home Banners */}
      <Section
        title="🏠 Home Banners"
        banners={homeBanners}
        render={(banner) => (
          <img
            key={banner._id}
            src={banner.imageUrl}
            alt="Home Banner"
            className="rounded-lg border shadow h-64 w-full object-cover"
          />
        )}
      />

      {/* Offer Banners */}
      <Section
        title="🎁 Offer Banners"
        banners={offerBanners}
        render={(banner) => (
          <div
            key={banner._id}
            className="border rounded-lg p-4 shadow flex flex-col items-center"
          >
            <img
              src={banner.imageUrl}
              alt="Offer Banner"
              className="w-full h-40 object-cover rounded mb-2"
            />
            <h3 className="text-lg font-medium">{banner.title}</h3>
          </div>
        )}
      />

      {/* Category Banners */}
      <Section
        title="📂 Category Banners"
        banners={categoryBanners}
        render={(banner) => (
          <div
            key={banner._id}
            className="border rounded-lg p-4 shadow flex flex-col items-center"
          >
            <img
              src={banner.imageUrl}
              alt="Category Banner"
              className="w-full h-40 object-cover rounded mb-2"
            />
            <h3 className="text-lg font-medium">{banner.title}</h3>
            <p className="text-sm text-gray-500">{banner.categoryType}</p>
          </div>
        )}
      />

      {/* Product Type Banners */}
      <Section
        title="🛒 Product Type Banners"
        banners={productTypeBanners}
        render={(banner) => (
          <div
            key={banner._id}
            className="border rounded-lg p-4 shadow flex flex-col"
          >
            <img
              src={banner.productImageUrl || banner.imageUrl}
              alt={banner.title}
              className="w-full h-40 object-cover rounded mb-2"
            />
            <h3 className="text-lg font-medium">{banner.title}</h3>
            <p className="text-sm text-gray-500">{banner.productType}</p>
            <p className="text-sm text-green-700 font-semibold mt-1">
              ₹{banner.price}
              {banner.oldPrice && (
                <span className="text-gray-400 line-through ml-2">₹{banner.oldPrice}</span>
              )}
            </p>
            {banner.discountPercent && (
              <p className="text-xs text-blue-600 mt-1">
                {banner.discountPercent}% OFF • {banner.weightValue}
                {banner.weightUnit}
              </p>
            )}
          </div>
        )}
      />
    </div>
  );
};

export default AllBannersDisplay;
