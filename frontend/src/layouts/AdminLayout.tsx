import React from "react";
import { Outlet, NavLink } from "react-router-dom";
import { LayoutDashboard, Users, Package } from "lucide-react";

const AdminLayout = () => {
  // Hàm tạo style cho Link (Active/Inactive)
  const getLinkClass = ({ isActive }: { isActive: boolean }) => {
    const baseClass =
      "flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium mb-1";
    return isActive
      ? `${baseClass} bg-blue-50 text-blue-600`
      : `${baseClass} text-gray-500 hover:bg-gray-50 hover:text-gray-900`;
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

          <NavLink to="/admin/designs" className={getLinkClass}>
            <Package size={20} /> Quản lý thiết kế
          </NavLink>
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition cursor-pointer">
            {/* Avatar giả lập */}
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
              BẮ
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                Người dùng quản trị
              </p>
              <p className="text-xs text-gray-500 truncate">
                admin@tailpanel.com
              </p>
            </div>
            {/* 3 dots icon */}
            <div className="text-gray-400">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="1" />
                <circle cx="19" cy="12" r="1" />
                <circle cx="5" cy="12" r="1" />
              </svg>
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
