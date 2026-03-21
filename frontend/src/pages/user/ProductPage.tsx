import { useEffect, useState, useMemo } from "react";
import axiosClient from "../../api/axiosClient";
import type { Product } from "../../types/product";
import ProductCard from "../../components/user/ProductCard";
import { Search, Filter, SlidersHorizontal, ChevronRight, XCircle, ArrowDownUp } from "lucide-react";
import { Link } from "react-router-dom";

interface Category {
  id: number;
  categoryName: string;
}

const ProductPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | number>("all");
  const [sortOption, setSortOption] = useState("newest");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [productsRes, categoriesRes] = await Promise.all([
          axiosClient.get("/products"),
          axiosClient.get("/categories"),
        ]);
        setProducts(productsRes.data.data || []);
        setCategories(categoriesRes.data.data || categoriesRes.data);
      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const processedProducts = useMemo(() => {
    if (!Array.isArray(products)) return [];

    let itemsWithMinPrice = products.map((product) => {
      const prices = product.variants?.map((v: any) => v.price) || [];
      const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
      return { ...product, minPrice };
    });

    let result = itemsWithMinPrice.filter((product) => {
      const matchesSearch = product.productName
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesCategory =
        activeCategory === "all" ||
        product.categories?.some((cat: any) => cat.id === activeCategory);
      return matchesSearch && matchesCategory;
    });

    return result.sort((a, b) => {
      if (sortOption === "price_asc") return a.minPrice - b.minPrice;
      if (sortOption === "price_desc") return b.minPrice - a.minPrice;
      if (sortOption === "newest") {
        return new Date(b.createdAt || "").getTime() - new Date(a.createdAt || "").getTime();
      }
      return 0;
    });
  }, [products, searchQuery, activeCategory, sortOption]);

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      {/* BREADCRUMB */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <nav className="flex text-xs sm:text-sm text-gray-500 items-center gap-2">
          <Link to="/" className="hover:text-blue-600 transition-colors">Trang chủ</Link>
          <ChevronRight size={14} className="text-gray-400" />
          <span className="text-gray-900 font-medium">Tất cả sản phẩm</span>
        </nav>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row gap-8">
        {/* SIDEBAR - TẤT CẢ FILTER NẰM Ở ĐÂY */}
        <aside className="lg:w-72 flex-shrink-0 space-y-5">
          {/* 1. Box Tìm kiếm */}
          <div className="bg-white p-6 rounded-md border border-gray-200 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Search size={16} className="text-gray-400" /> Tìm kiếm
            </h3>
            <input
              type="text"
              placeholder="Tên sản phẩm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          {/* 2. Box Sắp xếp */}
          <div className="bg-white p-6 rounded-md border border-gray-200 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <SlidersHorizontal size={16} className="text-gray-400" /> Sắp xếp theo
            </h3>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none cursor-pointer"
            >
              <option value="newest">Mới nhất</option>
              <option value="price_asc">Giá tăng dần</option>
              <option value="price_desc">Giá giảm dần</option>
            </select>
          </div>

          {/* 3. Box Danh mục */}
          <div className="bg-white p-6 rounded-md border border-gray-200 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Filter size={16} className="text-gray-400" /> Danh mục
            </h3>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => setActiveCategory("all")}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-all ${activeCategory === "all"
                    ? "bg-blue-50 text-blue-600 font-semibold"
                    : "text-gray-600 hover:bg-gray-50"
                  }`}
              >
                Tất cả sản phẩm
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-all ${activeCategory === cat.id
                      ? "bg-blue-50 text-blue-600 font-semibold"
                      : "text-gray-600 hover:bg-gray-50"
                    }`}
                >
                  {cat.categoryName}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* MAIN AREA - CHỈ HIỂN THỊ KẾT QUẢ */}
        <main className="flex-1">

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="aspect-[3/4] bg-white border border-gray-100 rounded-md animate-pulse" />
              ))}
            </div>
          ) : processedProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {processedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-md py-20 flex flex-col items-center justify-center text-center">
              <XCircle size={40} className="text-gray-200 mb-4" />
              <h3 className="text-base font-bold text-gray-900 mb-2">Không tìm thấy sản phẩm</h3>
              <p className="text-sm text-gray-500 mb-6">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm của bạn.</p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setActiveCategory("all");
                  setSortOption("newest");
                }}
                className="text-sm font-bold text-blue-600 hover:underline"
              >
                Đặt lại tất cả bộ lọc
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ProductPage;