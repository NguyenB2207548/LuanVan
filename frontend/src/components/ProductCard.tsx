import React from "react";
import { Link } from "react-router-dom";
import { ImageIcon } from "lucide-react";
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
      className="group flex flex-col w-full cursor-pointer"
    >
      {/* Container Ảnh (Bo góc nhẹ giống ảnh tham khảo) */}
      <div className="aspect-square w-full bg-gray-100 rounded-xl overflow-hidden relative">
        {displayImage ? (
          <img
            src={displayImage}
            alt={product.productName}
            // Thêm hiệu ứng zoom nhẹ khi hover cho mượt mà
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-in-out"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
            <ImageIcon size={40} strokeWidth={1} className="mb-2 opacity-40" />
            <span className="text-[10px] uppercase tracking-widest font-medium">
              No Image
            </span>
          </div>
        )}
      </div>

      {/* Nội dung Card (Chữ canh trái, thiết kế tối giản) */}
      <div className="pt-3 pb-1 flex flex-col text-left">
        {/* Tên sản phẩm */}
        <h3 className="font-normal text-[15px] text-gray-800 truncate">
          {product.productName}
        </h3>

        {/* Thể loại phụ (Chữ xám, in hoa nhỏ) */}
        <p className="text-gray-500 text-[11px] uppercase tracking-wider mt-1 truncate">
          {product.category?.categoryName || "CHƯA PHÂN LOẠI"}
        </p>

        {/* Giá tiền (Chữ to, in đậm) */}
        <div className="mt-1.5 flex items-center">
          <span className="text-gray-700 font-bold text-lg">
            {minPrice ? `${minPrice.toLocaleString("vi-VN")}đ` : "Liên hệ"}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
