import { useState, useEffect } from "react";
import {
  Package, MapPin, Clock, ChevronRight, Store, Phone, RefreshCw, ArrowRight,
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
    sellerProfile?: { shopName: string; shopAddress: string };
  };
}

const ShipperOrderManager = () => {
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get("/orders/shipper/available");
      const data = Array.isArray(res.data) ? res.data : res.data.data || [];
      setAvailableOrders(data);
    } catch {
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
    <div className="min-h-screen pb-16">
      <Toaster position="top-right" />

      {/* Page header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Đơn hàng sẵn sàng giao</h1>

        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">
            <span className="font-semibold text-gray-900">{availableOrders.length}</span> đơn khả dụng
          </span>
          <button
            onClick={fetchOrders}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="bg-white border border-gray-200 rounded-xl py-20 flex flex-col items-center gap-3">
          <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Đang tải đơn hàng...</p>
        </div>
      ) : availableOrders.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl py-24 text-center">
          <Package size={36} className="mx-auto text-gray-200 mb-3" />
          <p className="text-sm text-gray-400">Hiện không có đơn hàng nào khả dụng</p>
        </div>
      ) : (
        <div className="space-y-3">
          {availableOrders.map(order => {
            const shopName = order.seller?.sellerProfile?.shopName || order.seller?.fullName || "—";
            const shopAddress = order.seller?.sellerProfile?.shopAddress || "Chưa cập nhật địa chỉ";
            const sellerPhone = order.seller?.phoneNumber || "—";
            const isCOD = order.paymentMethod === "COD";

            return (
              <div key={order.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-gray-300 transition-colors">

                {/* Header */}
                <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-900 font-mono">{order.orderNumber}</span>
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      Chờ nhận hàng
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Clock size={13} />
                    {format(new Date(order.createdAt), "HH:mm · dd/MM/yyyy", { locale: vi })}
                  </div>
                </div>

                {/* Route — inline, không box riêng */}
                <div className="px-5 py-5">
                  <div className="flex items-start gap-4">

                    {/* Pickup */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1 mb-2.5">
                        <Store size={11} /> Lấy hàng
                      </p>
                      <p className="text-sm font-semibold text-gray-900">{shopName}</p>
                      <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
                        <Phone size={12} className="text-gray-400 shrink-0" />{sellerPhone}
                      </p>
                      <p className="text-sm text-gray-500 mt-1 flex items-start gap-1.5">
                        <MapPin size={12} className="text-gray-400 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{shopAddress}</span>
                      </p>
                    </div>

                    {/* Arrow */}
                    <div className="flex flex-col items-center gap-1 pt-8 shrink-0 px-2">
                      <ArrowRight size={18} className="text-gray-300" />
                    </div>

                    {/* Delivery */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1 mb-2.5">
                        <MapPin size={11} /> Giao hàng
                      </p>
                      <p className="text-sm font-semibold text-gray-900">{order.recipientName}</p>
                      <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
                        <Phone size={12} className="text-gray-400 shrink-0" />{order.phoneNumber}
                      </p>
                      <p className="text-sm text-gray-500 mt-1 flex items-start gap-1.5">
                        <MapPin size={12} className="text-gray-400 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{order.shippingAddress}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-5 py-3.5 border-t border-gray-100 bg-gray-50/40 flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">
                        {isCOD ? "Thu hộ COD" : "Đã thanh toán online"}
                      </p>
                      <p className="text-base font-semibold text-gray-900">
                        {Number(order.totalAmount).toLocaleString("vi-VN")}đ
                      </p>
                    </div>
                    {isCOD && (
                      <span className="text-xs text-orange-600 bg-orange-50 border border-orange-200 px-2 py-1 rounded">
                        Cần thu tiền mặt
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handlePickOrder(order.id)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-black transition-colors"
                  >
                    Nhận đơn này <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ShipperOrderManager;