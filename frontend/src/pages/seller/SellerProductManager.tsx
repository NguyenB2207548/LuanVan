import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Package,
  Search,
  Edit,
  Trash2,
  Plus,
  Palette as PaletteIcon,
  Copy,
  ChevronDown,
  Image as ImageIcon,
} from "lucide-react";
import axiosClient from "@/api/axiosClient";

const BaseURL = "http://localhost:3000";

// Định nghĩa Interface khớp với dữ liệu thực tế từ Backend bạn gửi
interface Product {
  id: number;
  productName: string;
  status: string;
  createdAt: string;
  design?: {
    id: number;
    name: string;
  };
  images: {
    url: string;
    isPrimary: boolean;
  }[];
  variants: any[];
}

const SellerProductManager = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const navigate = useNavigate();

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get("/products/seller");
      // Dựa trên JSON bạn gửi: res.data.data
      setProducts(res.data.data || []);
    } catch (err) {
      console.error("Error fetching products", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Logic lọc sản phẩm
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.productName
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getPrimaryImage = (product: Product) => {
    const primary = product.images.find((img) => img.isPrimary);
    return primary ? `${BaseURL}${primary.url}` : null;
  };

  // --- HÀM XỬ LÝ XÓA SẢN PHẨM ---
  const handleDeleteProduct = async (id: number, name: string) => {
    // 1. Hiển thị xác nhận
    const confirmDelete = window.confirm(
      `Bạn có chắc chắn muốn xóa sản phẩm "${name}"? Hành động này không thể hoàn tác.`,
    );

    if (!confirmDelete) return;

    try {
      setDeletingId(id);
      // 2. Gọi API xóa (Backend của bạn nên hỗ trợ DELETE /products/:id)
      await axiosClient.delete(`/products/${id}`);

      // 3. Cập nhật UI ngay lập tức mà không cần reload trang
      setProducts((prev) => prev.filter((p) => p.id !== id));

      // Có thể thêm thông báo thành công ở đây (toast, alert...)
    } catch (err: any) {
      console.error("Lỗi khi xóa sản phẩm:", err);
      alert(
        err.response?.data?.message ||
          "Không thể xóa sản phẩm. Vui lòng thử lại.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="w-full">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="text-blue-600" size={26} />
            Quản lý Sản phẩm
          </h1>
        </div>

        <button
          onClick={() => navigate("/seller/products/add")}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium text-sm rounded-md hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={16} />
          Tạo sản phẩm
        </button>
      </div>

      {/* FILTER & TOOLBAR - Dropdown Style */}
      <div className="bg-white p-4 border border-gray-200 rounded-lg mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="text-gray-400" size={16} />
          </div>
          <input
            type="text"
            placeholder="Tìm theo tên sản phẩm..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none block w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white cursor-pointer"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Đã ẩn</option>
            </select>
            <ChevronDown
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              size={14}
            />
          </div>
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Ảnh chính
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Thông tin sản phẩm
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Tên thiết kế
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-sm text-gray-500"
                  >
                    <div className="flex justify-center items-center gap-2">
                      <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                      Đang tải sản phẩm...
                    </div>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-sm text-gray-500"
                  >
                    Không tìm thấy sản phẩm nào.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr
                    key={product.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-16 w-16 rounded-md border border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center">
                        {getPrimaryImage(product) ? (
                          <img
                            src={getPrimaryImage(product) || ""}
                            alt={product.productName}
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <ImageIcon className="text-gray-300" size={24} />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900 truncate max-w-xs">
                        {product.productName}
                      </div>
                      <div className="text-xs text-gray-500 mt-1 font-mono">
                        ID: #{product.id}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {product.design ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                          {product.design.name}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 italic">
                          Chưa có thiết kế
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                          product.status === "active"
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : "bg-gray-50 text-gray-700 border border-gray-200"
                        }`}
                      >
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${product.status === "active" ? "bg-green-600 animate-pulse" : "bg-gray-400"}`}
                        />
                        {product.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() =>
                            navigate(`/seller/designs/${product.id}`)
                          }
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                          title="Cấu hình POD"
                        >
                          <PaletteIcon size={18} />
                        </button>
                        <button
                          className="text-gray-600 hover:text-gray-900 transition-colors"
                          title="Nhân bản"
                        >
                          <Copy size={18} />
                        </button>
                        <Link
                          to={`/seller/products/edit/${product.id}`}
                          className="text-gray-600 hover:text-blue-600 transition-colors p-1"
                          title="Chỉnh sửa"
                        >
                          <Edit size={18} />
                        </Link>
                        <button
                          onClick={() =>
                            handleDeleteProduct(product.id, product.productName)
                          }
                          disabled={deletingId === product.id}
                          className={`${
                            deletingId === product.id
                              ? "text-gray-300 cursor-not-allowed"
                              : "text-red-500 hover:text-red-700"
                          } transition-colors`}
                          title="Xóa"
                        >
                          {deletingId === product.id ? (
                            <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Trash2 size={18} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FOOTER */}
      {!loading && filteredProducts.length > 0 && (
        <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
          <div>
            Hiển thị{" "}
            <span className="font-medium">{filteredProducts.length}</span> sản
            phẩm
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerProductManager;
function setDeletingId(id: number) {
  throw new Error("Function not implemented.");
}
