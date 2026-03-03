import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import type { Product } from "../../types/product";
import { ArrowRight } from "lucide-react";
import ProductCard from "../../components/ProductCard";

const HomePage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axiosClient.get("/products");
        setProducts(response.data);
      } catch (error) {
        console.error("Lỗi khi lấy sản phẩm:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* HERO SECTION */}
      <section className="bg-gray-50 py-20 px-4 text-center border-b border-gray-200">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">
            Món Quà Cho Người Đặc Biệt
          </h1>
          <p className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto">
            Tùy chỉnh thiết kế theo phong cách cá nhân của bạn. Dễ dàng tạo ra
            những sản phẩm độc đáo, mang đậm dấu ấn riêng và đầy ý nghĩa.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-3.5 rounded-md font-medium hover:bg-blue-700 transition-colors shadow-sm"
          >
            Khám phá ngay <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* DANH SÁCH SẢN PHẨM */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
              Sản phẩm nổi bật
            </h2>
          </div>
          <Link
            to="/products"
            className="hidden md:flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
          >
            Xem tất cả <ArrowRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="aspect-[4/5] bg-gray-100 animate-pulse rounded-lg border border-gray-200"
              ></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default HomePage;
