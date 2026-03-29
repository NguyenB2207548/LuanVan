import { useState, useEffect } from "react";
import {
  CheckCircle2,
  XCircle,
  Eye,
  Clock,
  Search,
  UserCheck,
  X,
  Store,
  Truck,
  RefreshCw,
  FileCheck,
} from "lucide-react";
import axiosClient from "../../api/axiosClient";
import toast, { Toaster } from "react-hot-toast";
import StatCard from "@/components/common/StatCard";

interface ApprovalRequest {
  id: number;
  requestedRole: "seller" | "shipper";
  status: "pending" | "approved" | "rejected";
  shopName?: string;
  shopAddress?: string;
  vehiclePlate?: string;
  shipperAddress?: string;
  createdAt: string;
  user: {
    fullName: string;
    email: string;
    phoneNumber: string;
  };
}

interface ApprovalStats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
  pendingSeller: number;
  pendingShipper: number;
}

const FILTER_TABS = [
  { value: "all", label: "Tất cả" },
  { value: "pending", label: "Chờ duyệt" },
  { value: "approved", label: "Đã duyệt" },
  { value: "rejected", label: "Từ chối" },
];

const ApprovalManagementPage = () => {
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [stats, setStats] = useState<ApprovalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedReq, setSelectedReq] = useState<ApprovalRequest | null>(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get("/approvals");
      setRequests(res.data || []);
    } catch (err) {
      toast.error("Không thể lấy danh sách yêu cầu");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const res = await axiosClient.get("/approvals/admin/stats");
      setStats(res.data);
    } catch (err) {
      console.error("Lỗi fetch thống kê approval");
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchStats();
  }, []);

  const handleAction = async (id: number, action: "approve" | "reject") => {
    const confirmMsg = action === "approve" ? "Phê duyệt đối tác này?" : "Từ chối yêu cầu này?";
    if (!window.confirm(confirmMsg)) return;

    const loadingToast = toast.loading("Đang xử lý...");
    try {
      await axiosClient.patch(`/approvals/${id}/${action}`);
      toast.success(action === "approve" ? "Đã phê duyệt thành công" : "Đã từ chối yêu cầu", { id: loadingToast });

      fetchRequests();
      fetchStats();
      setSelectedReq(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Lỗi xử lý", { id: loadingToast });
    }
  };

  const filteredRequests = requests.filter((r) => {
    const matchSearch =
      r.user?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.shopName?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="w-full min-h-screen bg-gray-50 pb-16">
      <Toaster position="top-right" />

      {/* PAGE HEADER */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <UserCheck className="text-blue-600" size={24} />
            Phê duyệt đối tác
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Quản lý hồ sơ đăng ký Seller và Shipper</p>
        </div>
        <button
          onClick={() => { fetchRequests(); fetchStats(); }}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* STATS SECTION */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Chờ xử lý"
          value={stats?.pending || 0}
          icon={<Clock />}
          loading={loadingStats}
        />
        <StatCard
          label="Đăng ký Seller"
          value={stats?.pendingSeller || 0}
          icon={<Store />}
          loading={loadingStats}
        />
        <StatCard
          label="Đăng ký Shipper"
          value={stats?.pendingShipper || 0}
          icon={<Truck />}
          loading={loadingStats}
        />
        <StatCard
          label="Tỉ lệ duyệt"
          value={stats ? `${Math.round((stats.approved / (stats.total || 1)) * 100)}%` : "0%"}
          icon={<FileCheck />}
          loading={loadingStats}
        />
      </div>

      {/* MAIN CARD: Toolbar + Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">

        {/* Toolbar */}
        <div className="px-5 py-3 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input
              type="text"
              placeholder="Tìm tên, email hoặc shop..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400 transition-colors bg-gray-50"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
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
              </button>
            ))}
          </div>

          <span className="sm:ml-auto text-xs text-gray-400 whitespace-nowrap">
            {filteredRequests.length} yêu cầu
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-t border-b border-gray-100 bg-gray-50/60">
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Người đăng ký</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Vai trò</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Trạng thái</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Ngày gửi</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center">
                    <div className="flex justify-center items-center gap-2 text-sm text-gray-400">
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                      Đang tải hồ sơ...
                    </div>
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center text-sm text-gray-400 italic">
                    Không có dữ liệu yêu cầu phê duyệt
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${req.requestedRole === 'seller' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                          }`}>
                          {req.user.fullName?.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{req.user.fullName}</p>
                          <p className="text-xs text-gray-400 truncate">{req.user.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-tight ${req.requestedRole === 'seller' ? 'text-blue-600' : 'text-emerald-600'
                        }`}>
                        {req.requestedRole === 'seller' ? <Store size={12} /> : <Truck size={12} />}
                        {req.requestedRole}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-sm">
                      <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold uppercase ${req.status === "approved" ? "text-emerald-600" : req.status === "rejected" ? "text-red-600" : "text-amber-600"
                        }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${req.status === "approved" ? "bg-emerald-500" : req.status === "rejected" ? "bg-red-500" : "bg-amber-500"
                          }`} />
                        {req.status === "pending" ? "Đang chờ" : req.status === "approved" ? "Đã duyệt" : "Từ chối"}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-sm text-gray-500 font-medium">
                      {new Date(req.createdAt).toLocaleDateString("vi-VN")}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedReq(req)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all shadow-sm border border-gray-100 bg-white"
                          title="Xem hồ sơ"
                        >
                          <Eye size={15} />
                        </button>
                        {req.status === "pending" && (
                          <>
                            <button
                              onClick={() => handleAction(req.id, "approve")}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md transition-all shadow-sm border border-emerald-100 bg-white"
                              title="Duyệt hồ sơ"
                            >
                              <CheckCircle2 size={15} />
                            </button>
                            <button
                              onClick={() => handleAction(req.id, "reject")}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-all shadow-sm border border-red-100 bg-white"
                              title="Từ chối"
                            >
                              <XCircle size={15} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL MODAL (Giữ nguyên logic cũ nhưng tinh chỉnh nhẹ UI) */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 uppercase tracking-tight">
                  {selectedReq.requestedRole === 'seller' ? <Store className="text-blue-600" /> : <Truck className="text-emerald-600" />}
                  Chi tiết hồ sơ
                </h2>
                <button onClick={() => setSelectedReq(null)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-[10px] font-black uppercase text-gray-400">Người gửi</span>
                    <span className="text-sm font-bold text-gray-800">{selectedReq.user.fullName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[10px] font-black uppercase text-gray-400">Số điện thoại</span>
                    <span className="text-sm font-bold text-gray-800">{selectedReq.user.phoneNumber}</span>
                  </div>
                  <hr />
                  {selectedReq.requestedRole === "seller" ? (
                    <>
                      <div>
                        <p className="text-[10px] text-gray-400 font-black uppercase mb-1">Tên cửa hàng</p>
                        <p className="text-base font-black text-blue-600">{selectedReq.shopName}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-black uppercase mb-1">Địa chỉ lấy hàng</p>
                        <p className="text-sm text-gray-600 italic leading-relaxed">{selectedReq.shopAddress}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <p className="text-[10px] text-gray-400 font-black uppercase mb-1">Biển số xe</p>
                        <p className="text-base font-black text-emerald-600">{selectedReq.vehiclePlate}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-black uppercase mb-1">Địa chỉ hoạt động</p>
                        <p className="text-sm text-gray-600 italic leading-relaxed">{selectedReq.shipperAddress || 'Chưa cập nhật'}</p>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] font-black uppercase text-gray-400">Trạng thái</span>
                  <span className={`font-black uppercase text-xs ${selectedReq.status === "approved" ? "text-emerald-600" : selectedReq.status === "rejected" ? "text-red-600" : "text-amber-600"
                    }`}>
                    {selectedReq.status === "pending" ? "Đang chờ duyệt" : selectedReq.status === "approved" ? "Đã phê duyệt" : "Đã từ chối"}
                  </span>
                </div>

                {selectedReq.status === "pending" && (
                  <div className="flex gap-3 pt-4 border-t">
                    <button
                      className="flex-1 bg-gray-900 hover:bg-black text-white font-bold py-3 rounded-xl transition-all"
                      onClick={() => handleAction(selectedReq.id, "approve")}
                    >
                      Duyệt ngay
                    </button>
                    <button
                      className="flex-1 border border-red-100 text-red-600 hover:bg-red-50 font-bold py-3 rounded-xl transition-all"
                      onClick={() => handleAction(selectedReq.id, "reject")}
                    >
                      Từ chối
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalManagementPage;