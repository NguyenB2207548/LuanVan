import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  XCircle,
  Eye,
  Clock,
  Search,
  UserCheck,
  Loader2,
  X,
  Store,
  Truck,
  Calendar,
} from "lucide-react";
import axiosClient from "../../api/axiosClient";
import toast, { Toaster } from "react-hot-toast";

interface ApprovalRequest {
  id: number;
  requestedRole: "seller" | "shipper";
  status: "pending" | "approved" | "rejected";
  shopName?: string;
  shopAddress?: string;
  vehiclePlate?: string;
  //vehicleType?: string; // Đã bỏ loại xe
  shipperAddress?: string; // Đã thêm địa chỉ shipper
  createdAt: string;
  user: {
    fullName: string;
    email: string;
    phoneNumber: string;
  };
}

const ApprovalManagementPage = () => {
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
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

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (id: number, action: "approve" | "reject") => {
    const confirmMsg = action === "approve" ? "Phê duyệt yêu cầu này?" : "Từ chối yêu cầu này?";
    if (!window.confirm(confirmMsg)) return;

    const loadingToast = toast.loading("Đang xử lý...");
    try {
      await axiosClient.patch(`/approvals/${id}/${action}`);
      toast.success(action === "approve" ? "Đã phê duyệt thành công" : "Đã từ chối yêu cầu", { id: loadingToast });

      setRequests((prev) =>
        prev.map((req) => (req.id === id ? { ...req, status: action === "approve" ? "approved" : "rejected" } : req))
      );
      setSelectedReq(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Lỗi xử lý", { id: loadingToast });
    }
  };

  // Trả về màu chữ cho Trạng thái
  const getStatusTextColor = (status: string) => {
    switch (status) {
      case "approved": return "text-emerald-600";
      case "rejected": return "text-red-600";
      default: return "text-amber-600";
    }
  };

  const filteredRequests = requests.filter(
    (r) =>
      r.user?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full">
      <Toaster position="top-right" />

      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <UserCheck className="text-blue-600" size={26} />
            Phê duyệt đối tác
          </h1>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white p-4 border border-gray-200 rounded-lg mb-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="relative w-full max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="text-gray-400" size={16} />
          </div>
          <input
            type="text"
            placeholder="Tìm theo tên hoặc email..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">
          Tổng cộng: {filteredRequests.length} yêu cầu
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Người đăng ký</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Vai trò yêu cầu</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Trạng thái</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Ngày gửi</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Hành động</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                    <div className="flex justify-center items-center gap-2 italic">
                      <Loader2 className="animate-spin text-blue-600" size={18} />
                      Đang đồng bộ yêu cầu...
                    </div>
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">Không tìm thấy yêu cầu nào.</td>
                </tr>
              ) : (
                filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm shrink-0 uppercase">
                          {req.user.fullName?.charAt(0)}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-bold text-gray-900">{req.user.fullName}</div>
                          <div className="text-xs text-gray-500">{req.user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-xs font-black uppercase tracking-tight ${req.requestedRole === 'seller' ? 'text-blue-600' : 'text-emerald-600'}`}>
                        {req.requestedRole}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`flex items-center gap-1.5 font-bold uppercase text-[11px] ${getStatusTextColor(req.status)}`}>
                        <div className={`w-1 h-1 rounded-full ${req.status === "pending" ? "bg-amber-500" : req.status === "approved" ? "bg-emerald-500" : "bg-red-500"}`} />
                        {req.status === "pending" ? "Đang chờ" : req.status === "approved" ? "Đã duyệt" : "Từ chối"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(req.createdAt).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Nút Chi tiết đóng khung */}
                        <button
                          onClick={() => setSelectedReq(req)}
                          className="px-3 py-1.5 border border-gray-200 rounded-md text-gray-600 hover:bg-gray-50 hover:border-blue-400 hover:text-blue-600 transition-all flex items-center gap-1 text-xs font-bold shadow-sm"
                        >
                          <Eye size={14} /> Chi tiết
                        </button>

                        {req.status === "pending" && (
                          <>
                            {/* Nút Duyệt đóng khung */}
                            <button
                              onClick={() => handleAction(req.id, "approve")}
                              className="px-3 py-1.5 border border-emerald-200 bg-emerald-50 text-emerald-700 rounded-md hover:bg-emerald-600 hover:text-white transition-all flex items-center gap-1 text-xs font-bold shadow-sm"
                            >
                              <CheckCircle2 size={14} /> Duyệt
                            </button>
                            {/* Nút Từ chối đóng khung */}
                            <button
                              onClick={() => handleAction(req.id, "reject")}
                              className="px-3 py-1.5 border border-red-200 bg-red-50 text-red-700 rounded-md hover:bg-red-600 hover:text-white transition-all flex items-center gap-1 text-xs font-bold shadow-sm"
                            >
                              <XCircle size={14} /> Từ chối
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

      {/* DETAIL MODAL */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 tracking-tight uppercase">
                  {selectedReq.requestedRole === 'seller' ? <Store className="text-blue-600" /> : <Truck className="text-emerald-600" />}
                  Thông tin hồ sơ
                </h2>
                <button onClick={() => setSelectedReq(null)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-5">
                <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 space-y-4">
                  <div className="grid grid-cols-3 text-[11px] font-black uppercase text-gray-400 tracking-wider">
                    <span>Người gửi:</span>
                    <span className="col-span-2 text-sm font-bold text-gray-800 normal-case">{selectedReq.user.fullName}</span>
                  </div>
                  <div className="grid grid-cols-3 text-[11px] font-black uppercase text-gray-400 tracking-wider">
                    <span>Liên hệ:</span>
                    <span className="col-span-2 text-sm font-bold text-gray-800">{selectedReq.user.phoneNumber || 'Chưa cập nhật'}</span>
                  </div>
                  <hr className="border-gray-200" />

                  {selectedReq.requestedRole === "seller" ? (
                    <>
                      <div className="space-y-1">
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Tên cửa hàng</p>
                        <p className="text-lg font-black text-blue-600">{selectedReq.shopName}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Địa chỉ lấy hàng</p>
                        <p className="text-sm text-gray-600 italic leading-relaxed">{selectedReq.shopAddress}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-1">
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Biển số xe</p>
                        <p className="text-lg font-black text-emerald-600">{selectedReq.vehiclePlate}</p>
                      </div>
                      <div className="space-y-1">
                        {/* SỬA TẠI ĐÂY: Thay loại phương tiện bằng địa chỉ */}
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Địa chỉ hoạt động</p>
                        <p className="text-sm text-gray-600 italic leading-relaxed">{selectedReq.shipperAddress || 'Chưa cập nhật'}</p>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex items-center justify-between px-2 text-sm">
                  <span className="text-gray-400 font-bold uppercase text-[10px]">Trạng thái:</span>
                  <span className={`font-black uppercase text-xs ${getStatusTextColor(selectedReq.status)}`}>
                    {selectedReq.status === "pending" ? "Đang chờ duyệt" : selectedReq.status === "approved" ? "Đã phê duyệt" : "Đã từ chối"}
                  </span>
                </div>

                {selectedReq.status === "pending" && (
                  <div className="flex gap-3 pt-4 border-t border-gray-100">
                    <button
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black py-3 rounded-xl transition-all shadow-lg shadow-blue-100 active:scale-95"
                      onClick={() => handleAction(selectedReq.id, "approve")}
                    >
                      Xác nhận duyệt
                    </button>
                    <button
                      className="flex-1 border border-red-100 text-red-600 hover:bg-red-50 font-black py-3 rounded-xl transition-all active:scale-95"
                      onClick={() => handleAction(selectedReq.id, "reject")}
                    >
                      Từ chối
                    </button>
                  </div>
                )}

                {/* Nút đóng cho đơn đã xử lý */}
                {selectedReq.status !== "pending" && (
                  <button
                    className="w-full bg-gray-900 text-white font-black py-3 rounded-xl transition-all"
                    onClick={() => setSelectedReq(null)}
                  >
                    Đóng chi tiết
                  </button>
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