import { useState, useEffect } from "react";
import {
  Search, Package, Eye, Check, X, FileDown,
  Clock, Truck, CircleCheck, CircleX, RefreshCw,
  DollarSign
} from "lucide-react";
import axiosClient from "@/api/axiosClient";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import toast, { Toaster } from "react-hot-toast";
import OrderDetailModal from "../../modals/OrderDetailModal";
import StatCard from "@/components/common/StatCard";

const BASE_URL = "http://localhost:3000";

interface OrderItem {
  id: number;
  quantity: number;
  priceAtPurchase: number;
  variantNameSnapshot: string;
  customizedDesignJson: Record<string, string> | null;
  variant: {
    id: number;
    sku: string;
    price: number;
    stock: number;
    images: { url: string; isPrimary: boolean }[];
    product: {
      id: number;
      productName: string;
      images: { url: string; isPrimary: boolean }[];
    };
  } | null;
}

interface Order {
  id: number;
  orderNumber: string;
  totalAmount: string;
  status: "pending" | "confirmed" | "shipped" | "success" | "failed" | "cancelled";
  recipientName: string;
  phoneNumber: string;
  shippingAddress: string;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  user: { id: number; fullName: string; email: string; phoneNumber: string };
  shipper: { id: number; fullName: string; phoneNumber: string } | null;
}

