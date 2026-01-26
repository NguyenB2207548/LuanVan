import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import type { Product, Variant } from "../types/product";
import {
  Loader2,
  Palette,
  Scissors,
  AlertCircle,
  ImageIcon,
} from "lucide-react";

const BASE_URL = "http://localhost:3000";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await axiosClient.get(`/products/${id}`);
        const data = response.data;
        setProduct(data);
        // Kiểm tra an toàn trước khi set variant đầu tiên
        if (data?.variants && data.variants.length > 0) {
          setSelectedVariant(data.variants[0]);
        }
      } catch (error) {
        console.error("Lỗi:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  // Logic lấy ảnh hiển thị - Thêm check an toàn ?.
  const getDisplayImage = () => {
    if (selectedVariant?.images && selectedVariant.images.length > 0) {
      return `${BASE_URL}${selectedVariant.images[0].url}`;
    }

    const primaryImg = product?.images?.find((img) => img.isPrimary);
    if (primaryImg) return `${BASE_URL}${primaryImg.url}`;

    if (product?.images && product.images.length > 0) {
      return `${BASE_URL}${product.images[0].url}`;
    }
    return null;
  };

  // Logic lấy giá từ mảng prices của variant
  const getVariantPrice = (variant: Variant | null) => {
    if (!variant || !variant.prices || variant.prices.length === 0) return 0;
    return parseFloat(variant.prices[0].amount.toString());
  };

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
      </div>
    );

  if (!product)
    return (
      <div className="text-center py-20 italic">Sản phẩm không tồn tại.</div>
    );

  const currentImageUrl = getDisplayImage();

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Gallery Section */}
        <div className="space-y-4">
          <div className="bg-white rounded-3xl aspect-square flex items-center justify-center border border-gray-100 shadow-sm overflow-hidden relative p-8 md:p-12">
            {/* Thêm p-8 hoặc p-12 để tạo khoảng trắng bao quanh sản phẩm */}
            {currentImageUrl ? (
              <img
                src={currentImageUrl}
                alt={product.productName}
                className="max-w-full max-h-full object-contain drop-shadow-2xl transition-all duration-500"
              />
            ) : (
              /* Thay object-cover bằng object-contain để ảnh không bị mất góc */
              /* Thêm drop-shadow-2xl để tạo bóng đổ đổ thật cho sản phẩm */
              <div className="flex flex-col items-center text-gray-300">
                <ImageIcon size={64} strokeWidth={1} />
                <span className="text-sm mt-2">Chưa có ảnh sản phẩm</span>
              </div>
            )}

            {selectedVariant && (
              <div className="absolute top-6 left-6 bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg">
                {selectedVariant.attributeValues
                  ?.map((av) => av.valueName)
                  .join(" / ") || "Mặc định"}
              </div>
            )}
          </div>

          {/* Thumbnail List - Đã thêm ?.map */}
          <div className="flex gap-3 overflow-x-auto pb-2">
            {product.images?.map((img, idx) => (
              <div
                key={idx}
                className="w-20 h-20 rounded-xl border border-gray-200 overflow-hidden flex-shrink-0 cursor-pointer hover:border-indigo-500 transition-colors"
              >
                <img
                  src={`${BASE_URL}${img.url}`}
                  className="w-full h-full object-cover"
                  alt={`Thumbnail ${idx}`}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Info Section */}
        <div className="flex flex-col">
          <nav className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-2">
            {product.category?.categoryName || "Quà tặng"}
          </nav>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
            {product.productName}
          </h1>

          <div className="mb-6">
            <span className="text-4xl font-black text-indigo-600">
              {getVariantPrice(selectedVariant).toLocaleString()}đ
            </span>
          </div>

          <div className="bg-gray-50 p-5 rounded-2xl mb-8">
            <h4 className="text-xs font-black uppercase text-gray-400 mb-3 tracking-widest">
              Đặc điểm sản phẩm
            </h4>
            <p className="text-gray-600 leading-relaxed text-sm">
              {product.description ||
                "Hỗ trợ in ấn cá nhân hóa, chất lượng cao."}
            </p>
          </div>

          {/* Variants Selection - Đã thêm ?.map */}
          <div className="mb-8">
            <h3 className="font-bold mb-4 flex items-center gap-2 text-gray-800 uppercase text-xs tracking-wider">
              <Scissors size={16} /> Lựa chọn phiên bản:
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {product.variants?.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVariant(v)}
                  className={`p-3 border-2 rounded-2xl text-left transition-all duration-300 ${
                    selectedVariant?.id === v.id
                      ? "border-indigo-600 bg-indigo-50 ring-4 ring-indigo-50"
                      : "border-gray-100 hover:border-gray-200 bg-white"
                  }`}
                >
                  <div className="text-[10px] uppercase text-gray-400 font-black mb-1">
                    {v.attributeValues?.map((av) => av.valueName).join(" - ") ||
                      "Tiêu chuẩn"}
                  </div>
                  <div className="text-sm font-bold text-gray-800">
                    {getVariantPrice(v).toLocaleString()}đ
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-auto pt-6 border-t border-gray-100">
            <button
              disabled={!selectedVariant || selectedVariant.stock === 0}
              onClick={() =>
                navigate(
                  `/designer/${product.id}?variantId=${selectedVariant?.id}`,
                )
              }
              className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-indigo-200 disabled:bg-gray-300 disabled:shadow-none"
            >
              <Palette size={22} />
              BẮT ĐẦU THIẾT KẾ NGAY
            </button>

            {selectedVariant && selectedVariant.stock === 0 && (
              <p className="flex items-center gap-1 text-red-500 text-[10px] font-bold uppercase justify-center mt-3 tracking-tighter">
                <AlertCircle size={14} /> Phiên bản này hiện đã hết hàng
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
