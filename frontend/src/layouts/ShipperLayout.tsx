import { useState } from "react";
import { Outlet, NavLink, Navigate, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, LogOut, ChevronUp, Truck,
  History, ClipboardList, UserCircle,
} from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import NotificationBell from "@/components/common/NotificationBell";

const ShipperLayout = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [showUserMenu, setShowUserMenu] = useState(false);

  if (!user || user.role !== "shipper") {
    return <Navigate to="/" replace />;
  }

  const getLinkClass = ({ isActive }: { isActive: boolean }) =>
    [
      "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all duration-150",
      isActive
        ? "text-emerald-700 font-semibold bg-emerald-50"
        : "text-gray-500 font-medium hover:text-gray-800 hover:bg-gray-50",
    ].join(" ");

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getInitials = (name: string) =>
    name ? name.charAt(0).toUpperCase() : "S";

  const navItems = [
    { to: "/shipper/dashboard", icon: LayoutDashboard, label: "Bảng điều khiển" },
    { to: "/shipper/orders", icon: ClipboardList, label: "Đơn hàng" },
    { to: "/shipper/my-orders", icon: Truck, label: "Đơn đang giao" },
    { to: "/shipper/history", icon: History, label: "Lịch sử giao hàng" },
    { to: "/shipper/settings", icon: UserCircle, label: "Hồ sơ vận chuyển" },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col fixed left-0 top-0 h-full z-30">
        <div className="h-11 flex items-center px-5 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-emerald-600 rounded-md flex items-center justify-center shrink-0">
              <Truck size={15} className="text-white" />
            </div>
            <span className="text-sm font-bold text-gray-900 tracking-tight">
              Shipper Center
            </span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-3">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} className={getLinkClass}>
              <Icon size={16} className="shrink-0" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-3 border-t border-gray-200">
          <div className="relative">
            {showUserMenu && (
              <div className="absolute bottom-full left-0 w-full mb-1.5 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                >
                  <LogOut size={14} /> Đăng xuất
                </button>
              </div>
            )}
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-full flex items-center gap-2.5 px-2 py-2 rounded-md hover:bg-gray-50 transition-colors"
            >
              <div className="w-7 h-7 rounded-md bg-emerald-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {getInitials(user.fullName || user.email)}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-xs font-semibold text-gray-800 truncate">
                  {user.fullName || "Shipper"}
                </p>
                <p className="text-[10px] text-emerald-600 font-medium">Đang sẵn sàng</p>
              </div>
              <ChevronUp
                size={13}
                className={`text-gray-400 transition-transform duration-200 ${showUserMenu ? "" : "rotate-180"}`}
              />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col pl-56">
        <header className="h-11 bg-white border-b border-gray-200 sticky top-0 z-20 flex items-center justify-end px-5 gap-1">
          <NotificationBell />  {/* ← thay button Bell cũ */}
          <button
            onClick={handleLogout}
            className="w-8 h-8 flex items-center justify-center rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut size={16} />
          </button>
        </header>

        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ShipperLayout;