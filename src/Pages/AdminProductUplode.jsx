import { useState, useEffect } from "react"
import axios from "axios"
import { API_BASE } from "../utils/api"
import AdminLayout from "../Componenets/AdminLayout"
import { useNavigate } from "react-router-dom"

export default function AdminProductUpload() {
  const navigate = useNavigate()
  const [name, setName] = useState("")
  const [variants, setVariants] = useState([
    { sizeValue: "", sizeUnit: "ml", price: "", discountPercent: "", finalPrice: "", stock: "", isOutOfStock: false },
  ])
  const [images, setImages] = useState([])
  const [existingImages, setExistingImages] = useState([])
  const [removedImages, setRemovedImages] = useState([])
  const [products, setProducts] = useState([])
  const [editingProduct, setEditingProduct] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [detailsList, setDetailsList] = useState([{ key: "", value: "" }])
  const [description, setDescription] = useState("")
  const [keywords, setKeywords] = useState("")
  const [keywordsList, setKeywordsList] = useState([])
  const [productType, setProductType] = useState("")
  const [availableProductTypes, setAvailableProductTypes] = useState([])
  const [newProductTypeInput, setNewProductTypeInput] = useState("")

  useEffect(() => {
    fetchProducts()
  }, [])

  const debugToken = () => {
    const token = localStorage.getItem("adminToken")
    console.log("=== TOKEN DEBUG INFO ===")
    console.log("Token exists:", !!token)
    console.log("Token length:", token?.length)
    console.log("Token first 50 chars:", token?.substring(0, 50))
    console.log("Token last 20 chars:", token?.substring(token.length - 20))
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]))
        console.log("Token payload:", payload)
        console.log("Token expires at:", new Date(payload.exp * 1000))
        console.log("Token issued at:", new Date(payload.iat * 1000))
        console.log("Current time:", new Date())
        console.log("Token expired?", Date.now() > payload.exp * 1000)
      } catch (e) {
        console.error("Failed to decode token:", e)
      }
    }
    console.log("========================")
  }

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/products/all-products`)
      setProducts(res.data)
      const uniqueTypes = [...new Set(res.data.map((p) => p.productType).filter(Boolean))].sort()
      setAvailableProductTypes(uniqueTypes)
    } catch (err) {
      console.error("Fetch products error:", err)
    }
  }

  const resetForm = () => {
    setName("")
    setVariants([
      { sizeValue: "", sizeUnit: "ml", price: "", discountPercent: "", finalPrice: "", stock: "", isOutOfStock: false },
    ])
    setImages([])
    setExistingImages([])
    setRemovedImages([])
    setEditingProduct(null)
    setDetailsList([{ key: "", value: "" }])
    setDescription("")
    setKeywords("")
    setKeywordsList([])
    setProductType("")
    const fileInput = document.getElementById("product-images")
    if (fileInput) fileInput.value = ""
  }

  const handleImageChange = (e) => {
    if (e.target.files) {
      setImages([...images, ...Array.from(e.target.files)])
    }
  }

  const handleImageRemove = (publicId) => {
    setRemovedImages((prev) => [...prev, publicId])
    setExistingImages((prev) => prev.filter((img) => img.public_id !== publicId))
  }

  const removeNewImage = (index) => {
    const copy = [...images]
    copy.splice(index, 1)
    setImages(copy)
  }

  const handleVariantChange = (index, field, value) => {
    setVariants((prev) => {
      const updated = [...prev]
      updated[index][field] = value
      const price = Number.parseFloat(updated[index].price)
      const discount = Number.parseFloat(updated[index].discountPercent)
      if (!isNaN(price) && !isNaN(discount)) {
        updated[index].finalPrice = (price - (price * discount) / 100).toFixed(2)
      } else {
        updated[index].finalPrice = ""
      }
      return updated
    })
  }

  const addVariant = () => {
    setVariants([
      ...variants,
      {
        sizeValue: "",
        sizeUnit: "ml",
        price: "",
        discountPercent: "",
        finalPrice: "",
        stock: "",
        isOutOfStock: false,
      },
    ])
  }

  const removeVariant = (i) => {
    const copy = [...variants]
    copy.splice(i, 1)
    setVariants(copy)
  }

  const handleDetailChange = (index, field, value) => {
    const copy = [...detailsList]
    copy[index][field] = value
    setDetailsList(copy)
  }

  const addDetailField = () => {
    setDetailsList([...detailsList, { key: "", value: "" }])
  }

  const removeDetailField = (index) => {
    const copy = [...detailsList]
    copy.splice(index, 1)
    setDetailsList(copy)
  }

  const handleKeywordsChange = (e) => {
    setKeywords(e.target.value)
  }

  const addKeyword = () => {
    if (keywords.trim()) {
      const newKeywords = keywords
        .split(",")
        .map((k) => k.trim().toLowerCase())
        .filter((k) => k && !keywordsList.includes(k))
      setKeywordsList([...keywordsList, ...newKeywords])
      setKeywords("")
    }
  }

  const removeKeyword = (index) => {
    const copy = [...keywordsList]
    copy.splice(index, 1)
    setKeywordsList(copy)
  }

  const handleAddProductType = () => {
    const newType = newProductTypeInput.trim()
    if (newType && !availableProductTypes.includes(newType)) {
      setAvailableProductTypes((prev) => [...prev, newType].sort())
      setProductType(newType)
      setNewProductTypeInput("")
      alert(`Product type "${newType}" added to dropdown. Save a product to persist it.`)
    } else if (newType && availableProductTypes.includes(newType)) {
      alert(`Product type "${newType}" already exists.`)
    }
  }

  const handleSubmit = async () => {
    console.log("🔘 Submit button clicked")
    debugToken()
    console.log("⚠️ Skipping token validation, proceeding with request...")

    if (!name || variants.some((v) => !v.sizeValue || !v.price)) {
      alert("Product name and current price are required")
      console.warn("❌ Validation failed", { name, variants })
      return
    }

    if (!productType) {
      alert("Please select a product type.")
      return
    }

    if (images.length === 0 && existingImages.length === 0) {
      alert("Please upload at least one image for the product.")
      return
    }

    const preparedVariants = variants.map((v) => ({
      size: `${v.sizeValue}${v.sizeUnit}`,
      price: Number.parseFloat(v.price),
      discountPercent: Number.parseFloat(v.discountPercent),
      stock: Number.parseInt(v.stock),
      isOutOfStock: Boolean(v.isOutOfStock),
    }))

    const detailsObject = {}
    detailsList.forEach((item) => {
      if (item.key && item.value) {
        detailsObject[item.key] = item.value
      }
    })

    const formData = new FormData()
    formData.append("name", name)
    formData.append("variants", JSON.stringify(preparedVariants))
    formData.append("description", description)
    formData.append("details", JSON.stringify(detailsObject))
    formData.append("keywords", JSON.stringify(keywordsList))
    formData.append("productType", productType)

    images.forEach((img) => formData.append("images", img))

    if (removedImages.length > 0) {
      formData.append("removedImages", JSON.stringify(removedImages))
    }

    const token = localStorage.getItem("adminToken")
    console.log("--- Submitting Product Data ---")
    console.log("Name:", name)
    console.log("Product Type:", productType)
    console.log("Variants:", preparedVariants)
    console.log("Description:", description)
    console.log("Details:", detailsObject)
    console.log("Keywords:", keywordsList)
    console.log("New Images Count:", images.length)
    console.log("Existing Images to Remove Count:", removedImages.length)

    if (editingProduct) {
      console.log("Editing Product ID:", editingProduct._id)
    }

    console.log("Admin Token:", token ? "Present" : "Missing")
    console.log("Request URL:", `${API_BASE}/api/products/update/${editingProduct._id}`)
    console.log("Environment Variables Check:")
    console.log("- API_BASE:", API_BASE)
    console.log("-----------------------------")

    try {
      let res
      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
        timeout: 30000,
      }

      console.log("🚀 Making request with config:", {
        url: editingProduct
          ? `${API_BASE}/api/products/update/${editingProduct._id}`
          : `${API_BASE}/api/products/upload-product`,
        method: editingProduct ? "PUT" : "POST",
        headers: config.headers,
      })

      if (editingProduct) {
        res = await axios.put(`${API_BASE}/api/products/update/${editingProduct._id}`, formData, config)
        alert("✅ Product updated")
        console.log("🟢 Updated:", res.data)
      } else {
        res = await axios.post(`${API_BASE}/api/products/upload-product`, formData, config)
        alert("✅ Product uploaded")
        console.log("🟢 Uploaded:", res.data)
      }

      resetForm()
      fetchProducts()
    } catch (err) {
      console.error("❌ Operation error:", err.response?.data || err.message)
      console.error("❌ Error status:", err.response?.status)
      console.error("❌ Error headers:", err.response?.headers)
      console.error("❌ Request config:", err.config)
      console.error("❌ Full error object:", err)

      if (err.response) {
        console.log("🔍 Server response details:")
        console.log("- Status:", err.response.status)
        console.log("- Status Text:", err.response.statusText)
        console.log("- Data:", err.response.data)
        console.log("- Headers:", err.response.headers)
      }

      if (err.response?.status === 401) {
        alert("Your session has expired. Please log in again.")
        localStorage.removeItem("adminToken")
        localStorage.removeItem("admin")
        navigate("/login")
      } else if (err.response?.status === 413) {
        alert("File size too large. Please reduce image sizes and try again.")
      } else if (err.response?.status === 500) {
        alert("Server error. Please try again later.")
      } else {
        alert(err.response?.data?.message || "Operation failed. Please try again.")
      }
    }
  }

  const handleEdit = (product) => {
    setEditingProduct(product)
    setName(product.title)
    setProductType(product.productType || "")

    const parsedVariants = product.variants
      .map((v) => {
        const match = v.size.match(/^([\d.]+)([a-zA-Z]+)$/)
        if (!match) return null
        const [, sizeValue, sizeUnit] = match
        return {
          sizeValue,
          sizeUnit,
          price: v.price,
          discountPercent: v.discountPercent || "",
          finalPrice: (v.price - (v.price * (v.discountPercent || 0)) / 100).toFixed(2),
          stock: v.stock,
          isOutOfStock: v.isOutOfStock || false,
        }
      })
      .filter(Boolean)

    setVariants(parsedVariants)
    setImages([])
    setExistingImages(product.images?.others || [])
    setRemovedImages([])
    setDetailsList(Object.entries(product.details || {}).map(([key, value]) => ({ key, value: String(value) })))
    setDescription(product.description || "")
    setKeywordsList(product.keywords || [])
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return

    try {
      const token = localStorage.getItem("adminToken")
      await axios.delete(`${API_BASE}/api/products/delete/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      alert("Product deleted successfully")
      fetchProducts()
    } catch (err) {
      console.error("Delete failed:", err.response?.data || err.message)
      if (err.response?.status === 401) {
        alert("Your session has expired. Please log in again.")
        navigate("/login")
      } else {
        alert(err.response?.data?.message || "Delete failed")
      }
    }
  }

  const toggleStock = async (id, currentStatus) => {
    try {
      const token = localStorage.getItem("adminToken")
      await axios.put(
        `${API_BASE}/api/products/toggle-stock/${id}`,
        {
          isOutOfStock: !currentStatus,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )
      fetchProducts()
    } catch (err) {
      console.error("Stock update failed:", err.response?.data || err.message)
      if (err.response?.status === 401) {
        alert("Your session has expired. Please log in again.")
        navigate("/login")
      } else {
        alert(err.response?.data?.message || "Stock update failed")
      }
    }
  }

  // New function to toggle individual variant stock
  const toggleVariantStock = async (productId, variantIndex, currentStatus) => {
    try {
      const token = localStorage.getItem("adminToken")
      await axios.put(
        `${API_BASE}/api/products/toggle-variant-stock/${productId}`,
        {
          variantIndex: variantIndex,
          isOutOfStock: !currentStatus,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )
      fetchProducts()
    } catch (err) {
      console.error("Variant stock update failed:", err.response?.data || err.message)
      if (err.response?.status === 401) {
        alert("Your session has expired. Please log in again.")
        navigate("/login")
      } else {
        alert(err.response?.data?.message || "Variant stock update failed")
      }
    }
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {editingProduct ? "Edit Product" : "Add New Product"}
          </h2>
          <p className="text-gray-600">
            {editingProduct
              ? "Update product information and variants"
              : "Create a new product with variants and details"}
          </p>
        </div>

        {/* Product Form */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Product Information</h3>

          {/* Product Name */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
            <input
              type="text"
              placeholder="Enter product name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Variants Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900">Product Variants</h4>
              <button
                onClick={addVariant}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <span>+</span>
                Add Variant
              </button>
            </div>

            <div className="space-y-4">
              {variants.map((variant, i) => (
                <div key={i} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h5 className="font-medium text-gray-900">Variant {i + 1}</h5>
                    {variants.length > 1 && (
                      <button
                        onClick={() => removeVariant(i)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Size Value */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Size Value *</label>
                      <input
                        type="number"
                        placeholder="e.g., 500"
                        value={variant.sizeValue}
                        onChange={(e) => handleVariantChange(i, "sizeValue", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    {/* Size Unit */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                      <select
                        value={variant.sizeUnit}
                        onChange={(e) => handleVariantChange(i, "sizeUnit", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="ml">ml</option>
                        <option value="li">li</option>
                        <option value="g">g</option>
                        <option value="kg">kg</option>
                      </select>
                    </div>

                    {/* Price */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹) *</label>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={variant.price}
                        onChange={(e) => handleVariantChange(i, "price", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    {/* Discount */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Discount (%)</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={variant.discountPercent}
                        onChange={(e) => handleVariantChange(i, "discountPercent", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    {/* Final Price (Read-only) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Final Price (₹)</label>
                      <input
                        type="text"
                        value={variant.finalPrice}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                      />
                    </div>

                    {/* Stock */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={variant.stock}
                        onChange={(e) => handleVariantChange(i, "stock", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    {/* Out of Stock Toggle */}
                    <div className="flex flex-col">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Stock Status</label>
                      <div className="flex items-center h-10">
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={variant.isOutOfStock}
                            onChange={(e) => handleVariantChange(i, "isOutOfStock", e.target.checked)}
                            className="sr-only"
                          />
                          <div
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              variant.isOutOfStock ? "bg-red-600" : "bg-green-600"
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                variant.isOutOfStock ? "translate-x-6" : "translate-x-1"
                              }`}
                            />
                          </div>
                          <span
                            className={`ml-2 text-sm font-medium ${
                              variant.isOutOfStock ? "text-red-600" : "text-green-600"
                            }`}
                          >
                            {variant.isOutOfStock ? "Out of Stock" : "In Stock"}
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Product Type and Keywords */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Product Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Product Type *</label>
              <select
                value={productType}
                onChange={(e) => setProductType(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Type</option>
                {availableProductTypes.map((typeOption, index) => (
                  <option key={index} value={typeOption}>
                    {typeOption}
                  </option>
                ))}
              </select>
              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  placeholder="Add new type"
                  value={newProductTypeInput}
                  onChange={(e) => setNewProductTypeInput(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === "Enter" && handleAddProductType()}
                />
                <button
                  onClick={handleAddProductType}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Add Type
                </button>
              </div>
            </div>

            {/* Keywords */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Keywords</label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  placeholder="Add keywords (e.g., masala, spice, turmeric)"
                  value={keywords}
                  onChange={handleKeywordsChange}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === "Enter" && addKeyword()}
                />
                <button
                  onClick={addKeyword}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Add
                </button>
              </div>
              {keywordsList.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {keywordsList.map((keyword, index) => (
                    <span
                      key={index}
                      className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                    >
                      {keyword}
                      <button
                        onClick={() => removeKeyword(index)}
                        className="text-red-500 hover:text-red-700 font-bold"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Product Details */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900">Product Details</h4>
              <button
                onClick={addDetailField}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                + Add Detail
              </button>
            </div>
            <div className="space-y-3">
              {detailsList.map((item, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="Label (e.g., Brand)"
                    value={item.key}
                    onChange={(e) => handleDetailChange(index, "key", e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="text"
                    placeholder="Value (e.g., Mirakle)"
                    value={item.value}
                    onChange={(e) => handleDetailChange(index, "value", e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {detailsList.length > 1 && (
                    <button
                      onClick={() => removeDetailField(index)}
                      className="text-red-600 hover:text-red-800 font-medium"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">Product Description</label>
            <textarea
              rows={5}
              placeholder="Enter product description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Image Upload */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">Product Images *</label>
            <input
              id="product-images"
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            {/* New Images Preview */}
            {images.length > 0 && (
              <div className="mt-4">
                <h5 className="text-sm font-medium text-gray-700 mb-2">New Images</h5>
                <div className="grid grid-cols-4 gap-3">
                  {images.map((img, i) => (
                    <div key={i} className="relative">
                      <img
                        src={URL.createObjectURL(img) || "/placeholder.svg"}
                        alt={`New image ${i}`}
                        className="w-full h-24 object-cover rounded-lg border"
                      />
                      <button
                        onClick={() => removeNewImage(i)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Existing Images Preview */}
            {existingImages.length > 0 && (
              <div className="mt-4">
                <h5 className="text-sm font-medium text-gray-700 mb-2">Existing Images</h5>
                <div className="grid grid-cols-4 gap-3">
                  {existingImages.map((img, i) => (
                    <div key={i} className="relative">
                      <img
                        src={img.url || "/placeholder.svg?height=100&width=100"}
                        alt={`Existing image ${i}`}
                        className="w-full h-24 object-cover rounded-lg border"
                      />
                      <button
                        onClick={() => handleImageRemove(img.public_id)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleSubmit}
              className={`px-8 py-3 rounded-lg font-medium text-white transition-colors ${
                editingProduct ? "bg-orange-600 hover:bg-orange-700" : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {editingProduct ? "Update Product" : "Create Product"}
            </button>
            {editingProduct && (
              <button
                onClick={resetForm}
                className="px-8 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Products List */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">All Products</h2>
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-80"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products
              .filter((p) => p.title.toLowerCase().includes(searchTerm.toLowerCase()))
              .map((product) => (
                <div
                  key={product._id}
                  className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow"
                >
                  <img
                    src={
                      product?.images?.others?.[0]?.url
                        ? product.images.others[0].url
                        : "/placeholder.svg?height=200&width=200"
                    }
                    alt={product.title}
                    className="w-full h-48 object-cover mb-4 rounded-lg"
                  />

                  <h3 className="text-lg font-bold text-gray-900 mb-2">{product.title}</h3>

                  {product.productType && (
                    <p className="text-sm text-gray-600 mb-3">
                      <span className="font-medium">Type:</span> {product.productType}
                    </p>
                  )}

                  {/* Variants with individual stock status */}
                  <div className="space-y-2 mb-4">
                    <h4 className="text-sm font-medium text-gray-700">Variants:</h4>
                    {product.variants?.map((v, i) => (
                      <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                        <div className="flex-1">
                          <span className="text-sm font-medium">{v.size}</span>
                          <span className="text-sm text-gray-600 ml-2">
                            ₹{v.price} {v.discountPercent > 0 && `(${v.discountPercent}% off)`}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs px-2 py-1 rounded-full font-medium ${
                              v.isOutOfStock ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                            }`}
                          >
                            {v.isOutOfStock ? "Out of Stock" : "In Stock"}
                          </span>
                          <button
                            onClick={() => toggleVariantStock(product._id, i, v.isOutOfStock)}
                            className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
                              v.isOutOfStock
                                ? "bg-green-600 text-white hover:bg-green-700"
                                : "bg-red-600 text-white hover:bg-red-700"
                            }`}
                          >
                            {v.isOutOfStock ? "Set In Stock" : "Set Out of Stock"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(product)}
                      className="flex-1 bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(product._id)}
                      className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors font-medium"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => toggleStock(product._id, product.isOutOfStock)}
                      className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors font-medium"
                    >
                      {product.isOutOfStock ? "Set In Stock" : "Set Out of Stock"}
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
