import React from "react";
import { Link, useNavigate } from "react-router-dom"; // Thêm useNavigate
import { useAuthStore } from "../store/useAuthStore";
import { ShoppingCart, User, LogOut, Gift } from "lucide-react";

const Header = () => {
  // Chọn lọc từng state để Header render lại ngay khi state đó thay đổi
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login"); // Chuyển hướng ngay lập tức
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 text-indigo-600 font-bold text-xl"
        >
          <Gift size={28} />
          <span>GiftShop</span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-8 text-gray-600 font-medium">
          <Link to="/" className="hover:text-indigo-600 transition">
            Trang chủ
          </Link>
          <Link to="/products" className="hover:text-indigo-600 transition">
            Sản phẩm
          </Link>
          <Link to="/about" className="hover:text-indigo-600 transition">
            Giới thiệu
          </Link>
        </nav>

        {/* User Actions */}
        <div className="flex items-center gap-5">
          <Link
            to="/cart"
            className="relative text-gray-600 hover:text-indigo-600"
          >
            <ShoppingCart size={24} />
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
              0
            </span>
          </Link>

          {/* Logic hiển thị dựa trên isAuthenticated */}
          {isAuthenticated && user ? (
            <div className="flex items-center gap-4 border-l pl-5">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                  <User size={16} />
                </div>
                <span className="hidden sm:inline">Chào, {user.fullName}</span>
              </div>
              <button
                onClick={handleLogout}
                className="text-gray-400 hover:text-red-500 transition-colors p-1"
                title="Đăng xuất"
              >
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="text-sm font-medium text-gray-600 hover:text-indigo-600 px-2"
              >
                Đăng nhập
              </Link>
              <Link
                to="/register"
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-all shadow-sm active:scale-95"
              >
                Đăng ký
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
