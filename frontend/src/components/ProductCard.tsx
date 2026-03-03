import React from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, ImageIcon } from "lucide-react";
import type { Product } from "../types/product";

const BASE_URL = "http://localhost:3000";

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  // Logic lấy ảnh hiển thị ưu tiên
  const getDisplayImage = (product: Product) => {
    const primaryProductImg = product.images?.find((img) => img.isPrimary);
    if (primaryProductImg) return `${BASE_URL}${primaryProductImg.url}`;

    const firstVariantWithImg = product.variants?.find(
      (v) => v.images && v.images.length > 0,
    );
    if (firstVariantWithImg)
      return `${BASE_URL}${firstVariantWithImg.images[0].url}`;

    return null;
  };

  // Logic lấy giá thấp nhất
  const getMinPrice = (product: Product) => {
    const allPrices = product.variants
      ?.flatMap((v) => v.prices || [])
      .map((p) => parseFloat(p.amount.toString()));

    if (!allPrices || allPrices.length === 0) return null;
    return Math.min(...allPrices);
  };

  const displayImage = getDisplayImage(product);
  const minPrice = getMinPrice(product);

  return (
    <Link
      to={`/products/${product.id}`}
      className="group bg-white rounded-lg overflow-hidden border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-300 flex flex-col"
    >
      {/* Container Ảnh (Tỷ lệ vuông) */}
      <div className="aspect-square bg-gray-50 relative overflow-hidden">
        {displayImage ? (
          <img
            src={displayImage}
            alt={product.productName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
            <ImageIcon size={40} strokeWidth={1} className="mb-2 opacity-50" />
            <span className="text-[10px] uppercase tracking-widest font-medium">
              No Image
            </span>
          </div>
        )}

        {/* Badge Category */}
        {product.category && (
          <div className="absolute top-3 left-3">
            <span className="bg-white/95 backdrop-blur-sm text-gray-700 border border-gray-200 text-[10px] font-bold px-2.5 py-1 rounded-md shadow-sm">
              {product.category.categoryName.toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Nội dung Card */}
      <div className="p-5 flex-1 flex flex-col">
        <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors text-base line-clamp-2 mb-1">
          {product.productName}
        </h3>

        <p className="text-gray-500 text-sm line-clamp-1 mb-4 flex-1">
          {product.description || "Thiết kế tùy chỉnh độc đáo"}
        </p>

        <div className="pt-4 border-t border-gray-100 flex items-end justify-between mt-auto">
          <div>
            <p className="text-[11px] text-gray-500 uppercase font-semibold tracking-wider mb-0.5">
              Giá từ
            </p>
            <p className="text-gray-900 font-bold text-lg">
              {minPrice ? `$${minPrice.toFixed(2)}` : "Liên hệ"}
            </p>
          </div>

          {/* Nút Cart mờ, hiện rõ khi hover */}
          <button
            className="bg-gray-50 text-gray-600 hover:bg-blue-600 hover:text-white p-2.5 rounded-md transition-colors duration-300 border border-gray-200 hover:border-blue-600"
            onClick={(e) => {
              e.preventDefault(); // Ngăn không cho click vào nút này bị chuyển trang (tránh xung đột với thẻ Link bọc ngoài)
              // TODO: Thêm logic add to cart nhanh ở đây nếu cần
            }}
          >
            <ShoppingBag size={18} />
          </button>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
