import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package,
  Search,
  Edit,
  Trash2,
  Plus,
  Palette as PaletteIcon,
  Image as ImageIcon,
  CheckCircle,
  AlertTriangle,
  Clock,
  FileDown,
  RefreshCw,
} from "lucide-react";
import axiosClient from "@/api/axiosClient";
import StatCard from "@/components/common/StatCard";
import toast, { Toaster } from "react-hot-toast";
import { showErrorToast, showSuccessToast } from "@/components/common/toast";

const BaseURL = "http://localhost:3000";

interface Product {
  id: number;
  productName: string;
  status: "active" | "inactive";
  createdAt: string;
  design?: { id: number; name: string };
  images: { url: string; isPrimary: boolean }[];
  variants: any[];
}

const FILTER_TABS = [
  { value: "all", label: "Tất cả" },
  { value: "active", label: "Hoạt động" },
  { value: "inactive", label: "Đã ẩn" },
];

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
    } catch {
      showErrorToast("Không thể tải danh sách sản phẩm");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const res = await axiosClient.get("/products/seller/stats");
      setStats(res.data);
    } catch {
      console.error("Error fetching stats");
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchStats();
  }, []);

  const handleDeleteProduct = async (id: number, name: string) => {
    if (!window.confirm(`Xác nhận xóa sản phẩm "${name}"?`)) return;
    const loadingToast = toast.loading("Đang xóa...");
    try {
      setDeletingId(id);
      await axiosClient.delete(`/products/${id}`);
      toast.dismiss(loadingToast);

      showSuccessToast("Xóa thành công");
      setProducts((prev) => prev.filter((p) => p.id !== id));
      fetchStats();
    } catch (err: any) {
      toast.dismiss(loadingToast);

      showErrorToast(err.response?.data?.message || "Lỗi khi xóa");
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = products.filter((p) => {
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

  const countByStatus = (s: string) =>
    s === "all"
      ? products.length
      : products.filter((p) => p.status === s).length;

  return (
    <div className="w-full min-h-screen pb-16">
      <Toaster position="top-right" />

      {/* Page header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Quản lý sản phẩm
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              fetchProducts();
              fetchStats();
            }}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Làm mới"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={() => navigate("/seller/products/add")}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg hover:bg-black transition-colors shadow-sm"
          >
            <Plus size={15} /> Tạo sản phẩm
          </button>
        </div>
      </div>

      {/* STATS SECTION */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Tổng sản phẩm"
          value={stats?.total || 0}
          icon={<Package />}
          loading={loadingStats}
        />
        <StatCard
          label="Đang hoạt động"
          value={stats?.active || 0}
          icon={<CheckCircle />}
          loading={loadingStats}
        />
        <StatCard
          label="Hết hàng"
          value={stats?.outOfStock || 0}
          icon={<AlertTriangle />}
          loading={loadingStats}
        />
        <StatCard
          label="Thiết kế sẵn"
          value={products.filter((p) => p.design).length}
          icon={<PaletteIcon />}
          loading={loadingStats}
        />
      </div>

      {/* MAIN CARD: Toolbar + Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        {/* Toolbar */}
        <div className="px-5 py-3 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Search */}
          <div className="relative w-full sm:w-56">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={14}
            />
            <input
              type="text"
              placeholder="Tìm tên sản phẩm..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400 transition-colors bg-gray-50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Status filter tabs */}
          <div className="flex items-center gap-1 flex-wrap">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border font-medium transition-colors ${
                  statusFilter === tab.value
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                }`}
              >
                {tab.label}
                <span
                  className={`text-[10px] min-w-[16px] text-center rounded ${
                    statusFilter === tab.value
                      ? "text-white/70"
                      : "text-gray-400"
                  }`}
                >
                  {countByStatus(tab.value)}
                </span>
              </button>
            ))}
          </div>

          <div className="sm:ml-auto">
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <FileDown size={14} /> Xuất Excel
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-t border-b border-gray-100 bg-gray-50/60">
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700">
                  Thông tin sản phẩm
                </th>
                {/* <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700">Thiết kế</th> */}
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700">
                  Trạng thái
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700">
                  Biến thể
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-700">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center">
                    <div className="flex justify-center items-center gap-2 text-sm text-gray-400">
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                      Đang tải dữ liệu...
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center">
                    <Package className="mx-auto text-gray-200 mb-3" size={36} />
                    <p className="text-sm text-gray-400">
                      Không tìm thấy sản phẩm nào
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((product) => {
                  const img = getPrimaryImage(product);
                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-gray-50/70 transition-colors"
                    >
                      {/* Thông tin chính */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-lg border border-gray-100 bg-gray-50 overflow-hidden shrink-0 flex items-center justify-center">
                            {img ? (
                              <img
                                src={img}
                                className="w-full h-full object-contain"
                                alt=""
                              />
                            ) : (
                              <ImageIcon size={16} className="text-gray-300" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                              {product.productName}
                            </p>
                            <p className="text-[11px] text-gray-400 mt-0.5 font-mono">
                              ID: #{product.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Thiết kế */}
                      {/* <td className="px-5 py-4">
                        {product.design ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-600 border border-blue-100">
                            <PaletteIcon size={10} /> {product.design.name}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300 italic">Chưa có thiết kế</span>
                        )}
                      </td> */}

                      {/* Trạng thái */}
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded border ${
                            product.status === "active"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                              : "bg-gray-50 text-gray-500 border-gray-200"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${product.status === "active" ? "bg-emerald-500" : "bg-gray-400"}`}
                          />
                          {product.status === "active" ? "Hoạt động" : "Đã ẩn"}
                        </span>
                      </td>

                      {/* Biến thể */}
                      <td className="px-5 py-4 text-sm text-gray-500 font-medium">
                        {product.variants?.length || 0} variants
                      </td>

                      {/* Hành động */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() =>
                              navigate(`/seller/designs/${product.id}`)
                            }
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            title="Thiết kế"
                          >
                            <PaletteIcon size={15} />
                          </button>
                          <button
                            onClick={() =>
                              navigate(`/seller/products/edit/${product.id}`)
                            }
                            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                            title="Sửa"
                          >
                            <Edit size={15} />
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteProduct(
                                product.id,
                                product.productName,
                              )
                            }
                            disabled={deletingId === product.id}
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                            title="Xóa"
                          >
                            {deletingId === product.id ? (
                              <div className="w-3.5 h-3.5 border-2 border-gray-300 border-t-rose-500 rounded-full animate-spin" />
                            ) : (
                              <Trash2 size={15} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {!loading && filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/30">
            <p className="text-xs text-gray-400">
              Hiển thị{" "}
              <span className="font-medium text-gray-600">
                {filtered.length}
              </span>{" "}
              / {products.length} sản phẩm
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerProductManager;
