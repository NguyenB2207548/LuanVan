import React, { useState, useEffect } from "react";
import {
    MapPin,
    Phone,
    Navigation,
    CheckCircle2,
    Clock,
    ChevronRight,
    Truck,
    Box,
    Store,
    ExternalLink,
    XCircle
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
    createdAt: string;
    seller?: {
        fullName: string;
        phoneNumber: string;
    };
}

const ShipperMyOrders = () => {
    const [myOrders, setMyOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMyShippingOrders();
    }, []);

    const fetchMyShippingOrders = async () => {
        try {
            setLoading(true);
            const res = await axiosClient.get("/orders/shipper/my-orders");
            const ordersList = res.data?.data;

            if (Array.isArray(ordersList)) {
                setMyOrders(ordersList);
            } else {
                setMyOrders([]);
                console.warn("Cấu trúc trả về không chứa mảng data:", res.data);
            }
        } catch (err) {
            console.error("Lỗi:", err);
            toast.error("Không thể tải danh sách đơn hàng của bạn");
        } finally {
            setLoading(false);
        }
    };

    const handleCompleteOrder = async (orderId: number) => {
        if (!window.confirm("Xác nhận bạn đã giao hàng và thu tiền thành công?")) return;
        try {
            await axiosClient.patch(`/orders/shipper/${orderId}/complete`);
            toast.success("Chúc mừng! Đơn hàng đã hoàn thành.");
            fetchMyShippingOrders();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Lỗi khi cập nhật trạng thái");
        }
    };

    const handleFailOrder = async (orderId: number) => {
        if (!window.confirm("Xác nhận đơn hàng này giao hàng thất bại?")) return;
        try {
            // Gửi lý do mặc định hoặc trống vì đã bỏ phần nhập lý do
            await axiosClient.patch(`/orders/shipper/${orderId}/fail`, { reason: "Giao hàng không thành công" });
            toast.success("Đã xác nhận giao thất bại.");
            fetchMyShippingOrders();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Lỗi khi cập nhật trạng thái");
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-6">
            <Toaster position="top-center" />

            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                        <Truck className="text-blue-600" /> Đơn đang giao
                    </h1>
                    <p className="text-gray-500 text-sm">Danh sách đơn hàng bạn đang phụ trách</p>
                </div>
                <div className="bg-blue-100 text-blue-700 px-4 py-1 rounded-full text-xs font-bold">
                    {myOrders.length} Đơn hàng
                </div>
            </div>

            {loading ? (
                <div className="py-20 text-center animate-pulse text-blue-600 font-medium italic">
                    Đang tải dữ liệu vận chuyển...
                </div>
            ) : (
                <div className="space-y-6">
                    {myOrders.length === 0 ? (
                        <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-16 text-center">
                            <Box size={48} className="mx-auto text-gray-200 mb-4" />
                            <p className="text-gray-400 font-medium">Bạn chưa nhận đơn hàng nào</p>
                            <button
                                onClick={() => window.location.href = '/shipper/available'}
                                className="mt-4 text-blue-600 font-bold text-sm hover:underline"
                            >
                                Đến kho nhận đơn ngay →
                            </button>
                        </div>
                    ) : (
                        myOrders.map((order) => (
                            <div
                                key={order.id}
                                className={`bg-white border-2 rounded-3xl overflow-hidden shadow-sm transition-all ${order.status === 'success' ? 'border-emerald-100 opacity-80' : order.status === 'cancelled' || order.status === 'failed' ? 'border-red-100 opacity-80' : 'border-gray-100 hover:border-blue-200'}`}
                            >
                                <div className={`px-6 py-3 text-white flex justify-between items-center text-xs font-bold uppercase tracking-widest ${order.status === 'success' ? 'bg-emerald-500' : order.status === 'cancelled' || order.status === 'failed' ? 'bg-red-500' : 'bg-blue-600'}`}>
                                    <div className="flex items-center gap-2">
                                        <Clock size={14} />
                                        <span>Nhận lúc: {format(new Date(order.createdAt), "HH:mm dd/MM")}</span>
                                    </div>
                                    <span>
                                        {order.status === 'success' ? 'Giao thành công' :
                                            order.status === 'cancelled' || order.status === 'failed' ? 'Giao thất bại' :
                                                'Đang vận chuyển'}
                                    </span>
                                </div>

                                <div className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 text-gray-400">
                                                <MapPin size={16} />
                                                <span className="text-[10px] font-bold uppercase">Giao đến</span>
                                            </div>
                                            <div>
                                                <p className="text-lg font-black text-gray-900">{order.recipientName}</p>
                                                <p className="text-sm text-gray-600 leading-relaxed mt-1">{order.shippingAddress}</p>
                                            </div>
                                        </div>

                                        <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                                            <div className="flex items-center gap-2 text-gray-400 mb-3">
                                                <Store size={16} />
                                                <span className="text-[10px] font-bold uppercase">Nơi lấy hàng</span>
                                            </div>
                                            <p className="text-sm font-bold text-gray-800">{order.seller?.fullName || "Người bán lẻ"}</p>
                                            <p className="text-xs text-gray-500 mt-1">SĐT: {order.seller?.phoneNumber || "N/A"}</p>
                                            <button className="text-blue-600 text-[10px] font-bold mt-3 flex items-center gap-1 hover:underline">
                                                XEM CHI TIẾT LẤY HÀNG <ExternalLink size={10} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex flex-col md:flex-row items-center justify-between pt-6 border-t border-gray-100 gap-4">
                                        <div className="text-center md:text-left w-full md:w-auto">
                                            <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Tiền mặt cần thu (COD)</p>
                                            <p className={`text-2xl font-black ${order.status === 'success' ? 'text-emerald-400' : order.status === 'cancelled' || order.status === 'failed' ? 'text-red-400' : 'text-emerald-600'}`}>
                                                {Number(order.totalAmount).toLocaleString("vi-VN")}đ
                                            </p>
                                        </div>

                                        <div className="flex gap-3 w-full md:w-auto">
                                            {order.status === 'success' ? (
                                                <div className="flex items-center gap-2 text-emerald-600 font-bold bg-emerald-50 px-6 py-3 rounded-2xl">
                                                    <CheckCircle2 size={20} /> ĐÃ HOÀN TẤT
                                                </div>
                                            ) : order.status === 'cancelled' || order.status === 'failed' ? (
                                                <div className="flex items-center gap-2 text-red-600 font-bold bg-red-50 px-6 py-3 rounded-2xl">
                                                    <XCircle size={20} /> ĐÃ HỦY / THẤT BẠI
                                                </div>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => handleFailOrder(order.id)}
                                                        className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-red-50 text-red-600 px-6 py-4 rounded-2xl font-bold text-sm hover:bg-red-100 transition-all active:scale-95"
                                                    >
                                                        <XCircle size={20} /> THẤT BẠI
                                                    </button>
                                                    <button
                                                        onClick={() => handleCompleteOrder(order.id)}
                                                        className="flex-[2] md:flex-none flex items-center justify-center gap-2 bg-emerald-600 text-white px-10 py-4 rounded-2xl font-black text-sm shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all hover:-translate-y-1 active:scale-95"
                                                    >
                                                        <CheckCircle2 size={20} /> GIAO THÀNH CÔNG
                                                    </button>
                                                </>
                                            )}
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

export default ShipperMyOrders;