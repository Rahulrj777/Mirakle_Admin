"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { API_BASE } from "../utils/api"

const AdminBannerUpload = () => {
  const [banners, setBanners] = useState([])
  const [products, setProducts] = useState([])
  const [selectedType, setSelectedType] = useState("slider")
  const [selectedFile, setSelectedFile] = useState(null)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0)
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    fetchBanners()
    fetchProducts()
  }, [])

  const fetchBanners = async () => {
    try {
      console.log("Fetching banners from:", `${API_BASE}/api/banners`)
      const res = await axios.get(`${API_BASE}/api/banners`)
      console.log("Banners fetched:", res.data.length)
      setBanners(res.data)
    } catch (err) {
      console.error("Failed to fetch banners:", err)
      alert("Failed to fetch banners: " + (err.response?.data?.message || err.message))
    }
  }

  const fetchProducts = async () => {
    try {
      console.log("Fetching products from:", `${API_BASE}/api/products/all-products`)
      const res = await axios.get(`${API_BASE}/api/products/all-products`)
      console.log("Products fetched:", res.data.length)
      setProducts(res.data)
    } catch (err) {
      console.error("Failed to fetch products:", err)
      alert("Failed to fetch products: " + (err.response?.data?.message || err.message))
    }
  }

  const calculateHash = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const arrayBuffer = e.target.result
        const hashArray = Array.from(new Uint8Array(arrayBuffer))
        const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
        resolve(hashHex.substring(0, 32))
      }
      reader.readAsArrayBuffer(file)
    })
  }

  const handleUpload = async () => {
    if (!selectedType) {
      alert("Please select a banner type")
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append("type", selectedType)

      if (selectedType === "product-type" || selectedType === "side") {
        // Product-based banner
        if (!selectedProduct) {
          alert("Please select a product")
          setIsUploading(false)
          return
        }

        console.log("Uploading product banner:", {
          productId: selectedProduct._id,
          productTitle: selectedProduct.title,
          variantIndex: selectedVariantIndex,
        })

        const selectedVariant = selectedProduct.variants[selectedVariantIndex]
        const discountPercent = selectedVariant?.discountPercent || 0
        const price = selectedVariant?.price || 0
        const oldPrice = discountPercent > 0 ? price / (1 - discountPercent / 100) : price

        // Extract size info
        const sizeMatch = selectedVariant?.size?.match(/^([\d.]+)([a-zA-Z]+)$/)
        const weightValue = sizeMatch ? sizeMatch[1] : ""
        const weightUnit = sizeMatch ? sizeMatch[2] : ""

        formData.append("productId", selectedProduct._id)
        formData.append("selectedVariantIndex", selectedVariantIndex.toString())
        formData.append("productImageUrl", selectedProduct.images?.others?.[0] || "")
        formData.append("title", selectedProduct.title)
        formData.append("price", price.toString())
        formData.append("discountPercent", discountPercent.toString())
        formData.append("oldPrice", oldPrice.toFixed(2))
        formData.append("weightValue", weightValue)
        formData.append("weightUnit", weightUnit)
      } else {
        // Regular banner with image
        if (!selectedFile) {
          alert("Please select an image file")
          setIsUploading(false)
          return
        }

        console.log("Uploading regular banner with image")
        console.log("type:", selectedType)
        console.log("image:", selectedFile)

        const hash = await calculateHash(selectedFile)
        console.log("hash:", hash)

        formData.append("image", selectedFile)
        formData.append("hash", hash)
      }

      console.log("Making POST request to:", `${API_BASE}/api/banners/upload`)

      const response = await axios.post(`${API_BASE}/api/banners/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })

      console.log("Upload response:", response.data)
      alert("Banner uploaded successfully!")

      // Reset form
      setSelectedFile(null)
      setSelectedProduct(null)
      setSelectedVariantIndex(0)

      // Refresh banners
      fetchBanners()
    } catch (err) {
      console.error("Upload error:", err)
      alert("Upload failed: " + (err.response?.data?.message || err.message))
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (bannerId) => {
    if (!confirm("Are you sure you want to delete this banner?")) return

    try {
      await axios.delete(`${API_BASE}/api/banners/${bannerId}`)
      alert("Banner deleted successfully!")
      fetchBanners()
    } catch (err) {
      console.error("Delete error:", err)
      alert("Delete failed: " + (err.response?.data?.message || err.message))
    }
  }

  // 🚨 FIXED: Handle product navigation properly
  const handleProductClick = (banner) => {
    console.log("🔍 Banner object:", banner)
    console.log("🔍 ProductId type:", typeof banner.productId)
    console.log("🔍 ProductId value:", banner.productId)

    let productId = null

    // Handle different cases of productId
    if (banner.productId) {
      if (typeof banner.productId === "string") {
        // Case 1: productId is a string
        productId = banner.productId
        console.log("✅ Using string productId:", productId)
      } else if (typeof banner.productId === "object" && banner.productId._id) {
        // Case 2: productId is a populated object with _id
        productId = banner.productId._id
        console.log("✅ Using object._id:", productId)
      } else if (typeof banner.productId === "object" && banner.productId.toString) {
        // Case 3: productId is an ObjectId that can be converted to string
        productId = banner.productId.toString()
        console.log("✅ Using toString():", productId)
      }
    }

    if (productId && typeof productId === "string" && productId.length > 0) {
      const url = `https://mirakle-client.vercel.app/product/${productId}`
      console.log("🚀 Navigating to:", url)
      window.open(url, "_blank")
    } else {
      console.error("❌ Invalid product ID:", banner.productId)
      alert("Invalid product ID. Cannot navigate to product page.")
    }
  }

  const renderBanner = (banner) => {
    const isProductBanner = banner.type === "product-type" || banner.type === "side"

    return (
      <div key={banner._id} className="border rounded-lg p-4 shadow-md">
        <div className="flex justify-between items-start mb-2">
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">{banner.type}</span>
          <button onClick={() => handleDelete(banner._id)} className="text-red-500 hover:text-red-700 text-sm">
            Delete
          </button>
        </div>

        {isProductBanner ? (
          <div className="space-y-2">
            <div className="aspect-video bg-gray-100 rounded overflow-hidden">
              {banner.imageUrl ? (
                <img src={`${API_BASE}${banner.imageUrl}`} alt={banner.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500">No Image</div>
              )}
            </div>

            <div className="space-y-1">
              <h3 className="font-semibold text-lg">{banner.title}</h3>

              {banner.price && (
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-bold text-green-600">₹{banner.price}</span>
                  {banner.oldPrice && banner.oldPrice > banner.price && (
                    <span className="text-sm text-gray-500 line-through">₹{banner.oldPrice}</span>
                  )}
                  {banner.discountPercent > 0 && (
                    <span className="text-sm bg-red-100 text-red-800 px-2 py-1 rounded">
                      {banner.discountPercent}% OFF
                    </span>
                  )}
                </div>
              )}

              {banner.weight && (
                <p className="text-sm text-gray-600">
                  Weight: {banner.weight.value}
                  {banner.weight.unit}
                </p>
              )}

              <button
                onClick={() => handleProductClick(banner)}
                className="w-full mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
              >
                View Product
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="aspect-video bg-gray-100 rounded overflow-hidden">
              <img
                src={`${API_BASE}${banner.imageUrl}`}
                alt={banner.title || "Banner"}
                className="w-full h-full object-cover"
              />
            </div>
            {banner.title && <h3 className="font-semibold">{banner.title}</h3>}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Banner Management</h1>

      {/* Upload Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Upload New Banner</h2>

        <div className="space-y-4">
          {/* Banner Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Banner Type</label>
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value)
                setSelectedFile(null)
                setSelectedProduct(null)
              }}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="slider">Slider Banner (Max 5)</option>
              <option value="side">Side Banner (Max 3)</option>
              <option value="offer">Offer Banner (Max 1)</option>
              <option value="product-type">Product Banner (Max 10)</option>
            </select>
          </div>

          {/* Conditional Inputs */}
          {selectedType === "product-type" || selectedType === "side" ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Product</label>
                <select
                  value={selectedProduct?._id || ""}
                  onChange={(e) => {
                    const product = products.find((p) => p._id === e.target.value)
                    setSelectedProduct(product)
                    setSelectedVariantIndex(0)
                  }}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Choose a product...</option>
                  {products.map((product) => (
                    <option key={product._id} value={product._id}>
                      {product.title}
                    </option>
                  ))}
                </select>
              </div>

              {selectedProduct && selectedProduct.variants && selectedProduct.variants.length > 1 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Variant</label>
                  <select
                    value={selectedVariantIndex}
                    onChange={(e) => setSelectedVariantIndex(Number.parseInt(e.target.value))}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {selectedProduct.variants.map((variant, index) => (
                      <option key={index} value={index}>
                        {variant.size} - ₹{variant.price}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedProduct && (
                <div className="bg-gray-50 p-4 rounded-md">
                  <h3 className="font-medium mb-2">Preview:</h3>
                  <div className="flex items-center space-x-4">
                    {selectedProduct.images?.others?.[0] && (
                      <img
                        src={`${API_BASE}${selectedProduct.images.others[0]}`}
                        alt={selectedProduct.title}
                        className="w-16 h-16 object-cover rounded"
                      />
                    )}
                    <div>
                      <p className="font-medium">{selectedProduct.title}</p>
                      {selectedProduct.variants?.[selectedVariantIndex] && (
                        <p className="text-sm text-gray-600">
                          {selectedProduct.variants[selectedVariantIndex].size} - ₹
                          {selectedProduct.variants[selectedVariantIndex].price}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setSelectedFile(e.target.files[0])}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {selectedFile && (
                <div className="mt-2">
                  <img
                    src={URL.createObjectURL(selectedFile) || "/placeholder.svg"}
                    alt="Preview"
                    className="w-32 h-32 object-cover rounded"
                  />
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={isUploading}
            className={`w-full py-2 px-4 rounded-md font-medium ${
              isUploading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
            } text-white transition-colors`}
          >
            {isUploading ? "Uploading..." : "Upload Banner"}
          </button>
        </div>
      </div>

      {/* Banners Display */}
      <div className="space-y-6">
        {["slider", "side", "offer", "product-type"].map((type) => {
          const typeBanners = banners.filter((banner) => banner.type === type)
          if (typeBanners.length === 0) return null

          return (
            <div key={type}>
              <h2 className="text-xl font-semibold mb-4 capitalize">
                {type.replace("-", " ")} Banners ({typeBanners.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {typeBanners.map(renderBanner)}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default AdminBannerUpload
