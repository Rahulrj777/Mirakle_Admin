import { useState, useEffect } from "react"
import axios from "axios"
import { API_BASE } from "../utils/api"

export default function AdminProductUpload() {
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

  const productTypes = ["Oil", "Seasonings", "Sauce", "Beverages", "Snacks", "Others"]

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/products/all-products`)
      setProducts(res.data)
    } catch (err) {
      console.error("Fetch error:", err)
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
    const fileInput = document.getElementById("product-images")
    if (fileInput) fileInput.value = ""
  }

  const handleImageChange = (e) => {
    if (e.target.files) {
      setImages([...images, ...Array.from(e.target.files)])
    }
  }

  const handleImageRemove = (imgPath) => {
    setRemovedImages((prev) => [...prev, imgPath])
    setExistingImages((prev) => prev.filter((img) => img !== imgPath))
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

  const handleSubmit = async () => {
    console.log("🔘 Submit button clicked")
    if (!name || variants.some((v) => !v.sizeValue || !v.price)) {
      alert("Product name and current price are required")
      console.warn("❌ Validation failed", { name, variants })
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
    formData.append("name", name) // Backend expects 'name' for title
    formData.append("variants", JSON.stringify(preparedVariants))
    formData.append("description", description)
    formData.append("details", JSON.stringify(detailsObject))
    formData.append("keywords", JSON.stringify(keywordsList))
    formData.append("productType", productType)


    images.forEach((img) => formData.append("images", img)) // Append new images

    const token = localStorage.getItem("authToken") // or sessionStorage.getItem("authToken");

    console.log("--- Submitting Product Data ---")
    console.log("Name:", name)
    console.log("Variants:", preparedVariants)
    console.log("Description:", description)
    console.log("Details:", detailsObject)
    console.log("Keywords:", keywordsList)
    console.log("New Images Count:", images.length)
    console.log("Existing Images to Remove Count:", removedImages.length)
    if (editingProduct) {
      console.log("Editing Product ID:", editingProduct._id)
      formData.append("removedImages", JSON.stringify(removedImages)) // Send removed images for update
    }
    console.log("Token:", token ? "Present" : "Missing")
    console.log("-----------------------------")

    if (!token) {
      alert("Authentication token is missing. Please log in.")
      return
    }

    try {
      let res
      if (editingProduct) {
        // Update existing product
        res = await axios.put(
          `${API_BASE}/api/products/${editingProduct._id}`, // Corrected endpoint for update
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${token}`,
            },
          },
        )
        alert("✅ Product updated")
        console.log("🟢 Updated:", res.data)
      } else {
        // Upload new product
        res = await axios.post(
          `${API_BASE}/api/products/upload-product`, // Corrected endpoint for new product
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${token}`,
            },
          },
        )
        alert("✅ Product uploaded")
        console.log("🟢 Uploaded:", res.data)
      }
      resetForm()
      fetchProducts() // Refresh product list after operation
    } catch (err) {
      console.error("❌ Operation error:", err.response?.data || err.message)
      alert(err.response?.data?.message || "Operation failed")
    }
  }

  const handleEdit = (product) => {
    setEditingProduct(product)
    setName(product.title)
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
    setExistingImages(product.images?.others || [])
    setDetailsList(Object.entries(product.details || {}).map(([key, value]) => ({ key, value: String(value) })))
    setDescription(product.description || "")
    setKeywordsList(product.keywords || []) // Load existing keywords
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE}/api/products/${id}`)
      fetchProducts()
    } catch (err) {
      alert("Delete failed")
    }
  }

  const toggleStock = async (id, currentStatus) => {
    try {
      await axios.put(`${API_BASE}/api/products/${id}/toggle-stock`, {
        isOutOfStock: !currentStatus,
      })
      fetchProducts()
    } catch (err) {
      alert("Stock update failed")
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">{editingProduct ? "Edit Product" : "Upload Product"}</h2>
      <input
        type="text"
        placeholder="Product Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="p-2 border w-full mb-4"
      />
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

      <div className="flex content-between items-center">
        {/*🚨 NEW: Product Type Selection */}
        <label className="block mb-2 mt-6 font-semibold">Product Type</label>
          <select
            value={productType}
            onChange={(e) => setProductType(e.target.value)}
            className="p-2 border w-[150px] "
          >
            <option value="">Select Type</option>
            {productTypes.map((type, index) => (
              <option key={index} value={type}>
                {type}
              </option>
            ))}
          </select>

        {/* 🚨 NEW: Keywords Section */}
        <h3 className="text-lg font-semibold mt-6 mb-2">Search Keywords</h3>
        <div className="mb-4">
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              placeholder="Add keywords (e.g., masala, spice, turmeric) - separate with commas"
              value={keywords}
              onChange={handleKeywordsChange}
              className="p-2 border flex-1"
              onKeyPress={(e) => e.key === "Enter" && addKeyword()}
            />
            <button onClick={addKeyword} className="bg-green-500 text-white px-4 py-2 rounded">
              Add Keywords
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
          <p className="text-sm text-gray-600 mt-2">
            💡 <strong>Examples:</strong> For "Turmeric Powder" add keywords like: turmeric, haldi, masala, spice, powder,
            yellow, cooking
          </p>
        </div>
      </div>

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
        className="w-full border p-2"
      />
      <input id="product-images" type="file" multiple accept="image/*" onChange={handleImageChange} className="mt-4" />
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
      {existingImages.length > 0 && (
        <div className="grid grid-cols-4 gap-2 mt-4">
          {existingImages.map((img, i) => (
            <div key={i} className="relative">
              <img src={`${API_BASE}${img}`} alt={`Existing image ${i}`} className="w-full h-24 object-cover rounded" />
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
        className={`mt-6 ${editingProduct ? "bg-orange-500" : "bg-green-600"} text-white px-4 py-2 rounded`}
      >
        {editingProduct ? "Update Product" : "Upload Product"}
      </button>
      {editingProduct && (
        <button onClick={resetForm} className="ml-4 bg-gray-500 text-white px-4 py-2 rounded">
          Cancel
        </button>
      )}
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
                  product?.images?.others?.[0]
                    ? `${API_BASE}${product.images.others[0]}`
                    : "/placeholder.svg?height=150&width=150" // Using v0 placeholder
                }
                alt={product.title}
                className="w-full h-40 object-cover mb-2 rounded"
              />
              <h3 className="text-lg font-bold">{product.title}</h3>
              {/* 🚨 NEW: Display keywords */}
              {product.keywords && product.keywords.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs text-gray-600 mb-1">Keywords:</p>
                  <div className="flex flex-wrap gap-1">
                    {product.keywords.slice(0, 5).map((keyword, i) => (
                      <span key={i} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                        {keyword}
                      </span>
                    ))}
                    {product.keywords.length > 5 && (
                      <span className="text-xs text-gray-500">+{product.keywords.length - 5} more</span>
                    )}
                  </div>
                </div>
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
  )
}
