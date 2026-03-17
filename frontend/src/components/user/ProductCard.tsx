import React from "react";
import { Link } from "react-router-dom";
import { ImageIcon } from "lucide-react";
import type { Product } from "../../types/product";

const BASE_URL = "http://localhost:3000";

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  // 1. Logic lấy ảnh hiển thị ưu tiên
  const getDisplayImage = (product: Product) => {
    // Ưu tiên ảnh chính của Product
    const primaryProductImg = product.images?.find((img) => img.isPrimary);
    if (primaryProductImg) return `${BASE_URL}${primaryProductImg.url}`;

    // Nếu không có, lấy ảnh đầu tiên của Variant đầu tiên có ảnh
    const firstVariantWithImg = product.variants?.find(
      (v) => v.images && v.images.length > 0,
    );
    if (firstVariantWithImg)
      return `${BASE_URL}${firstVariantWithImg.images[0].url}`;

    // Nếu vẫn không có, lấy đại ảnh đầu tiên trong mảng images của Product
    if (product.images && product.images.length > 0)
      return `${BASE_URL}${product.images[0].url}`;

    return null;
  };

  // 2. Logic lấy giá thấp nhất (SỬA LẠI THEO JSON MỚI)
  const getMinPrice = (product: Product) => {
    if (!product.variants || product.variants.length === 0) return null;

    // Lấy tất cả trường price từ mảng variants
    const allPrices = product.variants
      .map((v) => Number(v.price))
      .filter((p) => !isNaN(p));

    if (allPrices.length === 0) return null;
    return Math.min(...allPrices);
  };

  const displayImage = getDisplayImage(product);
  const minPrice = getMinPrice(product);

  return (
    <Link
      to={`/products/${product.id}`}
      className="group flex flex-col w-full cursor-pointer"
    >
      {/* Container Ảnh */}
      <div className="aspect-square w-full bg-gray-100 rounded-xl overflow-hidden relative border border-gray-100">
        {displayImage ? (
          <img
            src={displayImage}
            alt={product.productName}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
            <ImageIcon size={40} strokeWidth={1} className="mb-2 opacity-40" />
            <span className="text-[10px] uppercase tracking-widest font-medium">
              No Image
            </span>
          </div>
        )}

        {/* Badge "Hết hàng" nếu tổng stock = 0 */}
        {product.variants?.every((v) => v.stock === 0) && (
          <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded-md backdrop-blur-sm">
            HẾT HÀNG
          </div>
        )}
      </div>

      {/* Nội dung Card */}
      <div className="pt-3 pb-1 flex flex-col text-left">
        {/* Tên sản phẩm - Màu xám đen, font vừa phải */}
        <h3 className="text-[16px] text-slate-700 leading-tight line-clamp-1 group-hover:text-blue-600 transition-colors">
          {product.productName}
        </h3>

        {/* Dòng phụ (Tương đương POSITIVE SUNFLOWER...) - Màu xám nhạt, in hoa */}
        <p className="text-gray-400 text-[11px] uppercase tracking-wide mt-1 truncate">
          {product.categories && product.categories.length > 0
            ? product.categories[0].categoryName
            : "QUÀ TẶNG"}
        </p>

        {/* Phần giá tiền */}
        <div className="mt-1 flex flex-col">
          <span className="text-slate-900 font-bold text-[19px] mt-[-2px]">
            {minPrice ? `${minPrice.toLocaleString("vi-VN")}đ` : "Liên hệ"}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
