import { useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";
import { useCartStore } from "../../store/useCartStore";
import {
  ShoppingCart,
  LogOut,
  Gift,
  Menu,
  User,
  Store,
  Truck,
  LayoutDashboard,
  ChevronDown,
  Package,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const Header = () => {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const location = useLocation();

  // Lấy dữ liệu giỏ hàng từ Cart Store
  const { cartCount, fetchCartCount, updateCartCount } = useCartStore();

  // Tự động cập nhật số lượng giỏ hàng khi người dùng đã đăng nhập
  useEffect(() => {
    if (isAuthenticated) {
      fetchCartCount();
    } else {
      updateCartCount(0);
    }
  }, [isAuthenticated, fetchCartCount, updateCartCount]);

  const handleLogout = () => {
    logout();
    updateCartCount(0); // Reset số lượng giỏ hàng về 0 khi đăng xuất
    navigate("/login");
  };

  const getInitials = (name: string) => name?.charAt(0).toUpperCase() || "U";

  // --- LOGIC HIỂN THỊ LINK QUẢN LÝ NHANH (SHORTCUT) ---
  const renderPartnerSection = () => {
    // 1. Trường hợp là ADMIN
    if (isAuthenticated && user?.role === "admin") {
      return (
        <Link to="/admin" className="flex items-center gap-1.5 text-sm font-bold text-purple-600 hover:opacity-80 transition-all">
          <LayoutDashboard size={16} /> Quản trị hệ thống
        </Link>
      );
    }

    // 2. Trường hợp là SELLER
    if (isAuthenticated && user?.role === "seller") {
      return (
        <Link to="/seller/dashboard" className="flex items-center gap-1.5 text-sm font-bold text-blue-600 hover:opacity-80 transition-all">
          <Store size={16} /> Kênh Người Bán
        </Link>
      );
    }

    // 3. Trường hợp là SHIPPER
    if (isAuthenticated && user?.role === "shipper") {
      return (
        <Link to="/shipper/dashboard" className="flex items-center gap-1.5 text-sm font-bold text-emerald-600 hover:opacity-80 transition-all">
          <Truck size={16} /> Kênh Vận Chuyển
        </Link>
      );
    }

    // 4. Mặc định: USER thường hoặc CHƯA ĐĂNG NHẬP (Hiện menu Hợp tác)
    return (
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-blue-600 outline-none">
          Hợp tác <ChevronDown size={14} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56 p-2 rounded-xl">
          <DropdownMenuItem onClick={() => navigate("/register-seller")} className="gap-3 py-3 cursor-pointer rounded-lg">
            <Store size={18} className="text-blue-600" />
            <span className="font-bold">Đăng ký bán hàng</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate("/register-shipper")} className="gap-3 py-3 cursor-pointer rounded-lg">
            <Truck size={18} className="text-emerald-600" />
            <span className="font-bold">Đăng ký giao hàng</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">

        {/* LEFT: LOGO & NAV */}
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="bg-blue-600 text-white p-2 rounded-xl group-hover:rotate-12 transition-all duration-300 shadow-lg shadow-blue-200">
              <Gift size={22} />
            </div>
            <span className="font-black text-2xl text-slate-900 tracking-tight italic">
              Gift<span className="text-blue-600">Shop</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className={`text-sm font-semibold transition-colors ${location.pathname === "/" ? "text-blue-600" : "text-slate-600 hover:text-blue-600"}`}>
              Trang chủ
            </Link>
            <Link to="/products" className={`text-sm font-semibold transition-colors ${location.pathname === "/products" ? "text-blue-600" : "text-slate-600 hover:text-blue-600"}`}>
              Sản phẩm
            </Link>

            {/* Vạch ngăn cách nhẹ trước phần Shortcut */}
            <div className="h-4 w-px bg-slate-200 mx-1" />
            {renderPartnerSection()}
          </nav>
        </div>

        {/* RIGHT: ACTIONS */}
        <div className="flex items-center gap-2">
          {/* Cart Icon với số lượng động */}
          <Button variant="ghost" size="icon" className="relative text-slate-600 hover:bg-blue-50 hover:text-blue-600 rounded-full h-11 w-11" asChild>
            <Link to="/cart">
              <ShoppingCart size={22} />
              {cartCount > 0 && (
                <span className="absolute top-1  right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white animate-in zoom-in duration-300">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>
          </Button>

          <div className="h-6 w-px bg-slate-200 mx-2 hidden sm:block" />

          {/* User Auth Section */}
          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="outline-none">
                <div className="flex items-center gap-2 p-1.5 pr-3 hover:bg-slate-100 rounded-full transition-all border border-transparent hover:border-slate-200">
                  <Avatar className="h-9 w-9 border-2 border-white shadow-sm">
                    <AvatarFallback className="bg-blue-600 text-white font-bold">
                      {getInitials(user.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:flex flex-col items-start leading-none">
                    <span className="text-sm font-bold text-slate-800">{user.fullName}</span>
                    <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">{user.role}</span>
                  </div>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 p-2 mt-2 rounded-2xl shadow-xl border-slate-100">
                <DropdownMenuLabel className="px-3 py-3">
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-bold text-slate-900">{user.fullName}</p>
                    <p className="text-xs text-slate-400 font-medium truncate">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {/* Quản lý theo từng vai trò */}
                {user.role === "seller" && (
                  <DropdownMenuItem onClick={() => navigate("/seller/dashboard")} className="gap-3 py-3 cursor-pointer rounded-xl text-blue-600 bg-blue-50/50 mb-1">
                    <Store size={18} />
                    <span className="font-bold text-sm">Quản lý gian hàng</span>
                  </DropdownMenuItem>
                )}
                {user.role === "shipper" && (
                  <DropdownMenuItem onClick={() => navigate("/shipper/dashboard")} className="gap-3 py-3 cursor-pointer rounded-xl text-emerald-600 bg-emerald-50/50 mb-1">
                    <Truck size={18} />
                    <span className="font-bold text-sm">Quản lý giao hàng</span>
                  </DropdownMenuItem>
                )}
                {user.role === "admin" && (
                  <DropdownMenuItem onClick={() => navigate("/admin")} className="gap-3 py-3 cursor-pointer rounded-xl text-purple-600 bg-purple-50/50 mb-1">
                    <LayoutDashboard size={18} />
                    <span className="font-bold text-sm">Bảng điều khiển Admin</span>
                  </DropdownMenuItem>
                )}

                <DropdownMenuItem onClick={() => navigate("/profile")} className="gap-3 py-3 cursor-pointer rounded-xl">
                  <User size={18} className="text-slate-400" />
                  <span className="font-semibold text-sm">Hồ sơ cá nhân</span>
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => navigate("/order-history")} className="gap-3 py-3 cursor-pointer rounded-xl">
                  <Package size={18} className="text-slate-400" />
                  <span className="font-semibold text-sm">Đơn hàng của tôi</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={handleLogout} className="gap-3 py-3 cursor-pointer rounded-xl text-red-600 focus:bg-red-50 focus:text-red-600 transition-colors">
                  <LogOut size={18} />
                  <span className="font-bold text-sm">Đăng xuất</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-3">
              <Button variant="ghost" className="hidden sm:flex font-bold text-slate-600 hover:text-blue-600 rounded-xl" asChild>
                <Link to="/login">Đăng nhập</Link>
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-100 rounded-xl px-6 font-bold" asChild>
                <Link to="/register">Đăng ký</Link>
              </Button>
            </div>
          )}

          <Button variant="ghost" size="icon" className="md:hidden rounded-full ml-1 text-slate-600">
            <Menu size={24} />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;