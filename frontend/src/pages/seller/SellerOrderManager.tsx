import React, { useState, useEffect } from "react";
import {
  Search,
  Package,
  Eye,
  MapPin,
  Phone,
  CreditCard,
  Calendar,
  Check,
  X,
} from "lucide-react";
import axiosClient from "@/api/axiosClient";
import { format } from "date-fns";
import toast, { Toaster } from "react-hot-toast";

const BASE_URL = "http://localhost:3000";

// --- INTERFACES ---
interface OrderItem {
  id: number;
  quantity: number;
  priceAtPurchase: number;
  variantNameSnapshot: string;
  variant: {
    sku: string;
    images: { url: string }[];
  };
}

interface Order {
  id: number;
  orderNumber: string;
  totalAmount: string;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  recipientName: string;
  phoneNumber: string;
  shippingAddress: string;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  items: OrderItem[];
  user: {
    fullName: string;
    email: string;
  };
}

const SellerOrderManager = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get("/orders/seller");
      setOrders(res.data.data || []);
    } catch (err) {
      console.error("Lỗi fetch orders:", err);
      toast.error("Không thể tải danh sách đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  // --- HÀM XÁC NHẬN ĐƠN HÀNG ---
  const handleConfirmOrder = async (orderId: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn xác nhận đơn hàng này?")) return;

    const loadingToast = toast.loading("Đang xác nhận đơn hàng...");
    try {
      await axiosClient.patch(`/orders/${orderId}/seller-confirm`);
      toast.success("Đã xác nhận đơn hàng thành công!", { id: loadingToast });
      fetchOrders(); // Tải lại danh sách
    } catch (err: any) {
      const msg = err.response?.data?.message || "Xác nhận thất bại";
      toast.error(msg, { id: loadingToast });
    }
  };

  // --- HÀM TỪ CHỐI ĐƠN HÀNG ---
  const handleCancelOrder = async (orderId: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn từ chối đơn hàng này?")) return;

    const loadingToast = toast.loading("Đang hủy đơn hàng...");
    try {
      // Giả sử endpoint hủy là /seller-cancel
      await axiosClient.patch(`/orders/${orderId}/seller-cancel`);
      toast.success("Đã từ chối đơn hàng", { id: loadingToast });
      fetchOrders();
    } catch (err: any) {
      const msg = err.response?.data?.message || "Hủy đơn thất bại";
      toast.error(msg, { id: loadingToast });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-50 text-amber-600 border-amber-100";
      case "confirmed":
        return "bg-blue-50 text-blue-600 border-blue-100";
      case "delivered":
        return "bg-emerald-50 text-emerald-600 border-emerald-100";
      case "cancelled":
        return "bg-rose-50 text-rose-600 border-rose-100";
      default:
        return "bg-gray-50 text-gray-600 border-gray-100";
    }
  };

  const filteredOrders = orders.filter(
    (order) =>
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.recipientName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="w-full min-h-screen bg-gray-50/50 pb-20 text-gray-900">
      <Toaster position="top-right" />

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 px-1">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="text-blue-600" size={28} />
            Quản lý đơn hàng
          </h1>
          <p className="text-sm text-gray-500 mt-1 italic">
            Theo dõi và vận hành đơn hàng của shop
          </p>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white p-4 border border-gray-200 rounded-xl mb-6 shadow-sm flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Tìm theo mã đơn hoặc tên khách..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/10 text-sm transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="text-xs font-bold bg-blue-50 px-3 py-1.5 rounded-full text-blue-600 border border-blue-100 uppercase tracking-tighter">
          {filteredOrders.length} Đơn hàng
        </div>
      </div>

      {/* LIST ORDERS */}
      {loading ? (
        <div className="text-center p-20 text-gray-400 animate-pulse">
          Đang đồng bộ dữ liệu...
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all"
            >
              {/* Order Header */}
              <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-black text-gray-900 tracking-tight">
                    {order.orderNumber}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-1 rounded border ${getStatusColor(order.status)}`}
                  >
                    {order.status}
                  </span>
                </div>
                <div className="flex items-center gap-6 text-[11px] text-gray-500 font-medium">
                  <span className="flex items-center gap-1">
                    <Calendar size={14} />{" "}
                    {format(new Date(order.createdAt), "dd/MM/yyyy HH:mm")}
                  </span>
                  <span className="flex items-center gap-1 font-bold text-gray-700 uppercase italic">
                    <CreditCard size={14} /> {order.paymentMethod}
                  </span>
                </div>
              </div>

              {/* Order Body */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                {/* 1. Customer Info */}
                <div className="lg:col-span-3 p-5 flex flex-col justify-center border-r border-gray-50">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-50 p-2 rounded-lg text-blue-600 mt-0.5">
                      <MapPin size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800">
                        {order.recipientName}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                        {order.shippingAddress}
                      </p>
                      <p className="text-xs text-blue-600 mt-2 font-black flex items-center gap-1">
                        <Phone size={12} /> {order.phoneNumber}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. Items List */}
                <div className="lg:col-span-6 p-5 lg:pl-10 flex flex-col justify-center border-r border-gray-50">
                  <div className="space-y-4">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gray-50 rounded-lg border border-gray-100 overflow-hidden flex-shrink-0 shadow-inner">
                          {item.variant.images?.[0] ? (
                            <img
                              src={`${BASE_URL}${item.variant.images[0].url}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                              <Package size={18} />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-800 line-clamp-1">
                            {item.variantNameSnapshot}
                          </p>
                          <p className="text-[10px] text-gray-400 font-mono mt-0.5 uppercase tracking-tighter">
                            SKU: {item.variant.sku}
                          </p>
                        </div>
                        <div className="text-right min-w-[100px]">
                          <p className="text-sm font-bold text-gray-900">
                            {(
                              item.priceAtPurchase * item.quantity
                            ).toLocaleString("vi-VN")}
                            đ
                          </p>
                          <p className="text-[11px] text-gray-400 font-medium italic">
                            x{item.quantity}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Total & Actions */}
                <div className="lg:col-span-3 p-5 lg:pl-10 flex flex-col justify-center bg-gray-50/10">
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                      Thành tiền
                    </p>
                    <p className="text-2xl font-black text-blue-600">
                      {Number(order.totalAmount).toLocaleString("vi-VN")}đ
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1 font-medium">
                      Giao dịch:{" "}
                      <span className="text-gray-600 font-bold uppercase">
                        {order.paymentStatus}
                      </span>
                    </p>
                  </div>

                  <div className="mt-5 flex gap-2">
                    {order.status === "pending" ? (
                      <>
                        <button
                          onClick={() => handleConfirmOrder(order.id)}
                          className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-[11px] font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-blue-200"
                        >
                          <Check size={14} /> Xác nhận
                        </button>
                        <button
                          onClick={() => handleCancelOrder(order.id)}
                          className="px-3 bg-white border border-red-200 text-red-500 py-2 rounded-lg hover:bg-red-50 transition-all shadow-sm"
                        >
                          <X size={14} />
                        </button>
                      </>
                    ) : (
                      <button className="flex-1 bg-white border border-gray-200 text-gray-600 py-2 rounded-lg text-[11px] font-bold hover:bg-gray-50 flex items-center justify-center gap-2 transition-all shadow-sm">
                        <Eye size={14} /> Xem chi tiết
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SellerOrderManager;
