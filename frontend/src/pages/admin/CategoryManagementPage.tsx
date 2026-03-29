import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Tags,
  Search,
  Edit,
  Trash2,
  Plus,
  FolderTree,
  RefreshCw,
  Layers,
  PackageCheck,
  TrendingUp,
  BarChart,
  Calendar,
  Loader2,
} from "lucide-react";
import axiosClient from "../../api/axiosClient";
import StatCard from "@/components/common/StatCard";
import toast, { Toaster } from "react-hot-toast";

interface Category {
  id: number;
  categoryName: string;
  description?: string;
  createdAt: string;
  productCount?: number; // Backend trả về số lượng SP trong danh mục
}

interface CategoryStats {
  total: number;
  totalProductsMapped: number;
  mostPopulated: { name: string; productCount: number } | null;
}

const CategoryManagementPage = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState<CategoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get("/categories");
      setCategories(res.data.data || res.data || []);
    } catch (err) {
      toast.error("Không thể tải danh sách danh mục");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const res = await axiosClient.get("/categories/admin/stats");
      setStats(res.data);
    } catch (err) {
      console.error("Lỗi fetch thống kê danh mục");
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchStats();
  }, []);

  const handleDeleteCategory = async (id: number, name: string) => {
    if (!window.confirm(`Xác nhận xóa danh mục "${name}"? Các sản phẩm thuộc danh mục này sẽ bị mất liên kết.`)) return;

    const loadingToast = toast.loading("Đang xóa...");
    try {
      await axiosClient.delete(`/categories/${id}`);
      toast.success("Xóa danh mục thành công", { id: loadingToast });
      setCategories((prev) => prev.filter((cat) => cat.id !== id));
      fetchStats();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Không thể xóa danh mục", { id: loadingToast });
    }
  };

  const filteredCategories = categories.filter((cat) =>
    (cat.categoryName || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full min-h-screen bg-gray-50 pb-16">
      <Toaster position="top-right" />

      {/* PAGE HEADER */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <FolderTree className="text-blue-600" size={24} />
            Quản lý danh mục
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Phân loại sản phẩm trên toàn hệ thống</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { fetchCategories(); fetchStats(); }}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Làm mới"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={() => navigate("/admin/categories/add")}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus size={16} /> Thêm danh mục
          </button>
        </div>
      </div>

      {/* STATS SECTION */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Tổng danh mục"
          value={stats?.total || 0}
          icon={<Layers />}
          loading={loadingStats}
        />
        <StatCard
          label="SP đã phân loại"
          value={stats?.totalProductsMapped || 0}
          icon={<PackageCheck />}
          loading={loadingStats}
        />
        <StatCard
          label={`Hot: ${stats?.mostPopulated?.name || 'N/A'}`}
          value={stats?.mostPopulated?.productCount || 0}
          icon={<TrendingUp />}
          loading={loadingStats}
        />
        <StatCard
          label="Trung bình/loại"
          value={stats ? (stats.totalProductsMapped / (stats.total || 1)).toFixed(1) : 0}
          icon={<BarChart />}
          loading={loadingStats}
        />
      </div>

      {/* MAIN CARD: Toolbar + Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">

        {/* Toolbar */}
        <div className="px-5 py-3 flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-white">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input
              type="text"
              placeholder="Tìm tên danh mục..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400 transition-colors bg-gray-50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <span className="sm:ml-auto text-xs text-gray-400 font-medium uppercase tracking-wider">
            {filteredCategories.length} danh mục
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-t border-b border-gray-100 bg-gray-50/60">
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-20">ID</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Tên danh mục</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Mô tả</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Ngày tạo</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center">
                    <div className="flex justify-center items-center gap-2 text-sm text-gray-400 italic">
                      <Loader2 className="animate-spin text-blue-600" size={18} />
                      Đang đồng bộ danh mục...
                    </div>
                  </td>
                </tr>
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center text-sm text-gray-400 italic">
                    Không tìm thấy danh mục nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredCategories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-5 py-4 text-xs font-mono text-gray-400">
                      #{cat.id}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                          <Tags size={14} />
                        </div>
                        <span className="text-sm font-semibold text-gray-900 uppercase tracking-tight">
                          {cat.categoryName}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-xs text-gray-500 line-clamp-1 max-w-xs">
                        {cat.description || <span className="italic text-gray-300">Không có mô tả</span>}
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} className="text-gray-400" />
                        {cat.createdAt ? new Date(cat.createdAt).toLocaleDateString("vi-VN") : "N/A"}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => navigate(`/admin/categories/edit/${cat.id}`)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all shadow-sm border border-gray-100 bg-white"
                          title="Sửa danh mục"
                        >
                          <Edit size={15} />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(cat.id, cat.categoryName)}
                          className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-all shadow-sm border border-gray-100 bg-white"
                          title="Xóa danh mục"
                        >
                          <Trash2 size={15} />
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
        {!loading && filteredCategories.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/30">
            <p className="text-xs text-gray-400">
              Mẹo: Click vào nút <Edit size={10} className="inline mb-1" /> để cập nhật tên hoặc mô tả danh mục.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryManagementPage;