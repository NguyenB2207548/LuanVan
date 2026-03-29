import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Trash2,
  Image as ImageIcon,
  Layers,
  Clock,
  ExternalLink,
  Box,
  CheckCircle,
  AlertCircle,
  Edit,
  RefreshCw,
  FileDown
} from "lucide-react";
import axiosClient from "@/api/axiosClient";
import { format } from "date-fns";
import StatCard from "@/components/common/StatCard";
import toast, { Toaster } from "react-hot-toast";

const BASE_URL = "http://localhost:3000";

// --- INTERFACES ---
interface MergedDesign {
  id: number;
  designName: string;
  createdAt: string;
  product: {
    id: number;
    productName: string;
    images: { url: string; isPrimary: boolean }[];
  } | null;
  artwork: {
    id: number;
    artworkName: string;
    layersJson: {
      details: any[];
      printArea: {
        x: number;
        y: number;
        width: number;
        height: number;
      };
    };
  };
}

interface DesignStats {
  total: number;
  activeDesigns: number;
  pendingDesigns: number;
  designedProducts: number;
}

const FILTER_TABS = [
  { value: "all", label: "Tất cả" },
  { value: "active", label: "Đã hoàn tất" },
  { value: "pending", label: "Chờ Artwork" },
];

const SellerDesignManager = () => {
  const navigate = useNavigate();
  const [mergedDesigns, setMergedDesigns] = useState<MergedDesign[]>([]);
  const [stats, setStats] = useState<DesignStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    fetchMergedDesigns();
    fetchStats();
  }, []);

  const fetchMergedDesigns = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get("/designs/seller/list");
      setMergedDesigns(res.data || []);
    } catch (err) {
      toast.error("Không thể tải danh sách thiết kế");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const res = await axiosClient.get("/designs/seller/designs/stats");
      setStats(res.data);
    } catch (err) {
      console.error("Lỗi fetch stats");
    } finally {
      setLoadingStats(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Xác nhận xóa thiết kế "${name}"?`)) return;
    const t = toast.loading("Đang xóa...");
    try {
      setDeletingId(id);
      await axiosClient.delete(`/designs/${id}`);
      toast.success("Xóa thành công", { id: t });
      setMergedDesigns((prev) => prev.filter((d) => d.id !== id));
      fetchStats();
    } catch (err) {
      toast.error("Không thể xóa thiết kế này", { id: t });
    } finally {
      setDeletingId(null);
    }
  };

  const getThumbnail = (design: MergedDesign) => {
    if (!design.product || !design.product.images) return null;
    const primaryImg = design.product.images.find((img) => img.isPrimary);
    const displayImg = primaryImg ? primaryImg.url : design.product.images[0]?.url;
    return displayImg ? `${BASE_URL}${displayImg}` : null;
  };

  const filtered = mergedDesigns.filter((d) => {
    const matchSearch = (d.designName || "").toLowerCase().includes(searchTerm.toLowerCase());
    // Thêm logic filter status nếu backend hỗ trợ, ở đây tui giữ cấu trúc cho đồng bộ UI
    return matchSearch;
  });

  const countByStatus = (s: string) => {
    if (s === "all") return mergedDesigns.length;
    if (s === "active") return stats?.activeDesigns || 0;
    if (s === "pending") return stats?.pendingDesigns || 0;
    return 0;
  };

  return (
    <div className="w-full min-h-screen bg-gray-50 pb-16">
      <Toaster position="top-right" />

      {/* PAGE HEADER */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Quản lý thiết kế</h1>

        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { fetchMergedDesigns(); fetchStats(); }}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Làm mới"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={() => navigate("add")}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg hover:bg-black transition-colors shadow-sm"
          >
            <Plus size={16} /> Tạo thiết kế
          </button>
        </div>
      </div>

      {/* STATS SECTION */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Tổng thiết kế" value={stats?.total || 0} icon={<Layers />} loading={loadingStats} />
        <StatCard label="Đã hoàn tất" value={stats?.activeDesigns || 0} icon={<CheckCircle />} loading={loadingStats} />
        <StatCard label="Chờ Artwork" value={stats?.pendingDesigns || 0} icon={<AlertCircle />} loading={loadingStats} />
        <StatCard label="Độ phủ sản phẩm" value={stats?.designedProducts || 0} icon={<Box />} loading={loadingStats} />
      </div>

      {/* MAIN CARD: Toolbar + Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">

        {/* Toolbar */}
        <div className="px-5 py-3 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input
              type="text"
              placeholder="Tìm tên thiết kế..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400 transition-colors bg-gray-50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

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
                <span className={`text-[10px] min-w-[16px] text-center rounded ${statusFilter === tab.value ? "text-white/70" : "text-gray-400"
                  }`}>
                  {countByStatus(tab.value)}
                </span>
              </button>
            ))}
          </div>

          <div className="sm:ml-auto">
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-emerald-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <FileDown size={14} /> Xuất Excel
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-t border-b border-gray-100 bg-gray-50/60">
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700">Thông tin thiết kế</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700">Thông số in</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700">Ngày gộp</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-700">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-5 py-16 text-center text-sm text-gray-400">
                    <div className="flex justify-center items-center gap-2">
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                      Đang tải dữ liệu...
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-16 text-center">
                    <ImageIcon className="mx-auto text-gray-200 mb-3" size={36} />
                    <p className="text-sm text-gray-400">Không tìm thấy thiết kế nào</p>
                  </td>
                </tr>
              ) : (
                filtered.map((design) => {
                  const thumb = getThumbnail(design);
                  const printArea = design.artwork?.layersJson?.printArea || { width: 0, height: 0 };

                  return (
                    <tr key={design.id} className="hover:bg-gray-50/70 transition-colors cursor-pointer" onClick={() => navigate(`edit/${design.id}`)}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-lg border border-gray-100 bg-gray-50 overflow-hidden shrink-0 flex items-center justify-center">
                            {thumb ? (
                              <img src={thumb} className="w-full h-full object-contain" alt="" />
                            ) : (
                              <ImageIcon size={16} className="text-gray-300" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate max-w-[250px]">{design.designName}</p>
                            <p className="text-[11px] text-blue-600 font-bold uppercase tracking-tight mt-0.5">
                              Phôi: {design.product?.productName || "N/A"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-xs font-medium text-gray-700">
                          {printArea.width}x{printArea.height}px
                        </div>
                        <div className="text-[10px] text-gray-400 mt-0.5">Vùng in ảo</div>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-500 font-medium">
                        {format(new Date(design.createdAt), "dd/MM/yyyy")}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end gap-1" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => navigate(`edit/${design.id}`)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            title="Chỉnh sửa"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => thumb && window.open(thumb, "_blank")}
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                            title="Xem ảnh"
                          >
                            <ExternalLink size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(design.id, design.designName)}
                            disabled={deletingId === design.id}
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                            title="Xóa"
                          >
                            {deletingId === design.id ? (
                              <div className="w-3.5 h-3.5 border-2 border-gray-300 border-t-rose-500 rounded-full animate-spin" />
                            ) : (
                              <Trash2 size={16} />
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
              Hiển thị <span className="font-medium text-gray-600">{filtered.length}</span> / {mergedDesigns.length} thiết kế
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerDesignManager;