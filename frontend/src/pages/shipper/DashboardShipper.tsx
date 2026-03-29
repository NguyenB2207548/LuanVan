import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Truck,
    CheckCircle2,
    Package,
    TrendingUp,
    MapPin,
    User,
    Loader2,
    ArrowRight,
    Clock,
} from "lucide-react";
import axiosClient from "@/api/axiosClient";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import StatCard from "@/components/common/StatCard";

const BASE_URL = "http://localhost:3000";

interface ShipperStats {
    shipping: number;
    completedToday: number;
    totalCompleted: number;
    totalFailed: number;
    successRate: number | null;
}

interface OrderItem {
    id: number;
    variantNameSnapshot: string;
    variant?: {
        images?: { url: string; isPrimary: boolean }[];
        product?: {
            productName: string;
            images?: { url: string; isPrimary: boolean }[];
        };
    };
}

interface RecentOrder {
    id: number;
    orderNumber: string;
    totalAmount: string;
    status: string;
    recipientName: string;
    shippingAddress: string;
    createdAt: string;
    items: OrderItem[];
}

const getItemImage = (item: OrderItem): string => {
    const variantImg = item.variant?.images?.find((i) => i.isPrimary)?.url;
    const productImg = item.variant?.product?.images?.find((i) => i.isPrimary)?.url;
    const url = variantImg || productImg;
    return url ? `${BASE_URL}${url}` : "";
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    confirmed: { label: "Chờ lấy hàng", color: "text-blue-700 bg-blue-50 border-blue-200" },
    shipping: { label: "Đang giao", color: "text-violet-700 bg-violet-50 border-violet-200" },
    success: { label: "Hoàn thành", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
    failed: { label: "Thất bại", color: "text-red-700 bg-red-50 border-red-200" },
};

const DashboardShipper = () => {
    const navigate = useNavigate();

    const [stats, setStats] = useState<ShipperStats | null>(null);
    const [activeOrders, setActiveOrders] = useState<RecentOrder[]>([]);
    const [loadingStats, setLoadingStats] = useState(true);
    const [loadingOrders, setLoadingOrders] = useState(true);

    useEffect(() => {
        Promise.all([fetchStats(), fetchActiveOrders()]);
    }, []);

    const fetchStats = async () => {
        try {
            setLoadingStats(true);
            const res = await axiosClient.get("/orders/shipper/stats");
            setStats(res.data);
        } catch {
        } finally {
            setLoadingStats(false);
        }
    };

    const fetchActiveOrders = async () => {
        try {
            setLoadingOrders(true);
            const res = await axiosClient.get("/orders/shipper/my-orders");
            setActiveOrders(res.data.data || []);
        } catch {
        } finally {
            setLoadingOrders(false);
        }
    };

    return (
        <div className="space-y-6">

            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Tổng quan</h1>
            </div>

            {/* Hàng 1: Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Đang giao"
                    value={stats ? stats.shipping : "—"}
                    icon={<Truck className="text-violet-500" />}
                    loading={loadingStats}
                />
                <StatCard
                    label="Hoàn thành hôm nay"
                    value={stats ? stats.completedToday : "—"}
                    icon={<CheckCircle2 className="text-emerald-500" />}
                    loading={loadingStats}
                />
                <StatCard
                    label="Tổng đã giao"
                    value={stats ? stats.totalCompleted : "—"}
                    icon={<Package className="text-blue-500" />}
                    loading={loadingStats}
                />
                <StatCard
                    label="Tỷ lệ thành công"
                    value={stats ? (stats.successRate !== null ? `${stats.successRate}%` : "—") : "—"}
                    icon={<TrendingUp className="text-amber-500" />}
                    loading={loadingStats}
                />
            </div>

            {/* Hàng 2: Đơn đang giao */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-sm font-semibold text-gray-800">Đơn đang giao</h2>
                        <p className="text-xs text-gray-400 mt-0.5">
                            {stats?.shipping
                                ? `${stats.shipping} đơn cần xử lý`
                                : "Không có đơn nào đang giao"}
                        </p>
                    </div>
                    <button
                        onClick={() => navigate("/shipper/my-orders")}
                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 transition-colors"
                    >
                        Xem tất cả <ArrowRight size={12} />
                    </button>
                </div>

                {loadingOrders ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="animate-spin text-gray-300" size={24} />
                    </div>
                ) : activeOrders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-300">
                        <Truck size={36} className="mb-2" />
                        <p className="text-xs">Không có đơn nào đang giao</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {activeOrders.slice(0, 5).map((order) => {
                            const firstItem = order.items?.[0];
                            const imgUrl = firstItem ? getItemImage(firstItem) : "";
                            const productName =
                                firstItem?.variant?.product?.productName ||
                                firstItem?.variantNameSnapshot || "—";
                            const extraCount = (order.items?.length || 1) - 1;
                            const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.shipping;

                            return (
                                <div
                                    key={order.id}
                                    className="px-5 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors cursor-pointer"
                                    onClick={() => navigate("/shipper/my-orders")}
                                >
                                    <div className="shrink-0 w-12 h-12 rounded-lg border border-gray-100 bg-gray-50 overflow-hidden flex items-center justify-center">
                                        {imgUrl ? (
                                            <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <Package size={16} className="text-gray-300" />
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="text-xs font-mono text-gray-500">
                                                {order.orderNumber}
                                            </span>
                                            <span className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full border ${statusCfg.color}`}>
                                                {statusCfg.label}
                                            </span>
                                        </div>
                                        <p className="text-sm font-medium text-gray-900 line-clamp-1">
                                            {productName}
                                            {extraCount > 0 && (
                                                <span className="text-gray-400 font-normal ml-1">+{extraCount}</span>
                                            )}
                                        </p>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="flex items-center gap-1 text-xs text-gray-500">
                                                <User size={10} className="text-gray-400" />
                                                {order.recipientName}
                                            </span>
                                            <span className="flex items-center gap-1 text-xs text-gray-500">
                                                <MapPin size={10} className="text-gray-400" />
                                                {order.shippingAddress}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="shrink-0 text-right">
                                        <p className="text-sm font-bold text-gray-900">
                                            {Number(order.totalAmount).toLocaleString("vi-VN")}đ
                                        </p>
                                        <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1 justify-end">
                                            <Clock size={10} />
                                            {format(new Date(order.createdAt), "dd/MM/yyyy", { locale: vi })}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Hàng 3: Tóm tắt thống kê */}
            {!loadingStats && stats && (
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-semibold text-gray-800">Tóm tắt hoạt động</h2>
                        <button
                            onClick={() => navigate("/shipper/history")}
                            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 transition-colors"
                        >
                            Xem lịch sử <ArrowRight size={12} />
                        </button>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="text-center py-4 bg-emerald-50 rounded-xl border border-emerald-100">
                            <p className="text-2xl font-bold text-emerald-700">{stats.totalCompleted}</p>
                            <p className="text-xs text-emerald-600 mt-1 font-medium">Giao thành công</p>
                        </div>
                        <div className="text-center py-4 bg-red-50 rounded-xl border border-red-100">
                            <p className="text-2xl font-bold text-red-600">{stats.totalFailed}</p>
                            <p className="text-xs text-red-500 mt-1 font-medium">Giao thất bại</p>
                        </div>
                        <div className="text-center py-4 bg-blue-50 rounded-xl border border-blue-100">
                            <p className="text-2xl font-bold text-blue-700">
                                {stats.successRate !== null ? `${stats.successRate}%` : "—"}
                            </p>
                            <p className="text-xs text-blue-600 mt-1 font-medium">Tỷ lệ thành công</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardShipper;