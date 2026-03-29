import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Search,
  Edit,
  Trash2,
  Plus,
  ShieldCheck,
  User as UserIcon,
  RefreshCw,
  Lock,
  Unlock,
  CheckCircle,
  XCircle,
  Truck,
  Store,
} from "lucide-react";
import axiosClient from "../../api/axiosClient";
import StatCard from "@/components/common/StatCard";
import toast, { Toaster } from "react-hot-toast";

interface User {
  id: number;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean; // Thêm trường này
  createdAt: string;
}

interface UserStats {
  total: number;
  active: number;
  inactive: number;
  roles: { role: string; count: string }[];
}

const FILTER_TABS = [
  { value: "all", label: "Tất cả" },
  { value: "admin", label: "Quản trị" },
  { value: "seller", label: "Người bán" },
  { value: "shipper", label: "Giao hàng" },
  { value: "user", label: "Khách hàng" },
];

const UserManagementPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [processingId, setProcessingId] = useState<number | null>(null);
  const navigate = useNavigate();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get("/users");
      setUsers(res.data.data || res.data || []);
    } catch {
      toast.error("Không thể tải danh sách người dùng");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const res = await axiosClient.get("/users/admin/stats");
      setStats(res.data);
    } catch {
      console.error("Lỗi fetch thống kê user");
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, []);

  const handleToggleStatus = async (user: User) => {
    const action = user.isActive ? "deactivate" : "activate";
    const confirmMsg = user.isActive
      ? `Bạn có chắc muốn KHÓA tài khoản ${user.email}?`
      : `Bạn có chắc muốn KHÔI PHỤC tài khoản ${user.email}?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      setProcessingId(user.id);
      await axiosClient.patch(`/users/${user.id}/${action}`);
      toast.success(user.isActive ? "Đã khóa tài khoản" : "Đã mở khóa tài khoản");
      fetchUsers();
      fetchStats();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Thao tác thất bại");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteUser = async (userId: number, userName: string) => {
    if (!window.confirm(`Xóa vĩnh viễn người dùng "${userName}"? Hành động này không thể hoàn tác.`)) return;
    try {
      await axiosClient.delete(`/users/${userId}`);
      toast.success("Đã xóa người dùng");
      setUsers(prev => prev.filter(u => u.id !== userId));
      fetchStats();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Không thể xóa");
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchSearch =
      user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = roleFilter === "all" || user.role === roleFilter;
    return matchSearch && matchRole;
  });

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin": return <ShieldCheck size={14} className="text-purple-600" />;
      case "seller": return <Store size={14} className="text-blue-600" />;
      case "shipper": return <Truck size={14} className="text-orange-600" />;
      default: return <UserIcon size={14} className="text-gray-600" />;
    }
  };

  return (
    <div className="w-full min-h-screen bg-gray-50 pb-16">
      <Toaster position="top-right" />

      {/* PAGE HEADER */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Users className="text-blue-600" size={24} />
            Quản lý người dùng
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { fetchUsers(); fetchStats(); }}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={() => navigate("/admin/users/add")}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus size={16} /> Thêm người dùng
          </button>
        </div>
      </div>

      {/* STATS SECTION */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Tổng người dùng" value={stats?.total || 0} icon={<Users />} loading={loadingStats} />
        <StatCard label="Đang hoạt động" value={stats?.active || 0} icon={<CheckCircle />} loading={loadingStats} />
        <StatCard label="Đã bị khóa" value={stats?.inactive || 0} icon={<XCircle />} loading={loadingStats} />
        <StatCard label="Cửa hàng" value={stats?.roles.find(r => r.role === 'seller')?.count || 0} icon={<Store />} loading={loadingStats} />
      </div>

      {/* MAIN CARD: Toolbar + Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">

        {/* Toolbar */}
        <div className="px-5 py-3 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input
              type="text"
              placeholder="Tìm tên hoặc email..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400 transition-colors bg-gray-50"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-1 flex-wrap">
            {FILTER_TABS.map(tab => (
              <button
                key={tab.value}
                onClick={() => setRoleFilter(tab.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border font-medium transition-colors ${roleFilter === tab.value
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <span className="sm:ml-auto text-xs text-gray-400 whitespace-nowrap">
            {filteredUsers.length} người dùng
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-t border-b border-gray-100 bg-gray-50/60">
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700">Thông tin người dùng</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700">Vai trò</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700">Trạng thái</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700">Ngày gia nhập</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-700">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center">
                    <div className="flex justify-center items-center gap-2 text-sm text-gray-400">
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                      Đang tải danh sách...
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center">
                    <UserIcon className="mx-auto text-gray-200 mb-3" size={36} />
                    <p className="text-sm text-gray-400">Không tìm thấy người dùng phù hợp</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs shrink-0">
                          {user.fullName ? user.fullName.charAt(0).toUpperCase() : "?"}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{user.fullName || "N/A"}</p>
                          <p className="text-xs text-gray-400 truncate">{user.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border
                        ${user.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                        {getRoleIcon(user.role)}
                        <span className="capitalize">{user.role}</span>
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full border ${user.isActive
                        ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                        : "bg-rose-50 text-rose-700 border-rose-100"
                        }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? "bg-emerald-500" : "bg-rose-500"}`} />
                        {user.isActive ? "Hoạt động" : "Bị khóa"}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleToggleStatus(user)}
                          disabled={processingId === user.id}
                          className={`p-1.5 rounded-md transition-colors ${user.isActive
                            ? "text-gray-400 hover:text-rose-600 hover:bg-rose-50"
                            : "text-amber-500 hover:text-emerald-600 hover:bg-emerald-50"
                            }`}
                          title={user.isActive ? "Khóa tài khoản" : "Mở khóa"}
                        >
                          {processingId === user.id ? (
                            <div className="w-3.5 h-3.5 border-2 border-gray-300 border-t-current rounded-full animate-spin" />
                          ) : user.isActive ? <Lock size={15} /> : <Unlock size={15} />}
                        </button>
                        <button
                          onClick={() => navigate(`/admin/users/edit/${user.id}`)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          title="Sửa"
                        >
                          <Edit size={15} />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id, user.fullName)}
                          className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                          title="Xóa"
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

        {/* Footer info */}
        {!loading && filteredUsers.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/30">
            <p className="text-xs text-gray-400 italic">
              * Lưu ý: Khi khóa tài khoản, người dùng sẽ không thể đăng nhập vào hệ thống.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagementPage;