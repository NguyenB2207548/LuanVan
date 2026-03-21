import { useState, useEffect } from "react";
import {
  Package,
  MapPin,
  Clock,
  ChevronRight,
  Box,
  Store,
} from "lucide-react";
import axiosClient from "@/api/axiosClient";
import { format } from "date-fns";
import toast, { Toaster } from "react-hot-toast";

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
  seller?: {
    fullName: string;
    phoneNumber: string;
  };
}

const ShipperOrderManager = () => {
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get("/orders/shipper/available");

      const data = Array.isArray(res.data) ? res.data : [];
      setAvailableOrders(data);
    } catch (err) {
      console.error("Lỗi tải đơn hàng:", err);
      toast.error("Không thể tải danh sách đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  const handlePickOrder = async (orderId: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn nhận đơn hàng này?")) return;
    try {
      await axiosClient.patch(`/orders/shipper/${orderId}/pickup`);
      toast.success("Nhận đơn thành công! Hãy đến kho lấy hàng.");
      fetchOrders();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Không thể nhận đơn");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <Toaster position="top-center" />

      {/* Header đơn giản thay cho Tab */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Box className="text-emerald-600" /> Đơn hàng sẵn sàng
          </h1>
          <p className="text-gray-500 text-sm">Các đơn hàng đã xác nhận đang chờ shipper</p>
        </div>
        <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">
          {availableOrders.length} Đơn mới
        </div>
      </div>

      {/* List content */}
      {loading ? (
        <div className="py-20 text-center animate-pulse text-emerald-600 font-medium italic">
          Đang tìm đơn hàng mới quanh đây...
        </div>
      ) : (
        <div className="space-y-4">
          {availableOrders.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center">
              <Package size={48} className="mx-auto text-gray-200 mb-4" />
              <p className="text-gray-400 font-medium">
                Hiện tại không có đơn hàng nào khả dụng
              </p>
            </div>
          ) : (
            availableOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-emerald-200 transition-all"
              >
                {/* Order Header */}
                <div className="p-4 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
                  <span className="text-xs font-mono font-bold text-gray-500 bg-white px-2 py-1 rounded border border-gray-100">
                    {order.orderNumber}
                  </span>
                  <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                    <Clock size={12} />
                    <span className="text-[10px] font-bold uppercase">
                      {format(new Date(order.createdAt), "HH:mm dd/MM/yyyy")}
                    </span>
                  </div>
                </div>

                {/* Main Content */}
                <div className="p-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Thông tin khách hàng */}
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 flex-shrink-0">
                        <MapPin size={20} />
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Người nhận</p>
                        <p className="text-sm font-black text-gray-800 mb-1">
                          {order.recipientName}
                        </p>
                        <p className="text-xs text-gray-500 leading-relaxed italic">
                          {order.shippingAddress}
                        </p>
                      </div>
                    </div>

                    {/* Thông tin Seller (Lấy hàng tại đâu) */}
                    <div className="flex items-start gap-4 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 flex-shrink-0">
                        <Store size={20} />
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Lấy hàng tại</p>
                        <p className="text-sm font-bold text-blue-900">
                          {order.seller?.fullName || "N/A"}
                        </p>
                        <p className="text-xs text-blue-700">
                          SĐT: {order.seller?.phoneNumber || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Footer info & Action */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-bold">Tổng thu hộ (COD)</p>
                      <p className="text-xl font-black text-emerald-600">
                        {Number(order.totalAmount).toLocaleString("vi-VN")}đ
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* <a
                        href={`tel:${order.phoneNumber}`}
                        className="flex items-center gap-2 text-gray-600 bg-gray-100 p-2 rounded-xl hover:bg-gray-200 transition-all shadow-sm"
                        title="Gọi khách hàng"
                      >
                        <Phone size={18} />
                      </a> */}
                      <button
                        onClick={() => handlePickOrder(order.id)}
                        className="bg-emerald-600 text-white px-8 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all flex items-center gap-2 active:scale-95"
                      >
                        Nhận đơn ngay <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

    </div>
  );
};

export default ShipperOrderManager;