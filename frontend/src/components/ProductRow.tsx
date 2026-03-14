import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import type { Product } from "../types/product";
import ProductCard from "./ProductCard";
import { Skeleton } from "@/components/ui/skeleton";

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
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* TIÊU ĐỀ: Chuyển về font đứng, dày, cực kỳ gọn gàng */}
      <div className="flex flex-col items-center justify-center mb-10 text-center">
        <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight uppercase">
          {title}
        </h2>
        {/* Thanh bar mảnh và sang hơn */}
        <div className="w-12 h-1 bg-slate-900 mt-4 rounded-full"></div>
      </div>

      {/* GRID SẢN PHẨM */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5 gap-y-10">
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} className="space-y-4">
              <Skeleton className="aspect-[4/5] w-full rounded-2xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5 gap-y-10">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {/* NÚT XEM TẤT CẢ: Làm lại theo phong cách nút bấm bo tròn chuyên nghiệp */}
      <div className="mt-12 flex justify-center">
        <Link
          to={linkTo}
          className="group relative inline-flex items-center gap-3 px-8 py-3.5 bg-white border border-slate-200 rounded-full text-sm font-bold text-slate-900 shadow-sm hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all duration-300 active:scale-95"
        >
          <span>Xem tất cả</span>
          <ArrowRight
            size={18}
            className="transition-transform duration-300 group-hover:translate-x-1"
          />
        </Link>
      </div>
    </section>
  );
};

export default ProductRow;
