import { Outlet, Link } from "react-router-dom";
import { LayoutDashboard, Box, ShoppingCart, LogOut } from "lucide-react";

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
          <Link
            to="/admin/orders"
            className="flex items-center gap-3 hover:text-indigo-400 transition"
          >
            <ShoppingCart size={20} /> Đơn hàng
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="h-16 bg-white shadow-sm flex items-center justify-end px-8">
          <span className="text-sm font-medium text-gray-600">Admin Mode</span>
        </header>
        <main className="p-8">
          <Outlet /> {/* Các trang admin sẽ render ở đây */}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
