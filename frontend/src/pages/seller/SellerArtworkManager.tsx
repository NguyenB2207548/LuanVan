import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  Trash2,
  Image as ImageIcon,
  Palette,
  Calendar,
  Edit,
  CheckCircle,
  FileEdit,
  RefreshCw,
  FileDown,
  Clock,
} from "lucide-react";
import axiosClient from "@/api/axiosClient";
import StatCard from "@/components/common/StatCard";
import toast, { Toaster } from "react-hot-toast";

interface Artwork {
  id: number;
  artworkName: string;
  createdAt: string;
  thumbnailUrl?: string;
  // Giả sử có thêm status để filter như các trang khác
  status?: "active" | "draft";
}

interface ArtworkStats {
  total: number;
  usedInDesign: number;
  unused: number;
}

const FILTER_TABS = [
  { value: "all", label: "Tất cả" },
  { value: "used", label: "Đã liên kết" },
  { value: "unused", label: "Bản nháp" },
];

const SellerArtworkManager = () => {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [stats, setStats] = useState<ArtworkStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const navigate = useNavigate();

  const fetchArtworks = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get("designs/seller/artworks");
      setArtworks(res.data || []);
    } catch (err) {
      toast.error("Không thể tải danh sách artwork");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const res = await axiosClient.get("designs/seller/artworks/stats");
      setStats(res.data);
    } catch (err) {
      console.error("Lỗi fetch stats");
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchArtworks();
    fetchStats();
  }, []);

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa bản vẽ "${name || "không tên"}"?`)) return;
    const t = toast.loading("Đang xóa...");
    try {
      setDeletingId(id);
      await axiosClient.delete(`designs/artworks/${id}`);
      toast.success("Xóa thành công", { id: t });
      setArtworks((prev) => prev.filter((a) => a.id !== id));
      fetchStats();
    } catch (err) {
      toast.error("Không thể xóa thiết kế này", { id: t });
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = artworks.filter((art) => {
    const matchSearch = (art.artworkName || "").toLowerCase().includes(searchTerm.toLowerCase());
    // Giả sử logic lọc: usedInDesign được tính dựa trên backend, 
    // ở đây tui lọc tạm theo search để giữ cấu trúc filter tab cho đẹp
    return matchSearch;
  });

  return (
    <div className="w-full min-h-screen pb-16">
      <Toaster position="top-right" />

      {/* PAGE HEADER */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Thư viện Artwork</h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => { fetchArtworks(); fetchStats(); }}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Làm mới"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={() => navigate("/seller/artworks/add")}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg hover:bg-black transition-colors shadow-sm"
          >
            <Plus size={16} /> Tạo artwork
          </button>
        </div>
      </div>

      {/* STATS SECTION */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Tổng Artwork"
          value={stats?.total || 0}
          icon={<Palette />}
          loading={loadingStats}
        />
        <StatCard
          label="Đã liên kết"
          value={stats?.usedInDesign || 0}
          icon={<CheckCircle />}
          loading={loadingStats}
        />
        <StatCard
          label="Bản nháp"
          value={stats?.unused || 0}
          icon={<FileEdit />}
          loading={loadingStats}
        />

      </div>

      {/* MAIN CARD: Toolbar + Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">

        {/* Toolbar */}
        <div className="px-5 py-3 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Search */}
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input
              type="text"
              placeholder="Tìm tên bản vẽ..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400 transition-colors bg-gray-50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Status filter tabs */}
          <div className="flex items-center gap-1 flex-wrap">
            {FILTER_TABS.map(tab => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border font-medium transition-colors ${statusFilter === tab.value
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="sm:ml-auto">
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-emerald-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <FileDown size={15} /> Xuất Excel
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-t border-b border-gray-100 bg-gray-50/60">
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700">Tên bản vẽ</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700">Ngày tạo</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700">Trạng thái</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-700">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-5 py-16 text-center">
                    <div className="flex justify-center items-center gap-2 text-sm text-gray-400">
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                      Đang tải danh sách...
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-16 text-center">
                    <ImageIcon className="mx-auto text-gray-200 mb-3" size={36} />
                    <p className="text-sm text-gray-400">Không tìm thấy bản vẽ nào</p>
                  </td>
                </tr>
              ) : (
                filtered.map((art) => (
                  <tr key={art.id} className="hover:bg-gray-50/70 transition-colors cursor-pointer" onClick={() => navigate(`/seller/artworks/edit/${art.id}`)}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg border border-gray-100 bg-gray-50 overflow-hidden flex items-center justify-center shrink-0">
                          <Palette size={16} className="text-gray-400" />
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {art.artworkName || `Artwork #${art.id}`}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar size={14} className="text-gray-400" />
                        {new Date(art.createdAt).toLocaleDateString("vi-VN")}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded border bg-blue-50 text-blue-700 border-blue-100`}>
                        Mẫu thiết kế
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-1" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => navigate(`/seller/artworks/edit/${art.id}`)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(art.id, art.artworkName)}
                          disabled={deletingId === art.id}
                          className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                          title="Xóa"
                        >
                          {deletingId === art.id ? (
                            <div className="w-4 h-4 border-2 border-gray-300 border-t-rose-500 rounded-full animate-spin"></div>
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
        {!loading && filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/30">
            <p className="text-xs text-gray-400">
              Hiển thị <span className="font-medium text-gray-600">{filtered.length}</span> / {artworks.length} bản vẽ
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerArtworkManager;