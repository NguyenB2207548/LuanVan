import { useState, useEffect } from "react";
import {
  CheckCircle2,
  XCircle,
  Eye,
  Clock,
  Search,
  UserCheck,
  Loader2,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axiosClient from "../../api/axiosClient";

interface ApprovalRequest {
  id: number;
  fullName: string;
  email: string;
  requestedRole: "seller" | "shipper";
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

const ApprovalManagementPage = () => {
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchRequests = async () => {
    try {
      setLoading(true);
      // Giả sử API lấy danh sách user có trạng thái pending_approval hoặc bảng riêng
      const res = await axiosClient.get("/admin/approvals");
      setRequests(res.data.data || res.data || []);
    } catch (err) {
      console.error("Lỗi lấy danh sách phê duyệt", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // Hàm xử lý Phê duyệt / Từ chối
  const handleAction = async (id: number, action: "approve" | "reject") => {
    const confirmMsg =
      action === "approve" ? "Xác nhận cấp quyền?" : "Từ chối yêu cầu này?";
    if (!window.confirm(confirmMsg)) return;

    try {
      await axiosClient.post(`/admin/approvals/${id}`, { action });
      // Cập nhật lại danh sách tại chỗ để tránh load lại trang
      setRequests((prev) => prev.filter((req) => req.id !== id));
      alert("Xử lý thành công!");
    } catch (err) {
      alert("Có lỗi xảy ra khi xử lý.");
    }
  };

  const filteredRequests = requests.filter(
    (r) =>
      r.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="w-full space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <UserCheck className="text-blue-600" size={28} />
          Role Approvals
        </h1>
      </div>

      <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-sm">
        <div className="relative w-full max-w-md">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={16}
          />
          <Input
            placeholder="Search by name or email..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="px-6 py-3 font-semibold text-xs uppercase">
                User
              </TableHead>
              <TableHead className="px-6 py-3 font-semibold text-xs uppercase text-center">
                Requested Role
              </TableHead>
              <TableHead className="px-6 py-3 font-semibold text-xs uppercase text-center">
                Status
              </TableHead>
              <TableHead className="px-6 py-3 font-semibold text-xs uppercase">
                Date
              </TableHead>
              <TableHead className="px-6 py-3 font-semibold text-xs uppercase text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-20 text-center">
                  <Loader2 className="animate-spin mx-auto text-blue-600" />
                </TableCell>
              </TableRow>
            ) : filteredRequests.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-20 text-center text-gray-500 font-medium"
                >
                  No pending requests found.
                </TableCell>
              </TableRow>
            ) : (
              filteredRequests.map((req) => (
                <TableRow key={req.id} className="hover:bg-gray-50">
                  <TableCell className="px-6 py-4">
                    <div className="font-medium text-gray-900">
                      {req.fullName}
                    </div>
                    <div className="text-xs text-gray-500">{req.email}</div>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-center">
                    <Badge
                      variant="outline"
                      className={
                        req.requestedRole === "seller"
                          ? "text-blue-600 bg-blue-50"
                          : "text-emerald-600 bg-emerald-50"
                      }
                    >
                      {req.requestedRole.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-center">
                    <div className="flex justify-center items-center gap-1.5 text-amber-600 font-medium text-sm italic">
                      <Clock size={14} /> Pending
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm text-gray-500">
                    {new Date(req.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                        onClick={() => handleAction(req.id, "approve")}
                      >
                        <CheckCircle2 size={18} className="mr-1" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleAction(req.id, "reject")}
                      >
                        <XCircle size={18} className="mr-1" /> Reject
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ApprovalManagementPage;
