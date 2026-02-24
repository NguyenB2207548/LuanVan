import React, { useState } from "react";
import { Outlet, NavLink, Navigate, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Package,
  LogOut,
  ChevronUp,
} from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";

const AdminLayout = () => {
  const navigate = useNavigate();
  // Lấy user và hàm logout từ store
  const { user, logout } = useAuthStore();

  // State để quản lý việc mở/đóng menu đăng xuất
  const [showUserMenu, setShowUserMenu] = useState(false);

  if (!user || user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  // Hàm tạo style cho Link (Active/Inactive)
  const getLinkClass = ({ isActive }: { isActive: boolean }) => {
    const baseClass =
      "flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium mb-1";
    return isActive
      ? `${baseClass} bg-blue-50 text-blue-600`
      : `${baseClass} text-gray-500 hover:bg-gray-50 hover:text-gray-900`;
  };

  // Hàm xử lý đăng xuất
  const handleLogout = () => {
    logout(); // Xóa token và user khỏi store
    navigate("/login"); // Chuyển về trang đăng nhập
  };

  // Lấy chữ cái đầu tiên của tên để làm Avatar (VD: "Nguyen Pham" -> "N")
  const getInitials = (name: string) => {
    if (!name) return "A";
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col fixed left-0 top-0 h-full z-10">
        {/* Logo Area */}
        <div className="p-6 pb-2">
          <div className="flex items-center gap-2 mb-6 text-gray-800 font-bold text-xl">
            <div className="grid grid-cols-2 gap-0.5">
              <div className="w-2 h-2 border border-gray-600 rounded-sm"></div>
              <div className="w-2 h-2 border border-gray-600 rounded-sm"></div>
              <div className="w-2 h-2 border border-gray-600 rounded-sm"></div>
              <div className="w-2 h-2 border border-gray-600 rounded-sm"></div>
            </div>
            <span>Dashboard</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 overflow-y-auto custom-scrollbar">
          <NavLink to="/admin" end className={getLinkClass}>
            <LayoutDashboard size={20} /> Bảng điều khiển
          </NavLink>

          <NavLink to="/admin/users" className={getLinkClass}>
            <Users size={20} /> Quản lý người dùng
          </NavLink>

          <NavLink to="/admin/products" className={getLinkClass}>
            <Package size={20} /> Quản lý sản phẩm
          </NavLink>

          <NavLink to="/admin/categories" className={getLinkClass}>
            <Package size={20} /> Quản lý danh mục
          </NavLink>

          <NavLink to="/admin/attributes" className={getLinkClass}>
            <Package size={20} /> Quản lý thuộc tính
          </NavLink>

          <NavLink to="/admin/designs" className={getLinkClass}>
            <Package size={20} /> Quản lý thiết kế
          </NavLink>
        </nav>

        {/* User Profile Area */}
        <div className="p-4 border-t border-gray-100 relative">
          {/* Popup Menu Đăng xuất (Chỉ hiện khi click vào Profile) */}
          {showUserMenu && (
            <div className="absolute bottom-full left-4 right-4 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg py-1 overflow-hidden z-20">
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
              >
                <LogOut size={16} /> Đăng xuất
              </button>
            </div>
          )}

          {/* User Info Bar */}
          <div
            onClick={() => setShowUserMenu(!showUserMenu)}
            className={`flex items-center gap-3 p-2 rounded-lg transition cursor-pointer select-none ${showUserMenu ? "bg-gray-100" : "hover:bg-gray-50"}`}
          >
            {/* Avatar lấy chữ cái đầu */}
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
              {getInitials(user.fullName || user.email)}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {user.fullName || "Admin"}
              </p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>

            <div className="text-gray-400">
              <ChevronUp
                size={16}
                className={`transition-transform duration-200 ${showUserMenu ? "rotate-180" : ""}`}
              />
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col pl-64">
        <main className="p-8 bg-gray-50 min-h-screen">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
