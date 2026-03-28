import { useState, useEffect } from "react";
import {
    TrendingUp,
    ShoppingBag,
    CheckCircle2,
    XCircle,
    Clock,
    Loader2,
    Calendar,
} from "lucide-react";
import {
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Area,
    AreaChart,
} from "recharts";
import axiosClient from "@/api/axiosClient";

// --- INTERFACES ---
interface RevenueOverview {
    period: { from: string; to: string };
    current: {
        totalRevenue: number;
        completedOrders: number;
        cancelledOrders: number;
        pendingOrders: number;
        avgOrderValue: number;
    };
}

interface ChartDataPoint {
    period: string;
    label: string;
    revenue: number;
    orders: number;
    cancelled: number;
}

interface RevenueChart {
    groupBy: string;
    period: { from: string; to: string };
    data: ChartDataPoint[];
}

// --- HELPERS ---
const formatVND = (value: number) =>
    new Intl.NumberFormat("vi-VN", { style: "decimal" }).format(value) + "đ";

const formatShortVND = (value: number) => {
    if (value >= 1_000_000) return (value / 1_000_000).toFixed(1) + "tr";
    if (value >= 1_000) return (value / 1_000).toFixed(0) + "k";
    return value.toString();
};

// Custom tooltip cho biểu đồ
const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg text-sm">
            <p className="font-semibold text-gray-700 mb-2">{label}</p>
            <p className="text-blue-600">
                Doanh thu: <span className="font-bold">{formatVND(payload[0]?.value || 0)}</span>
            </p>
            <p className="text-gray-500">
                Đơn thành công: <span className="font-medium">{payload[1]?.value || 0}</span>
            </p>
        </div>
    );
};

// --- PRESET DATE RANGES ---
const getPresets = () => {
    const now = new Date();
    const fmt = (d: Date) => d.toISOString().split("T")[0];

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const start7 = new Date(now);
    start7.setDate(now.getDate() - 6);

    const start30 = new Date(now);
    start30.setDate(now.getDate() - 29);

    const startOfYear = new Date(now.getFullYear(), 0, 1);

    return [
        { label: "7 ngày qua", from: fmt(start7), to: fmt(now), groupBy: "day" },
        { label: "30 ngày qua", from: fmt(start30), to: fmt(now), groupBy: "day" },
        { label: "Tháng này", from: fmt(startOfMonth), to: fmt(endOfMonth), groupBy: "day" },
        { label: "Năm nay", from: fmt(startOfYear), to: fmt(now), groupBy: "month" },
    ];
};

