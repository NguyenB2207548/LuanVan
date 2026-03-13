import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import type { Product } from "../types/product";
import ProductCard from "./ProductCard";

export interface ProductRowProps {
  title: string;
  linkTo: string;
  products: Product[];
  loading: boolean;
}

const ProductRow: React.FC<ProductRowProps> = ({
  title,
  linkTo,
  products,
  loading,
}) => {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      {/* KHU VỰC TIÊU ĐỀ: Nằm giữa, to hơn */}
      <div className="flex flex-col items-center justify-center mb-10 text-center">
        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
          {title}
        </h2>
        {/* Dòng line trang trí nhỏ dưới tiêu đề */}
        <div className="w-12 h-1 bg-gray-900 mt-4 rounded-full opacity-80"></div>
      </div>

      {/* KHU VỰC GRID SẢN PHẨM */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 gap-y-10">
          {[1, 2, 3, 4, 5].map((n) => (
            <div
              key={n}
              className="aspect-[3/4] bg-gray-100 animate-pulse rounded-xl border border-gray-100"
            ></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 gap-y-10">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {/* KHU VỰC NÚT XEM TẤT CẢ: Chữ to hơn (text-lg), icon to hơn (size 20) */}
      <div className="mt-12 flex justify-center">
        <Link
          to={linkTo}
          className="group flex items-center gap-1.5 text-lg font-bold text-gray-900 hover:text-gray-600 transition-colors"
        >
          <span className="underline underline-offset-[4px] decoration-2">
            Xem tất cả
          </span>
          <ArrowRight
            size={20}
            className="group-hover:translate-x-1.5 transition-transform duration-300"
          />
        </Link>
      </div>
    </section>
  );
};

export default ProductRow;
