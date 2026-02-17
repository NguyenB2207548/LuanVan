import React from "react";
import {
  ShoppingCart,
  TrendingUp,
  Package,
  RotateCcw,
  Eye,
  MoreHorizontal,
  type LucideIcon,
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

// --- DỮ LIỆU GIẢ (MOCK DATA) ---

// Dữ liệu cho biểu đồ (7 ngày gần nhất)
const dataChart = [
  { name: "Mon", value: 4000000 },
  { name: "Tue", value: 3000000 },
  { name: "Wed", value: 5000000 },
  { name: "Thu", value: 4500000 },
  { name: "Fri", value: 6000000 },
  { name: "Sat", value: 7500000 },
  { name: "Sun", value: 6000000 },
];

// Dữ liệu đơn hàng mới nhất
const recentOrders = [
  {
    id: "ORD-001",
    customer: "Nguyễn Văn A",
    status: "In Production",
    total: "450.000 VNĐ",
    date: "2026-02-17",
  },
  {
    id: "ORD-002",
    customer: "Trần Thị B",
    status: "Pending",
    total: "320.000 VNĐ",
    date: "2026-02-17",
  },
  {
    id: "ORD-003",
    customer: "Lê Văn C",
    status: "Shipped",
    total: "680.000 VNĐ",
    date: "2026-02-16",
  },
  {
    id: "ORD-004",
    customer: "Phạm Thị D",
    status: "Completed",
    total: "290.000 VNĐ",
    date: "2026-02-16",
  },
  {
    id: "ORD-005",
    customer: "Hoàng Văn E",
    status: "In Production",
    total: "540.000 VNĐ",
    date: "2026-02-15",
  },
];
interface StatCardProps {
  title: string;
  value: string | number;
  subtext?: string; // Dấu ? nghĩa là có thể có hoặc không
  icon: LucideIcon;
  colorClass: string;
  trend?: string | number | null;
}
const StatCard = ({
  title,
  value,
  subtext,
  icon: Icon,
  colorClass,
  trend,
}: StatCardProps) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-36">
    <div className="flex justify-between items-start">
      <div className={`p-3 rounded-xl ${colorClass}`}>
        <Icon size={24} />
      </div>
      {trend && (
        <span className="text-green-500 text-xs font-medium bg-green-50 px-2 py-1 rounded-full">
          +{trend}%
        </span>
      )}
    </div>
    <div>
      <h3 className="text-gray-500 text-sm font-medium mb-1">{title}</h3>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-gray-800">{value}</span>
        {subtext && <span className="text-gray-500 text-sm">{subtext}</span>}
      </div>
    </div>
  </div>
);

// Hàm lấy màu cho trạng thái đơn hàng
const getStatusColor = (status: string) => {
  switch (status) {
    case "In Production":
      return "bg-blue-100 text-blue-700";
    case "Pending":
      return "bg-yellow-100 text-yellow-700";
    case "Shipped":
      return "bg-purple-100 text-purple-700";
    case "Completed":
      return "bg-green-100 text-green-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

// --- COMPONENT CHÍNH ---

const Dashboard = () => {
  return (
    <div className="space-y-6">
      {/* 1. Header Dashboard */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500">Tổng quan hoạt động kinh doanh POD</p>
      </div>

      {/* 2. Stats Grid (4 ô trên cùng) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Tổng đơn hàng"
          value="1.247"
          icon={ShoppingCart}
          colorClass="bg-blue-50 text-blue-600"
          trend="12"
        />
        <StatCard
          title="Doanh thu"
          value="45.7M"
          icon={TrendingUp}
          colorClass="bg-green-50 text-green-600"
          trend="8.2"
        />
        <StatCard
          title="Sản phẩm bán chạy"
          value="Custom T-Shirt"
          icon={Package}
          colorClass="bg-purple-50 text-purple-600"
          trend="5.1"
        />
        <StatCard
          title="Tỷ lệ trả hàng"
          value="2.3%"
          icon={RotateCcw}
          colorClass="bg-orange-50 text-orange-600"
          trend={null}
        />
      </div>

      {/* 3. Chart Section (Biểu đồ ở giữa) */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-800">
            Doanh số theo tuần
          </h2>
          <p className="text-sm text-gray-500">
            Biểu đồ doanh thu 7 ngày gần nhất
          </p>
        </div>

        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dataChart}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#E5E7EB"
              />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#6B7280", fontSize: 12 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#6B7280", fontSize: 12 }}
                tickFormatter={(value) => `${value / 1000000}M`}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: "none",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
                formatter={(value: any) =>
                  new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(value)
                }
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorValue)"
                dot={{ r: 4, fill: "#3b82f6", strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 6 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Recent Orders Table (Bảng đơn hàng mới nhất) */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">Đơn hàng mới nhất</h2>
          <p className="text-sm text-gray-500">
            Theo dõi trạng thái đơn hàng gần đây
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-500 font-medium">
              <tr>
                <th className="px-6 py-4">MÃ ĐƠN</th>
                <th className="px-6 py-4">KHÁCH HÀNG</th>
                <th className="px-6 py-4">TRẠNG THÁI</th>
                <th className="px-6 py-4">TỔNG TIỀN</th>
                <th className="px-6 py-4">NGÀY ĐẶT</th>
                <th className="px-6 py-4 text-center">HÀNH ĐỘNG</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {order.id}
                  </td>
                  <td className="px-6 py-4">{order.customer}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-900">{order.total}</td>
                  <td className="px-6 py-4 text-gray-500">{order.date}</td>
                  <td className="px-6 py-4 text-center">
                    <button className="text-blue-500 hover:bg-blue-50 p-2 rounded-full transition">
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
