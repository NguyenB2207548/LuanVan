import { useState } from "react";
import { Outlet, NavLink, Navigate, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  LogOut,
  ChevronUp,
  ShoppingCart,
  Palette,
  Settings,
  Store,
  HelpCircle,
  Image as ImageIcon, // Icon cho Artwork
  Layers, // Icon cho Thiết kế POD
  Box, // Icon cho Sản phẩm
} from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";

const SellerLayout = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [showUserMenu, setShowUserMenu] = useState(false);

  if (!user || user.role !== "seller") {
    return <Navigate to="/" replace />;
  }

  const getLinkClass = ({ isActive }: { isActive: boolean }) => {
    const baseClass =
      "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium mb-1 group";
    return isActive
      ? `${baseClass} bg-blue-600 text-white shadow-md shadow-blue-200`
      : `${baseClass} text-gray-600 hover:bg-gray-100 hover:text-gray-900`;
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getInitials = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : "S";
  };

  return (
    <div className="flex min-h-screen bg-[#F8F9FB]">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col fixed left-0 top-0 h-full z-30">
        <div className="h-16 flex items-center px-6 border-b border-gray-50">
          <div className="flex items-center gap-2.5">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <Store size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-linear-to-r from-gray-900 to-gray-600">
              Seller Center
            </span>
          </div>
        </div>

        <div className="flex-1 px-4 py-6 overflow-y-auto space-y-1 custom-scrollbar">
          <p className="px-4 text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Tổng quan
          </p>
          <NavLink to="/seller/dashboard" className={getLinkClass}>
            <LayoutDashboard size={18} /> <span>Bảng điều khiển</span>
          </NavLink>

          <p className="px-4 text-[11px] font-semibold text-gray-400 uppercase tracking-wider mt-6 mb-2">
            Sản phẩm & Thiết kế
          </p>

          {/* Mục Sản phẩm gốc */}
          <NavLink to="/seller/products" className={getLinkClass}>
            <Box size={18} /> <span>Sản phẩm của tôi</span>
          </NavLink>

          {/*  Artwork Library */}
          <NavLink to="/seller/artworks" className={getLinkClass}>
            <ImageIcon size={18} /> <span>Thư viện Artwork</span>
          </NavLink>

          {/* POD Section - Đã gộp các tính năng cấu hình thiết kế */}
          <NavLink to="/seller/designs" className={getLinkClass}>
            <Palette size={18} /> <span>Thiết kế</span>
          </NavLink>

          <p className="px-4 text-[11px] font-semibold text-gray-400 uppercase tracking-wider mt-6 mb-2">
            Kinh doanh
          </p>
          <NavLink to="/seller/orders" className={getLinkClass}>
            <ShoppingCart size={18} /> <span>Đơn hàng</span>
          </NavLink>

          <p className="px-4 text-[11px] font-semibold text-gray-400 uppercase tracking-wider mt-6 mb-2">
            Hệ thống
          </p>
          <NavLink to="/seller/settings" className={getLinkClass}>
            <Settings size={18} /> <span>Cài đặt cửa hàng</span>
          </NavLink>
          <NavLink to="/seller/help" className={getLinkClass}>
            <HelpCircle size={18} /> <span>Trợ giúp</span>
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
              <div className="w-9 h-9 rounded-lg bg-linear-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                {getInitials(user.fullName || user.email)}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">
                  {user.fullName || "Seller Name"}
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
          <h2 className="font-semibold text-gray-800">
            Chào, {user.fullName?.split(" ")[0] || "Seller"}!
          </h2>
          <div className="flex items-center gap-4">
            <div className="text-[12px] py-1 px-3 bg-green-100 text-green-700 rounded-full font-bold">
              Cửa hàng: Đang hoạt động
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

export default SellerLayout;
