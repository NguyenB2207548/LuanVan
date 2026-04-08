import { useState, useRef, useEffect } from "react";
import { Bell, Package, CheckCircle2, Truck, XCircle, AlertTriangle } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string }> = {
    ORDER_PLACED: { icon: <Package size={14} />, color: "text-blue-500 bg-blue-50" },
    ORDER_CONFIRMED: { icon: <CheckCircle2 size={14} />, color: "text-emerald-500 bg-emerald-50" },
    ORDER_CANCELLED_BY_SELLER: { icon: <XCircle size={14} />, color: "text-red-500 bg-red-50" },
    ORDER_CANCELLED_BY_USER: { icon: <XCircle size={14} />, color: "text-red-500 bg-red-50" },
    SHIPPER_PICKED_UP: { icon: <Truck size={14} />, color: "text-violet-500 bg-violet-50" },
    ORDER_DELIVERED: { icon: <CheckCircle2 size={14} />, color: "text-emerald-500 bg-emerald-50" },
    ORDER_FAILED: { icon: <AlertTriangle size={14} />, color: "text-orange-500 bg-orange-50" },
};

const NotificationBell = () => {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const {
        notifications, unreadCount, loading,
        fetchNotifications, markAsRead, markAllAsRead,
    } = useNotifications();

    // Đóng khi click ngoài
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const handleOpen = () => {
        if (!open) fetchNotifications();
        setOpen((v) => !v);
    };

    return (
        <div className="relative" ref={ref}>
            {/* Bell button */}
            <button
                onClick={handleOpen}
                className="w-8 h-8 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors relative"
            >
                <Bell size={16} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5">
                        {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">

                    {/* Header */}
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-800">
                            Thông báo
                            {unreadCount > 0 && (
                                <span className="ml-2 text-xs font-medium text-white bg-red-500 px-1.5 py-0.5 rounded-full">
                                    {unreadCount}
                                </span>
                            )}
                        </span>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
                            >
                                Đọc tất cả
                            </button>
                        )}
                    </div>

                    {/* List */}
                    <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
                        {loading ? (
                            <div className="py-8 text-center text-xs text-gray-400">Đang tải...</div>
                        ) : notifications.length === 0 ? (
                            <div className="py-8 text-center text-xs text-gray-400">
                                Không có thông báo nào
                            </div>
                        ) : (
                            notifications.map((n) => {
                                const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.ORDER_PLACED;
                                return (
                                    <div
                                        key={n.id}
                                        onClick={() => !n.isRead && markAsRead(n.id)}
                                        className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${!n.isRead ? "bg-blue-50/40" : ""
                                            }`}
                                    >
                                        {/* Icon */}
                                        <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${cfg.color}`}>
                                            {cfg.icon}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm leading-snug ${!n.isRead ? "font-semibold text-gray-900" : "font-medium text-gray-700"}`}>
                                                {n.title}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>
                                            <p className="text-[11px] text-gray-400 mt-1">
                                                {format(new Date(n.createdAt), "HH:mm dd/MM/yyyy", { locale: vi })}
                                            </p>
                                        </div>

                                        {/* Unread dot */}
                                        {!n.isRead && (
                                            <div className="shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-1.5" />
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;