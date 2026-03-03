import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { ShoppingCart, User, LogOut, Gift, Menu } from "lucide-react";

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
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 bg-opacity-95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* LOGO & MOBILE MENU */}
        <div className="flex items-center gap-4">
          <button className="md:hidden p-2 text-gray-500 hover:text-gray-900">
            <Menu size={24} />
          </button>
          <Link to="/" className="flex items-center gap-2 group">
            <div className="bg-blue-600 text-white p-1.5 rounded-md group-hover:bg-blue-700 transition-colors">
              <Gift size={20} />
            </div>
            <span className="font-bold text-xl text-gray-900 tracking-tight">
              GiftShop
            </span>
          </Link>
        </div>

        {/* NAVIGATION (Desktop) */}
        <nav className="hidden md:flex items-center gap-8">
          <Link
            to="/"
            className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
          >
            Trang chủ
          </Link>
          <Link
            to="/products"
            className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
          >
            Sản phẩm
          </Link>
          <Link
            to="/about"
            className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
          >
            Giới thiệu
          </Link>
        </nav>

        {/* USER ACTIONS */}
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Cart Icon */}
          <Link
            to="/cart"
            className="relative p-2 text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ShoppingCart size={22} strokeWidth={2.5} />
            <span className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white box-content">
              0
            </span>
          </Link>

          {/* User Auth Section */}
          <div className="flex items-center border-l border-gray-200 pl-4 sm:pl-6">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2">
                  <div className="w-8 h-8 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center border border-gray-200">
                    <User size={16} />
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {user.fullName}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-gray-400 hover:text-red-500 p-2 rounded-md hover:bg-red-50 transition-colors"
                  title="Đăng xuất"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 sm:gap-4">
                <Link
                  to="/login"
                  className="hidden sm:block text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
