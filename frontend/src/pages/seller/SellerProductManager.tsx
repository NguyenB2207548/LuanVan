import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Package,
  Search,
  Edit,
  Trash2,
  Plus,
  Palette as PaletteIcon,
  ChevronDown,
  Image as ImageIcon,
  CheckCircle,
  AlertTriangle,
  Clock,
  FileDown,
} from "lucide-react";
import axiosClient from "@/api/axiosClient";
import StatCard from "@/components/common/StatCard";

const BaseURL = "http://localhost:3000";

interface Product {
  id: number;
  productName: string;
  status: string;
  createdAt: string;
  design?: { id: number; name: string };
  images: { url: string; isPrimary: boolean }[];
  variants: any[];
}

const SellerProductManager = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const navigate = useNavigate();

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get("/products/seller");
      setProducts(res.data.data || []);
    } catch (err) {
      console.error("Error fetching products", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const res = await axiosClient.get("/products/seller/stats");
      setStats(res.data);
    } catch (err) {
      console.error("Error fetching stats", err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchStats();
  }, []);

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.productName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getPrimaryImage = (product: Product) => {
    const primary = product.images.find((img) => img.isPrimary);
    return primary ? `${BaseURL}${primary.url}` : null;
  };

  const handleDeleteProduct = async (id: number, name: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${name}"?`)) return;
    try {
      setDeletingId(id);
      await axiosClient.delete(`/products/${id}`);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      fetchStats();
    } catch (err: any) {
      alert(err.response?.data?.message || "Không thể xóa sản phẩm. Vui lòng thử lại.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sản phẩm</h1>
          <p className="text-sm text-gray-500 mt-1">Quản lý danh sách sản phẩm của cửa hàng</p>
        </div>
        <button
          onClick={() => navigate("/seller/products/add")}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-black transition-colors"
        >
          <Plus size={15} />
          Tạo sản phẩm
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Tổng sản phẩm" value={stats?.total || 0} icon={<Package size={18} />} loading={loadingStats} />
        <StatCard label="Đang hoạt động" value={stats?.active || 0} icon={<CheckCircle size={18} />} loading={loadingStats} />
        <StatCard label="Hết hàng" value={stats?.outOfStock || 0} icon={<AlertTriangle size={18} />} loading={loadingStats} />
        <StatCard label="Chờ duyệt" value={0} icon={<Clock size={18} />} loading={loadingStats} />
      </div>

      {/* Table card — search + filter + table trong cùng 1 nền */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">

        {/* Toolbar */}
        <div className="px-5 py-3 flex flex-col sm:flex-row items-center gap-2">
          <div className="relative w-full sm:w-52">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
            <input
              type="text"
              placeholder="Tìm sản phẩm..."
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-gray-400 transition-colors"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Status filter buttons */}
          <div className="flex items-center gap-1">
            {[
              { value: "all", label: "Tất cả" },
              { value: "active", label: "Hoạt động" },
              { value: "inactive", label: "Đã ẩn" },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value)}
                className={`px-3 py-1.5 text-xs rounded-lg border font-medium transition-colors ${statusFilter === opt.value
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
                  }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="sm:ml-auto">
            <button
              onClick={() => {/* TODO: export excel logic */ }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
            >
              <FileDown size={13} />
              Xuất Excel
            </button>
          </div>
        </div>
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-5 py-3 text-left text-sm text-gray-900 font-semibold">Ảnh</th>
                <th className="px-5 py-3 text-left text-sm text-gray-900 font-semibold">Sản phẩm</th>
                <th className="px-5 py-3 text-left text-sm text-gray-900 font-semibold">Thiết kế</th>
                <th className="px-5 py-3 text-left text-sm text-gray-900 font-semibold">Trạng thái</th>
                <th className="px-5 py-3 text-right text-sm text-gray-900 font-semibold">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center">
                    <div className="flex justify-center items-center gap-2 text-sm text-gray-400">
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                      Đang tải...
                    </div>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center">
                    <Package className="mx-auto text-gray-200 mb-3" size={36} />
                    <p className="text-sm text-gray-400">Không tìm thấy sản phẩm nào</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">

                    {/* Ảnh */}
                    <td className="px-5 py-4">
                      <div className="w-14 h-14 rounded-lg border border-gray-100 bg-gray-50 overflow-hidden flex items-center justify-center shrink-0">
                        {getPrimaryImage(product) ? (
                          <img
                            src={getPrimaryImage(product) || ""}
                            alt={product.productName}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <ImageIcon className="text-gray-300" size={20} />
                        )}
                      </div>
                    </td>

                    {/* Tên + ID */}
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-gray-900 leading-snug max-w-xs truncate">
                        {product.productName}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5 font-mono">#{product.id}</p>
                    </td>

                    {/* Thiết kế */}
                    <td className="px-5 py-4">
                      {product.design ? (
                        <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
                          {product.design.name}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Chưa có thiết kế</span>
                      )}
                    </td>

                    {/* Trạng thái */}
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md border ${product.status === "active"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                        : "bg-gray-50 text-gray-500 border-gray-200"
                        }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${product.status === "active" ? "bg-emerald-500" : "bg-gray-400"
                          }`} />
                        {product.status === "active" ? "Hoạt động" : "Đã ẩn"}
                      </span>
                    </td>

                    {/* Hành động */}
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigate(`/seller/designs/${product.id}`)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Cấu hình thiết kế"
                        >
                          <PaletteIcon size={16} />
                        </button>
                        <Link
                          to={`/seller/products/edit/${product.id}`}
                          className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Edit size={16} />
                        </Link>
                        <button
                          onClick={() => handleDeleteProduct(product.id, product.productName)}
                          disabled={deletingId === product.id}
                          className={`p-2 rounded-lg transition-colors ${deletingId === product.id
                            ? "text-gray-300 cursor-not-allowed"
                            : "text-gray-400 hover:text-red-500 hover:bg-red-50"
                            }`}
                          title="Xóa"
                        >
                          {deletingId === product.id ? (
                            <div className="w-4 h-4 border-2 border-gray-300 border-t-red-400 rounded-full animate-spin" />
                          ) : (
                            <Trash2 size={16} />
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

        {/* Footer */}
        {!loading && filteredProducts.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              Hiển thị <span className="font-medium text-gray-600">{filteredProducts.length}</span> sản phẩm
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerProductManager;