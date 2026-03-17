import { useState } from "react";
import { Outlet, NavLink, Navigate, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  LogOut,
  ChevronUp,
  Truck,
  PackageCheck,
  History,
  ClipboardList,
  MapPin,
  Bell,
  UserCircle,
} from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";

const ShipperLayout = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Kiểm tra quyền: Chỉ cho phép shipper vào
  if (!user || user.role !== "shipper") {
    return <Navigate to="/" replace />;
  }

  const getLinkClass = ({ isActive }: { isActive: boolean }) => {
    const baseClass =
      "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium mb-1 group";
    return isActive
      ? `${baseClass} bg-emerald-600 text-white shadow-md shadow-emerald-200`
      : `${baseClass} text-gray-600 hover:bg-emerald-50 hover:text-emerald-700`;
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getInitials = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : "S";
  };

  return (
    <div className="flex min-h-screen bg-[#F4F7F6]">
      {/* Sidebar dành cho Shipper */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col fixed left-0 top-0 h-full z-30">
        <div className="h-16 flex items-center px-6 border-b border-gray-50">
          <div className="flex items-center gap-2.5">
            <div className="bg-emerald-600 p-1.5 rounded-lg">
              <Truck size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-900 to-emerald-600">
              Shipper Center
            </span>
          </div>
        </div>

        <div className="flex-1 px-4 py-6 overflow-y-auto space-y-1 custom-scrollbar">
          <p className="px-4 text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Vận hành
          </p>
          <NavLink to="/shipper/dashboard" className={getLinkClass}>
            <LayoutDashboard size={18} /> <span>Bảng điều khiển</span>
          </NavLink>

          <p className="px-4 text-[11px] font-semibold text-gray-400 uppercase tracking-wider mt-6 mb-2">
            Quản lý đơn hàng
          </p>

          <NavLink to="/shipper/available" className={getLinkClass}>
            <ClipboardList size={18} /> <span>Đơn hàng sẵn sàng</span>
          </NavLink>

          <NavLink to="/shipper/my-orders" className={getLinkClass}>
            <Truck size={18} /> <span>Đơn đang giao</span>
          </NavLink>

          <NavLink to="/shipper/history" className={getLinkClass}>
            <History size={18} /> <span>Lịch sử giao hàng</span>
          </NavLink>

          <p className="px-4 text-[11px] font-semibold text-gray-400 uppercase tracking-wider mt-6 mb-2">
            Tài khoản
          </p>
          <NavLink to="/profile" className={getLinkClass}>
            <UserCircle size={18} /> <span>Hồ sơ cá nhân</span>
          </NavLink>
        </div>

        {/* User Profile Area */}
        <div className="p-4 border-t border-gray-100">
          <div className="relative">
            {showUserMenu && (
              <div className="absolute bottom-full left-0 w-full mb-2 bg-white border border-gray-200 rounded-xl shadow-xl py-1 z-50 animate-in fade-in slide-in-from-bottom-2">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors font-medium"
                >
                  <LogOut size={16} /> Đăng xuất tài khoản
                </button>
              </div>
            )}

            <div
              onClick={() => setShowUserMenu(!showUserMenu)}
              className={`flex items-center gap-3 p-2 rounded-xl transition-all cursor-pointer border ${
                showUserMenu
                  ? "bg-gray-50 border-gray-200"
                  : "border-transparent hover:bg-gray-50"
              }`}
            >
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                {getInitials(user.fullName || user.email)}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">
                  {user.fullName || "Shipper"}
                </p>
                <p className="text-[10px] text-emerald-600 font-bold uppercase">
                  Giao hàng
                </p>
              </div>

              <ChevronUp
                size={14}
                className={`text-gray-400 transition-transform duration-300 ${showUserMenu ? "rotate-180" : ""}`}
              />
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col pl-64">
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-20 flex items-center justify-between px-8">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-gray-800">
              Chào shipper, {user.fullName?.split(" ")[0] || "Bạn"}!
            </h2>
            <span className="animate-bounce">👋</span>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="text-[12px] py-1 px-3 bg-emerald-100 text-emerald-700 rounded-full font-bold flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
              Trạng thái: Đang sẵn sàng
            </div>
          </div>
        </header>

        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ShipperLayout;
