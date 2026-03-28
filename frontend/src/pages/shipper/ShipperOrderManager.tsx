import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package,
  MapPin,
  Clock,
  ChevronRight,
  Box,
  Store,
  Phone,
  Calendar,
} from "lucide-react";
import axiosClient from "@/api/axiosClient";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
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
    sellerProfile?: {
      shopName: string;
      shopAddress: string;
    };
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
      const data = Array.isArray(res.data) ? res.data : res.data.data || [];
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
    <div className="max-w-5xl mx-auto px-6 py-10 font-sans text-gray-800">
      <Toaster position="top-center" />

      {/* Header tối giản */}
      <div className="mb-10 border-b border-gray-100 pb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Đơn hàng sẵn sàng</h1>
        </div>
        <div className="text-sm font-medium text-gray-400">
          Hiện có <span className="text-gray-800 font-bold">{availableOrders.length}</span> đơn hàng
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-20 text-center text-gray-400 italic text-sm">
          Đang tìm kiếm đơn hàng mới...
        </div>
      ) : (
        <div className="space-y-6">
          {availableOrders.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-md py-20 text-center">
              <Package size={40} className="mx-auto text-gray-200 mb-4" />
              <p className="text-gray-400 text-sm">Hiện tại không có đơn hàng nào khả dụng quanh đây</p>
            </div>
          ) : (
            availableOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white border border-gray-200 rounded-md overflow-hidden transition-all hover:border-gray-400"
              >
                {/* Order ID bar */}
                <div className="px-6 py-3 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Mã đơn: {order.orderNumber}
                  </span>
                  <div className="flex items-center gap-2 text-gray-400 text-[12px]">
                    <Clock size={14} />
                    <span>{format(new Date(order.createdAt), "HH:mm - dd/MM/yyyy", { locale: vi })}</span>
                  </div>
                </div>

                {/* Main Body */}
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

                    {/* Cột 1: Thông tin lấy hàng (Seller) */}
                    <section>
                      <h3 className="flex items-center gap-2 text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">
                        <Store size={14} /> Điểm lấy hàng
                      </h3>
                      <div className="space-y-2">
                        <p className="font-semibold text-gray-800">
                          {order.seller?.sellerProfile?.shopName || order.seller?.fullName || "Chưa cập nhật"}
                        </p>
                        <p className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone size={14} className="text-gray-300" /> {order.seller?.phoneNumber || "N/A"}
                        </p>
                        <p className="text-sm text-gray-500 leading-relaxed italic">
                          {order.seller?.sellerProfile?.shopAddress || "Địa chỉ kho chưa cập nhật"}
                        </p>
                      </div>
                    </section>

                    {/* Cột 2: Thông tin giao hàng (Recipient) */}
                    <section>
                      <h3 className="flex items-center gap-2 text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">
                        <MapPin size={14} /> Điểm giao hàng
                      </h3>
                      <div className="space-y-2">
                        <p className="font-semibold text-gray-800">{order.recipientName}</p>
                        <p className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone size={14} className="text-gray-300" /> {order.phoneNumber}
                        </p>
                        <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-sm border border-gray-100">
                          {order.shippingAddress}
                        </p>
                      </div>
                    </section>
                  </div>

                  {/* Divider ngang nhạt */}
                  <div className="h-px bg-gray-100 w-full my-6"></div>

                  {/* Footer Action Area */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Số tiền cần thu hộ (COD)</p>
                      <p className="text-xl font-bold text-gray-800">
                        {Number(order.totalAmount).toLocaleString("vi-VN")}đ
                      </p>
                    </div>

                    <button
                      onClick={() => handlePickOrder(order.id)}
                      className="w-full sm:w-auto px-10 py-3 bg-gray-800 text-white text-xs font-bold rounded uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2"
                    >
                      Nhận đơn hàng này <ChevronRight size={16} />
                    </button>
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