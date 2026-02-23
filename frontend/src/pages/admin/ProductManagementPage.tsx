import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Package,
  ImageIcon,
  Filter,
  // MoreHorizontal,
  ArrowUpDown,
} from "lucide-react";
import axiosClient from "../../api/axiosClient";
import type { Product } from "../../types/product";

const BASE_URL = "http://localhost:3000";

const ProductManagementPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // 1. Lấy danh sách sản phẩm
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axiosClient.get("/products");
      setProducts(response.data);
    } catch (error) {
      console.error("Lỗi tải sản phẩm:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // 2. Xóa sản phẩm
  const handleDelete = async (id: number) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) {
      try {
        await axiosClient.delete(`/products/${id}`);
        setProducts(products.filter((p) => p.id !== id));
      } catch (error) {
        alert("Lỗi khi xóa sản phẩm");
      }
    }
  };

  // 3. Filter
  const filteredProducts = products.filter((p) =>
    p.productName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 font-sans text-gray-800">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* === HEADER SECTION === */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Danh sách sản phẩm
            </h1>
          </div>

          <Link
            to="/admin/products/add"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm flex items-center gap-2 transition-colors"
          >
            <Plus size={18} /> Thêm sản phẩm
          </Link>
        </div>

        {/* === TOOLBAR (SEARCH & FILTER) === */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-96">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, mã sản phẩm..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            <button className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              <Filter size={16} /> Bộ lọc
            </button>
            <select className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer">
              <option value="">Tất cả danh mục</option>
              <option value="ao-thun">Áo thun</option>
              <option value="coc-su">Cốc sứ</option>
            </select>
          </div>
        </div>

        {/* === TABLE SECTION === */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-blue-600 mb-4"></div>
              <p className="text-gray-500 text-sm font-medium">
                Đang tải dữ liệu...
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Sản phẩm
                    </th>
                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Phân loại
                    </th>
                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 group flex items-center gap-1">
                      Giá bán{" "}
                      <ArrowUpDown
                        size={12}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                    </th>
                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">
                      Tồn kho
                    </th>
                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredProducts.map((product) => {
                    // Logic lấy ảnh & giá (giữ nguyên logic của bạn)
                    const displayImg =
                      product.images?.find((i) => i.isPrimary)?.url ||
                      product.images?.[0]?.url;
                    const prices =
                      product.variants?.flatMap(
                        (v) =>
                          v.prices?.map((p) =>
                            parseFloat(p.amount.toString()),
                          ) || [],
                      ) || [];
                    const minPrice = prices.length ? Math.min(...prices) : 0;
                    const maxPrice = prices.length ? Math.max(...prices) : 0;

                    // Format giá: Nếu min = max thì hiện 1 giá, ngược lại hiện range
                    const priceDisplay =
                      minPrice === maxPrice
                        ? `${minPrice.toLocaleString()}đ`
                        : `${minPrice.toLocaleString()}đ - ${maxPrice.toLocaleString()}đ`;

                    return (
                      <tr
                        key={product.id}
                        className="hover:bg-gray-50 transition-colors group"
                      >
                        {/* 1. PRODUCT INFO */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-md bg-gray-100 border border-gray-200 flex-shrink-0 overflow-hidden relative">
                              {displayImg ? (
                                <img
                                  src={`${BASE_URL}${displayImg}`}
                                  className="w-full h-full object-cover"
                                  alt=""
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                  <ImageIcon size={20} />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <Link
                                to={`/admin/products/${product.id}`}
                                className="text-sm font-semibold text-gray-900 hover:text-blue-600 truncate block max-w-[200px]"
                              >
                                {product.productName}
                              </Link>
                              <span className="text-xs text-gray-500">
                                ID: #{product.id}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* 2. CATEGORY */}
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {product.category?.categoryName || "Uncategorized"}
                          </span>
                        </td>

                        {/* 3. PRICE */}
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {priceDisplay}
                        </td>

                        {/* 4. STOCK */}
                        <td className="px-6 py-4 text-center">
                          <div className="inline-flex items-center gap-1.5 text-sm text-gray-600 bg-gray-50 px-2 py-1 rounded border border-gray-200">
                            <Package size={14} />
                            <span>{product.stock}</span>
                          </div>
                        </td>

                        {/* 5. STATUS */}
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                              product.status === "active"
                                ? "bg-green-50 text-green-700 border-green-200"
                                : "bg-gray-50 text-gray-600 border-gray-200"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${product.status === "active" ? "bg-green-600" : "bg-gray-400"}`}
                            ></span>
                            {product.status === "active" ? "Đang bán" : "Đã ẩn"}
                          </span>
                        </td>

                        {/* 6. ACTIONS */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Link
                              to={`/admin/products/${product.id}`}
                              className="p-1.5 text-blue-600 hover:text-blue-900"
                              title="Chỉnh sửa"
                            >
                              <Edit size={18} />
                            </Link>
                            <button
                              onClick={() => handleDelete(product.id)}
                              className="p-1.5 text-red-500 hover:text-red-700"
                              title="Xóa"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {/* Empty State */}
                  {!loading && filteredProducts.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-12 text-center text-gray-500"
                      >
                        <Package
                          size={48}
                          className="mx-auto text-gray-300 mb-3"
                        />
                        <p className="text-base font-medium">
                          Không tìm thấy sản phẩm nào
                        </p>
                        <p className="text-sm">
                          Thử thay đổi bộ lọc hoặc thêm sản phẩm mới.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-center border-t border-gray-200 pt-4">
          <div className="flex gap-2">
            <button className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 hover:bg-gray-50 transition-colors">
              Trước
            </button>
            <button className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 hover:bg-gray-50 transition-colors">
              Sau
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductManagementPage;
