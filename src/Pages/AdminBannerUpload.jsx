"use client"

import { useState, useEffect, useCallback } from "react" // Import useCallback
import axios from "axios"
import { API_BASE } from "../utils/api"

const AdminBannerUpload = () => {
  const [image, setImage] = useState(null)
  // ✅ FIXED: Set initial type to "all" to show all banners by default
  const [type, setType] = useState("all")
  const [banners, setBanners] = useState([])
  const [products, setProducts] = useState([])
  const [selectedProductIds, setSelectedProductIds] = useState([])
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0)
  const [productSearchTerm, setProductSearchTerm] = useState("")
  const [selectedCategoryType, setSelectedCategoryType] = useState("")
  const [availableProductTypes, setAvailableProductTypes] = useState([])
  const [title, setTitle] = useState("") // For offerbanner title
  const [percentage, setPercentage] = useState("") // For offerbanner percentage
  const [offerSlot, setOfferSlot] = useState("") // For offerbanner slot

  // ✅ NEW: Fetch banners and products on component mount and when type changes
  useEffect(() => {
    fetchBanners()
    fetchProducts()
  }, []) // Run once on mount

  // ✅ NEW: Reset image and related states when banner type changes
  useEffect(() => {
    setImage(null)
    setTitle("")
    setPercentage("")
    setOfferSlot("")
    setSelectedProductIds([])
    setSelectedVariantIndex(0)
    setProductSearchTerm("")
    setSelectedCategoryType("")
    // Re-fetch banners when type changes to update the filtered list
    if (type !== "all") {
      // Only re-fetch if we're switching to a specific upload type
      fetchBanners()
    }
  }, [type])

  const fetchBanners = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/banners`)
      console.log("Fetched All Banners:", res.data)
      setBanners(res.data)
    } catch (err) {
      console.error("Failed to fetch banners:", err)
      setBanners([])
    }
  }

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/products/all-products`)
      setProducts(res.data)
      const uniqueTypes = [...new Set(res.data.map((p) => p.productType).filter(Boolean))].sort()
      setAvailableProductTypes(uniqueTypes)
    } catch (err) {
      console.error("Failed to fetch products:", err)
      setProducts([])
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file || !file.type.startsWith("image/")) {
      alert("Only image files are allowed")
      setImage(null)
      return
    }
    setImage(file)
  }

  // ✅ NEW: Function to clear the selected image
  const clearImage = useCallback(() => {
    setImage(null)
    const fileInput = document.getElementById(`banner-file-${type}`)
    if (fileInput) fileInput.value = ""
  }, [type])

  const getSelectedProduct = () => products.find((p) => p._id === selectedProductIds[0]) || null
  const getSelectedVariant = () => getSelectedProduct()?.variants?.[selectedVariantIndex] || null

  const filteredProducts = products.filter((product) =>
    product.title.toLowerCase().includes(productSearchTerm.toLowerCase()),
  )

  const handleUpload = async () => {
    if (type === "all") {
      alert("Cannot upload when 'Show All' is selected. Please choose a specific banner type to upload.")
      return
    }

    const formData = new FormData()
    formData.append("type", type)

    if (type === "homebanner") {
      if (!image) {
        alert("Please select an image for the Main Banner.")
        return
      }
      formData.append("image", image)
    } else if (type === "category") {
      if (!image) {
        alert("Please select an image for the Category Banner.")
        return
      }
      if (!selectedCategoryType) {
        alert("Please select a category type.")
        return
      }
      if (banners.some((b) => b.type === "category" && b.title === selectedCategoryType)) {
        alert(`A banner for category '${selectedCategoryType}' already exists.`)
        return
      }
      formData.append("image", image)
      formData.append("title", selectedCategoryType)
    } else if (type === "offerbanner") {
      if (!image) {
        alert("Please select an image for the Offer Zone Banner.")
        return
      }
      if (!title.trim() || !percentage || !offerSlot) {
        alert("Please enter title, percentage, and select an offer slot.")
        return
      }
      if (banners.some((b) => b.type === "offerbanner" && b.slot === offerSlot)) {
        alert(`An offer banner for slot '${offerSlot}' already exists.`)
        return
      }
      formData.append("title", title.trim())
      formData.append("percentage", percentage)
      formData.append("slot", offerSlot)
      formData.append("image", image)
    } else if (type === "product-type") {
      if (selectedProductIds.length === 0) {
        alert("Please select at least one product.")
        return
      }
      let successCount = 0
      for (const productId of selectedProductIds) {
        const product = products.find((p) => p._id === productId)
        let variant = null
        if (selectedProductIds.length === 1) {
          variant = product?.variants?.[selectedVariantIndex]
        } else {
          variant = product?.variants?.[0]
        }
        if (!product || !variant) continue

        const productImageUrl = product.images?.others?.[0] || ""
        if (!productImageUrl) {
          console.warn(`Skipping product ${product.title}: No image URL found.`)
          continue
        }

        if (banners.some((b) => b.type === "product-type" && b.productId === productId)) {
          console.warn(`Skipping upload for product ${product.title}: A banner for this product already exists.`)
          continue
        }

        const discount = Number.parseFloat(variant.discountPercent) || 0
        const oldPrice = Number.parseFloat(variant.price) || 0
        const price = oldPrice - (oldPrice * discount) / 100
        const productFormData = new FormData()
        productFormData.append("type", type)
        productFormData.append("productId", productId)
        productFormData.append("productImageUrl", productImageUrl)
        productFormData.append("title", product.title)
        productFormData.append("price", price.toFixed(2))
        productFormData.append("oldPrice", oldPrice.toFixed(2))
        productFormData.append("discountPercent", discount.toString())
        productFormData.append("productType", product.productType)
        const sizeMatch = variant.size.match(/^([\d.]+)([a-zA-Z]+)$/)
        if (sizeMatch) {
          productFormData.append("weightValue", sizeMatch[1])
          productFormData.append("weightUnit", sizeMatch[2])
        }
        try {
          const res = await axios.post(`${API_BASE}/api/banners/upload`, productFormData, {
            headers: { "Content-Type": "multipart/form-data" },
          })
          console.log(`Uploaded banner for ${product.title}`, res.data)
          successCount++
        } catch (err) {
          console.error(`❌ Failed to upload banner for ${product.title}`, err.response?.data || err.message)
          alert(`Failed to upload banner for ${product.title}: ${err.response?.data?.message || err.message}`)
        }
      }
      if (successCount > 0) {
        alert(`Uploaded ${successCount} banner(s) successfully`)
        fetchBanners()
      } else {
        alert("No banners uploaded. Please check product images or errors.")
      }
      setSelectedProductIds([])
      setSelectedVariantIndex(0)
      return
    }
    // This 'else' block should ideally not be reached if all types are handled
    alert("Unknown banner type selected. Please choose a valid banner type.")
  }

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this banner?")) {
      try {
        const url = `${API_BASE}/api/banners/${id}`
        const response = await axios.delete(url)
        if (response.status === 200) {
          alert("Banner deleted successfully")
          fetchBanners()
        } else {
          console.error("Unexpected response:", response)
          alert("Failed to delete banner")
        }
      } catch (err) {
        console.error("Delete error:", err.response?.data || err.message)
        alert(err.response?.data?.message || "Failed to delete banner")
      }
    }
  }

  const handleDeleteAll = async () => {
    const currentType = type === "all" ? "all" : type
    const typeNames = {
      all: "ALL",
      homebanner: "Main Banner",
      category: "Category Banner",
      offerbanner: "Offer Zone Banner",
      "product-type": "Product Type Banner",
    }
    const confirmMessage =
      currentType === "all"
        ? "Are you sure you want to delete ALL banners?"
        : `Delete all ${typeNames[currentType]} banners?`
    if (confirm(confirmMessage)) {
      try {
        const url = `${API_BASE}/api/banners${currentType !== "all" ? `?type=${currentType}` : ""}`
        const response = await axios.delete(url)
        alert(response.data.message || "Banners deleted successfully")
        fetchBanners()
      } catch (err) {
        console.error("Delete all error:", err.response?.data || err.message)
        alert(err.response?.data?.message || "Failed to delete banners")
      }
    }
  }

  const selectedProduct = getSelectedProduct()
  const selectedVariant = getSelectedVariant()
  const filteredBanners = banners.filter((b) => type === "all" || b.type === type)

  // Determine if the upload button should be enabled
  const isUploadEnabled = (() => {
    if (type === "all") return false // Cannot upload in "Show All" mode
    if (type === "homebanner") return !!image
    if (type === "category") return !!image && !!selectedCategoryType
    if (type === "offerbanner") return !!image && !!title.trim() && !!percentage && !!offerSlot
    if (type === "product-type") return selectedProductIds.length > 0
    return false // Fallback for unknown types
  })()

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Admin Banner Upload Panel</h2>
      <select value={type} onChange={(e) => setType(e.target.value)} className="border p-2 w-full mb-4">
        <option value="all">Show All (View Only)</option>
        <option value="homebanner">Main Banner</option>
        <option value="category">Category Banner</option>
        <option value="offerbanner">Offer Zone Banner</option>
        <option value="product-type">Our Special Product's Banner</option>
      </select>

      {type !== "all" && (
        <div className="bg-white shadow p-4 rounded mb-6">
          {type === "product-type" && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Select Product(s):</label>
              <input
                type="text"
                placeholder="Search products..."
                value={productSearchTerm}
                onChange={(e) => setProductSearchTerm(e.target.value)}
                className="mb-2 p-2 border w-full rounded"
              />
              <div className="mb-3">
                <label className="block text-sm font-medium mb-2">Select Products (Max 10):</label>
                <div className="max-h-60 overflow-y-auto border rounded p-2">
                  {filteredProducts.map((product) => {
                    const isProductBannerExisting = banners.some(
                      (b) => b.type === "product-type" && b.productId === product._id,
                    )
                    return (
                      <label
                        key={product._id}
                        className={`flex items-center gap-2 mb-2 cursor-pointer ${isProductBannerExisting ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        <input
                          type="checkbox"
                          value={product._id}
                          checked={selectedProductIds.includes(product._id)}
                          onChange={(e) => {
                            const checked = e.target.checked
                            const value = e.target.value
                            setSelectedVariantIndex(0)
                            setSelectedProductIds((prevIds) => {
                              const maxSelections = 10
                              if (checked) {
                                if (prevIds.includes(value)) return prevIds
                                if (prevIds.length >= maxSelections) {
                                  alert(`You can select a maximum of ${maxSelections} products only.`)
                                  return prevIds
                                }
                                return [...prevIds, value]
                              } else {
                                return prevIds.filter((id) => id !== value)
                              }
                            })
                          }}
                          disabled={isProductBannerExisting}
                          className="accent-green-600"
                        />
                        <span className="text-sm">
                          {product.title} {isProductBannerExisting && "(Banner Exists)"}
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>
              {selectedProductIds.length === 1 && selectedProduct?.variants?.length > 1 && (
                <div className="mb-3">
                  <label className="block text-sm font-medium mb-1">Select Variant:</label>
                  <select
                    value={selectedVariantIndex}
                    onChange={(e) => setSelectedVariantIndex(Number(e.target.value))}
                    className="p-2 border w-full"
                  >
                    {selectedProduct.variants.map((variant, index) => (
                      <option key={index} value={index}>
                        {variant.size} - ₹{variant.price}
                        {variant.discountPercent > 0 && ` (${variant.discountPercent}% OFF)`}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {selectedProductIds.length === 1 && selectedProduct && selectedVariant && (
                <div className="bg-gray-50 p-3 rounded border">
                  <h4 className="font-medium text-sm mb-2">Selected Product Preview:</h4>
                  <div className="flex gap-3">
                    {selectedProduct.images?.others?.[0] && (
                      <img
                        src={`${API_BASE}${selectedProduct.images.others[0]}`}
                        alt={selectedProduct.title}
                        className="w-16 h-16 object-cover rounded"
                      />
                    )}
                    <div className="text-sm">
                      <p className="font-medium">{selectedProduct.title}</p>
                      <p className="text-gray-600">{selectedVariant.size}</p>
                      <p className="text-green-600 font-semibold">₹{selectedVariant.price}</p>
                      {selectedVariant.discountPercent > 0 && (
                        <p className="text-red-500 text-xs">{selectedVariant.discountPercent}% OFF</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {selectedProductIds.length > 1 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  {selectedProductIds.map((productId) => {
                    const product = products.find((p) => p._id === productId)
                    const variant = product?.variants?.[0]
                    if (!product || !variant) return null
                    return (
                      <div key={productId} className="bg-gray-100 p-3 rounded border flex items-center gap-3">
                        {product.images?.others?.[0] && (
                          <img
                            src={`${API_BASE}${product.images.others[0]}`}
                            alt={product.title}
                            className="w-16 h-16 object-cover rounded"
                          />
                        )}
                        <div className="text-sm">
                          <p className="font-medium">{product.title}</p>
                          <p className="text-gray-600">{variant.size}</p>
                          <p className="text-green-600 font-semibold">₹{variant.price}</p>
                          {variant.discountPercent > 0 && (
                            <p className="text-red-500 text-xs">{variant.discountPercent}% OFF</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {(type === "category" || type === "homebanner" || type === "offerbanner") && (
            <>
              {type === "category" && (
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Select Category Type:</label>
                  <select
                    value={selectedCategoryType}
                    onChange={(e) => setSelectedCategoryType(e.target.value)}
                    className="p-2 border w-full rounded"
                  >
                    <option value="">Select a product category</option>
                    {availableProductTypes.map((typeOption, index) => {
                      const isCategoryBannerExisting = banners.some(
                        (b) => b.type === "category" && b.title === typeOption,
                      )
                      return (
                        <option key={index} value={typeOption} disabled={isCategoryBannerExisting}>
                          {typeOption} {isCategoryBannerExisting && "(Banner Exists)"}
                        </option>
                      )
                    })}
                  </select>
                </div>
              )}

              {type === "offerbanner" && (
                <>
                  <input
                    type="text"
                    placeholder="Enter Offer Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="mb-4 p-2 border rounded w-full"
                  />
                  <input
                    type="number"
                    placeholder="Discount Percentage (e.g., 50)"
                    value={percentage}
                    onChange={(e) => setPercentage(e.target.value)}
                    className="mb-4 p-2 border rounded w-full"
                  />
                  <select
                    value={offerSlot}
                    onChange={(e) => setOfferSlot(e.target.value)}
                    className="mb-4 p-2 border rounded w-full"
                  >
                    <option value="">Select Slot</option>
                    <option value="left" disabled={banners.some((b) => b.type === "offerbanner" && b.slot === "left")}>
                      Left Banner {banners.some((b) => b.type === "offerbanner" && b.slot === "left") && "(Exists)"}
                    </option>
                    <option
                      value="right"
                      disabled={banners.some((b) => b.type === "offerbanner" && b.slot === "right")}
                    >
                      Right Banner {banners.some((b) => b.type === "offerbanner" && b.slot === "right") && "(Exists)"}
                    </option>
                  </select>
                </>
              )}

              <div className="flex items-center gap-2 mb-4">
                <input
                  id={`banner-file-${type}`}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="flex-1"
                />
                {image && (
                  <button onClick={clearImage} className="bg-red-500 text-white px-3 py-1 rounded text-sm">
                    Clear Image
                  </button>
                )}
              </div>
              {image && (
                <img
                  src={URL.createObjectURL(image) || "/placeholder.svg"}
                  alt="Preview"
                  className="mb-4 w-full h-64 object-cover rounded border"
                />
              )}
            </>
          )}

          <button
            onClick={() => setTimeout(handleUpload, 100)}
            className={`px-4 py-2 rounded text-white ${isUploadEnabled ? "bg-green-600 hover:bg-green-700" : "bg-gray-400 cursor-not-allowed"}`}
            disabled={!isUploadEnabled}
          >
            Upload Banner
          </button>
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">
          {type === "all"
            ? "All Uploaded Banners"
            : `${type === "homebanner" ? "Main Banners" : type === "category" ? "Category Banners" : type === "offerbanner" ? "Offer Zone Banners" : "Product Type Banners"} (${filteredBanners.length})`}
        </h3>
        {filteredBanners.length > 0 && (
          <button
            onClick={handleDeleteAll}
            className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700"
          >
            {type === "all"
              ? "Delete All Banners"
              : `Delete All ${type === "homebanner" ? "Main" : type === "category" ? "Category" : type === "offerbanner" ? "Offer Zone" : "Product Type"} Banners`}
          </button>
        )}
      </div>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        {filteredBanners.map((banner) => (
          <div key={banner._id} className="border p-3 rounded shadow relative">
            <img
              src={banner.imageUrl || "/placeholder.svg"}
              alt={banner.title || banner.type}
              className="w-full h-40 object-cover rounded mb-2"
            />
            {banner.discountPercent > 0 && (
              <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md">
                {banner.discountPercent}% OFF
              </span>
            )}
            <div className="text-sm text-center font-medium mt-1">
              {banner.title || `(${banner.type.replace("banner", " Banner")})`}
            </div>
            {banner.price > 0 && (
              <div className="text-center text-sm mt-1">
                <span className="text-green-700 font-semibold">₹ {Number(banner.price).toFixed(0)}</span>
                {banner.oldPrice > banner.price && (
                  <span className="text-gray-400 line-through ml-2 text-xs">
                    ₹ {Number(banner.oldPrice).toFixed(0)}
                  </span>
                )}
              </div>
            )}
            {banner.weight?.value > 0 && (
              <div className="text-gray-500 text-center text-xs">
                {banner.weight.value} {banner.weight.unit}
              </div>
            )}
            {banner.slot && <div className="text-gray-600 text-center text-xs mt-1">Slot: {banner.slot}</div>}
            {banner.percentage > 0 && (
              <div className="text-red-500 text-center text-xs mt-1">{banner.percentage}% Discount</div>
            )}
            <div className="mt-3 text-center">
              <button
                onClick={() => handleDelete(banner._id)}
                className="bg-red-500 text-white px-3 py-1 text-sm rounded hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
      {filteredBanners.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          <p>No banners found for the selected type.</p>
        </div>
      )}
    </div>
  )
}

export default AdminBannerUpload
