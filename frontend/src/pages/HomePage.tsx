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
        <button className="bg-indigo-600 text-white px-8 py-3 rounded-full hover:bg-indigo-700 transition">
          Khám Phá Ngay
        </button>
      </section>

      {/* 2. Ưu điểm nổi bật */}
      <section className="py-12 bg-gray-50 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto px-4">
        <div className="flex flex-col items-center p-6 bg-white rounded-xl shadow-sm">
          <Palette className="text-indigo-500 mb-4" size={40} />
          <h3 className="font-semibold text-lg">Tự Do Thiết Kế</h3>
          <p className="text-gray-500 text-center text-sm">
            Công cụ Konva mạnh mẽ, dễ dùng
          </p>
        </div>
        <div className="flex flex-col items-center p-6 bg-white rounded-xl shadow-sm">
          <ShoppingBag className="text-indigo-500 mb-4" size={40} />
          <h3 className="font-semibold text-lg">Chất Lượng Cao</h3>
          <p className="text-gray-500 text-center text-sm">
            Chất liệu tuyển chọn, bền màu
          </p>
        </div>
        <div className="flex flex-col items-center p-6 bg-white rounded-xl shadow-sm">
          <Truck className="text-indigo-500 mb-4" size={40} />
          <h3 className="font-semibold text-lg">Giao Hàng Nhanh</h3>
          <p className="text-gray-500 text-center text-sm">
            Đóng gói cẩn thận, vận chuyển toàn quốc
          </p>
        </div>
      </section>

      {/* 3. Danh sách sản phẩm */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold mb-8 text-gray-800">
          Sản phẩm nổi bật
        </h2>

        {loading ? (
          <div className="text-center py-20">Đang tải quà tặng...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                className="group bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition"
              >
                <div className="h-64 bg-gray-200 relative">
                  {/* Thay bằng ảnh thật từ database của bạn */}
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                    No Image
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-gray-800 group-hover:text-indigo-600 transition">
                    {product.productName}
                  </h3>
                  <p className="text-gray-500 text-sm mt-1 line-clamp-2">
                    {product.description}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="font-bold text-indigo-600">
                      Liên hệ báo giá
                    </span>
                    <Link
                      to={`/designer/${product.id}`}
                      className="text-sm bg-gray-100 px-3 py-1 rounded hover:bg-gray-200"
                    >
                      Thiết kế ngay
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default HomePage;
