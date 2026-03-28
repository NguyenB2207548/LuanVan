import React, { useState, useEffect } from "react";
import {
    MapPin,
    Phone,
    CheckCircle2,
    Clock,
    Truck,
    Box,
    Store,
    XCircle,
    Calendar
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
            const ordersList = res.data?.data || res.data;
            setMyOrders(Array.isArray(ordersList) ? ordersList : []);
        } catch (err) {
            console.error("Lỗi:", err);
            toast.error("Không thể tải danh sách đơn hàng");
        } finally {
            setLoading(false);
        }
    };

    const handleCompleteOrder = async (orderId: number) => {
        if (!window.confirm("Xác nhận bạn đã giao hàng và thu tiền thành công?")) return;
        try {
            await axiosClient.patch(`/orders/shipper/${orderId}/complete`);
            toast.success("Đơn hàng đã hoàn thành thành công.");
            fetchMyShippingOrders();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Lỗi cập nhật");
        }
    };

    const handleFailOrder = async (orderId: number) => {
        if (!window.confirm("Xác nhận đơn hàng này giao hàng thất bại?")) return;
        try {
            await axiosClient.patch(`/orders/shipper/${orderId}/fail`, { reason: "Giao hàng không thành công" });
            toast.success("Đã xác nhận giao thất bại.");
            fetchMyShippingOrders();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Lỗi cập nhật");
        }
    };

    return (
        <div className="max-w-5xl mx-auto px-6 py-10 font-sans text-gray-800">
            <Toaster position="top-center" />

            {/* Header tối giản */}
            <div className="mb-10 border-b border-gray-100 pb-6 flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
                        <Truck size={24} className="text-gray-400" /> Đơn hàng đang giao
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Quản lý và cập nhật trạng thái các đơn hàng bạn đang vận chuyển</p>
                </div>
                <div className="text-sm font-medium text-gray-400">
                    <span className="text-gray-800 font-bold">{myOrders.length}</span> Đơn phụ trách
                </div>
            </div>

            {loading ? (
                <div className="py-20 text-center text-gray-400 italic text-sm">
                    Đang tải dữ liệu vận chuyển...
                </div>
            ) : (
                <div className="space-y-8">
                    {myOrders.length === 0 ? (
                        <div className="bg-white border border-gray-100 rounded-md py-20 text-center">
                            <Box size={40} className="mx-auto text-gray-200 mb-4" />
                            <p className="text-gray-400 text-sm mb-4">Bạn chưa nhận đơn hàng nào</p>
                            <button
                                onClick={() => window.location.href = '/shipper/available'}
                                className="text-sm font-bold text-gray-800 hover:underline"
                            >
                                Xem đơn hàng sẵn sàng →
                            </button>
                        </div>
                    ) : (
                        myOrders.map((order) => (
                            <div
                                key={order.id}
                                className={`bg-white border rounded-md overflow-hidden transition-all ${order.status === 'success' ? 'border-emerald-200 bg-emerald-50/10' :
                                        (order.status === 'failed' || order.status === 'cancelled') ? 'border-red-200 bg-red-50/10' :
                                            'border-gray-200'
                                    }`}
                            >
                                {/* Order Header */}
                                <div className="px-6 py-3 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            Mã đơn: {order.orderNumber}
                                        </span>
                                        <div className="h-3 w-px bg-gray-200"></div>
                                        <div className="flex items-center gap-1.5 text-gray-400 text-[12px]">
                                            <Calendar size={13} />
                                            <span>{format(new Date(order.createdAt), "HH:mm - dd/MM/yyyy", { locale: vi })}</span>
                                        </div>
                                    </div>
                                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${order.status === 'success' ? 'text-emerald-600' :
                                            (order.status === 'failed' || order.status === 'cancelled') ? 'text-red-600' :
                                                'text-blue-600'
                                        }`}>
                                        {order.status === 'success' ? 'Đã hoàn tất' :
                                            (order.status === 'failed' || order.status === 'cancelled') ? 'Thất bại' :
                                                'Đang giao hàng'}
                                    </span>
                                </div>

                                <div className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                        {/* Điểm lấy hàng */}
                                        <section>
                                            <h3 className="flex items-center gap-2 text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">
                                                <Store size={14} /> Điểm lấy hàng
                                            </h3>
                                            <div className="text-sm space-y-1.5">
                                                <p className="font-semibold text-gray-700">{order.seller?.sellerProfile?.shopName || order.seller?.fullName || "N/A"}</p>
                                                <p className="flex items-center gap-2 text-gray-500"><Phone size={13} className="text-gray-300" /> {order.seller?.phoneNumber}</p>
                                                <p className="text-gray-400 text-xs italic">{order.seller?.sellerProfile?.shopAddress || "Địa chỉ kho lẻ"}</p>
                                            </div>
                                        </section>

                                        {/* Điểm giao hàng */}
                                        <section>
                                            <h3 className="flex items-center gap-2 text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">
                                                <MapPin size={14} /> Điểm giao hàng
                                            </h3>
                                            <div className="text-sm space-y-1.5 text-gray-600">
                                                <p className="font-semibold text-gray-700">{order.recipientName}</p>
                                                <p className="flex items-center gap-2 text-gray-500"><Phone size={13} className="text-gray-300" /> {order.phoneNumber}</p>
                                                <p className="bg-gray-50 p-3 rounded-sm border border-gray-100 text-gray-500">{order.shippingAddress}</p>
                                            </div>
                                        </section>
                                    </div>

                                    {/* Divider ngang nhạt */}
                                    <div className="h-px bg-gray-100 w-full my-6"></div>

                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                        <div>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Số tiền thu hộ (COD)</p>
                                            <p className={`text-xl font-bold ${order.status === 'success' ? 'text-emerald-600' : 'text-gray-800'}`}>
                                                {Number(order.totalAmount).toLocaleString("vi-VN")}đ
                                            </p>
                                        </div>

                                        <div className="flex gap-3 w-full sm:w-auto">
                                            {order.status !== 'success' && order.status !== 'failed' && order.status !== 'cancelled' ? (
                                                <>
                                                    <button
                                                        onClick={() => handleFailOrder(order.id)}
                                                        className="flex-1 sm:flex-none px-6 py-2.5 text-xs font-bold text-red-600 border border-red-100 rounded hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                                                    >
                                                        <XCircle size={16} /> Giao thất bại
                                                    </button>
                                                    <button
                                                        onClick={() => handleCompleteOrder(order.id)}
                                                        className="flex-1 sm:flex-none px-8 py-2.5 bg-gray-800 text-white text-xs font-bold rounded hover:bg-black transition-all flex items-center justify-center gap-2"
                                                    >
                                                        <CheckCircle2 size={16} /> Hoàn tất giao
                                                    </button>
                                                </>
                                            ) : (
                                                <div className="text-xs font-bold text-gray-400 border border-gray-100 px-4 py-2 rounded">
                                                    ĐƠN HÀNG ĐÃ ĐÓNG
                                                </div>
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