"use client"

import { useState, useEffect, useCallback } from "react"
import axios from "axios"
import { useParams, useNavigate } from "react-router-dom"
import { API_BASE } from "../utils/api"

export default function AdminProductUpload() {
  const { id } = useParams() // For editing existing product
  const navigate = useNavigate()

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [productType, setProductType] = useState("")
  const [category, setCategory] = useState("")
  const [subCategory, setSubCategory] = useState("")
  const [brand, setBrand] = useState("")
  const [variants, setVariants] = useState([{ size: "", color: "", price: 0, discountPercent: 0, stock: 0, sku: "" }])
  const [newImages, setNewImages] = useState([]) // Files to be uploaded
  const [existingImages, setExistingImages] = useState([]) // { url, public_id } for images already on Cloudinary
  const [keywords, setKeywords] = useState("")
  const [isFeatured, setIsFeatured] = useState(false)
  const [isNewArrival, setIsNewArrival] = useState(false)
  const [isBestSeller, setIsBestSeller] = useState(false)
  const [isOutOfStock, setIsOutOfStock] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const isUploadEnabled = () => {
    return title && description && productType && variants.length > 0 && newImages.length > 0
  }

  useEffect(() => {
    if (id) {
      // Fetch product data for editing
      const fetchProduct = async () => {
        setLoading(true)
        try {
          const res = await axios.get(`${API_BASE}/api/products/${id}`)
          const product = res.data
          setTitle(product.title)
          setDescription(product.description)
          setProductType(product.productType)
          setCategory(product.category || "")
          setSubCategory(product.subCategory || "")
          setBrand(product.brand || "")
          setVariants(
            product.variants.length > 0
              ? product.variants
              : [{ size: "", color: "", price: 0, discountPercent: 0, stock: 0, sku: "" }],
          )
          setKeywords(product.keywords.join(", "))
          setIsFeatured(product.isFeatured)
          setIsNewArrival(product.isNewArrival)
          setIsBestSeller(product.isBestSeller)
          setIsOutOfStock(product.isOutOfStock)

          // Set existing images, filtering for those with public_id
          const currentImages = []
          if (product.images.thumbnail && product.images.thumbnail.url && product.images.thumbnail.public_id) {
            currentImages.push(product.images.thumbnail)
          }
          if (product.images.others && product.images.others.length > 0) {
            product.images.others.forEach((img) => {
              if (img.url && img.public_id) {
                // Only add if it has a public_id
                currentImages.push(img)
              }
            })
          }
          setExistingImages(currentImages)

          setLoading(false)
        } catch (err) {
          setError("Failed to fetch product data.")
          setLoading(false)
        }
      }
      fetchProduct()
    }
  }, [id])

  const handleVariantChange = useCallback(
    (index, field, value) => {
      const newVariants = [...variants]
      newVariants[index][field] = value
      setVariants(newVariants)
    },
    [variants],
  )

  const addVariant = useCallback(() => {
    setVariants([...variants, { size: "", color: "", price: 0, discountPercent: 0, stock: 0, sku: "" }])
  }, [variants])

  const removeVariant = useCallback(
    (index) => {
      const newVariants = variants.filter((_, i) => i !== index)
      setVariants(newVariants)
    },
    [variants],
  )

  const handleImageChange = useCallback((e) => {
    setNewImages([...e.target.files])
  }, [])

  const removeExistingImage = useCallback((publicIdToRemove) => {
    setExistingImages((prevImages) => prevImages.filter((img) => img.public_id !== publicIdToRemove))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    const formData = new FormData()
    formData.append("title", title)
    formData.append("description", description)
    formData.append("productType", productType)
    formData.append("category", category)
    formData.append("subCategory", subCategory)
    formData.append("brand", brand)
    formData.append("variants", JSON.stringify(variants))
    formData.append(
      "keywords",
      JSON.stringify(
        keywords
          .split(",")
          .map((k) => k.trim())
          .filter(Boolean),
      ),
    )
    formData.append("isFeatured", isFeatured)
    formData.append("isNewArrival", isNewArrival)
    formData.append("isBestSeller", isBestSeller)
    formData.append("isOutOfStock", isOutOfStock)

    // Append new images
    newImages.forEach((file) => {
      formData.append("images", file)
    })

    // Append public_ids of existing images that are kept
    const existingImagePublicIds = existingImages.map((img) => img.public_id)
    formData.append("existingImagePublicIds", JSON.stringify(existingImagePublicIds))

    try {
      if (id) {
        await axios.put(`${API_BASE}/api/products/edit/${id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        })
        setSuccess("Product updated successfully!")
      } else {
        await axios.post(`${API_BASE}/api/products/add`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        })
        setSuccess("Product added successfully!")
        // Clear form after successful add
        setTitle("")
        setDescription("")
        setProductType("")
        setCategory("")
        setSubCategory("")
        setBrand("")
        setVariants([{ size: "", color: "", price: 0, discountPercent: 0, stock: 0, sku: "" }])
        setNewImages([])
        setExistingImages([])
        setKeywords("")
        setIsFeatured(false)
        setIsNewArrival(false)
        setIsBestSeller(false)
        setIsOutOfStock(false)
      }
      navigate("/admin/products") // Redirect to product list or similar
    } catch (err) {
      console.error("Error submitting product:", err.response?.data?.message || err.message)
      setError(err.response?.data?.message || "Failed to save product.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">{id ? "Edit Product" : "Add New Product"}</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="text-red-500">{error}</div>}
        {success && <div className="text-green-500">{success}</div>}

        <div>
          <label className="block text-sm font-medium text-gray-700">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows="4"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          ></textarea>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Product Type</label>
          <input
            type="text"
            value={productType}
            onChange={(e) => setProductType(e.target.value)}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Category</label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Sub Category</label>
          <input
            type="text"
            value={subCategory}
            onChange={(e) => setSubCategory(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Brand</label>
          <input
            type="text"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>

        <h3 className="text-lg font-semibold mt-6 mb-2">Variants</h3>
        {variants.map((variant, index) => (
          <div key={index} className="grid grid-cols-1 md:grid-cols-6 gap-4 border p-4 rounded-md relative">
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700">Size</label>
              <input
                type="text"
                value={variant.size}
                onChange={(e) => handleVariantChange(index, "size", e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
            </div>
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700">Color</label>
              <input
                type="text"
                value={variant.color}
                onChange={(e) => handleVariantChange(index, "color", e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
            </div>
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700">Price</label>
              <input
                type="number"
                value={variant.price}
                onChange={(e) => handleVariantChange(index, "price", Number.parseFloat(e.target.value))}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
            </div>
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700">Discount (%)</label>
              <input
                type="number"
                value={variant.discountPercent}
                onChange={(e) => handleVariantChange(index, "discountPercent", Number.parseFloat(e.target.value))}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
            </div>
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700">Stock</label>
              <input
                type="number"
                value={variant.stock}
                onChange={(e) => handleVariantChange(index, "stock", Number.parseInt(e.target.value))}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
            </div>
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700">SKU</label>
              <input
                type="text"
                value={variant.sku}
                onChange={(e) => handleVariantChange(index, "sku", e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
            </div>
            {variants.length > 1 && (
              <button
                type="button"
                onClick={() => removeVariant(index)}
                className="absolute top-2 right-2 text-red-500 hover:text-red-700"
              >
                &times;
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={addVariant}
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
        >
          Add Variant
        </button>

        <h3 className="text-lg font-semibold mt-6 mb-2">Images</h3>
        <div className="flex flex-wrap gap-4 mb-4">
          {existingImages.map((img, index) => (
            <div key={img.public_id || index} className="relative w-32 h-32 border rounded-md overflow-hidden">
              <img
                src={img.url || "/placeholder.svg"}
                alt={`Product image ${index}`}
                className="w-full h-full object-cover"
              />
              {img.public_id && ( // Only show remove button if it has a public_id
                <button
                  type="button"
                  onClick={() => removeExistingImage(img.public_id)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                  aria-label="Remove image"
                >
                  &times;
                </button>
              )}
            </div>
          ))}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Upload New Images</label>
          <input
            type="file"
            multiple
            onChange={handleImageChange}
            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Keywords (comma-separated)</label>
          <input
            type="text"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-900">Featured</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={isNewArrival}
              onChange={(e) => setIsNewArrival(e.target.checked)}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-900">New Arrival</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={isBestSeller}
              onChange={(e) => setIsBestSeller(e.target.checked)}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-900">Best Seller</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={isOutOfStock}
              onChange={(e) => setIsOutOfStock(e.target.checked)}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-900">Out of Stock</span>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading || !isUploadEnabled()}
          className="bg-green-500 text-white px-6 py-2 rounded-md hover:bg-green-600 disabled:opacity-50"
        >
          {loading ? "Saving..." : id ? "Update Product" : "Add Product"}
        </button>
      </form>
    </div>
  )
}
