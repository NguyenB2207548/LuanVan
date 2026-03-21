import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import type { Product } from "../../types/product";
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
      {/* TIÊU ĐỀ*/}
      <div className="flex flex-col items-center justify-center mb-10 text-center">
        <h2 className="text-3xl md:text-3xl font-bold text-slate-900 tracking-normal">
          {title}
        </h2>
        <div className="w-10 h-0.5 bg-slate-300 mt-3 rounded-full"></div>
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
          className="group inline-flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 rounded-full text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 transition-all duration-300"
        >
          <span>Xem tất cả</span>
          <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </section>
  );
};

export default ProductRow;
