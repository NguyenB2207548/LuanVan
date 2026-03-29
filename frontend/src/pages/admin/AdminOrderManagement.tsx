import { useState, useEffect } from "react";
import {
    Search,
    Package,
    Eye,
    RefreshCw,
    FileDown,
    DollarSign,
    Users,
    Truck,
    CheckCircle,
    MoreHorizontal,
    Filter,
    ArrowRight,
    User as UserIcon,
    Store,
} from "lucide-react";
import axiosClient from "../../api/axiosClient";
import { format } from "date-fns";
import toast, { Toaster } from "react-hot-toast";
import StatCard from "@/components/common/StatCard";
import OrderDetailModal from "../../modals/OrderDetailModal";

interface AdminOrder {
    id: number;
    orderNumber: string;
    totalAmount: string;
    status: string;
    paymentStatus: string;
    createdAt: string;
    customer: { fullName: string; email: string };
    seller: { fullName: string; email: string };
    shipper?: { fullName: string };
    items: { id: number; quantity: number }[];
}

interface GlobalStats {
    pending: number;
    confirmed: number;
    shipping: number;
    success: number;
    failed: number;
    cancelled: number;
    totalOrders: number;
    totalRevenue: number;
    totalCustomers: number;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    pending: { label: "Chờ xác nhận", color: "text-amber-600", bg: "bg-amber-50" },
    confirmed: { label: "Đã xác nhận", color: "text-blue-600", bg: "bg-blue-50" },
    shipping: { label: "Đang giao", color: "text-violet-600", bg: "bg-violet-50" },
    success: { label: "Thành công", color: "text-emerald-600", bg: "bg-emerald-50" },
    failed: { label: "Thất bại", color: "text-red-600", bg: "bg-red-50" },
    cancelled: { label: "Đã hủy", color: "text-gray-500", bg: "bg-gray-100" },
};

