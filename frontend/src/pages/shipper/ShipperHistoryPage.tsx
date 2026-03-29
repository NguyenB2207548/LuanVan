import { useState, useEffect } from "react";
import {
    History,
    Search,
    CheckCircle2,
    AlertTriangle,
    Package,
    MapPin,
    Phone,
    User,
    Store,
    Loader2,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import axiosClient from "@/api/axiosClient";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

const BASE_URL = "http://localhost:3000";

// --- INTERFACES ---
interface OrderItem {
    id: number;
    quantity: number;
    priceAtPurchase: number;
    variantNameSnapshot: string;
    variant?: {
        images?: { url: string; isPrimary: boolean }[];
        product?: {
            productName: string;
            images?: { url: string; isPrimary: boolean }[];
        };
    };
}

interface SellerInfo {
    id: number;
    fullName: string;
    phoneNumber: string;
}

interface HistoryOrder {
    id: number;
    orderNumber: string;
    totalAmount: string;
    status: "success" | "failed";
    recipientName: string;
    phoneNumber: string;
    shippingAddress: string;
    paymentMethod: string;
    paymentStatus: string;
    seller: SellerInfo | null;
    items: OrderItem[];
    createdAt: string;
    updatedAt: string;
}

interface Meta {
    total: number;
    page: number;
    lastPage: number;
}

// --- HELPERS ---
const getItemImage = (item: OrderItem): string => {
    const variantImg = item.variant?.images?.find((i) => i.isPrimary)?.url;
    const productImg = item.variant?.product?.images?.find((i) => i.isPrimary)?.url;
    const url = variantImg || productImg;
    return url ? `${BASE_URL}${url}` : "";
};

// --- MAIN ---
const ShipperHistoryPage = () => {
    const [orders, setOrders] = useState<HistoryOrder[]>([]);
    const [meta, setMeta] = useState<Meta>({ total: 0, page: 1, lastPage: 1 });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "success" | "failed">("all");
    const [page, setPage] = useState(1);
    const limit = 10;

    useEffect(() => {
        fetchHistory();
    }, [page]);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const res = await axiosClient.get("/orders/shipper/history", {
                params: { page, limit },
            });
            setOrders(res.data.data || []);
            setMeta(res.data.meta);
        } catch {
        } finally {
            setLoading(false);
        }
    };

    // Filter client-side (data đã được phân trang từ server)
    const filtered = orders.filter((o) => {
        const matchSearch =
            o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            o.recipientName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchStatus = statusFilter === "all" || o.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const statusTabs = [
        { key: "all", label: "Tất cả", count: orders.length },
        {
            key: "success",
            label: "Thành công",
            count: orders.filter((o) => o.status === "success").length,
        },
        {
            key: "failed",
            label: "Thất bại",
            count: orders.filter((o) => o.status === "failed").length,
        },
    ];

    return (
        <div className="space-y-6">

            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Lịch sử giao hàng</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Tổng <span className="font-medium text-gray-700">{meta.total}</span> đơn đã xử lý
                </p>
            </div>

            {/* Table card */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">

                {/* Toolbar */}
                <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className="relative flex-1 w-full sm:max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                        <input
                            type="text"
                            placeholder="Tìm mã đơn, tên người nhận..."
                            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400 transition-colors"
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); }}
                        />
                    </div>

                    {/* Status tabs */}
                    <div className="flex gap-1.5">
                        {statusTabs.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setStatusFilter(tab.key as any)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${statusFilter === tab.key
                                        ? "bg-gray-900 text-white border-gray-900"
                                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                                    }`}
                            >
                                {tab.label}
                                <span className="ml-1.5 opacity-60">({tab.count})</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* List */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="animate-spin text-gray-300" size={28} />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-300">
                        <History size={40} className="mb-3" />
                        <p className="text-sm">
                            {searchTerm || statusFilter !== "all"
                                ? "Không tìm thấy đơn phù hợp"
                                : "Chưa có lịch sử giao hàng"}
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {filtered.map((order) => {
                            const isSuccess = order.status === "success";
                            const firstItem = order.items[0];
                            const extraCount = order.items.length - 1;
                            const imgUrl = getItemImage(firstItem);

                            return (
                                <div key={order.id} className="px-5 py-4 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-start gap-4">

                                        {/* Ảnh sản phẩm */}
                                        <div className="shrink-0 w-14 h-14 rounded-lg border border-gray-100 bg-gray-50 overflow-hidden flex items-center justify-center">
                                            {imgUrl ? (
                                                <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <Package size={18} className="text-gray-300" />
                                            )}
                                        </div>

                                        {/* Nội dung chính */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-3 mb-2">
                                                <div>
                                                    <span className="text-xs font-mono font-medium text-gray-600">
                                                        {order.orderNumber}
                                                    </span>
                                                    <p className="text-sm font-semibold text-gray-900 mt-0.5 line-clamp-1">
                                                        {firstItem?.variant?.product?.productName ||
                                                            firstItem?.variantNameSnapshot}
                                                        {extraCount > 0 && (
                                                            <span className="text-gray-400 font-normal ml-1.5">
                                                                +{extraCount} sản phẩm
                                                            </span>
                                                        )}
                                                    </p>
                                                </div>

                                                {/* Badge trạng thái */}
                                                <span
                                                    className={`shrink-0 inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${isSuccess
                                                            ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                                                            : "text-red-700 bg-red-50 border-red-200"
                                                        }`}
                                                >
                                                    {isSuccess ? (
                                                        <CheckCircle2 size={11} />
                                                    ) : (
                                                        <AlertTriangle size={11} />
                                                    )}
                                                    {isSuccess ? "Thành công" : "Thất bại"}
                                                </span>
                                            </div>

                                            {/* Thông tin 2 cột */}
                                            <div className="grid grid-cols-2 gap-x-8 gap-y-1.5">
                                                {/* Cột trái: người nhận */}
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 text-xs text-gray-600">
                                                        <User size={11} className="shrink-0 text-gray-400" />
                                                        <span className="font-medium">{order.recipientName}</span>
                                                        <span className="text-gray-400">·</span>
                                                        <span>{order.phoneNumber}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                                        <MapPin size={11} className="shrink-0 text-gray-400" />
                                                        <span>{order.shippingAddress}</span>
                                                    </div>
                                                </div>

                                                {/* Cột phải: seller + thời gian */}
                                                <div className="space-y-1">
                                                    {order.seller && (
                                                        <div className="flex items-center gap-2 text-xs text-gray-600">
                                                            <Store size={11} className="shrink-0 text-gray-400" />
                                                            <span>{order.seller.fullName}</span>
                                                            {order.seller.phoneNumber && (
                                                                <>
                                                                    <span className="text-gray-400">·</span>
                                                                    <span className="text-gray-500">{order.seller.phoneNumber}</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-2 text-xs text-gray-400">
                                                        <span>
                                                            Giao lúc{" "}
                                                            {format(new Date(order.updatedAt), "HH:mm dd/MM/yyyy", {
                                                                locale: vi,
                                                            })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Tổng tiền */}
                                        <div className="shrink-0 text-right">
                                            <p className="text-sm font-bold text-gray-900">
                                                {Number(order.totalAmount).toLocaleString("vi-VN")}đ
                                            </p>
                                            <p className={`text-xs mt-0.5 font-medium ${order.paymentStatus === "paid"
                                                    ? "text-emerald-600"
                                                    : "text-amber-600"
                                                }`}>
                                                {order.paymentStatus === "paid" ? "Đã thanh toán" : "Chưa thanh toán"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Pagination */}
                {!loading && meta.lastPage > 1 && (
                    <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
                        <p className="text-xs text-gray-400">
                            Trang <span className="font-medium text-gray-600">{meta.page}</span> / {meta.lastPage}
                            <span className="ml-2">({meta.total} đơn)</span>
                        </p>
                        <div className="flex gap-1">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft size={14} />
                            </button>
                            <button
                                onClick={() => setPage((p) => Math.min(meta.lastPage, p + 1))}
                                disabled={page === meta.lastPage}
                                className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ShipperHistoryPage;