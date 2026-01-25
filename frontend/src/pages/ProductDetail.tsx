import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import type { Product, Variant } from "../types/product";
import {
  Loader2,
  Palette,
  ShoppingCart,
  Scissors,
  AlertCircle,
} from "lucide-react";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        // Lấy chi tiết sản phẩm kèm variants và attributes từ NestJS
        const response = await axiosClient.get(`/products/${id}`);
        setProduct(response.data);
        if (response.data.variants?.length > 0) {
          setSelectedVariant(response.data.variants[0]);
        }
      } catch (error) {
        console.error("Lỗi:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-indigo-600" />
      </div>
    );
  if (!product)
    return <div className="text-center py-20">Sản phẩm không tồn tại.</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Gallery/Preview */}
        <div className="bg-white rounded-2xl aspect-square flex flex-col items-center justify-center border border-dashed border-gray-300">
          <Palette size={48} className="text-gray-300 mb-2" />
          <span className="text-gray-400 font-medium">Ảnh phôi sản phẩm</span>
        </div>

        {/* Info */}
        <div className="flex flex-col">
          <nav className="text-sm text-gray-500 mb-4">
            Sản phẩm / {product.productName}
          </nav>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
            {product.productName}
          </h1>

          <div className="mb-6">
            <span className="text-3xl font-bold text-indigo-600">
              {selectedVariant
                ? `${selectedVariant?.price?.toLocaleString() ?? "0"}đ`
                : "Chưa có giá"}
            </span>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg mb-8">
            <h4 className="text-sm font-bold text-gray-700 mb-2">
              Mô tả sản phẩm:
            </h4>
            <p className="text-gray-600 leading-relaxed text-sm">
              {product.description ||
                "Dòng sản phẩm quà tặng cao cấp, hỗ trợ in ấn cá nhân hóa theo yêu cầu khách hàng."}
            </p>
          </div>

          {/* Chọn Variant dựa trên giá/id vì không có SKU */}
          <div className="mb-8">
            <h3 className="font-semibold mb-3 flex items-center gap-2 text-gray-800">
              <Scissors size={18} /> Lựa chọn mẫu:
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {product.variants.map((v, index) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVariant(v)}
                  className={`p-3 border rounded-xl text-left transition-all ${
                    selectedVariant?.id === v.id
                      ? "border-indigo-600 bg-indigo-50 ring-2 ring-indigo-100"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="text-xs uppercase text-gray-500 font-bold mb-1">
                    Mẫu {index + 1}
                  </div>
                  <div className="text-sm font-semibold text-gray-800">
                    {/* Sửa dòng 103 ở đây: Thêm dấu ? trước toLocaleString */}
                    {v.price?.toLocaleString() ?? "0"}đ
                  </div>
                  <div className="text-[10px] text-gray-400 mt-1">
                    Kho: {v.stock ?? 0}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-auto space-y-3">
            <button
              disabled={!selectedVariant || selectedVariant.stock === 0}
              onClick={() =>
                navigate(
                  `/designer/${product.id}?variantId=${selectedVariant?.id}`,
                )
              }
              className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 disabled:bg-gray-400"
            >
              <Palette size={20} />
              THIẾT KẾ CÁ NHÂN HÓA
            </button>

            {selectedVariant && selectedVariant.stock === 0 && (
              <p className="flex items-center gap-1 text-red-500 text-xs justify-center">
                <AlertCircle size={14} /> Mẫu này hiện đang hết hàng
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
