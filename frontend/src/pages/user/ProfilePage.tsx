import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  User,
  Package,
  Shield,
  LogOut,
  ChevronRight,
  MapPin,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import axiosClient from "../../api/axiosClient";
import { useAuthStore } from "../../store/useAuthStore";

const BASE_URL = "http://localhost:3000";

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState("orders"); // Mặc định mở tab Đơn hàng

  // State cho Đơn hàng
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    // Nếu chưa đăng nhập, đá văng ra trang login
    if (!user) {
      navigate("/login");
      return;
    }

    if (activeTab === "orders") {
      fetchMyOrders();
    }
  }, [activeTab, user, navigate]);

  const fetchMyOrders = async () => {
    setLoadingOrders(true);
    try {
      const response = await axiosClient.get("/orders/me");
      setOrders(response.data);
    } catch (error) {
      console.error("Lỗi lấy danh sách đơn hàng:", error);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Helper dịch trạng thái đơn hàng sang tiếng Việt
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
            <Clock size={12} /> Chờ xác nhận
          </span>
        );
      case "processing":
        return (
          <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
            <Package size={12} /> Đang sản xuất
          </span>
        );
      case "shipped":
        return (
          <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
            <Package size={12} /> Đang giao hàng
          </span>
        );
      case "delivered":
        return (
          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
            <CheckCircle size={12} /> Đã giao
          </span>
        );
      case "cancelled":
        return (
          <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
            <XCircle size={12} /> Đã hủy
          </span>
        );
      default:
        return (
          <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-semibold">
            {status}
          </span>
        );
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-20">
      {/* BREADCRUMB */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
        <nav className="flex text-sm text-gray-500 items-center gap-2">
          <Link to="/" className="hover:text-blue-600 transition-colors">
            Trang chủ
          </Link>
          <ChevronRight size={14} />
          <span className="text-gray-900 font-medium">Tài khoản của tôi</span>
        </nav>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-2 flex flex-col md:flex-row gap-8">
        {/* SIDEBAR NAVIGATION */}
        <div className="md:w-1/4 flex-shrink-0">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden sticky top-24">
            {/* User Info Header */}
            <div className="p-6 border-b border-gray-100 flex items-center gap-4 bg-gray-50/50">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xl border border-blue-200">
                {user.fullName?.charAt(0).toUpperCase() || "U"}
              </div>
              <div>
                <h3 className="font-bold text-gray-900 truncate max-w-[150px]">
                  {user.fullName}
                </h3>
                <p className="text-xs text-gray-500 truncate max-w-[150px]">
                  {user.email}
                </p>
              </div>
            </div>

            {/* Menu Links */}
            <nav className="p-2 space-y-1">
              <button
                onClick={() => setActiveTab("orders")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors ${activeTab === "orders" ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}
              >
                <Package size={18} /> Đơn hàng của tôi
              </button>
              <button
                onClick={() => setActiveTab("profile")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors ${activeTab === "profile" ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}
              >
                <User size={18} /> Thông tin cá nhân
              </button>
              <button
                onClick={() => setActiveTab("security")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors ${activeTab === "security" ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}
              >
                <Shield size={18} /> Đổi mật khẩu
              </button>

              <div className="border-t border-gray-100 my-2"></div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut size={18} /> Đăng xuất
              </button>
            </nav>
          </div>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="md:w-3/4">
          {/* TAB: ĐƠN HÀNG CỦA TÔI */}
          {activeTab === "orders" && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 sm:p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Đơn hàng của tôi
              </h2>

              {loadingOrders ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="animate-spin text-blue-600" size={32} />
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
                  <Package size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 mb-4">
                    Bạn chưa có đơn hàng nào.
                  </p>
                  <Link
                    to="/products"
                    className="text-blue-600 font-medium hover:underline"
                  >
                    Bắt đầu mua sắm ngay
                  </Link>
                </div>
              ) : (
                <div className="space-y-6">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="border border-gray-200 rounded-lg overflow-hidden transition-all hover:border-gray-300 hover:shadow-sm"
                    >
                      {/* Order Header */}
                      <div className="bg-gray-50 px-4 py-3 sm:px-6 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <p className="text-sm text-gray-500">
                            Mã đơn:{" "}
                            <span className="font-bold text-gray-900">
                              {order.orderNumber}
                            </span>
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Ngày đặt:{" "}
                            {new Date(order.createdAt).toLocaleDateString(
                              "vi-VN",
                            )}
                          </p>
                        </div>
                        <div>{getStatusBadge(order.status)}</div>
                      </div>

                      {/* Order Items */}
                      <div className="divide-y divide-gray-100">
                        {order.items.map((item: any) => {
                          const variantImg = item.variant?.images?.[0]?.url;
                          const productImg =
                            item.variant?.product?.images?.[0]?.url;
                          const displayImg =
                            variantImg || productImg
                              ? `${BASE_URL}${variantImg || productImg}`
                              : "";

                          return (
                            <div
                              key={item.id}
                              className="p-4 sm:p-6 flex items-center gap-4"
                            >
                              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-md border border-gray-200 flex-shrink-0 overflow-hidden">
                                {displayImg ? (
                                  <img
                                    src={displayImg}
                                    alt="product"
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <Package className="w-full h-full p-4 text-gray-300" />
                                )}
                              </div>
                              <div className="flex-1">
                                <h4 className="text-sm sm:text-base font-medium text-gray-900 line-clamp-1">
                                  {item.variant?.product?.productName ||
                                    "Sản phẩm"}
                                </h4>
                                <p className="text-xs text-gray-500 mt-1">
                                  Số lượng: {item.quantity}
                                </p>
                                {item.customizedDesignJson && (
                                  <span className="inline-block mt-2 text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded border border-indigo-100">
                                    Thiết kế cá nhân hóa
                                  </span>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-bold text-gray-900">
                                  {parseFloat(
                                    item.priceAtPurchase,
                                  ).toLocaleString()}
                                  đ
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Order Footer */}
                      <div className="bg-gray-50 px-4 py-3 sm:px-6 border-t border-gray-200 flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                          Tổng tiền:
                        </span>
                        <span className="text-lg font-bold text-blue-600">
                          {parseFloat(order.totalAmount).toLocaleString()}đ
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: THÔNG TIN CÁ NHÂN */}
          {activeTab === "profile" && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 sm:p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Thông tin cá nhân
              </h2>

              <div className="space-y-6 max-w-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                    <User size={16} /> Họ và tên
                  </label>
                  <input
                    type="text"
                    defaultValue={user.fullName}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-md focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                    <Mail size={16} /> Email (Không thể thay đổi)
                  </label>
                  <input
                    type="email"
                    defaultValue={user.email}
                    disabled
                    className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 text-gray-500 rounded-md cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                    <Phone size={16} /> Số điện thoại
                  </label>
                  <input
                    type="tel"
                    placeholder="Chưa cập nhật"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-md focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                    <MapPin size={16} /> Địa chỉ mặc định
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Nhập địa chỉ giao hàng mặc định của bạn..."
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-md focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                  ></textarea>
                </div>

                <button className="bg-blue-600 text-white px-6 py-2.5 rounded-md font-medium hover:bg-blue-700 transition-colors shadow-sm">
                  Lưu thay đổi
                </button>
              </div>
            </div>
          )}

          {/* TAB: ĐỔI MẬT KHẨU */}
          {activeTab === "security" && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 sm:p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Đổi mật khẩu
              </h2>

              <div className="space-y-6 max-w-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Mật khẩu hiện tại
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-md focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Mật khẩu mới
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-md focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Xác nhận mật khẩu mới
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-md focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                </div>

                <button className="bg-blue-600 text-white px-6 py-2.5 rounded-md font-medium hover:bg-blue-700 transition-colors shadow-sm">
                  Cập nhật mật khẩu
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
