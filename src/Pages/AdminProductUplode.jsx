import { useState, useEffect } from "react"
import axios from "axios"
import { API_BASE } from "../utils/api"
import AdminLayout from "../Componenets/AdminLayout"
import { useNavigate } from "react-router-dom"

export default function AdminProductUpload() {
  const navigate = useNavigate()
  const [name, setName] = useState("")
  const [variants, setVariants] = useState([
    {
      sizeValue: "",
      sizeUnit: "ml",
      price: "",
      discountPercent: "",
      finalPrice: "",
      stock: "",
      isOutOfStock: false,
      images: [],
    },
  ])
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
  const [loadingMap, setLoadingMap] = useState({})

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
      {
        sizeValue: "",
        sizeUnit: "ml",
        price: "",
        discountPercent: "",
        finalPrice: "",
        stock: "",
        isOutOfStock: false,
        images: [],
      },
    ])
    setEditingProduct(null)
    setDetailsList([{ key: "", value: "" }])
    setDescription("")
    setKeywords("")
    setKeywordsList([])
    setProductType("")
  }

  // Force migrate product images
  const forceImageMigration = async (productId) => {
    try {
      const token = localStorage.getItem("adminToken")
      console.log("🔄 FORCE migrating product:", productId)
      const response = await axios.post(
        `${API_BASE}/api/products/migrate-images/${productId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      )
      console.log("🔄 FORCE Migration result:", response.data)
      return response.data.product || null
    } catch (err) {
      console.error("❌ FORCE Migration failed:", err)
      return null
    }
  }

  const handleVariantImageChange = (variantIndex, e) => {
    if (e.target.files) {
      const newImages = Array.from(e.target.files)
      setVariants((prev) => {
        const updated = [...prev]
        updated[variantIndex].images = [...(updated[variantIndex].images || []), ...newImages]
        return updated
      })
    }
  }

  const removeVariantImage = (variantIndex, imageIndex) => {
    setVariants((prev) => {
      const updated = [...prev]
      updated[variantIndex].images.splice(imageIndex, 1)
      return updated
    })
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
        images: [],
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

    if (!name || variants.some((v) => !v.sizeValue || !v.price)) {
      alert("Product name and current price are required")
      return
    }
    if (!productType) {
      alert("Please select a product type.")
      return
    }

    if (!editingProduct) {
      const hasVariantImages = variants.some((v) => v.images && v.images.length > 0)
      if (!hasVariantImages) {
        alert("Please upload at least one image for at least one variant.")
        return
      }
    }

    try {
      const detailsObject = {}
      detailsList.forEach((item) => {
        if (item.key && item.value) {
          detailsObject[item.key] = item.value
        }
      })

      const formData = new FormData()
      formData.append("name", name)
      formData.append("description", description)
      formData.append("details", JSON.stringify(detailsObject))
      formData.append("keywords", JSON.stringify(keywordsList))
      formData.append("productType", productType)

      const preparedVariants = variants.map((v, variantIndex) => {
        if (v.images && v.images.length > 0) {
          v.images.forEach((img, imgIndex) => {
            if (typeof img === "object" && img.constructor === File) {
              formData.append(`variant_${variantIndex}_image_${imgIndex}`, img)
            }
          })
        }

        return {
          size: `${v.sizeValue}${v.sizeUnit}`,
          price: Number.parseFloat(v.price),
          discountPercent: Number.parseFloat(v.discountPercent),
          stock: Number.parseInt(v.stock),
          isOutOfStock: Boolean(v.isOutOfStock),
        }
      })

      formData.append("variants", JSON.stringify(preparedVariants))

      const token = localStorage.getItem("adminToken")
      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
        timeout: 30000,
      }

      let res
      if (editingProduct) {
        res = await axios.put(`${API_BASE}/api/products/update/${editingProduct._id}`, formData, config)
        alert("✅ Product updated successfully!")
      } else {
        res = await axios.post(`${API_BASE}/api/products/upload-product`, formData, config)
        alert("✅ Product uploaded successfully!")
      }

      resetForm()
      fetchProducts()
    } catch (err) {
      console.error("❌ Operation error:", err.response?.data || err.message)
      if (err.response?.status === 401) {
        alert("Your session has expired. Please log in again.")
        localStorage.removeItem("adminToken")
        localStorage.removeItem("admin")
        navigate("/login")
      } else {
        alert(err.response?.data?.message || "Operation failed. Please try again.")
      }
    }
  }

  const handleEdit = async (product) => {
    console.log("🔍 Editing product:", product)
    console.log("🔍 Product common images:", product.images?.others?.length || 0)
    console.log(
      "🔍 Product variants:",
      product.variants?.map((v, i) => ({ index: i, size: v.size, imageCount: v.images?.length || 0 })),
    )

    // ALWAYS try to force migrate if there are common images
    let productToEdit = product
    if (product.images?.others?.length > 0) {
      console.log("🔄 Product has common images - FORCE migrating...")
      const migratedProduct = await forceImageMigration(product._id)
      if (migratedProduct) {
        productToEdit = migratedProduct
        console.log("✅ Product FORCE migrated successfully")
        console.log(
          "🔍 Migrated product variants:",
          migratedProduct.variants.map((v) => ({
            size: v.size,
            imageCount: v.images?.length || 0,
            images: v.images,
          })),
        )
        // Refresh the products list to show updated data
        await fetchProducts()
      } else {
        console.log("❌ FORCE migration failed, using original product")
      }
    }

    setEditingProduct(productToEdit)
    setName(productToEdit.title)
    setProductType(productToEdit.productType || "")

    const parsedVariants = productToEdit.variants
      .map((v, index) => {
        const match = v.size.match(/^([\d.]+)([a-zA-Z]+)$/)
        if (!match) return null
        const [, sizeValue, sizeUnit] = match

        // Handle images - they should now be properly migrated
        const existingImages = v.images || []
        console.log(`🔍 Variant ${index} (${v.size}) has ${existingImages.length} images:`, existingImages)

        return {
          sizeValue,
          sizeUnit,
          price: v.price,
          discountPercent: v.discountPercent || "",
          finalPrice: (v.price - (v.price * (v.discountPercent || 0)) / 100).toFixed(2),
          stock: v.stock,
          isOutOfStock: v.isOutOfStock || false,
          images: existingImages,
        }
      })
      .filter(Boolean)

    console.log(
      "🔍 Final parsed variants for editing:",
      parsedVariants.map((v) => ({
        size: `${v.sizeValue}${v.sizeUnit}`,
        imageCount: v.images?.length || 0,
      })),
    )

    setVariants(parsedVariants)
    setDetailsList(Object.entries(productToEdit.details || {}).map(([key, value]) => ({ key, value: String(value) })))
    setDescription(productToEdit.description || "")
    setKeywordsList(productToEdit.keywords || [])
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

  const toggleVariantStock = async (productId, variantIndex, currentStatus) => {
    const key = `variant-${productId}-${variantIndex}`
    if (loadingMap[key]) return
    setLoadingMap((prev) => ({ ...prev, [key]: true }))
    try {
      const token = localStorage.getItem("adminToken")
      await axios.put(
        `${API_BASE}/api/products/toggle-variant-stock/${productId}`,
        { variantIndex, isOutOfStock: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      alert("Variant stock updated!")
      fetchProducts()
    } catch (err) {
      alert("Failed to update variant stock.")
      console.error(err)
    } finally {
      setLoadingMap((prev) => ({ ...prev, [key]: false }))
    }
  }

  // Helper function to get display image for a product
  const getProductDisplayImage = (product) => {
    // First try variant images
    if (product?.variants?.[0]?.images?.[0]?.url) {
      return product.variants[0].images[0].url
    }
    // Fallback to common images (for old products)
    if (product?.images?.others?.[0]?.url) {
      return product.images.others[0].url
    }
    return "/placeholder.svg?height=200&width=200"
  }

  const getImageSrc = (img) => {
    if (!img) return "/placeholder.svg"

    if (isFileObject(img)) {
      return URL.createObjectURL(img)
    }

    // Handle both string URLs and object with url property
    if (typeof img === "string") {
      return img
    }

    return img.url || "/placeholder.svg"
  }

  const isFileObject = (img) => {
    return typeof img === "object" && img.constructor === File
  }

  // Bulk migrate all products
  const handleBulkMigration = async () => {
    if (
      !window.confirm(
        "This will fix the database structure and migrate ALL products to support variant images. Continue?",
      )
    )
      return

    try {
      const token = localStorage.getItem("adminToken")
      console.log("🔄 Starting database structure fix...")

      const response = await axios.post(
        `${API_BASE}/api/products/fix-database-structure`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      )

      console.log("🔄 Database fix result:", response.data)
      alert(
        `✅ Database structure fixed successfully!\n${response.data.fixedCount} products updated\n${response.data.errorCount} errors\n\nAll variants now support images!`,
      )

      // Refresh products list
      await fetchProducts()
    } catch (err) {
      console.error("❌ Database structure fix failed:", err)
      alert("❌ Database structure fix failed: " + (err.response?.data?.message || err.message))
    }
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {editingProduct ? "Edit Product" : "Add New Product"}
                </h1>
                <p className="text-gray-600 mt-1">
                  {editingProduct
                    ? "Update product information and manage variants"
                    : "Create a new product with variants and details"}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleBulkMigration}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  🔧 Fix Database Structure
                </button>
                {editingProduct && (
                  <button
                    onClick={resetForm}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Product Form */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Product Information</h2>

            {/* Product Name */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
              <input
                type="text"
                placeholder="Enter product name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Variants Section */}
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Product Variants</h3>
                <button
                  onClick={addVariant}
                  className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 w-fit"
                >
                  <span>+</span>
                  Add Variant
                </button>
              </div>
              <div className="space-y-4">
                {variants.map((variant, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-gray-900">Variant {i + 1}</h4>
                      {variants.length > 1 && (
                        <button
                          onClick={() => removeVariant(i)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Stock Status</label>
                        <div className="flex items-center gap-3">
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
                              className={`ml-3 text-sm font-medium ${
                                variant.isOutOfStock ? "text-red-600" : "text-green-600"
                              }`}
                            >
                              {variant.isOutOfStock ? "Out of Stock" : "In Stock"}
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Variant-specific Image Upload */}
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Variant {i + 1} Images {!editingProduct && "*"}
                      </label>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => handleVariantImageChange(i, e)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      {/* Variant Images Preview */}
                      {variant.images && variant.images.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm text-gray-600 mb-2">
                            Current Images ({variant.images.length}):
                            {editingProduct && (
                              <span className="ml-2 text-xs text-green-600">✅ Migrated from common images</span>
                            )}
                          </p>
                          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                            {variant.images.map((img, imgIndex) => (
                              <div key={imgIndex} className="relative">
                                <img
                                  src={getImageSrc(img) || "/placeholder.svg"}
                                  alt={`Variant ${i + 1} image ${imgIndex + 1}`}
                                  className="w-full h-20 object-cover rounded-lg border"
                                  onError={(e) => {
                                    console.error("Image load error:", e)
                                    e.target.src = "/placeholder.svg"
                                  }}
                                />
                                <button
                                  onClick={() => removeVariantImage(i, imgIndex)}
                                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                                  title="Remove image"
                                >
                                  ×
                                </button>
                                {/* Show indicator for existing vs new images */}
                                <div className="absolute bottom-1 left-1">
                                  <span
                                    className={`text-xs px-1 py-0.5 rounded text-white ${
                                      isFileObject(img) ? "bg-green-500" : "bg-blue-500"
                                    }`}
                                  >
                                    {isFileObject(img) ? "New" : "Saved"}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Product Details</h3>
                <button
                  onClick={addDetailField}
                  className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors w-fit"
                >
                  + Add Detail
                </button>
              </div>
              <div className="space-y-3">
                {detailsList.map((item, index) => (
                  <div key={index} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
                        className="text-red-600 hover:text-red-800 font-medium px-3 py-2"
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
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleSubmit}
                className={`px-8 py-3 rounded-xl font-medium text-white transition-colors ${
                  editingProduct ? "bg-orange-600 hover:bg-orange-700" : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {editingProduct ? "Update Product" : "Create Product"}
              </button>
              {editingProduct && (
                <button
                  onClick={resetForm}
                  className="px-8 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>

          {/* Products List */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <h2 className="text-2xl font-bold text-gray-900">All Products</h2>
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-80"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {products
                .filter((p) => p.title.toLowerCase().includes(searchTerm.toLowerCase()))
                .map((product) => (
                  <div
                    key={product._id}
                    className="border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-200 bg-white"
                  >
                    <img
                      src={getProductDisplayImage(product) || "/placeholder.svg"}
                      alt={product.title}
                      className="w-full h-48 object-cover mb-4 rounded-xl"
                    />
                    <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">{product.title}</h3>
                    {product.productType && (
                      <p className="text-sm text-gray-600 mb-4">
                        <span className="font-medium">Type:</span> {product.productType}
                      </p>
                    )}

                    {/* Show migration status - Enhanced to show FORCE migration needed */}
                    {product.images?.others?.length > 0 && (
                      <div className="mb-3 p-2 bg-orange-50 border border-orange-200 rounded-lg">
                        <p className="text-xs text-orange-700">
                          🔄 This product has common images that will be FORCE migrated to variants when edited.
                        </p>
                      </div>
                    )}

                    <div className="space-y-3 mb-6">
                      <h4 className="text-sm font-medium text-gray-700">Variants:</h4>
                      {product.variants?.map((v, i) => (
                        <div key={i} className="bg-gray-50 rounded-xl p-3">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                            <div className="flex-1">
                              <span className="text-sm font-medium">{v.size}</span>
                              <span className="text-sm text-gray-600 ml-2">
                                ₹{v.price} {v.discountPercent > 0 && `(${v.discountPercent}% off)`}
                              </span>
                            </div>
                            <span
                              className={`text-xs px-2 py-1 rounded-full font-medium w-fit ${
                                v.isOutOfStock ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                              }`}
                            >
                              {v.isOutOfStock ? "Out of Stock" : "In Stock"}
                            </span>
                          </div>
                          {/* Show variant images if available */}
                          {v.images && v.images.length > 0 && (
                            <div className="mb-3">
                              <p className="text-xs text-gray-500 mb-2">Variant Images:</p>
                              <div className="flex gap-1 overflow-x-auto">
                                {v.images.slice(0, 3).map((img, imgIndex) => (
                                  <img
                                    key={imgIndex}
                                    src={img.url || "/placeholder.svg"}
                                    alt={`Variant ${i + 1} image ${imgIndex + 1}`}
                                    className="w-12 h-12 object-cover rounded border flex-shrink-0"
                                  />
                                ))}
                                {v.images.length > 3 && (
                                  <div className="w-12 h-12 bg-gray-200 rounded border flex items-center justify-center text-xs text-gray-500">
                                    +{v.images.length - 3}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          <button
                            disabled={loadingMap[`variant-${product._id}-${i}`]}
                            onClick={() => toggleVariantStock(product._id, i, v.isOutOfStock)}
                            className={`w-full text-xs px-3 py-2 rounded-lg font-medium transition-colors ${
                              v.isOutOfStock
                                ? "bg-green-600 text-white hover:bg-green-700"
                                : "bg-red-600 text-white hover:bg-red-700"
                            }`}
                          >
                            {v.isOutOfStock ? "Set In Stock" : "Set Out of Stock"}
                          </button>
                        </div>
                      ))}
                    </div>
                    {/* Action Buttons - Column Layout */}
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleEdit(product)}
                        className="w-full bg-yellow-500 text-white px-4 py-2 rounded-xl hover:bg-yellow-600 transition-colors font-medium"
                      >
                        Edit {product.images?.others?.length > 0 && "(Will Force Migrate)"}
                      </button>
                      <button
                        onClick={() => handleDelete(product._id)}
                        className="w-full bg-red-500 text-white px-4 py-2 rounded-xl hover:bg-red-600 transition-colors font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
            </div>
            {products.filter((p) => p.title.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">📦</div>
                <p className="text-gray-500 text-lg">No products found</p>
                <p className="text-gray-400 text-sm mt-2">Try adjusting your search terms</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
