import { Outlet, Link } from "react-router-dom";
// Thêm icon Palette vào đây
import {
  LayoutDashboard,
  Box,
  ShoppingCart,
  LogOut,
  Palette,
} from "lucide-react";

const AdminLayout = () => {
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar Admin */}
      <aside className="w-64 bg-slate-900 text-white p-6 shadow-xl flex flex-col">
        <div className="text-2xl font-bold mb-10 text-indigo-400">
          GiftShop Admin
        </div>
        <nav className="space-y-4 flex-1">
          <Link
            to="/admin"
            className="flex items-center gap-3 hover:text-indigo-400 transition"
          >
            <LayoutDashboard size={20} /> Dashboard
          </Link>
          <Link
            to="/admin/products"
            className="flex items-center gap-3 hover:text-indigo-400 transition"
          >
            <Box size={20} /> Quản lý sản phẩm
          </Link>

          {/* LINK DESIGN MỚI THÊM */}
          <Link
            to="/admin/designs"
            className="flex items-center gap-3 hover:text-indigo-400 transition"
          >
            <Palette size={20} /> Quản lý Thiết kế
          </Link>

          <Link
            to="/admin/orders"
            className="flex items-center gap-3 hover:text-indigo-400 transition"
          >
            <ShoppingCart size={20} /> Đơn hàng
          </Link>
        </nav>

        {/* Thêm nút Đăng xuất ở cuối sidebar cho chuyên nghiệp */}
        <div className="border-t border-slate-800 pt-4">
          <button className="flex items-center gap-3 text-gray-400 hover:text-red-400 transition w-full">
            <LogOut size={20} /> Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="h-16 bg-white shadow-sm flex items-center justify-end px-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
              AD
            </div>
            <span className="text-sm font-medium text-gray-600">
              Admin Mode
            </span>
          </div>
        </header>
        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
