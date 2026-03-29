import { useState, useEffect } from "react";
import {
    Package,
    Search,
    Trash2,
    Image as ImageIcon,
    CheckCircle,
    AlertTriangle,
    RefreshCw,
    FileDown,
    Ban,
    Unlock,
    User as UserIcon,
    Filter,
    Loader2,
} from "lucide-react";
import axiosClient from "../../api/axiosClient";
import StatCard from "@/components/common/StatCard";
import toast, { Toaster } from "react-hot-toast";

const BASE_URL = "http://localhost:3000";

interface Product {
    id: number;
    productName: string;
    status: "active" | "inactive" | "banned";
    createdAt: string;
    seller: {
        id: number;
        fullName: string;
        email: string;
    };
    images: { url: string }[];
    categories: { categoryName: string }[];
}

interface AdminProductStats {
    total: number;
    active: number;
    inactive: number;
    banned: number;
    totalSellers: number;
}

const FILTER_TABS = [
    { value: "all", label: "Tất cả" },
    { value: "active", label: "Hoạt động" },
    { value: "inactive", label: "Đã ẩn" },
    { value: "banned", label: "Bị khóa" },
];

const AdminProductManager = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [stats, setStats] = useState<AdminProductStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingStats, setLoadingStats] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [processingId, setProcessingId] = useState<number | null>(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await axiosClient.get("/products/admin/all", {
                params: {
                    status: statusFilter === "all" ? undefined : statusFilter,
                    limit: 100 // Lấy danh sách dài để Admin dễ quan sát
                }
            });
            setProducts(res.data.data || []);
        } catch {
            toast.error("Không thể tải danh sách sản phẩm toàn sàn");
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            setLoadingStats(true);
            const res = await axiosClient.get("/products/admin/stats");
            setStats(res.data);
        } catch {
            console.error("Lỗi fetch thống kê sản phẩm");
        } finally {
            setLoadingStats(false);
        }
    };

    useEffect(() => {
        fetchData();
        fetchStats();
    }, [statusFilter]);

    const handleUpdateStatus = async (id: number, currentStatus: string) => {
        const newStatus = currentStatus === "banned" ? "active" : "banned";
        const confirmMsg = newStatus === "banned"
            ? "Bạn có chắc muốn KHÓA sản phẩm này? Seller sẽ không thể kinh doanh mặt hàng này."
            : "Mở khóa sản phẩm này?";

        if (!window.confirm(confirmMsg)) return;

        try {
            setProcessingId(id);
            await axiosClient.patch(`/products/admin/${id}/status`, { status: newStatus });
            toast.success("Cập nhật trạng thái thành công");
            fetchData();
            fetchStats();
        } catch {
            toast.error("Thao tác thất bại");
        } finally {
            setProcessingId(null);
        }
    };

    const handlePermanentDelete = async (id: number, name: string) => {
        if (!window.confirm(`Bạn muốn xóa vĩnh viễn sản phẩm này.`)) return;

        try {
            await axiosClient.delete(`/products/admin/${id}/permanent`);
            toast.success("Đã xóa vĩnh viễn sản phẩm");
            setProducts(prev => prev.filter(p => p.id !== id));
            fetchStats();
        } catch {
            toast.error("Không thể xóa sản phẩm này");
        }
    };

    const filtered = products.filter(p =>
        p.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.seller.fullName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="w-full min-h-screen bg-gray-50 pb-16">
            <Toaster position="top-right" />

            {/* HEADER */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                        <Package className="text-blue-600" size={24} />
                        Quản trị sản phẩm toàn sàn
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">Giám sát hàng hóa từ tất cả các Seller</p>
                </div>
                <button
                    onClick={() => { fetchData(); fetchStats(); }}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <RefreshCw size={16} />
                </button>
            </div>

            {/* STATS SECTION */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <StatCard label="Tổng sản phẩm" value={stats?.total || 0} icon={<Package />} loading={loadingStats} />
                <StatCard label="Đang bán" value={stats?.active || 0} icon={<CheckCircle />} loading={loadingStats} />
                <StatCard label="Vi phạm/Khóa" value={stats?.banned || 0} icon={<Ban className="text-red-500" />} loading={loadingStats} />
                <StatCard label="Tổng số Seller" value={stats?.totalSellers || 0} icon={<UserIcon />} loading={loadingStats} />
            </div>

            {/* MAIN CARD */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">

                {/* Toolbar */}
                <div className="px-5 py-3 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input
                            type="text"
                            placeholder="Tìm sản phẩm hoặc chủ shop..."
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

                    <div className="sm:ml-auto">
                        <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
                            <FileDown size={14} /> Xuất Báo Cáo
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead>
                            <tr className="border-t border-b border-gray-100 bg-gray-50/60">
                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Thông tin sản phẩm</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Chủ cửa hàng (Seller)</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Trạng thái</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Ngày đăng</th>
                                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 bg-white">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-5 py-16 text-center">
                                        <div className="flex justify-center items-center gap-2 text-sm text-gray-400 italic">
                                            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                                            Đang đồng bộ dữ liệu toàn sàn...
                                        </div>
                                    </td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-5 py-16 text-center text-sm text-gray-400 italic">
                                        Không tìm thấy sản phẩm nào phù hợp
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((product) => {
                                    const img = product.images?.[0]?.url;
                                    return (
                                        <tr key={product.id} className="hover:bg-gray-50/70 transition-colors">
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-11 h-11 rounded-lg border border-gray-100 bg-gray-50 overflow-hidden shrink-0 flex items-center justify-center shadow-sm">
                                                        {img ? (
                                                            <img src={`${BASE_URL}${img}`} className="w-full h-full object-contain" alt="" />
                                                        ) : (
                                                            <ImageIcon size={16} className="text-gray-300" />
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-gray-900 truncate max-w-[220px]">{product.productName}</p>
                                                        <p className="text-[10px] text-blue-600 font-bold uppercase mt-0.5">
                                                            {product.categories?.[0]?.categoryName || "Chưa phân loại"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-gray-700">{product.seller.fullName}</span>
                                                    <span className="text-[11px] text-gray-400">{product.seller.email}</span>
                                                </div>
                                            </td>

                                            <td className="px-5 py-4">
                                                <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-0.5 rounded border ${product.status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                                    product.status === "banned" ? "bg-rose-50 text-rose-700 border-rose-200" :
                                                        "bg-gray-50 text-gray-500 border-gray-200"
                                                    }`}>
                                                    <div className={`w-1 h-1 rounded-full ${product.status === "active" ? "bg-emerald-500" :
                                                        product.status === "banned" ? "bg-rose-500" : "bg-gray-400"
                                                        }`} />
                                                    {product.status === "active" ? "Hoạt động" : product.status === "banned" ? "Đã khóa" : "Đã ẩn"}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4 text-xs text-gray-500 font-medium">
                                                {new Date(product.createdAt).toLocaleDateString("vi-VN")}
                                            </td>

                                            <td className="px-5 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        onClick={() => handleUpdateStatus(product.id, product.status)}
                                                        disabled={processingId === product.id}
                                                        className={`p-1.5 rounded-md transition-all shadow-sm border border-gray-100 bg-white ${product.status === "banned" ? "text-emerald-600 hover:bg-emerald-50" : "text-amber-500 hover:bg-rose-50 hover:text-rose-600"
                                                            }`}
                                                        title={product.status === "banned" ? "Mở khóa sản phẩm" : "Khóa vi phạm"}
                                                    >
                                                        {processingId === product.id ? <Loader2 size={15} className="animate-spin" /> :
                                                            product.status === "banned" ? <Unlock size={15} /> : <Ban size={15} />}
                                                    </button>

                                                    <button
                                                        onClick={() => handlePermanentDelete(product.id, product.productName)}
                                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all shadow-sm border border-gray-100 bg-white"
                                                        title="Xóa vĩnh viễn"
                                                    >
                                                        <Trash2 size={15} />
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
                    <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/30 text-xs text-gray-400">
                        * Lưu ý: Nút <Ban size={10} className="inline mb-0.5" /> dùng để đình chỉ kinh doanh các sản phẩm vi phạm bản quyền hoặc chính sách sàn.
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminProductManager;