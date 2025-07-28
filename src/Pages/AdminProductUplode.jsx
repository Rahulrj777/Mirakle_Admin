import { useState, useEffect } from "react"
import axios from "axios"
import { API_BASE } from "../utils/api"
import AdminLayout from "../Componenets/AdminLayout"
import { useNavigate } from "react-router-dom"

export default function AdminProductUpload() {
  const navigate = useNavigate()
  const [name, setName] = useState("")
  const [variants, setVariants] = useState([
    { sizeValue: "", sizeUnit: "ml", price: "", discountPercent: "", finalPrice: "", stock: "" },
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

  // Enhanced token debugging
  const debugToken = () => {
    const token = localStorage.getItem("adminToken")
    console.log("=== TOKEN DEBUG INFO ===")
    console.log("Token exists:", !!token)
    console.log("Token length:", token?.length)
    console.log("Token first 50 chars:", token?.substring(0, 50))
    console.log("Token last 20 chars:", token?.substring(token.length - 20))

    if (token) {
      try {
        // Decode JWT payload (without verification)
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

  // Test the actual product endpoint instead
  const testProductEndpoint = async () => {
    const token = localStorage.getItem("adminToken")
    if (!token) {
      console.log("❌ No token found")
      return false
    }

    try {
      console.log("🧪 Testing product endpoint...")

      // Test with the actual products endpoint
      await axios.get(`${API_BASE}/api/products/all-products`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      console.log("✅ Product endpoint test successful")
      return true
    } catch (error) {
      console.error("❌ Product endpoint test failed:", error.response?.data || error.message)
      console.error("Status:", error.response?.status)
      return false
    }
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
    setVariants([{ sizeValue: "", sizeUnit: "ml", price: "", discountPercent: "", finalPrice: "", stock: "" }])
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

    // Debug token
    debugToken()

    // Skip token validation for now and go straight to the request
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

      // Let's see what the server is actually returning
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

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-4">{editingProduct ? "Edit Product" : "Upload Product"}</h2>

        {/* Enhanced Debug Panel */}
        <div className="mb-4 p-4 bg-gray-100 rounded border">
          <h3 className="font-bold mb-2">🔧 Debug Panel</h3>
          <div className="flex flex-wrap gap-2 mb-2">
            <button onClick={debugToken} className="bg-blue-500 text-white px-3 py-1 rounded text-sm">
              🔍 Debug Token
            </button>
            <button onClick={testProductEndpoint} className="bg-green-500 text-white px-3 py-1 rounded text-sm">
              🧪 Test Products API
            </button>
            <button
              onClick={() => {
                localStorage.removeItem("adminToken")
                localStorage.removeItem("admin")
                navigate("/login")
              }}
              className="bg-red-500 text-white px-3 py-1 rounded text-sm"
            >
              🔄 Force Logout
            </button>
          </div>
          <div className="text-sm text-gray-600">
            <p>Token Status: {localStorage.getItem("adminToken") ? "✅ Present" : "❌ Missing"}</p>
            <p>API Base: {API_BASE}</p>
          </div>
        </div>

        {/* Product Name */}
        <input
          type="text"
          placeholder="Product Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="p-2 border w-full mb-4"
        />

        {/* Variants */}
        {variants.map((variant, i) => (
          <div key={i} className="grid grid-cols-7 gap-2 mb-2">
            <input
              type="number"
              placeholder="Size Value"
              value={variant.sizeValue}
              onChange={(e) => handleVariantChange(i, "sizeValue", e.target.value)}
              className="p-2 border"
            />
            <select
              value={variant.sizeUnit}
              onChange={(e) => handleVariantChange(i, "sizeUnit", e.target.value)}
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
              onChange={(e) => handleVariantChange(i, "price", e.target.value)}
              className="p-2 border"
            />
            <input
              type="number"
              placeholder="Discount %"
              value={variant.discountPercent}
              onChange={(e) => handleVariantChange(i, "discountPercent", e.target.value)}
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
              onChange={(e) => handleVariantChange(i, "stock", e.target.value)}
              className="p-2 border"
            />
            {variants.length > 1 && (
              <button onClick={() => removeVariant(i)} className="text-red-500">
                Remove
              </button>
            )}
          </div>
        ))}

        <button onClick={addVariant} className="bg-blue-600 text-white px-3 py-1 mt-2 rounded">
          + Add Variant
        </button>

        {/* Product Type and Keywords Section */}
        <div className="flex flex-wrap gap-8 mt-6">
          {/* Product Type */}
          <div className="flex flex-col">
            <label className="block mb-2 font-semibold">Product Type</label>
            <select
              value={productType}
              onChange={(e) => setProductType(e.target.value)}
              className="p-2 border w-[180px] rounded"
            >
              <option value="">Select Type</option>
              {availableProductTypes.map((typeOption, index) => (
                <option key={index} value={typeOption}>
                  {typeOption}
                </option>
              ))}
            </select>
            <div className="mt-4 flex gap-2">
              <input
                type="text"
                placeholder="Add new type"
                value={newProductTypeInput}
                onChange={(e) => setNewProductTypeInput(e.target.value)}
                className="p-2 border rounded flex-1"
                onKeyPress={(e) => e.key === "Enter" && handleAddProductType()}
              />
              <button onClick={handleAddProductType} className="bg-purple-600 text-white px-4 py-2 rounded">
                Add Type
              </button>
            </div>
          </div>

          {/* Keywords */}
          <div className="flex-1">
            <label className="block mb-2 font-semibold">Search Keywords</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Add keywords (e.g., masala, spice, turmeric)"
                value={keywords}
                onChange={handleKeywordsChange}
                className="p-2 border flex-1 rounded"
                onKeyPress={(e) => e.key === "Enter" && addKeyword()}
              />
              <button onClick={addKeyword} className="bg-green-500 text-white px-4 py-2 rounded">
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
                    <button onClick={() => removeKeyword(index)} className="text-red-500 hover:text-red-700 font-bold">
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Product Details */}
        <h3 className="text-lg font-semibold mt-6 mb-2">Product Details</h3>
        {detailsList.map((item, index) => (
          <div key={index} className="grid grid-cols-3 gap-2 mb-2">
            <input
              type="text"
              placeholder="Label (e.g., Brand)"
              value={item.key}
              onChange={(e) => handleDetailChange(index, "key", e.target.value)}
              className="p-2 border"
            />
            <input
              type="text"
              placeholder="Value (e.g., Mirakle)"
              value={item.value}
              onChange={(e) => handleDetailChange(index, "value", e.target.value)}
              className="p-2 border"
            />
            {detailsList.length > 1 && (
              <button onClick={() => removeDetailField(index)} className="text-red-500">
                Remove
              </button>
            )}
          </div>
        ))}
        <button onClick={addDetailField} className="bg-blue-500 text-white px-3 py-1 rounded mb-4">
          + Add Detail
        </button>

        <textarea
          rows={5}
          placeholder="Enter product description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border p-2 mb-4"
        />

        <input
          id="product-images"
          type="file"
          multiple
          accept="image/*"
          onChange={handleImageChange}
          className="mt-4"
        />

        {/* New Images Preview */}
        {images.length > 0 && (
          <div className="grid grid-cols-4 gap-2 mt-4">
            {images.map((img, i) => (
              <div key={i} className="relative">
                <img
                  src={URL.createObjectURL(img) || "/placeholder.svg"}
                  alt={`New image ${i}`}
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

        {/* Existing Images Preview */}
        {existingImages.length > 0 && (
          <div className="grid grid-cols-4 gap-2 mt-4">
            {existingImages.map((img, i) => (
              <div key={i} className="relative">
                <img
                  src={img.url || "/placeholder.svg?height=100&width=100"}
                  alt={`Existing image ${i}`}
                  className="w-full h-24 object-cover rounded"
                />
                <button
                  onClick={() => handleImageRemove(img.public_id)}
                  className="absolute top-0 right-0 bg-red-500 text-white text-xs px-1"
                >
                  X
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Submit Buttons */}
        <button
          onClick={handleSubmit}
          className={`mt-6 ${editingProduct ? "bg-orange-500" : "bg-green-600"} text-white px-4 py-2 rounded`}
        >
          {editingProduct ? "Update Product" : "Upload Product"}
        </button>

        {editingProduct && (
          <button onClick={resetForm} className="ml-4 bg-gray-500 text-white px-4 py-2 rounded">
            Cancel
          </button>
        )}

        {/* Products List */}
        <h2 className="text-xl font-semibold mt-10 mb-4">All Products</h2>
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="p-2 border w-full mb-4"
        />

        <div className="grid md:grid-cols-3 gap-4">
          {products
            .filter((p) => p.title.toLowerCase().includes(searchTerm.toLowerCase()))
            .map((product) => (
              <div key={product._id} className="border p-4 rounded shadow">
                <img
                  src={
                    product?.images?.others?.[0]?.url
                      ? product.images.others[0].url
                      : "/placeholder.svg?height=150&width=150"
                  }
                  alt={product.title}
                  className="w-full h-40 object-cover mb-2 rounded"
                />
                <h3 className="text-lg font-bold">{product.title}</h3>
                {product.productType && (
                  <p className="text-sm text-gray-700 mb-1">
                    <span className="font-semibold">Type:</span> {product.productType}
                  </p>
                )}
                {product.variants?.map((v, i) => (
                  <p key={i} className="text-sm">
                    {v.size} - ₹{v.price} ({v.discountPercent || 0}% off)
                  </p>
                ))}
                <div className="flex gap-2 mt-3">
                  <button onClick={() => handleEdit(product)} className="bg-yellow-500 text-white px-3 py-1 rounded">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(product._id)} className="bg-red-500 text-white px-3 py-1 rounded">
                    Delete
                  </button>
                  <button
                    onClick={() => toggleStock(product._id, product.isOutOfStock)}
                    className="bg-blue-500 text-white px-3 py-1 rounded"
                  >
                    {product.isOutOfStock ? "Set In Stock" : "Set Out of Stock"}
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>
    </AdminLayout>
  )
}
