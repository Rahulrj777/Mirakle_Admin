"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import SparkMD5 from "spark-md5"
import { API_BASE } from "../utils/api"

const AdminBannerUpload = () => {
  const [image, setImage] = useState(null)
  const [type, setType] = useState("slider")
  const [banners, setBanners] = useState([])
  const [products, setProducts] = useState([])
  const [selectedProductId, setSelectedProductId] = useState("")
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0)
  const [editingBanner, setEditingBanner] = useState(null)
  const [productSearchTerm, setProductSearchTerm] = useState("")

  const computeFileHash = (file) => {
    return new Promise((resolve, reject) => {
      const chunkSize = 2097152
      const spark = new SparkMD5.ArrayBuffer()
      const fileReader = new FileReader()
      let cursor = 0

      fileReader.onload = (e) => {
        spark.append(e.target.result)
        cursor += chunkSize
        if (cursor < file.size) {
          readNext()
        } else {
          resolve(spark.end())
        }
      }

      fileReader.onerror = () => reject("File reading error")

      function readNext() {
        const slice = file.slice(cursor, cursor + chunkSize)
        fileReader.readAsArrayBuffer(slice)
      }

      readNext()
    })
  }

  const fetchBanners = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/banners`)
      setBanners(res.data)
    } catch (err) {
      console.error("Failed to fetch banners:", err)
    }
  }

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/products/all-products`)
      setProducts(res.data)
    } catch (err) {
      console.error("Failed to fetch products:", err)
    }
  }

  useEffect(() => {
    fetchBanners()
    fetchProducts()
  }, [])

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      alert("Only image files are allowed")
      return
    }

    setImage(file)
  }

  const resetForm = () => {
    setImage(null)
    setSelectedProductId("")
    setSelectedVariantIndex(0)
    setEditingBanner(null)
    setProductSearchTerm("")
    const fileInput = document.getElementById("banner-file")
    if (fileInput) fileInput.value = ""
  }

  const getSelectedProduct = () => {
    return products.find((p) => p._id === selectedProductId)
  }

  const getSelectedVariant = () => {
    const product = getSelectedProduct()
    return product?.variants?.[selectedVariantIndex]
  }

  // Filter products based on search term
  const filteredProducts = products.filter((product) =>
    product.title.toLowerCase().includes(productSearchTerm.toLowerCase()),
  )

  const handleUpload = async () => {
    if (type === "all") {
      alert("Cannot upload when 'Show All' is selected")
      return
    }

    const formData = new FormData()
    formData.append("type", type)

    // Handle product-based banners
    if (type === "product-type" || type === "side") {
      if (!selectedProductId) {
        alert("Please select a product")
        return
      }

      const product = getSelectedProduct()
      const variant = getSelectedVariant()

      if (!product || !variant) {
        alert("Invalid product or variant selection")
        return
      }

      formData.append("productId", selectedProductId)
      formData.append("selectedVariantIndex", selectedVariantIndex.toString())
      formData.append("productImageUrl", product.images?.others?.[0] || "")
      formData.append("title", product.title)
      formData.append("price", variant.price.toString())
      formData.append("discountPercent", (variant.discountPercent || 0).toString())

      // Calculate old price if discount exists
      if (variant.discountPercent > 0) {
        const oldPrice = variant.price / (1 - variant.discountPercent / 100)
        formData.append("oldPrice", oldPrice.toFixed(2))
      }

      // Extract weight from variant size
      const sizeMatch = variant.size.match(/^([\d.]+)([a-zA-Z]+)$/)
      if (sizeMatch) {
        formData.append("weightValue", sizeMatch[1])
        formData.append("weightUnit", sizeMatch[2])
      }
    } else {
      // Handle regular banners (slider, offer)
      if (!image) {
        alert("Please select an image")
        return
      }

      const hash = await computeFileHash(image)
      formData.append("image", image)
      formData.append("hash", hash)
    }

    try {
      if (editingBanner) {
        await axios.put(`${API_BASE}/api/banners/${editingBanner._id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        })
        alert("Banner updated successfully")
      } else {
        await axios.post(`${API_BASE}/api/banners/upload`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        })
        alert("Banner uploaded successfully")
      }

      fetchBanners()
      resetForm()
    } catch (err) {
      console.error("Upload error:", err)
      alert(err.response?.data?.message || "Upload failed")
    }
  }

  const handleEdit = (banner) => {
    setEditingBanner(banner)
    setType(banner.type)
    setSelectedProductId(banner.productId || "")
    setSelectedVariantIndex(banner.selectedVariantIndex || 0)
    setImage(null)
    const fileInput = document.getElementById("banner-file")
    if (fileInput) fileInput.value = ""
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this banner?")) {
      try {
        await axios.delete(`${API_BASE}/api/banners/${id}`)
        fetchBanners()
        alert("Banner deleted successfully")
      } catch (err) {
        alert("Failed to delete banner")
      }
    }
  }

  const selectedProduct = getSelectedProduct()
  const selectedVariant = getSelectedVariant()

  // Get uploaded products for display
  const getUploadedProducts = () => {
    const productBanners = banners.filter((b) => b.type === "product-type" || b.type === "side")
    const uploadedProductIds = [...new Set(productBanners.map((b) => b.productId))]
    return products.filter((p) => uploadedProductIds.includes(p._id))
  }

  const uploadedProducts = getUploadedProducts()

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Admin Banner Upload Panel</h2>

      <select
        value={type}
        onChange={(e) => setType(e.target.value)}
        className={`border p-2 w-full mb-4 ${editingBanner ? "bg-gray-100 cursor-not-allowed" : ""}`}
        disabled={!!editingBanner}
      >
        <option value="all">Show All (View Only)</option>
        <option value="slider">Banner</option>
        <option value="side">Top Selling Product's</option>
        <option value="offer">Offer Zone</option>
        <option value="product-type">Our Special Product's</option>
      </select>

      {type !== "all" && (
        <div className="bg-white shadow p-4 rounded mb-6">
          {/* Product Selection for product-related banners */}
          {(type === "product-type" || type === "side") && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Select Product:</label>

              {/* Product Search */}
              <input
                type="text"
                placeholder="Search products..."
                value={productSearchTerm}
                onChange={(e) => setProductSearchTerm(e.target.value)}
                className="mb-2 p-2 border w-full rounded"
              />

              <select
                value={selectedProductId}
                onChange={(e) => {
                  setSelectedProductId(e.target.value)
                  setSelectedVariantIndex(0)
                }}
                className="mb-2 p-2 border w-full"
                size="5"
              >
                <option value="">-- Select a Product --</option>
                {filteredProducts.map((product) => (
                  <option key={product._id} value={product._id}>
                    {product.title}
                  </option>
                ))}
              </select>

              {/* Variant Selection */}
              {selectedProduct && selectedProduct.variants?.length > 1 && (
                <div className="mb-2">
                  <label className="block text-sm font-medium mb-1">Select Variant:</label>
                  <select
                    value={selectedVariantIndex}
                    onChange={(e) => setSelectedVariantIndex(Number.parseInt(e.target.value))}
                    className="p-2 border w-full"
                  >
                    {selectedProduct.variants.map((variant, index) => (
                      <option key={index} value={index}>
                        {variant.size} - ₹{variant.price}
                        {variant.discountPercent > 0 && ` (${variant.discountPercent}% off)`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Product Preview */}
              {selectedProduct && selectedVariant && (
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
            </div>
          )}

          {/* Image Upload only for non-product banners */}
          {(type === "slider" || type === "offer") && (
            <>
              <input id="banner-file" type="file" accept="image/*" onChange={handleImageChange} className="mb-4" />

              {image && (
                <img
                  src={URL.createObjectURL(image) || "/placeholder.svg"}
                  alt="Preview"
                  className="mb-4 w-full h-64 object-cover rounded border"
                />
              )}
            </>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleUpload}
              className={`text-white px-4 py-2 rounded ${editingBanner ? "bg-orange-500" : "bg-green-600"}`}
            >
              {editingBanner ? "Update Banner" : "Upload Banner"}
            </button>
            {editingBanner && (
              <button onClick={resetForm} className="bg-gray-400 text-white px-4 py-2 rounded">
                Cancel
              </button>
            )}
          </div>
        </div>
      )}

      {/* Show Uploaded Products instead of search */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Uploaded Banners</h3>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        {banners
          .filter((b) => type === "all" || b.type === type)
          .map((banner) => (
            <div key={banner._id} className="border p-3 rounded shadow relative">
              <div className="relative">
                <img
                  src={`${API_BASE}${banner.imageUrl}`}
                  alt={banner.title || banner.type}
                  className="w-full h-40 object-cover rounded mb-2"
                />
                {banner.discountPercent > 0 && (
                  <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md">
                    {banner.discountPercent}% OFF
                  </span>
                )}
              </div>

              {banner.title && <div className="text-sm text-center font-medium mt-1">{banner.title}</div>}

              {(banner.type === "product-type" || banner.type === "side") && banner.price > 0 && (
                <div className="text-center text-sm mt-1">
                  <span className="text-green-700 font-semibold">
                    ₹ {Number.parseFloat(banner.price || 0).toFixed(0)}
                  </span>
                  {banner.oldPrice > 0 && (
                    <span className="text-gray-400 line-through ml-2 text-xs">
                      ₹ {Number.parseFloat(banner.oldPrice).toFixed(0)}
                    </span>
                  )}
                </div>
              )}

              {banner.weight?.value > 0 && (
                <div className="text-gray-500 text-center text-xs">
                  {banner.weight.value} {banner.weight.unit}
                </div>
              )}

              <div className="flex justify-between mt-3">
                <button
                  onClick={() => handleEdit(banner)}
                  className="bg-yellow-500 text-white px-3 py-1 text-sm rounded"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(banner._id)}
                  className="bg-red-500 text-white px-3 py-1 text-sm rounded"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}

export default AdminBannerUpload