interface OrderStats {
  pending: number;
  confirmed: number;
  shipping: number;
  success: number;
  cancelled: number;
  failed: number;
  totalOrders: number;
  revenue: number;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  pending: { label: "Chờ xác nhận", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
  confirmed: { label: "Đã xác nhận", color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" },
  shipped: { label: "Đang giao", color: "text-violet-700", bg: "bg-violet-50", border: "border-violet-200" },
  success: { label: "Hoàn thành", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  failed: { label: "Thất bại", color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200" },
  cancelled: { label: "Đã hủy", color: "text-rose-700", bg: "bg-rose-50", border: "border-rose-200" },
};

const PAYMENT_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  paid: { label: "Đã thanh toán", color: "text-emerald-600" },
  pending: { label: "Chưa thanh toán", color: "text-gray-400" },
};

const FILTER_TABS = [
  { value: "all", label: "Tất cả" },
  { value: "pending", label: "Chờ xác nhận" },
  { value: "confirmed", label: "Đã xác nhận" },
  { value: "shipped", label: "Đang giao" },
  { value: "success", label: "Hoàn thành" },
  { value: "cancelled", label: "Đã hủy" },
];

const getFirstItemImage = (order: Order): string | null => {
  const item = order.items[0];
  if (!item) return null;
  return (
    item.variant?.images?.find(i => i.isPrimary)?.url ||
    item.variant?.product?.images?.find(i => i.isPrimary)?.url ||
    null
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const cfg = STATUS_CONFIG[status] || { label: status, color: "text-gray-600", bg: "bg-gray-50", border: "border-gray-200" };
  return (
    <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
      {cfg.label}
    </span>
  );
};

const SellerOrderManager = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchOrders();
    fetchStats();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get("/orders/seller");
      setOrders(res.data.data || []);
    } catch {
      toast.error("Không thể tải danh sách đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const res = await axiosClient.get("/orders/seller/stats");
      setStats(res.data);
    } catch {
      console.error("Không thể tải thống kê đơn hàng");
    } finally {
      setLoadingStats(false);
    }
  };

  const handleConfirmOrder = async (orderId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Xác nhận đơn hàng này?")) return;
    const t = toast.loading("Đang xác nhận...");
    try {
      await axiosClient.patch(`/orders/${orderId}/seller-confirm`);
      toast.success("Xác nhận thành công", { id: t });
      fetchOrders();
      fetchStats(); // Cập nhật lại stats
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Xác nhận thất bại", { id: t });
    }
  };

  const handleCancelOrder = async (orderId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Hủy đơn hàng này?")) return;
    const t = toast.loading("Đang hủy...");
    try {
      await axiosClient.patch(`/orders/${orderId}/seller-cancel`);
      toast.success("Đã hủy đơn hàng", { id: t });
      fetchOrders();
      fetchStats(); // Cập nhật lại stats
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Hủy thất bại", { id: t });
    }
  };

  const filtered = orders.filter(o => {
    const matchSearch =
      o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.recipientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.user.fullName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const countByStatus = (s: string) =>
    s === "all" ? orders.length : orders.filter(o => o.status === s).length;

  return (
    <div className="w-full min-h-screen pb-16">
      <Toaster position="top-right" />
      <OrderDetailModal
        order={selectedOrder}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {/* Page header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Quản lý đơn hàng</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { fetchOrders(); fetchStats(); }}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Làm mới"
          >
            <RefreshCw size={16} />
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 text-sm text-emerald-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <FileDown size={15} /> Xuất Excel
          </button>
        </div>
      </div>

      {/* STATS SECTION */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Doanh thu (VNĐ)"
          value={stats?.revenue?.toLocaleString("vi-VN") || 0}
          icon={<DollarSign />}
          loading={loadingStats}
        />
        <StatCard
          label="Chờ xác nhận"
          value={stats?.pending || 0}
          icon={<Clock />}
          loading={loadingStats}
        />
        <StatCard
          label="Đang giao hàng"
          value={stats?.shipping || 0}
          icon={<Truck />}
          loading={loadingStats}
        />
        <StatCard
          label="Đã hoàn thành"
          value={stats?.success || 0}
          icon={<CircleCheck />}
          loading={loadingStats}
        />
      </div>

      {/* Card chứa cả toolbar + table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">

        {/* Toolbar */}
        <div className="px-5 py-3 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Search */}
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input
              type="text"
              placeholder="Tìm mã đơn, tên khách..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400 transition-colors bg-gray-50"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Status filter */}
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

          <span className="sm:ml-auto text-xs text-gray-400 whitespace-nowrap">
            {filtered.length} đơn hàng
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-t border-b border-gray-100 bg-gray-50/60">
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700">Mã đơn</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700">Khách hàng</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700">Sản phẩm</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700">Trạng thái</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700">Thanh toán</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-700">Tổng tiền</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700">Ngày đặt</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-700">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center">
                    <div className="flex justify-center items-center gap-2 text-sm text-gray-400">
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                      Đang tải dữ liệu...
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center">
                    <Package className="mx-auto text-gray-200 mb-3" size={36} />
                    <p className="text-sm text-gray-400">Không tìm thấy đơn hàng nào</p>
                  </td>
                </tr>
              ) : (
                filtered.map(order => {
                  const img = getFirstItemImage(order);
                  const totalItems = order.items.reduce((s, i) => s + i.quantity, 0);
                  const paymentCfg = PAYMENT_STATUS_CONFIG[order.paymentStatus] || { label: order.paymentStatus, color: "text-gray-500" };

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-gray-50/70 transition-colors cursor-pointer"
                      onClick={() => { setSelectedOrder(order); setIsModalOpen(true); }}
                    >
                      <td className="px-5 py-4">
                        <span className="text-sm font-medium text-gray-900 font-mono">
                          {order.orderNumber.replace("ORD-", "")}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-sm text-gray-900">{order.recipientName}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{order.phoneNumber}</p>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-lg border border-gray-100 bg-gray-50 overflow-hidden shrink-0">
                            {img
                              ? <img src={`${BASE_URL}${img}`} className="w-full h-full object-cover" alt="" />
                              : <div className="w-full h-full flex items-center justify-center"><Package size={14} className="text-gray-300" /></div>
                            }
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm text-gray-800 truncate max-w-[180px]">
                              {order.items[0]?.variant?.product?.productName || order.items[0]?.variantNameSnapshot || "—"}
                            </p>
                            {totalItems > 1 && (
                              <p className="text-xs text-gray-400 mt-0.5">+{totalItems - 1} sản phẩm khác</p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={order.status} />
                      </td>

                      <td className="px-5 py-4">
                        <p className={`text-xs font-medium ${paymentCfg.color}`}>{paymentCfg.label}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{order.paymentMethod}</p>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <span className="text-sm font-semibold text-gray-900">
                          {Number(order.totalAmount).toLocaleString("vi-VN")}đ
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-sm text-gray-600">
                          {format(new Date(order.createdAt), "dd/MM/yyyy", { locale: vi })}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {format(new Date(order.createdAt), "HH:mm", { locale: vi })}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                          {order.status === "pending" && (
                            <>
                              <button
                                onClick={e => handleConfirmOrder(order.id, e)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Xác nhận"
                              >
                                <Check size={15} />
                              </button>
                              <button
                                onClick={e => handleCancelOrder(order.id, e)}
                                className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Hủy đơn"
                              >
                                <X size={15} />
                              </button>
                            </>
                          )}
                          <button
                            onClick={e => { e.stopPropagation(); setSelectedOrder(order); setIsModalOpen(true); }}
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Xem chi tiết"
                          >
                            <Eye size={15} />
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

        {!loading && filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              Hiển thị <span className="font-medium text-gray-600">{filtered.length}</span> / {orders.length} đơn hàng
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerOrderManager;