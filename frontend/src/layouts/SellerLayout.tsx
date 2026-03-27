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
  Image as ImageIcon,
  Box,
  Bell
} from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";

const SellerLayout = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [showUserMenu, setShowUserMenu] = useState(false);

  if (!user || user.role !== "seller") {
    return <Navigate to="/" replace />;
  }

  const getLinkClass = ({ isActive }: { isActive: boolean }) =>
    [
      "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all duration-150",
      isActive
        ? "text-gray-900 font-semibold bg-gray-100"
        : "text-gray-500 font-medium hover:text-gray-800 hover:bg-gray-50",
    ].join(" ");

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getInitials = (name: string) =>
    name ? name.charAt(0).toUpperCase() : "S";

  const navItems = [
    { to: "/seller/dashboard", icon: LayoutDashboard, label: "Bảng điều khiển" },
    { to: "/seller/products", icon: Box, label: "Sản phẩm" },
    { to: "/seller/artworks", icon: ImageIcon, label: "Thư viện Artwork" },
    { to: "/seller/designs", icon: Palette, label: "Thiết kế" },
    { to: "/seller/orders", icon: ShoppingCart, label: "Đơn hàng" },
    { to: "/seller/settings", icon: Settings, label: "Cài đặt cửa hàng" },
    { to: "/seller/help", icon: HelpCircle, label: "Trợ giúp" },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col fixed left-0 top-0 h-full z-30">
        {/* Logo */}
        <div className="h-11 flex items-center px-5 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gray-900 rounded-md flex items-center justify-center">
              <Store size={15} className="text-white" />
            </div>
            <span className="text-sm font-bold text-gray-900 tracking-tight">
              Seller Center
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-3">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} className={getLinkClass}>
              <Icon size={16} className="shrink-0" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User area */}
        <div className="px-3 py-3 border-t border-gray-100">
          <div className="relative">
            {showUserMenu && (
              <div className="absolute bottom-full left-0 w-full mb-1.5 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                >
                  <LogOut size={14} />
                  Đăng xuất
                </button>
              </div>
            )}

            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-full flex items-center gap-2.5 px-2 py-2 rounded-md hover:bg-gray-50 transition-colors"
            >
              <div className="w-7 h-7 rounded-md bg-gray-900 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {getInitials(user.fullName || user.email)}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-xs font-semibold text-gray-800 truncate">
                  {user.fullName || "Seller"}
                </p>
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
        {/* Header */}
        <header className="h-11 bg-white border-b border-gray-200 sticky top-0 z-30 flex items-center justify-end px-6 gap-2">
          <button className="w-8 h-8 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors relative">
            <Bell size={16} />
            {/* Badge thông báo chưa đọc — xóa nếu không cần */}
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
          </button>

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

export default SellerLayout;