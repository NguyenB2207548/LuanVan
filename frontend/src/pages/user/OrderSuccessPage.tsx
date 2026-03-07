import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  CheckCircle,
  Package,
  ArrowRight,
  Home,
  Loader2,
  Calendar,
} from "lucide-react";
import axiosClient from "../../api/axiosClient";

const OrderSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId) {
        setLoading(false);
        return;
      }
      try {
        const response = await axiosClient.get(`/orders/${orderId}`);
        setOrder(response.data);
      } catch (error) {
        console.error("Lỗi khi lấy thông tin đơn hàng:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  // Cảnh báo nếu ai đó vào thẳng trang này mà không có orderId
  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 text-center">
        <Package size={64} className="text-gray-400 mb-6" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Không tìm thấy đơn hàng
        </h1>
        <p className="text-gray-500 mb-8 max-w-md">
          Có vẻ như đường dẫn không hợp lệ hoặc đơn hàng không tồn tại.
        </p>
        <Link
          to="/"
          className="bg-blue-600 text-white px-8 py-3 rounded-md font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Home size={18} /> Về trang chủ
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 sm:p-10 text-center">
        {/* ICON THÀNH CÔNG */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center">
            <CheckCircle
              className="text-green-500"
              size={48}
              strokeWidth={2.5}
            />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Đặt hàng thành công!
        </h1>
        <p className="text-gray-500 mb-8">
          Cảm ơn bạn đã mua sắm tại GiftShop. Đơn hàng của bạn đang được chúng
          tôi xử lý.
        </p>

        {/* THÔNG TIN TÓM TẮT ĐƠN HÀNG */}
        <div className="bg-gray-50 rounded-xl p-6 text-left border border-gray-100 mb-8">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Package size={18} className="text-blue-600" /> Thông tin đơn hàng
          </h2>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center border-b border-gray-200 pb-3">
              <span className="text-gray-500">Mã đơn hàng:</span>
              <span className="font-bold text-gray-900">
                {order.orderNumber}
              </span>
            </div>

            <div className="flex justify-between items-center border-b border-gray-200 pb-3">
              <span className="text-gray-500">Ngày đặt:</span>
              <span className="font-medium text-gray-900 flex items-center gap-1.5">
                <Calendar size={14} className="text-gray-400" />
                {new Date(order.createdAt).toLocaleDateString("vi-VN")}
              </span>
            </div>

            <div className="flex justify-between items-center border-b border-gray-200 pb-3">
              <span className="text-gray-500">Thanh toán:</span>
              <span className="font-medium text-gray-900">
                {order.paymentMethod === "COD"
                  ? "Thanh toán khi nhận hàng"
                  : order.paymentMethod}
              </span>
            </div>

            <div className="flex justify-between items-center pt-1">
              <span className="text-gray-500">Tổng cộng:</span>
              <span className="text-lg font-bold text-blue-600">
                {parseFloat(order.totalAmount).toLocaleString()}đ
              </span>
            </div>
          </div>
        </div>

        {/* HÀNH ĐỘNG TIẾP THEO */}
        <div className="space-y-3">
          <Link
            to="/profile/orders" // Thay đổi đường dẫn này trỏ tới trang Lịch sử đơn hàng của bạn
            className="w-full bg-blue-600 text-white py-3.5 px-4 rounded-md font-bold text-sm hover:bg-blue-700 transition-colors shadow-sm flex justify-center items-center"
          >
            Theo dõi đơn hàng
          </Link>

          <Link
            to="/products"
            className="w-full bg-white text-gray-700 py-3.5 px-4 rounded-md font-bold text-sm border border-gray-200 hover:bg-gray-50 hover:text-blue-600 transition-colors flex justify-center items-center gap-2"
          >
            Tiếp tục mua sắm <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessPage;
