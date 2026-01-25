import React, { useEffect, useState } from "react";
import axiosClient from "../api/axiosClient";
import type { Product } from "../types/product";
import { ShoppingBag, Palette, Truck } from "lucide-react";
import { Link } from "react-router-dom";

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
    <div className="min-h-screen bg-gray-50">
      {/* 1. Hero Section */}
      <section className="bg-white py-20 px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
          Món Quà Riêng Cho Người Đặc Biệt
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto mb-8">
          Tự tay thiết kế những món quà độc đáo với công nghệ in ấn hiện đại.
          Biến ý tưởng của bạn thành hiện thực ngay hôm nay.
        </p>
        <button className="bg-indigo-600 text-white px-8 py-3 rounded-full hover:bg-indigo-700 transition shadow-lg shadow-indigo-200">
          Khám Phá Bộ Sưu Tập
        </button>
      </section>

      {/* 2. Ưu điểm nổi bật */}
      <section className="py-12 bg-gray-50 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto px-4">
        <div className="flex flex-col items-center p-6 bg-white rounded-xl shadow-sm border border-gray-100">
          <Palette className="text-indigo-500 mb-4" size={40} />
          <h3 className="font-semibold text-lg">Tự Do Thiết Kế</h3>
          <p className="text-gray-500 text-center text-sm">
            Công cụ Konva mạnh mẽ, dễ dùng
          </p>
        </div>
        <div className="flex flex-col items-center p-6 bg-white rounded-xl shadow-sm border border-gray-100">
          <ShoppingBag className="text-indigo-500 mb-4" size={40} />
          <h3 className="font-semibold text-lg">Chất Lượng Cao</h3>
          <p className="text-gray-500 text-center text-sm">
            Chất liệu tuyển chọn, bền màu
          </p>
        </div>
        <div className="flex flex-col items-center p-6 bg-white rounded-xl shadow-sm border border-gray-100">
          <Truck className="text-indigo-500 mb-4" size={40} />
          <h3 className="font-semibold text-lg">Giao Hàng Nhanh</h3>
          <p className="text-gray-500 text-center text-sm">
            Đóng gói cẩn thận, vận chuyển toàn quốc
          </p>
        </div>
      </section>

      {/* 3. Danh sách sản phẩm */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold mb-8 text-gray-800 border-l-4 border-indigo-600 pl-4">
          Sản phẩm nổi bật
        </h2>

        {loading ? (
          <div className="text-center py-20 animate-pulse text-gray-500">
            Đang tải quà tặng...
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map((product) => (
              <Link
                key={product.id}
                to={`/products/${product.id}`} // Link dẫn thẳng vào trang chi tiết
                className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100"
              >
                <div className="h-64 bg-gray-100 relative overflow-hidden">
                  {/* Overlay khi hover */}
                  <div className="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/5 transition-colors z-10" />

                  {/* Placeholder ảnh */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300">
                    <ShoppingBag size={48} className="mb-2 opacity-20" />
                    <span className="text-xs font-medium">
                      Click để xem chi tiết
                    </span>
                  </div>

                  {/* Hiệu ứng zoom ảnh nhẹ nếu có ảnh thật sau này */}
                  <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-md text-[10px] font-bold text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    XEM NGAY
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="font-bold text-gray-800 group-hover:text-indigo-600 transition-colors line-clamp-1">
                    {product.productName}
                  </h3>
                  <p className="text-gray-500 text-xs mt-2 line-clamp-2 h-8 leading-relaxed">
                    {product.description ||
                      "Chưa có mô tả chi tiết cho sản phẩm này."}
                  </p>

                  <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                    <span className="text-sm font-bold text-indigo-600">
                      Xem lựa chọn
                    </span>
                    <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                      POD Available
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default HomePage;
