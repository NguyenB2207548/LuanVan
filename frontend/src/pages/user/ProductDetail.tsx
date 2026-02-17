import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import type { Product, Variant } from "../../types/product";
import { CheckCircle2, Loader2 } from "lucide-react";
import ImageOptionSelector from "../../components/ImageOptionSelector";

const BASE_URL = "http://localhost:3000";

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  // State lưu ảnh đang hiển thị to (Main Image)
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await axiosClient.get(`/products/${id}`);
        const data = response.data;
        setProduct(data);
        // Mặc định chọn variant đầu tiên và set ảnh đầu tiên của nó
        if (data?.variants?.length > 0) {
          const firstVar = data.variants[0];
          setSelectedVariant(firstVar);
          if (firstVar.images?.length > 0) {
            setActiveImage(firstVar.images[0].url);
          } else if (data.images?.length > 0) {
            setActiveImage(data.images[0].url);
          }
        } else if (data.images?.length > 0) {
          setActiveImage(data.images[0].url);
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  // Khi người dùng chọn Variant khác, update lại ảnh Active
  useEffect(() => {
    if (selectedVariant?.images && selectedVariant.images.length > 0) {
      setActiveImage(selectedVariant.images[0].url);
    } else if (product?.images && product.images.length > 0) {
      setActiveImage(product.images[0].url);
    }
  }, [selectedVariant, product]);

  const getPrice = () => {
    if (!selectedVariant?.prices || selectedVariant.prices.length === 0)
      return 0;
    return parseFloat(selectedVariant.prices[0].amount.toString());
  };

  // LOGIC QUAN TRỌNG: Xác định danh sách ảnh để hiển thị
  // Ưu tiên ảnh của Variant, nếu không có thì fallback về ảnh Product
  const displayImages =
    selectedVariant?.images && selectedVariant.images.length > 0
      ? selectedVariant.images
      : product?.images || [];

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="animate-spin text-pink-500" size={48} />
      </div>
    );

  if (!product)
    return (
      <div className="text-center py-20 font-medium">Product not found.</div>
    );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 font-sans text-gray-800">
      <div className="flex flex-col md:flex-row gap-10">
        {/* === PHẦN SỬA ĐỔI: HIỂN THỊ ẢNH THEO VARIANT === */}
        <div className="w-full lg:w-1/2">
          <div className="sticky top-8 flex gap-4">
            {/* List ảnh nhỏ (Thumbnails) */}
            <div className="flex flex-col gap-2 w-20 max-h-[500px] overflow-y-auto hide-scrollbar">
              {displayImages.map((img, idx) => (
                <div
                  key={idx}
                  onClick={() => setActiveImage(img.url)} // Bấm vào để đổi ảnh to
                  className={`border rounded p-1 cursor-pointer transition-all ${
                    activeImage === img.url
                      ? "border-red-400 ring-1 ring-red-400"
                      : "border-gray-200 hover:border-red-300"
                  }`}
                >
                  <img
                    src={`${BASE_URL}${img.url}`}
                    alt="thumb"
                    className="w-full object-cover aspect-square rounded-sm"
                  />
                </div>
              ))}
            </div>

            {/* Ảnh to (Main Image) */}
            <div className="flex-1 bg-white border border-gray-100 relative group rounded-lg overflow-hidden">
              <div className="absolute top-3 left-3 bg-white/90 border border-red-200 px-2 py-1 text-[10px] text-red-500 font-bold uppercase z-10 shadow-sm rounded">
                Live Preview
              </div>
              <img
                src={activeImage ? `${BASE_URL}${activeImage}` : ""}
                alt="Main Product"
                className="w-full h-auto object-contain p-4 transition-transform duration-500 group-hover:scale-110"
              />
            </div>
          </div>
        </div>
        {/* === KẾT THÚC PHẦN SỬA ĐỔI === */}

        {/* CHI TIẾT SẢN PHẨM (GIỮ NGUYÊN) */}
        <div className="w-full lg:w-1/2 lg:pl-8">
          <div className="mb-8">
            <h1 className="text-xl lg:text-[32px] font-normal text-gray-800 leading-tight mb-4 block">
              {product.productName}
            </h1>
            <div className="flex items-center gap-3">
              <span className="text-[#ff4d6d] text-2xl lg:text-3xl font-bold">
                {getPrice().toLocaleString()} VND
              </span>
            </div>
          </div>

          {/* BIẾN THỂ VÀ THIẾT KẾ */}
          <div className="mt-10">
            <ImageOptionSelector
              label="Choose a product type"
              selectedId={selectedVariant?.id}
              onSelect={(id) => {
                const variant = product.variants.find((v) => v.id === id);
                if (variant) setSelectedVariant(variant);
              }}
              options={product.variants.map((v) => ({
                id: v.id,
                image: v.images?.[0]?.url
                  ? `${BASE_URL}${v.images[0].url}`
                  : `${BASE_URL}${product.images?.[0]?.url}`,
                title: v.attributeValues
                  ?.map((av: any) => av.valueName)
                  .join(" / "),
              }))}
            />

            {/* THIẾT KẾ */}
            <div className="font-semibold mb-4 text-lg">Personalized</div>
          </div>
          {/* THÊM VÀO GIỎ HÀNG */}
          <div className="mt-8 flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <span className="font-semibold text-gray-700">Quantity:</span>
              <div className="flex items-center border border-gray-300 rounded-md">
                <button
                  className="px-4 py-2 hover:bg-gray-100 border-r border-gray-300 transition-colors"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  −
                </button>
                <input
                  type="number"
                  className="w-12 text-center focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  value={quantity}
                  readOnly
                />
                <button
                  className="px-4 py-2 hover:bg-gray-100 border-l border-gray-300 transition-colors"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  +
                </button>
              </div>
            </div>
            <div className="mt-6">
              <button className="w-full bg-[#ff4d6d] text-white font-bold py-4 rounded-full hover:bg-[#e63958] hover:shadow-xl transition-all duration-300 uppercase tracking-widest text-sm flex items-center justify-center gap-2 group">
                <svg
                  className="w-5 h-5 transition-transform group-hover:-translate-y-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
                Add to cart
              </button>

              <p className="text-center text-xs text-gray-500 mt-3 italic">
                Guaranteed safe & secure checkout
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
