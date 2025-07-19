import { useState, useEffect, useCallback } from "react"
import axios from "axios"
import { API_BASE } from "../utils/api"

const AdminBannerUpload = () => {
  const [image, setImage] = useState(null)
  const [type, setType] = useState("all") 
  const [banners, setBanners] = useState([]) 
  const [offerBanners, setOfferBanners] = useState([])
  const [products, setProducts] = useState([])
  const [selectedProductIds, setSelectedProductIds] = useState([])
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0)
  const [productSearchTerm, setProductSearchTerm] = useState("") 
  const [selectedCategoryType, setSelectedCategoryType] = useState("") 
  const [title, setTitle] = useState("") 
  const [percentage, setPercentage] = useState("")
  const [offerSlot, setOfferSlot] = useState("") 
  const [availableProductTypes, setAvailableProductTypes] = useState([])
  const [offerLinkType, setOfferLinkType] = useState("none")
  const [linkedProductForOffer, setLinkedProductForOffer] = useState(null)
  const [linkedCategoryForOffer, setLinkedCategoryForOffer] = useState("")
  const [linkedDiscountUpToForOffer, setLinkedDiscountUpToForOffer] = useState("")
  const [editingBanner, setEditingBanner] = useState(null)

  useEffect(() => {
    fetchAllBannersAndProducts()
  }, [])

  const resetFormStates = useCallback(() => {
    setImage(null)
    setTitle("")
    setPercentage("")
    setOfferSlot("")
    setSelectedProductIds([])
    setSelectedVariantIndex(0)
    setProductSearchTerm("")
    setSelectedCategoryType("")
    setOfferLinkType("none")
    setLinkedProductForOffer(null)
    setLinkedCategoryForOffer("")
    setLinkedDiscountUpToForOffer("")
    setEditingBanner(null)
    const fileInput = document.getElementById(`banner-file-${type}`)
    if (fileInput) fileInput.value = ""
  }, [type])

  useEffect(() => {
    resetFormStates()
  }, [type, resetFormStates])

  const fetchAllBannersAndProducts = async () => {
    try {
      const [bannersRes, offerBannersRes, productsRes] = await Promise.all([
        axios.get(`${API_BASE}/api/banners`),
        axios.get(`${API_BASE}/api/offer-banners`),
        axios.get(`${API_BASE}/api/products/all-products`),
      ])
      setBanners(bannersRes.data)
      setOfferBanners(offerBannersRes.data.map((b) => ({ ...b, type: "offerbanner" })))
      setProducts(productsRes.data)
      const uniqueTypes = [...new Set(productsRes.data.map((p) => p.productType).filter(Boolean))].sort()
      setAvailableProductTypes(uniqueTypes)
    } catch (err) {
      console.error("Failed to fetch all data:", err)
      setBanners([])
      setOfferBanners([])
      setProducts([])
      setAvailableProductTypes([])
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

    try {
      let endpoint = `${API_BASE}/api/banners/upload`
      let method = "post"

      if (editingBanner) {
        endpoint = `${API_BASE}/api/${editingBanner.type === "offerbanner" ? "offer-banners" : "banners"}/${editingBanner._id}`
        method = "put"
      }

      if (type === "homebanner") {
        if (!image && !editingBanner) {
          alert("Please select an image for the Main Banner.")
          return
        }
        if (image) formData.append("image", image)
      } else if (type === "category") {
        if (!image && !editingBanner) {
          alert("Please select an image for the Category Banner.")
          return
        }
        if (!selectedCategoryType) {
          alert("Please select a category type.")
          return
        }
        if (image) formData.append("image", image)
        formData.append("title", selectedCategoryType)
      } else if (type === "offerbanner") {
        endpoint = `${API_BASE}/api/offer-banners/${editingBanner ? editingBanner._id : "upload"}`
        if (!image && !editingBanner?.imageUrl) {
          alert("Please select an image for the Offer Zone Banner.")
          return
        }
        if (!title.trim() || !offerSlot) {
          alert("Please enter title and select an offer slot.")
          return
        }
        if (image) formData.append("image", image)
        formData.append("title", title.trim())
        formData.append("slot", offerSlot)

        if (offerLinkType === "product" && linkedProductForOffer) {
          formData.append("linkedProductId", linkedProductForOffer._id)
        } else if (offerLinkType === "category" && linkedCategoryForOffer) {
          formData.append("linkedCategory", linkedCategoryForOffer)
        }
        if (linkedDiscountUpToForOffer !== "") {
          formData.append("linkedDiscountUpTo", linkedDiscountUpToForOffer)
        }
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

          if (banners.some((b) => b.type === "product-type" && b.productId === productId) && !editingBanner) {
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
            await axios.post(`${API_BASE}/api/banners/upload`, productFormData, {
              headers: { "Content-Type": "multipart/form-data" },
            })
            console.log(`Uploaded banner for ${product.title}`)
            successCount++
          } catch (err) {
            console.error(`❌ Failed to upload banner for ${product.title}`, err.response?.data || err.message)
            alert(`Failed to upload banner for ${product.title}: ${err.response?.data?.message || err.message}`)
          }
        }
        if (successCount > 0) {
          alert(`Uploaded ${successCount} banner(s) successfully`)
        } else {
          alert("No banners uploaded. Please check product images or errors.")
        }
        setSelectedProductIds([])
        setSelectedVariantIndex(0)
        setProductSearchTerm("")
        fetchAllBannersAndProducts()
        return
      } else {
        alert("Unknown banner type selected. Please choose a valid banner type.")
        return
      }

      if (method === "post") {
        await axios.post(endpoint, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        })
        alert(`✅ ${type.replace("banner", " Banner")} uploaded`)
      } else {
        await axios.put(endpoint, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        })
        alert(`✅ ${type.replace("banner", " Banner")} updated`)
      }

      resetFormStates()
      fetchAllBannersAndProducts() 
    } catch (err) {
      console.error("❌ Operation error:", err.response?.data || err.message)
      alert(err.response?.data?.message || "Operation failed")
    }
  }

  const handleDelete = async (bannerId, bannerType) => {
    if (!window.confirm("Are you sure you want to delete this banner?")) return

    try {
      let url = ""
      if (bannerType === "offerbanner") {
        url = `${API_BASE}/api/offer-banners/${bannerId}`
      } else {
        url = `${API_BASE}/api/banners/${bannerId}`
      }
      const response = await axios.delete(url)
      if (response.status === 200) {
        alert("Banner deleted successfully")
        fetchAllBannersAndProducts()
      } else {
        console.error("Unexpected response:", response)
        alert("Failed to delete banner")
      }
    } catch (err) {
      console.error("Delete error:", err.response?.data || err.message)
      alert(err.response?.data?.message || "Failed to delete banner")
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
    if (!confirm(confirmMessage)) return

    try {
      if (currentType === "offerbanner") {
        await axios.delete(`${API_BASE}/api/offer-banners`)
        alert("All offer banners deleted successfully")
      } else if (currentType === "all") {
        await Promise.all([
          axios.delete(`${API_BASE}/api/banners?type=all`),
          axios.delete(`${API_BASE}/api/offer-banners`),
        ])
        alert("All banners deleted successfully")
      } else {
        await axios.delete(`${API_BASE}/api/banners?type=${currentType}`)
        alert(`All ${typeNames[currentType]} banners deleted successfully`)
      }
      fetchAllBannersAndProducts()
    } catch (err) {
      console.error("Delete all error:", err.response?.data || err.message)
      alert(err.response?.data?.message || "Failed to delete banners")
    }
  }

  // ✅ NEW: Handle Edit for any banner type
  const handleEdit = (banner) => {
    setEditingBanner(banner)
    setType(banner.type) // Set the dropdown to the banner's type

    // Populate common fields
    setTitle(banner.title || "")
    setImage(null) // Clear image input, user can re-upload if needed

    // Populate type-specific fields
    if (banner.type === "category") {
      setSelectedCategoryType(banner.title || "")
    } else if (banner.type === "offerbanner") {
      setPercentage(banner.percentage === undefined ? "" : String(banner.percentage)) 
      setOfferSlot(banner.slot || "")
      setLinkedDiscountUpToForOffer(banner.linkedDiscountUpTo === undefined ? "" : String(banner.linkedDiscountUpTo))
      if (banner.linkedProductId) {
        setOfferLinkType("product")
        setLinkedProductForOffer(products.find((p) => p._id === banner.linkedProductId) || null)
      } else if (banner.linkedCategory) {
        setOfferLinkType("category")
        setLinkedCategoryForOffer(banner.linkedCategory)
      } else {
        setOfferLinkType("none")
      }
    } else if (banner.type === "product-type") {
      setSelectedProductIds([banner.productId])
      // For product-type, we don't typically edit the product itself, just the banner properties
      // If you need to edit the variant, you'd need to store and set selectedVariantIndex
    }
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const allCombinedBanners = [...banners, ...offerBanners]
  const filteredBanners = allCombinedBanners.filter((b) => type === "all" || b.type === type)

  const isUploadEnabled = (() => {
    if (type === "all") return false

    if (type === "homebanner") {
      return !!image || (editingBanner && editingBanner.imageUrl)
    }

    if (type === "category") {
      return (!!image || (editingBanner && editingBanner.imageUrl)) && !!selectedCategoryType
    }

    if (type === "offerbanner") {
      const hasImage = !!image || (editingBanner && editingBanner.imageUrl)
      const hasTitle = !!title.trim()
      const hasPercentage = percentage !== "" 
      const isPercentageValid = !isNaN(Number(percentage)) && Number(percentage) >= 0 && Number(percentage) <= 100
      const hasOfferSlot = !!offerSlot

      let isLinkDataValid = true // Assume valid unless proven otherwise
      if (offerLinkType === "product") {
        isLinkDataValid = !!linkedProductForOffer
      } else if (offerLinkType === "category") {
        isLinkDataValid = !!linkedCategoryForOffer
      }

      let isDiscountUpToValid = true // Assume valid unless proven otherwise
      if (linkedDiscountUpToForOffer !== "") {
        const discountVal = Number(linkedDiscountUpToForOffer)
        isDiscountUpToValid = !isNaN(discountVal) && discountVal >= 0 && discountVal <= 100
        // If a discount value is provided AND it's greater than 0, a link type must be selected
        if (isDiscountUpToValid && discountVal > 0 && offerLinkType === "none") {
          isDiscountUpToValid = false
        }
      }

      return (
        hasImage &&
        hasTitle &&
        hasPercentage &&
        isPercentageValid &&
        hasOfferSlot &&
        isLinkDataValid &&
        isDiscountUpToValid
      )
    }

    if (type === "product-type") {
      return selectedProductIds.length > 0
    }

    return false
  })()

  const selectedProduct = getSelectedProduct()
  const selectedVariant = getSelectedVariant()

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">
        {editingBanner ? `Edit ${editingBanner.type.replace("banner", " Banner")}` : "Admin Banner Upload Panel"}
      </h2>
      <select
        value={type}
        onChange={(e) => setType(e.target.value)}
        className="border p-2 w-full mb-4"
        disabled={!!editingBanner}
      >
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
                        className={`flex items-center gap-2 mb-2 cursor-pointer ${isProductBannerExisting && !editingBanner ? "opacity-50 cursor-not-allowed" : ""}`}
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
                          disabled={isProductBannerExisting && !editingBanner}
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

          {type === "category" && (
            <>
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
                      <option key={index} value={typeOption} disabled={isCategoryBannerExisting && !editingBanner}>
                        {typeOption} {isCategoryBannerExisting && "(Banner Exists)"}
                      </option>
                    )
                  })}
                </select>
              </div>
            </>
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
                <option
                  value="left"
                  disabled={
                    offerBanners.some((b) => b.slot === "left") && (!editingBanner || editingBanner.slot !== "left")
                  }
                >
                  Left Banner{" "}
                  {offerBanners.some((b) => b.slot === "left") &&
                    (!editingBanner || editingBanner.slot !== "left") &&
                    "(Exists)"}
                </option>
                <option
                  value="right"
                  disabled={
                    offerBanners.some((b) => b.slot === "right") && (!editingBanner || editingBanner.slot !== "right")
                  }
                >
                  Right Banner{" "}
                  {offerBanners.some((b) => b.slot === "right") &&
                    (!editingBanner || editingBanner.slot !== "right") &&
                    "(Exists)"}
                </option>
              </select>

              {/* ✅ NEW: Offer Banner Linking Options */}
              <div className="mb-4 p-3 border rounded bg-gray-50">
                <label className="block text-sm font-medium mb-2">Link Offer Banner To:</label>
                <div className="flex gap-4 mb-3">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="none"
                      checked={offerLinkType === "none"}
                      onChange={() => {
                        setOfferLinkType("none")
                        setLinkedProductForOffer(null)
                        setLinkedCategoryForOffer("")
                        setLinkedDiscountUpToForOffer("") // Clear discount if no link
                      }}
                      className="mr-2 accent-green-600"
                    />
                    No Specific Link
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="product"
                      checked={offerLinkType === "product"}
                      onChange={() => {
                        setOfferLinkType("product")
                        setLinkedCategoryForOffer("")
                      }}
                      className="mr-2 accent-green-600"
                    />
                    Specific Product
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="category"
                      checked={offerLinkType === "category"}
                      onChange={() => {
                        setOfferLinkType("category")
                        setLinkedProductForOffer(null)
                      }}
                      className="mr-2 accent-green-600"
                    />
                    Product Category
                  </label>
                </div>

                {offerLinkType === "product" && (
                  <div className="mb-3">
                    <input
                      type="text"
                      placeholder="Search product to link..."
                      value={productSearchTerm}
                      onChange={(e) => setProductSearchTerm(e.target.value)}
                      className="mb-2 p-2 border w-full rounded"
                    />
                    <div className="max-h-40 overflow-y-auto border rounded p-2">
                      {filteredProducts.map((product) => (
                        <label key={product._id} className="flex items-center gap-2 mb-2 cursor-pointer">
                          <input
                            type="radio"
                            name="linkedProduct"
                            value={product._id}
                            checked={linkedProductForOffer?._id === product._id}
                            onChange={() => setLinkedProductForOffer(product)}
                            className="mr-2 accent-green-600"
                          />
                          <span className="text-sm">{product.title}</span>
                        </label>
                      ))}
                    </div>
                    {linkedProductForOffer && (
                      <div className="bg-gray-100 p-2 rounded mt-2 text-sm">
                        Linked Product: <span className="font-semibold">{linkedProductForOffer.title}</span>
                      </div>
                    )}
                  </div>
                )}

                {offerLinkType === "category" && (
                  <div className="mb-3">
                    <label className="block text-sm font-medium mb-1">Select Category:</label>
                    <select
                      value={linkedCategoryForOffer}
                      onChange={(e) => setLinkedCategoryForOffer(e.target.value)}
                      className="p-2 border w-full rounded"
                    >
                      <option value="">Select a category</option>
                      {availableProductTypes.map((typeOption, index) => (
                        <option key={index} value={typeOption}>
                          {typeOption}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {(offerLinkType === "product" || offerLinkType === "category") && (
                  <div className="mb-3">
                    <label className="block text-sm font-medium mb-1">Discount Up To (%):</label>
                    <input
                      type="number"
                      placeholder="e.g., 25 (optional)"
                      value={linkedDiscountUpToForOffer}
                      onChange={(e) => setLinkedDiscountUpToForOffer(e.target.value)}
                      className="p-2 border w-full rounded"
                      min="0"
                      max="100"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      If set, clicking the banner will filter products with up to this discount.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          {(type === "homebanner" || type === "category" || type === "offerbanner") && (
            <div className="flex items-center gap-2 mb-4">
              <input
                id={`banner-file-${type}`}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="flex-1"
              />
              {(image || (editingBanner && editingBanner.imageUrl)) && (
                <button onClick={clearImage} className="bg-red-500 text-white px-3 py-1 rounded text-sm">
                  Clear Image
                </button>
              )}
            </div>
          )}
          {(type === "homebanner" || type === "category" || type === "offerbanner") &&
            (image || (editingBanner && editingBanner.imageUrl)) && (
              <img
                src={image ? URL.createObjectURL(image) : editingBanner.imageUrl || "/placeholder.svg"}
                alt="Preview"
                className="mb-4 w-full h-64 object-cover rounded border"
              />
          )}

          <button
            onClick={handleUpload}
            className={`px-4 py-2 rounded text-white ${isUploadEnabled ? "bg-green-600 hover:bg-green-700" : "bg-gray-400 cursor-not-allowed"}`}
            disabled={!isUploadEnabled}
          >
            {editingBanner ? "Update Banner" : "Upload Banner"}
          </button>
          {editingBanner && (
            <button onClick={resetFormStates} className="ml-4 bg-gray-500 text-white px-4 py-2 rounded">
              Cancel Edit
            </button>
          )}
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
            {banner.linkedProductId && (
              <div className="text-gray-600 text-center text-xs mt-1">
                Linked Product ID: {banner.linkedProductId.slice(-6)}
              </div>
            )}
            {banner.linkedCategory && (
              <div className="text-gray-600 text-center text-xs mt-1">Linked Category: {banner.linkedCategory}</div>
            )}
            {banner.linkedDiscountUpTo > 0 && (
              <div className="text-red-500 text-center text-xs mt-1">Up to {banner.linkedDiscountUpTo}% Discount</div>
            )}
            <div className="mt-3 text-center flex justify-center gap-2">
              <button
                onClick={() => handleEdit(banner)}
                className="bg-blue-500 text-white px-3 py-1 text-sm rounded hover:bg-blue-600"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(banner._id, banner.type)}
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