const AdminOrderManagement = () => {
    const [orders, setOrders] = useState<AdminOrder[]>([]);
    const [stats, setStats] = useState<GlobalStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingStats, setLoadingStats] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await axiosClient.get("/orders/admin/all", {
                params: {
                    status: statusFilter === "all" ? undefined : statusFilter,
                    search: searchTerm || undefined,
                },
            });
            setOrders(res.data.data || []);
        } catch {
            toast.error("Không thể tải danh sách đơn hàng toàn sàn");
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            setLoadingStats(true);
            const res = await axiosClient.get("/orders/admin/stats");
            setStats(res.data);
        } catch {
            console.error("Lỗi fetch thống kê toàn sàn");
        } finally {
            setLoadingStats(false);
        }
    };

    useEffect(() => {
        fetchData();
        fetchStats();
    }, [statusFilter]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchData();
    };

    return (
        <div className="w-full min-h-screen bg-gray-50 pb-16">
            <Toaster position="top-right" />

            {/* Modal chi tiết dùng chung logic cũ */}
            <OrderDetailModal
                order={selectedOrder}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />

            {/* HEADER */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                        <Package className="text-blue-600" size={24} />
                        Quản trị đơn hàng toàn sàn
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">Giám sát dòng tiền và vận hành hệ thống</p>
                </div>
                <button
                    onClick={() => { fetchData(); fetchStats(); }}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <RefreshCw size={16} />
                </button>
            </div>

            {/* STATS SECTION */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <StatCard
                    label="Tổng doanh thu toàn sàn"
                    value={`${stats?.totalRevenue?.toLocaleString("vi-VN")}đ`}
                    icon={<DollarSign />}
                    loading={loadingStats}
                />
                <StatCard
                    label="Tổng số khách hàng"
                    value={stats?.totalCustomers || 0}
                    icon={<Users />}
                    loading={loadingStats}
                />
                <StatCard
                    label="Đơn đang vận chuyển"
                    value={stats?.shipping || 0}
                    icon={<Truck />}
                    loading={loadingStats}
                />
                <StatCard
                    label="Tỷ lệ thành công"
                    value={stats ? `${Math.round((stats.success / (stats.totalOrders || 1)) * 100)}%` : "0%"}
                    icon={<CheckCircle />}
                    loading={loadingStats}
                />
            </div>

            {/* MAIN CONTENT */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">

                {/* Toolbar */}
                <div className="px-5 py-3 flex flex-col lg:flex-row items-start lg:items-center gap-4 bg-white border-b border-gray-100">
                    <form onSubmit={handleSearch} className="relative w-full lg:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input
                            type="text"
                            placeholder="Mã đơn, khách hàng, seller..."
                            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-500 transition-colors bg-gray-50"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </form>

                    <div className="flex items-center gap-1 flex-wrap">
                        <button
                            onClick={() => setStatusFilter("all")}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${statusFilter === "all" ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200"}`}
                        >
                            Tất cả
                        </button>
                        {Object.keys(STATUS_CONFIG).map(key => (
                            <button
                                key={key}
                                onClick={() => setStatusFilter(key)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${statusFilter === key ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"}`}
                            >
                                {STATUS_CONFIG[key].label}
                            </button>
                        ))}
                    </div>

                    <div className="lg:ml-auto">
                        <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
                            <FileDown size={14} /> Xuất dữ liệu
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead>
                            <tr className="bg-gray-50/60 text-left">
                                <th className="px-5 py-3 text-xs font-semibold text-gray-700">Mã đơn & Thời gian</th>
                                <th className="px-5 py-3 text-xs font-semibold text-gray-700">Khách hàng</th>
                                <th className="px-5 py-3 text-xs font-semibold text-gray-700">Luồng đơn hàng</th>
                                <th className="px-5 py-3 text-xs font-semibold text-gray-700">Tổng tiền</th>
                                <th className="px-5 py-3 text-xs font-semibold text-gray-700 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-5 py-16 text-center text-sm text-gray-400">
                                        <RefreshCw className="animate-spin inline mr-2" size={16} /> Đang đồng bộ đơn hàng...
                                    </td>
                                </tr>
                            ) : orders.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-5 py-16 text-center text-sm text-gray-400">
                                        Không tìm thấy dữ liệu đơn hàng nào.
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-5 py-4">
                                            <p className="text-sm font-bold text-gray-900 font-mono">#{order.orderNumber.split('-').pop()}</p>
                                            <p className="text-[11px] text-gray-400 mt-0.5">{format(new Date(order.createdAt), "dd/MM/yyyy HH:mm")}</p>
                                        </td>

                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-[10px]">
                                                    {order.customer.fullName.charAt(0)}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-gray-800 truncate">{order.customer.fullName}</p>
                                                    <p className="text-[11px] text-gray-400 truncate">{order.customer.email}</p>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-2 text-[11px] font-medium whitespace-nowrap">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-blue-600 flex items-center gap-1"><Store size={10} /> {order.seller.fullName}</span>
                                                    <span className="text-gray-400 flex items-center gap-1"><Truck size={10} /> {order.shipper?.fullName || "Chưa nhận"}</span>
                                                </div>
                                                <ArrowRight size={12} className="text-gray-300" />
                                                <span className={`px-2 py-0.5 rounded ${STATUS_CONFIG[order.status]?.bg} ${STATUS_CONFIG[order.status]?.color}`}>
                                                    {STATUS_CONFIG[order.status]?.label}
                                                </span>
                                            </div>
                                        </td>

                                        <td className="px-5 py-4">
                                            <p className="text-sm font-bold text-gray-900">{Number(order.totalAmount).toLocaleString("vi-VN")}đ</p>
                                            <p className={`text-[10px] font-medium ${order.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                                                {order.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chờ thanh toán'}
                                            </p>
                                        </td>

                                        <td className="px-5 py-4 text-right">
                                            <button
                                                onClick={() => { setSelectedOrder(order); setIsModalOpen(true); }}
                                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all border border-transparent hover:border-blue-100"
                                            >
                                                <Eye size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminOrderManagement;