import React, { useState, useEffect } from "react";
import {
  Package,
  MapPin,
  Phone,
  Navigation,
  CheckCircle2,
  Clock,
  ChevronRight,
  Box,
  Truck,
  AlertCircle,
} from "lucide-react";
import axiosClient from "@/api/axiosClient";
import { format } from "date-fns";
import toast, { Toaster } from "react-hot-toast";

const BASE_URL = "http://localhost:3000";

interface Order {
  id: number;
  orderNumber: string;
  totalAmount: string;
  status: string;
  recipientName: string;
  phoneNumber: string;
  shippingAddress: string;
  paymentMethod: string;
  createdAt: string;
  items: any[];
}

const ShipperOrderManager = () => {
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<"available" | "shipping">(
    "available",
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, [activeTab]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      // Giả sử API: /orders/shipper/available và /orders/shipper/my-orders
      const endpoint =
        activeTab === "available"
          ? "/orders/shipper/available"
          : "/orders/shipper/my-orders";
      const res = await axiosClient.get(endpoint);
      if (activeTab === "available") setAvailableOrders(res.data.data || []);
      else setMyOrders(res.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Không thể tải danh sách đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  const handlePickOrder = async (orderId: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn nhận đơn hàng này?")) return;
    try {
      await axiosClient.patch(`/orders/${orderId}/pick`);
      toast.success("Nhận đơn thành công! Hãy đến kho lấy hàng.");
      fetchOrders();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Không thể nhận đơn");
    }
  };

  const handleCompleteOrder = async (orderId: number) => {
    if (!window.confirm("Xác nhận đã giao hàng thành công?")) return;
    try {
      await axiosClient.patch(`/orders/${orderId}/complete`);
      toast.success("Tuyệt vời! Đơn hàng đã hoàn thành.");
      fetchOrders();
    } catch (err: any) {
      toast.error("Lỗi xác nhận hoàn thành");
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Toaster position="top-center" />

      {/* Tab Switcher */}
      <div className="flex bg-white p-1 rounded-xl border border-gray-200 mb-6 shadow-sm">
        <button
          onClick={() => setActiveTab("available")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all ${
            activeTab === "available"
              ? "bg-emerald-600 text-white shadow-lg"
              : "text-gray-500 hover:bg-gray-50"
          }`}
        >
          <Box size={18} /> Đơn sẵn sàng
        </button>
        <button
          onClick={() => setActiveTab("shipping")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all ${
            activeTab === "shipping"
              ? "bg-emerald-600 text-white shadow-lg"
              : "text-gray-500 hover:bg-gray-50"
          }`}
        >
          <Truck size={18} /> Đang giao của tôi
        </button>
      </div>

      {/* List content */}
      {loading ? (
        <div className="py-20 text-center animate-pulse text-emerald-600 font-medium">
          Đang tìm đơn hàng mới...
        </div>
      ) : (
        <div className="space-y-4">
          {(activeTab === "available" ? availableOrders : myOrders).length ===
          0 ? (
            <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center">
              <Package size={48} className="mx-auto text-gray-200 mb-4" />
              <p className="text-gray-400 font-medium">
                Hiện tại không có đơn hàng nào
              </p>
            </div>
          ) : (
            (activeTab === "available" ? availableOrders : myOrders).map(
              (order) => (
                <div
                  key={order.id}
                  className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:border-emerald-200 transition-all"
                >
                  <div className="p-4 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
                    <span className="text-xs font-mono font-bold text-gray-500">
                      {order.orderNumber}
                    </span>
                    <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                      <Clock size={12} />
                      <span className="text-[10px] font-bold uppercase">
                        {format(new Date(order.createdAt), "HH:mm dd/MM")}
                      </span>
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 flex-shrink-0">
                        <MapPin size={20} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-black text-gray-800 mb-1">
                          {order.recipientName}
                        </p>
                        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 italic">
                          {order.shippingAddress}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400 uppercase font-bold tracking-tighter">
                          Thu hộ (COD)
                        </p>
                        <p className="text-lg font-black text-emerald-600">
                          {Number(order.totalAmount).toLocaleString("vi-VN")}đ
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                      <a
                        href={`tel:${order.phoneNumber}`}
                        className="flex items-center gap-2 text-blue-600 text-sm font-bold hover:underline"
                      >
                        <Phone size={16} /> {order.phoneNumber}
                      </a>

                      <div className="flex gap-2">
                        {activeTab === "available" ? (
                          <button
                            onClick={() => handlePickOrder(order.id)}
                            className="bg-emerald-600 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-emerald-700 shadow-md shadow-emerald-100 transition-all flex items-center gap-2"
                          >
                            Nhận đơn ngay <ChevronRight size={16} />
                          </button>
                        ) : (
                          <>
                            <button className="p-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-all">
                              <Navigation size={20} />
                            </button>
                            <button
                              onClick={() => handleCompleteOrder(order.id)}
                              className="bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 shadow-md shadow-blue-100 transition-all flex items-center gap-2"
                            >
                              <CheckCircle2 size={18} /> Hoàn thành
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ),
            )
          )}
        </div>
      )}

      {/* Floating Info */}
      <div className="fixed bottom-6 right-6 lg:right-12">
        <div className="bg-white p-3 rounded-2xl shadow-2xl border border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase">
              Lưu ý
            </p>
            <p className="text-xs font-medium text-gray-600">
              Kiểm tra hàng kỹ trước khi nhận!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShipperOrderManager;
