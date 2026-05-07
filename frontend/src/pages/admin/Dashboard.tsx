import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp,
  ShoppingBag,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  AlertTriangle,
  Loader2,
  ArrowRight,
  User,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import axiosClient from "@/api/axiosClient";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import StatCard from "@/components/common/StatCard";

// --- INTERFACES ---
interface AdminOverview {
  totalRevenue: number;
  completedOrders: number;
  pendingOrders: number;
  totalUsers: number;
}

interface ChartPoint {
  label: string;
  revenue: number;
  orders: number;
}

interface OrderItem {
  id: number;
  quantity: number;
  priceAtPurchase: number;
  variantNameSnapshot: string;
  variant?: {
    product?: { productName: string };
  };
}

interface RecentOrder {
  id: number;
  orderNumber: string;
  totalAmount: string;
  status: string;
  recipientName: string;
  createdAt: string;
  items: OrderItem[];
}

interface RecentUser {
  id: number;
  fullName: string;
  email: string;
  role: string;
  createdAt: string;
}

// --- HELPERS ---
const formatVND = (v: number) => new Intl.NumberFormat("vi-VN").format(v) + "đ";

const formatShortVND = (v: number) => {
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + "tr";
  if (v >= 1_000) return (v / 1_000).toFixed(0) + "k";
  return v.toString();
};

const getLast30Days = () => {
  const now = new Date();
  const from = new Date(now);
  from.setDate(now.getDate() - 29);
  const fmt = (d: Date) => d.toISOString().split("T")[0];
  return { from: fmt(from), to: fmt(now) };
};

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  pending: {
    label: "Chờ xác nhận",
    color: "text-amber-700 bg-amber-50 border-amber-200",
    icon: <Clock size={11} />,
  },
  confirmed: {
    label: "Đã xác nhận",
    color: "text-blue-700 bg-blue-50 border-blue-200",
    icon: <CheckCircle2 size={11} />,
  },
  shipping: {
    label: "Đang giao",
    color: "text-violet-700 bg-violet-50 border-violet-200",
    icon: <Truck size={11} />,
  },
  success: {
    label: "Hoàn thành",
    color: "text-emerald-700 bg-emerald-50 border-emerald-200",
    icon: <CheckCircle2 size={11} />,
  },
  failed: {
    label: "Giao thất bại",
    color: "text-orange-700 bg-orange-50 border-orange-200",
    icon: <AlertTriangle size={11} />,
  },
  cancelled: {
    label: "Đã hủy",
    color: "text-red-700 bg-red-50 border-red-200",
    icon: <XCircle size={11} />,
  },
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg text-sm">
      <p className="font-medium text-gray-700 mb-1.5">{label}</p>
      <p className="text-blue-600 text-xs">
        Doanh thu:{" "}
        <span className="font-bold">{formatVND(payload[0]?.value || 0)}</span>
      </p>
    </div>
  );
};

