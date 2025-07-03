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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bannerRes, productRes] = await Promise.all([
          axios.get(`${API_BASE}/api/banners`),
          axios.get(`${API_BASE}/api/products/all-products`),
        ])
        setBanners(bannerRes.data)
        setProducts(productRes.data)
      } catch (err) {
        console.error("Init fetch failed:", err)
      }
    }
    fetchData()
  }, [])

  const computeFileHash = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader()
    const chunkSize = 2097152
    let cursor = 0
    const spark = new SparkMD5.ArrayBuffer()

    reader.onload = (e) => {
      spark.append(e.target.result)
      cursor += chunkSize
      cursor < file.size ? read() : resolve(spark.end())
    }
    reader.onerror = () => reject("File read error")

    const read = () => {
      const slice = file.slice(cursor, cursor + chunkSize)
      reader.readAsArrayBuffer(slice)
    }
    read()
  })

  const handleUpload = async () => {
    if (type === "all") return alert("Cannot upload in 'Show All'")
    const formData = new FormData()
    formData.append("type", type)

    if (["product-type", "side"].includes(type)) {
      const product = products.find(p => p._id === selectedProductId)
      const variant = product?.variants?.[selectedVariantIndex]
      if (!product || !variant) return alert("Select valid product/variant")

      formData.append("productId", selectedProductId)
      formData.append("selectedVariantIndex", selectedVariantIndex)
      formData.append("productImageUrl", product.images?.others?.[0] || "")
      formData.append("title", product.title)
      formData.append("price", variant.price)
      formData.append("discountPercent", variant.discountPercent || 0)
      if (variant.discountPercent > 0) {
        const oldPrice = variant.price / (1 - variant.discountPercent / 100)
        formData.append("oldPrice", oldPrice.toFixed(2))
      }
      const match = variant.size.match(/^([\d.]+)([a-zA-Z]+)$/)
      if (match) {
        formData.append("weightValue", match[1])
        formData.append("weightUnit", match[2])
      }
    } else {
      if (!image) return alert("Select an image")
      const hash = await computeFileHash(image)
      formData.append("image", image)
      formData.append("hash", hash)
    }

    try {
      const url = editingBanner ? `${API_BASE}/api/banners/${editingBanner._id}` : `${API_BASE}/api/banners/upload`
      const method = editingBanner ? axios.put : axios.post
      await method(url, formData, { headers: { "Content-Type": "multipart/form-data" } })
      alert(editingBanner ? "Banner updated" : "Banner uploaded")
      setImage(null)
      setSelectedProductId("")
      setSelectedVariantIndex(0)
      setEditingBanner(null)
      setProductSearchTerm("")
      document.getElementById("banner-file")?.value = ""
      const res = await axios.get(`${API_BASE}/api/banners`)
      setBanners(res.data)
    } catch (err) {
      console.error("Upload error:", err)
      alert(err.response?.data?.message || "Upload failed")
    }
  }

  const handleDelete = async (id) => {
    if (!confirm("Delete this banner?")) return
    try {
      await axios.delete(`${API_BASE}/api/banners/${id}`)
      const res = await axios.get(`${API_BASE}/api/banners`)
      setBanners(res.data)
      alert("Banner deleted")
    } catch {
      alert("Delete failed")
    }
  }

  const handleEdit = (b) => {
    setEditingBanner(b)
    setType(b.type)
    setSelectedProductId(b.productId || "")
    setSelectedVariantIndex(b.selectedVariantIndex || 0)
    document.getElementById("banner-file")?.value = ""
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const filteredProducts = products.filter(p => p.title.toLowerCase().includes(productSearchTerm.toLowerCase()))
  const uploadedProducts = banners.filter(b => ["product-type", "side"].includes(b.type)).map(b => b.productId)

  return <div className="p-6 max-w-5xl mx-auto">
    <h2 className="text-2xl font-bold mb-4">Admin Banner Upload</h2>

    <select value={type} onChange={e => setType(e.target.value)} className="border p-2 w-full mb-4">
      <option value="all">Show All</option>
      <option value="slider">Banner</option>
      <option value="side">Top Sellers</option>
      <option value="offer">Offer</option>
      <option value="product-type">Special Products</option>
    </select>

    {type !== "all" && <div className="bg-white shadow p-4 rounded mb-6">
      {["product-type", "side"].includes(type) && <div className="mb-4">
        <input placeholder="Search..." value={productSearchTerm} onChange={e => setProductSearchTerm(e.target.value)} className="mb-2 p-2 border w-full rounded" />
        <select value={selectedProductId} onChange={e => { setSelectedProductId(e.target.value); setSelectedVariantIndex(0) }} className="mb-2 p-2 border w-full" size="5">
          <option value="">-- Select Product --</option>
          {filteredProducts.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
        </select>
      </div>}

      {["slider", "offer"].includes(type) && <>
        <input id="banner-file" type="file" accept="image/*" onChange={e => setImage(e.target.files[0])} className="mb-4" />
        {image && <img src={URL.createObjectURL(image)} alt="Preview" className="mb-4 w-full h-64 object-cover rounded border" />}
      </>}

      <div className="flex gap-2">
        <button onClick={handleUpload} className={`text-white px-4 py-2 rounded ${editingBanner ? "bg-orange-500" : "bg-green-600"}`}>{editingBanner ? "Update Banner" : "Upload Banner"}</button>
        {editingBanner && <button onClick={() => setEditingBanner(null)} className="bg-gray-400 text-white px-4 py-2 rounded">Cancel</button>}
      </div>
    </div>}

    <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
      {banners.filter(b => type === "all" || b.type === type).map(b => (
        <div key={b._id} className="border p-3 rounded shadow relative">
          <img src={`${API_BASE}${b.imageUrl}`} alt={b.title || b.type} className="w-full h-40 object-cover rounded mb-2" />
          <div className="text-sm text-center font-medium mt-1">{b.title}</div>
          <div className="flex justify-between mt-3">
            <button onClick={() => handleEdit(b)} className="bg-yellow-500 text-white px-3 py-1 text-sm rounded">Edit</button>
            <button onClick={() => handleDelete(b._id)} className="bg-red-500 text-white px-3 py-1 text-sm rounded">Delete</button>
          </div>
        </div>
      ))}
    </div>
  </div>
}

export default AdminBannerUpload
