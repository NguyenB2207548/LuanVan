import React, { useEffect, useState } from "react";
import axiosClient from "../../api/axiosClient";
import type { Product } from "../../types/product";
import { ShoppingBag, Palette, Truck, ImageIcon } from "lucide-react";
import { Link } from "react-router-dom";

const BASE_URL = "http://localhost:3000";

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

  // 1. Logic lấy ảnh hiển thị ưu tiên
  const getDisplayImage = (product: Product) => {
    // Ưu tiên 1: Ảnh chính của sản phẩm
    const primaryProductImg = product.images?.find((img) => img.isPrimary);
    if (primaryProductImg) return `${BASE_URL}${primaryProductImg.url}`;

    // Ưu tiên 2: Ảnh của variant đầu tiên có ảnh
    const firstVariantWithImg = product.variants?.find(
      (v) => v.images && v.images.length > 0,
    );
    if (firstVariantWithImg)
      return `${BASE_URL}${firstVariantWithImg.images[0].url}`;

    return null;
  };

  // 2. Logic lấy giá thấp nhất để hiển thị "Từ ... đ"
  const getMinPrice = (product: Product) => {
    const allPrices = product.variants
      ?.flatMap((v) => v.prices || [])
      .map((p) => parseFloat(p.amount.toString()));

    if (!allPrices || allPrices.length === 0) return null;
    return Math.min(...allPrices);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Hero Section giữ nguyên nội dung của bạn */}
      <section className="bg-white py-16 px-4 text-center border-b">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
          Món Quà Riêng Cho Người Đặc Biệt
        </h1>
        <p className="text-gray-500 max-w-xl mx-auto mb-8 text-lg">
          Tùy chỉnh thiết kế theo phong cách cá nhân của bạn.
        </p>
      </section>

      {/* Danh sách sản phẩm */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight">
            Sản phẩm mới nhất
          </h2>
          <div className="h-1 flex-1 bg-gray-100 ml-6 hidden md:block"></div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="h-80 bg-gray-200 animate-pulse rounded-2xl"
              ></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map((product) => {
              const displayImage = getDisplayImage(product);
              const minPrice = getMinPrice(product);

              return (
                <Link
                  key={product.id}
                  to={`/products/${product.id}`}
                  className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100 flex flex-col"
                >
                  {/* Container Ảnh */}
                  <div className="h-72 bg-gray-50 relative overflow-hidden">
                    {displayImage ? (
                      <img
                        src={displayImage}
                        alt={product.productName}
                        className="w-full h-full object-cover transition-transform duration-700 "
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300">
                        <ImageIcon size={40} strokeWidth={1} />
                        <span className="text-[10px] mt-2 uppercase tracking-widest">
                          No Image
                        </span>
                      </div>
                    )}

                    {/* Badge Category */}
                    <div className="absolute top-4 left-4">
                      <span className="bg-white/90 backdrop-blur-md text-gray-800 text-[10px] font-bold px-3 py-1 rounded-full shadow-sm">
                        {product.category?.categoryName.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Nội dung */}
                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors text-lg mb-2">
                      {product.productName}
                    </h3>

                    <p className="text-gray-500 text-sm line-clamp-2 mb-4 flex-1 italic">
                      {product.description || "Thiết kế độc đáo cho riêng bạn."}
                    </p>

                    <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                          Giá từ
                        </p>
                        <p className="text-indigo-600 font-extrabold text-lg">
                          {minPrice
                            ? `${minPrice.toLocaleString()}đ`
                            : "Liên hệ"}
                        </p>
                      </div>
                      <button className="bg-gray-900 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                        <ShoppingBag size={18} />
                      </button>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default HomePage;