// --- MAIN ---
const DashboardAdmin = () => {
  const navigate = useNavigate();
  const { from, to } = getLast30Days();

  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);

  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingChart, setLoadingChart] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);

  useEffect(() => {
    fetchOverview();
    fetchChart();
    fetchRecentOrders();
    fetchRecentUsers();
  }, []);

  const fetchOverview = async () => {
    try {
      setLoadingOverview(true);
      const res = await axiosClient.get("statistics/admin/overview");
      setOverview(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingOverview(false);
    }
  };

  const fetchChart = async () => {
    try {
      setLoadingChart(true);
      const res = await axiosClient.get("statistics/admin/revenue-chart", {
        params: { from, to, groupBy: "day" },
      });
      setChartData(res.data.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingChart(false);
    }
  };

  const fetchRecentOrders = async () => {
    try {
      setLoadingOrders(true);
      // Sửa tên API backend thành /admin/recent-orders để tránh trùng lặp
      const res = await axiosClient.get("orders/admin/recent", {
        params: { limit: 5 },
      });
      setRecentOrders(res.data.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchRecentUsers = async () => {
    try {
      setLoadingUsers(true);
      const res = await axiosClient.get("users/admin/recent", {
        params: { limit: 5 },
      });
      setRecentUsers(res.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingUsers(false);
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
          label="Tổng doanh thu toàn sàn"
          value={overview ? formatVND(overview.totalRevenue) : "—"}
          icon={<TrendingUp className="text-blue-500" />}
          loading={loadingOverview}
        />
        <StatCard
          label="Đơn hoàn thành"
          value={overview ? overview.completedOrders : "—"}
          icon={<CheckCircle2 className="text-emerald-500" />}
          loading={loadingOverview}
        />
        <StatCard
          label="Tổng người dùng"
          value={overview ? overview.totalUsers : "—"}
          icon={<Users className="text-violet-500" />}
          loading={loadingOverview}
        />
        <StatCard
          label="Đơn chờ xử lý"
          value={overview ? overview.pendingOrders : "—"}
          icon={<Clock className="text-amber-500" />}
          loading={loadingOverview}
        />
      </div>

      {/* Hàng 2: Biểu đồ */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-sm font-semibold text-gray-800">
              Doanh thu toàn hệ thống (30 ngày)
            </h2>
          </div>
        </div>

        {loadingChart ? (
          <div className="flex items-center justify-center h-52">
            <Loader2 className="animate-spin text-gray-300" size={24} />
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-52 text-gray-300">
            <TrendingUp size={32} className="mb-2" />
            <p className="text-xs">Chưa có dữ liệu</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart
              data={chartData}
              margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f3f4f6"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
                dy={6}
              />
              <YAxis
                tickFormatter={formatShortVND}
                tick={{ fontSize: 10, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
                width={44}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#3b82f6"
                strokeWidth={1.5}
                fill="url(#grad)"
                dot={false}
                activeDot={{ r: 4, fill: "#3b82f6", strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Hàng 3: Layout 2 cột (Đơn hàng & Người dùng mới) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cột 1: Đơn hàng mới nhất */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-800">
              Đơn hàng mới nhất
            </h2>
            <button
              onClick={() => navigate("/admin/orders")}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
            >
              Xem tất cả <ArrowRight size={12} />
            </button>
          </div>
          <div className="p-0 flex-1 overflow-x-auto">
            {loadingOrders ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-gray-300" size={24} />
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-300">
                <ShoppingBag size={32} className="mb-2" />
                <p className="text-xs">Chưa có đơn hàng</p>
              </div>
            ) : (
              <table className="min-w-full">
                <tbody className="divide-y divide-gray-50">
                  {recentOrders.map((order) => {
                    const statusCfg =
                      STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                    return (
                      <tr
                        key={order.id}
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => navigate("/admin/orders")}
                      >
                        <td className="px-5 py-3">
                          <p className="text-xs font-mono font-bold text-gray-700">
                            {order.orderNumber}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {format(
                              new Date(order.createdAt),
                              "dd/MM/yy HH:mm",
                            )}
                          </p>
                        </td>
                        <td className="px-5 py-3">
                          <p className="text-sm text-gray-800">
                            {order.recipientName}
                          </p>
                          <p className="text-sm font-medium text-blue-600 mt-0.5">
                            {formatVND(Number(order.totalAmount))}
                          </p>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${statusCfg.color}`}
                          >
                            {statusCfg.icon} {statusCfg.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Cột 2: Người dùng mới đăng ký */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-800">
              Người dùng mới đăng ký
            </h2>
            <button
              onClick={() => navigate("/admin/users")}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
            >
              Xem tất cả <ArrowRight size={12} />
            </button>
          </div>
          <div className="p-0 flex-1 overflow-x-auto">
            {loadingUsers ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-gray-300" size={24} />
              </div>
            ) : recentUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-300">
                <Users size={32} className="mb-2" />
                <p className="text-xs">Chưa có người dùng</p>
              </div>
            ) : (
              <table className="min-w-full">
                <tbody className="divide-y divide-gray-50">
                  {recentUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => navigate("/admin/users")}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-500">
                            <User size={14} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800">
                              {user.fullName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <p className="text-xs font-medium text-gray-600 uppercase bg-gray-100 inline-block px-2 py-0.5 rounded">
                          {user.role}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-1">
                          {format(new Date(user.createdAt), "dd/MM/yyyy")}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardAdmin;