// --- MAIN COMPONENT ---
const SellerRevenuePage = () => {
    const presets = getPresets();

    const [overview, setOverview] = useState<RevenueOverview | null>(null);
    const [chart, setChart] = useState<RevenueChart | null>(null);
    const [loadingOverview, setLoadingOverview] = useState(true);
    const [loadingChart, setLoadingChart] = useState(true);

    const [from, setFrom] = useState(presets[2].from);
    const [to, setTo] = useState(presets[2].to);
    const [groupBy, setGroupBy] = useState<"day" | "week" | "month">("day");
    const [activePreset, setActivePreset] = useState(2);

    useEffect(() => {
        fetchOverview();
        fetchChart();
    }, [from, to, groupBy]);

    const fetchOverview = async () => {
        try {
            setLoadingOverview(true);
            const res = await axiosClient.get("/statistics/seller/revenue-overview", {
                params: { from, to },
            });
            setOverview(res.data);
        } catch {
            //
        } finally {
            setLoadingOverview(false);
        }
    };

    const fetchChart = async () => {
        try {
            setLoadingChart(true);
            const res = await axiosClient.get("/statistics/seller/revenue-chart", {
                params: { from, to, groupBy },
            });
            setChart(res.data);
        } catch {
            //
        } finally {
            setLoadingChart(false);
        }
    };

    const applyPreset = (index: number) => {
        const p = presets[index];
        setFrom(p.from);
        setTo(p.to);
        setGroupBy(p.groupBy as "day" | "week" | "month");
        setActivePreset(index);
    };

    const handleCustomDate = (field: "from" | "to", value: string) => {
        setActivePreset(-1);
        if (field === "from") setFrom(value);
        else setTo(value);
    };

    const statCards = overview
        ? [
            {
                label: "Doanh thu",
                value: formatVND(overview.current.totalRevenue),
                icon: <TrendingUp size={18} className="text-blue-500" />,
                bg: "bg-blue-50",
            },
            {
                label: "Đơn hoàn thành",
                value: overview.current.completedOrders,
                icon: <CheckCircle2 size={18} className="text-emerald-500" />,
                bg: "bg-emerald-50",
            },
            {
                label: "Giá trị TB / đơn",
                value: formatVND(overview.current.avgOrderValue),
                icon: <ShoppingBag size={18} className="text-violet-500" />,
                bg: "bg-violet-50",
            },
            {
                label: "Đơn đã hủy",
                value: overview.current.cancelledOrders,
                icon: <XCircle size={18} className="text-red-400" />,
                bg: "bg-red-50",
            },
            {
                label: "Đơn chờ xử lý",
                value: overview.current.pendingOrders,
                icon: <Clock size={18} className="text-amber-500" />,
                bg: "bg-amber-50",
            },
        ]
        : [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Doanh thu</h1>
                <p className="text-sm text-gray-500 mt-1">Tổng quan và biểu đồ doanh thu theo thời gian</p>
            </div>

            {/* Filter bar */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-wrap items-center gap-3">
                <div className="flex gap-1.5 flex-wrap">
                    {presets.map((p, i) => (
                        <button
                            key={i}
                            onClick={() => applyPreset(i)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${activePreset === i
                                    ? "bg-gray-900 text-white border-gray-900"
                                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                                }`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>

                <div className="h-5 w-px bg-gray-200 hidden sm:block" />

                <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-gray-400" />
                    <input
                        type="date"
                        value={from}
                        onChange={(e) => handleCustomDate("from", e.target.value)}
                        className="border border-gray-200 rounded-md px-2 py-1 text-xs outline-none focus:border-gray-400"
                    />
                    <span className="text-gray-400 text-xs">đến</span>
                    <input
                        type="date"
                        value={to}
                        onChange={(e) => handleCustomDate("to", e.target.value)}
                        className="border border-gray-200 rounded-md px-2 py-1 text-xs outline-none focus:border-gray-400"
                    />
                </div>

                <div className="h-5 w-px bg-gray-200 hidden sm:block" />

                <div className="flex gap-1">
                    {(["day", "week", "month"] as const).map((g) => (
                        <button
                            key={g}
                            onClick={() => { setGroupBy(g); setActivePreset(-1); }}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${groupBy === g
                                    ? "bg-gray-900 text-white border-gray-900"
                                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                                }`}
                        >
                            {g === "day" ? "Ngày" : g === "week" ? "Tuần" : "Tháng"}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stat cards */}
            {loadingOverview ? (
                <div className="flex items-center justify-center py-10">
                    <Loader2 className="animate-spin text-gray-400" size={28} />
                </div>
            ) : (
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    {statCards.map((card, i) => (
                        <div key={i} className="bg-white border border-gray-200 rounded-xl p-4">
                            <div className={`w-9 h-9 rounded-lg ${card.bg} flex items-center justify-center mb-3`}>
                                {card.icon}
                            </div>
                            <p className="text-xs text-gray-500 mb-1">{card.label}</p>
                            <p className="text-xl font-bold text-gray-900">{card.value}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Chart */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="mb-6">
                    <h2 className="text-sm font-bold text-gray-800">Biểu đồ doanh thu</h2>
                    <p className="text-xs text-gray-400 mt-0.5">
                        Chỉ tính đơn hàng hoàn thành (status = success)
                    </p>
                </div>

                {loadingChart ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="animate-spin text-gray-400" size={28} />
                    </div>
                ) : !chart || chart.data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                        <TrendingUp size={36} className="mb-3 opacity-30" />
                        <p className="text-sm">Không có dữ liệu trong khoảng thời gian này</p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={chart.data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.12} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                            <XAxis
                                dataKey="label"
                                tick={{ fontSize: 11, fill: "#9ca3af" }}
                                axisLine={false}
                                tickLine={false}
                                dy={8}
                            />
                            <YAxis
                                tickFormatter={formatShortVND}
                                tick={{ fontSize: 11, fill: "#9ca3af" }}
                                axisLine={false}
                                tickLine={false}
                                width={48}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Area
                                type="monotone"
                                dataKey="revenue"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                fill="url(#revenueGradient)"
                                dot={{ r: 3, fill: "#3b82f6", strokeWidth: 0 }}
                                activeDot={{ r: 5, fill: "#3b82f6" }}
                            />
                            <Line
                                type="monotone"
                                dataKey="orders"
                                stroke="#10b981"
                                strokeWidth={1.5}
                                dot={false}
                                strokeDasharray="4 3"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )}

                {chart && chart.data.length > 0 && (
                    <div className="flex items-center gap-5 mt-4 pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-0.5 bg-blue-500 rounded" />
                            <span className="text-xs text-gray-500">Doanh thu</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-0.5 bg-emerald-500 rounded" />
                            <span className="text-xs text-gray-500">Đơn thành công</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SellerRevenuePage;