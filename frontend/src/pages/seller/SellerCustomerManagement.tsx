import { useState, useEffect } from "react";
import {
    Search,
    Users,
    Eye,
    RefreshCw,
    FileDown,
    DollarSign,
    PackageCheck,
    CalendarDays,
    UserCircle,
    Mail,
    Phone,
    ArrowRight,
} from "lucide-react";
import axiosClient from "../../api/axiosClient";
import { format } from "date-fns";
import toast, { Toaster } from "react-hot-toast";
import StatCard from "@/components/common/StatCard";

interface SellerCustomer {
    id: number;
    fullName: string;
    email: string;
    phoneNumber: string;
    totalOrders: number;
    totalSpent: number;
    lastOrderDate: string;
}

interface SellerCustomerStats {
    totalCustomers: number;
    returningCustomers: number;
    avgCustomerValue: number;
}

const SellerCustomerManagement = () => {
    const [customers, setCustomers] = useState<SellerCustomer[]>([]);
    const [stats, setStats] = useState<SellerCustomerStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingStats, setLoadingStats] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await axiosClient.get("/orders/seller/customers", {
                params: {
                    page: page,
                    limit: 10,
                    search: searchTerm || undefined,
                },
            });
            setCustomers(res.data.data || []);
        } catch {
            toast.error("Không thể tải danh sách khách hàng của shop");
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            setLoadingStats(true);
            const res = await axiosClient.get("/orders/seller/customers/stats");
            setStats(res.data);
        } catch {
            console.error("Lỗi fetch thống kê khách hàng");
        } finally {
            setLoadingStats(false);
        }
    };

    useEffect(() => {
        fetchData();
        fetchStats();
    }, [page]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1); // Reset về trang 1 khi search
        fetchData();
    };

    return (
        <div className="w-full min-h-screen pb-16">
            <Toaster position="top-right" />

            {/* HEADER */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                        <Users className="text-blue-600" size={24} />
                        Quản lý khách hàng của Shop
                    </h1>
                </div>
                <button
                    onClick={() => { fetchData(); fetchStats(); }}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <RefreshCw size={16} />
                </button>
            </div>

            {/* STATS SECTION */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <StatCard
                    label="Tổng khách hàng từng mua"
                    value={stats?.totalCustomers || 0}
                    icon={<Users />}
                    loading={loadingStats}
                />
                <StatCard
                    label="Khách hàng quay lại"
                    value={stats?.returningCustomers || 0}
                    icon={<PackageCheck />}
                    loading={loadingStats}
                />
                <StatCard
                    label="Chi tiêu trung bình/khách"
                    value={`${Math.round(stats?.avgCustomerValue || 0).toLocaleString("vi-VN")}đ`}
                    icon={<DollarSign />}
                    loading={loadingStats}
                />
            </div>

            {/* MAIN CONTENT */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">

                {/* Toolbar */}
                <div className="px-5 py-3 flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-white border-b border-gray-100">
                    <form onSubmit={handleSearch} className="relative w-full sm:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input
                            type="text"
                            placeholder="Tìm tên, email hoặc số điện thoại..."
                            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-500 transition-colors bg-gray-50"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </form>

                    <div className="sm:ml-auto">
                        <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
                            <FileDown size={14} /> Xuất danh sách VIP
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead>
                            <tr className="bg-gray-50/60 text-left">
                                <th className="px-5 py-3 text-xs font-semibold text-gray-700">Khách hàng</th>
                                <th className="px-5 py-3 text-xs font-semibold text-gray-700">Liên hệ</th>
                                <th className="px-5 py-3 text-xs font-semibold text-gray-700">Số đơn đã mua</th>
                                <th className="px-5 py-3 text-xs font-semibold text-gray-700">Tổng chi tiêu</th>
                                <th className="px-5 py-3 text-xs font-semibold text-gray-700">Đơn cuối lúc</th>
                                <th className="px-5 py-3 text-xs font-semibold text-gray-700 text-right">Lịch sử</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 bg-white">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-5 py-16 text-center text-sm text-gray-400">
                                        <RefreshCw className="animate-spin inline mr-2" size={16} /> Đang tải danh sách khách hàng...
                                    </td>
                                </tr>
                            ) : customers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-5 py-16 text-center text-sm text-gray-400">
                                        Chưa có khách hàng nào từng mua sắm tại shop.
                                    </td>
                                </tr>
                            ) : (
                                customers.map((customer) => (
                                    <tr key={customer.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm shadow-sm border border-blue-100">
                                                    {customer.fullName.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-gray-900 truncate">{customer.fullName}</p>
                                                    <p className="text-[11px] text-gray-400 truncate">ID: #{customer.id}</p>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-5 py-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                                    <Mail size={12} className="text-gray-400" /> {customer.email || 'N/A'}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                                    <Phone size={12} className="text-gray-400" /> {customer.phoneNumber || 'N/A'}
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-5 py-4">
                                            <span className="text-sm font-bold text-gray-900">{customer.totalOrders} đơn</span>
                                        </td>

                                        <td className="px-5 py-4">
                                            <p className="text-sm font-bold text-emerald-700">{Number(customer.totalSpent).toLocaleString("vi-VN")}đ</p>
                                            <p className="text-[10px] text-gray-400 mt-0.5">Giá trị vòng đời (LTV)</p>
                                        </td>

                                        <td className="px-5 py-4 text-xs text-gray-500 font-medium">
                                            <div className="flex items-center gap-1.5">
                                                <CalendarDays size={12} className="text-gray-400" />
                                                {customer.lastOrderDate ? format(new Date(customer.lastOrderDate), "dd/MM/yyyy") : "N/A"}
                                            </div>
                                        </td>

                                        <td className="px-5 py-4 text-right">
                                            <button
                                                // Ông có thể dùng navigate để chuyển hướng sang trang Order Manager và lọc theo ID khách hàng
                                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all border border-transparent hover:border-blue-100"
                                                title="Xem lịch sử đơn hàng tại Shop"
                                            >
                                                <ArrowRight size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer (Phân trang đơn giản) */}
                {!loading && customers.length > 0 && (
                    <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/30 flex justify-between items-center text-xs text-gray-500">
                        <span>Hiển thị {customers.length} khách hàng trên trang này</span>
                        <div className="flex gap-1">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-3 py-1 border border-gray-200 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50"
                            >
                                Trước
                            </button>
                            <button
                                onClick={() => setPage(p => p + 1)}
                                disabled={customers.length < 10} // Giả sử limit là 10
                                className="px-3 py-1 border border-gray-200 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50"
                            >
                                Sau
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SellerCustomerManagement;