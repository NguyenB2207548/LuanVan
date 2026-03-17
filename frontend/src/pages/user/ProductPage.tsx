import { useEffect, useState } from "react";
import axiosClient from "../../api/axiosClient";
import type { Product } from "../../types/product";
import ProductCard from "../../components/user/ProductCard";
import { Search, Filter, SlidersHorizontal, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

// Định nghĩa thêm interface cho Category (nếu bạn chưa có trong file types)
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
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          axiosClient.get("/products"),
          axiosClient.get("/categories"),
        ]);

        // SỬA TẠI ĐÂY:
        // Vì backend trả về { data: [], meta: {} }, bạn cần lấy .data.data
        setProducts(productsRes.data.data || []);

        // Kiểm tra lại categoriesRes, nếu nó cũng có cấu trúc tương tự thì:
        setCategories(categoriesRes.data.data || categoriesRes.data);
      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu:", error);
        setProducts([]); // Fallback về mảng rỗng để không bị crash
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredProducts = Array.isArray(products)
    ? products.filter((product) => {
        const matchesSearch = product.productName
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

        // Vì product.categories là một mảng, chúng ta dùng .some để kiểm tra
        const matchesCategory =
          activeCategory === "all" ||
          product.categories?.some((cat: any) => cat.id === activeCategory);

        return matchesSearch && matchesCategory;
      })
    : [];

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-20">
      {/* BREADCRUMB NẰM CHUNG NỀN */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-2">
        <nav className="flex text-sm text-gray-500 items-center gap-2">
          <Link to="/" className="hover:text-blue-600 transition-colors">
            Trang chủ
          </Link>
          <ChevronRight size={14} />
          <span className="text-gray-900 font-medium">Sản phẩm</span>
        </nav>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 flex flex-col lg:flex-row gap-8">
        {/* SIDEBAR (BỘ LỌC) */}
        <div className="lg:w-1/4 flex-shrink-0 space-y-6">
          {/* Box Tìm kiếm */}
          <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Search size={18} className="text-gray-500" /> Tìm kiếm
            </h3>
            <div className="relative">
              <input
                type="text"
                placeholder="Nhập tên sản phẩm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-3 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          {/* Box Danh mục */}
          <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Filter size={18} className="text-gray-500" /> Danh mục
            </h3>
            <ul className="space-y-2">
              {/* Nút mặc định: Tất cả sản phẩm */}
              <li>
                <button
                  onClick={() => setActiveCategory("all")}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    activeCategory === "all"
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  Tất cả sản phẩm
                </button>
              </li>

              {/* Render danh sách danh mục từ API */}
              {categories.map((cat) => (
                <li key={cat.id}>
                  <button
                    onClick={() => setActiveCategory(cat.id)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      activeCategory === cat.id
                        ? "bg-blue-50 text-blue-700 font-medium"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    {cat.categoryName}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* PRODUCT GRID */}
        <div className="lg:w-3/4">
          {/* Top Bar (Sắp xếp & Hiển thị số lượng) */}
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-600">
              Hiển thị{" "}
              <span className="font-bold text-gray-900">
                {filteredProducts.length}
              </span>{" "}
              sản phẩm
            </p>
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-600 flex items-center gap-2">
                <SlidersHorizontal size={16} /> Sắp xếp theo:
              </label>
              <select className="bg-gray-50 border border-gray-200 text-sm rounded-md py-1.5 px-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-700">
                <option value="newest">Mới nhất</option>
                <option value="price_asc">Giá: Thấp đến Cao</option>
                <option value="price_desc">Giá: Cao đến Thấp</option>
              </select>
            </div>
          </div>

          {/* Grid Sản phẩm */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div
                  key={n}
                  className="aspect-[4/5] bg-white border border-gray-200 shadow-sm animate-pulse rounded-lg"
                ></div>
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            // Empty State khi tìm kiếm không ra kết quả
            <div className="bg-white border border-gray-200 rounded-lg p-16 flex flex-col items-center justify-center text-center">
              <Search size={48} className="text-gray-300 mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                Không tìm thấy sản phẩm
              </h3>
              <p className="text-gray-500 text-sm">
                Rất tiếc, không có sản phẩm nào khớp với tìm kiếm của bạn. Hãy
                thử từ khóa khác.
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setActiveCategory("all");
                }}
                className="mt-6 text-blue-600 font-medium hover:text-blue-800 text-sm"
              >
                Xóa bộ lọc
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductPage;
