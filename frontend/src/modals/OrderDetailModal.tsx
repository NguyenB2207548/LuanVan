import {
    X,
    Package,
    User,
    MapPin,
    Phone,
    CreditCard,
    ShoppingBag,
    CircleDot,
    Calendar
} from "lucide-react";
import { format } from "date-fns";

const BASE_URL = "http://localhost:3000";

interface OrderDetailModalProps {
    order: any;
    isOpen: boolean;
    onClose: () => void;
}

const OrderDetailModal = ({ order, isOpen, onClose }: OrderDetailModalProps) => {
    if (!isOpen || !order) return null;

    const getStatusStyle = (status: string) => {
        const styles: any = {
            pending: "bg-amber-50 text-amber-600 border-amber-100",
            confirmed: "bg-blue-50 text-blue-600 border-blue-100",
            shipping: "bg-purple-50 text-purple-600 border-purple-100",
            success: "bg-emerald-50 text-emerald-600 border-emerald-100",
            failed: "bg-orange-50 text-orange-600 border-orange-100",
            cancelled: "bg-red-50 text-red-600 border-red-100",
        };
        return styles[status] || "bg-gray-50 text-gray-600 border-gray-100";
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-3xl max-h-[90vh] rounded-[32px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in duration-300 border border-white/20">

                {/* Header */}
                <div className="p-6 border-b flex justify-between items-center bg-slate-50/50">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                            <ShoppingBag size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 leading-tight">Chi tiết đơn hàng</h2>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">
                                Mã: {order.orderNumber}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="overflow-y-auto p-8 space-y-10">

                    {/* Row 1: Status & Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1"><CircleDot size={12} /> Trạng thái</p>
                            <div className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black border uppercase ${getStatusStyle(order.status)}`}>
                                {order.status}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1"><Calendar size={12} /> Ngày đặt</p>
                            <p className="text-sm font-bold text-slate-700">{format(new Date(order.createdAt), "dd/MM/yyyy HH:mm")}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1"><CreditCard size={12} /> Thanh toán</p>
                            <p className="text-sm font-bold text-slate-700">{order.paymentMethod} - <span className="text-amber-600 uppercase text-xs">{order.paymentStatus}</span></p>
                        </div>
                    </div>

                    {/* Row 2: Customer & Shipping */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-4">
                            <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                <MapPin size={16} className="text-red-500" /> Địa chỉ giao hàng
                            </h4>
                            <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 space-y-2">
                                <p className="font-black text-slate-800">{order.recipientName}</p>
                                <p className="text-sm text-slate-600 font-medium italic leading-relaxed">{order.shippingAddress}</p>
                                <p className="text-sm font-bold text-blue-600 flex items-center gap-2"><Phone size={14} /> {order.phoneNumber}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                <User size={16} className="text-blue-500" /> Khách hàng
                            </h4>
                            <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100">
                                <p className="font-black text-slate-800">{order.user.fullName}</p>
                                <p className="text-sm text-slate-500 font-medium">{order.user.email}</p>
                                <div className="mt-2 text-[10px] font-bold text-slate-400 bg-white inline-block px-2 py-1 rounded-lg border border-slate-100 uppercase">
                                    User ID: #{order.user.id}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Row 3: Products */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                            <Package size={16} className="text-emerald-500" /> Danh sách sản phẩm
                        </h4>
                        <div className="border border-slate-100 rounded-[24px] overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase">
                                        <tr>
                                            <th className="px-6 py-4">Sản phẩm</th>
                                            <th className="px-6 py-4 text-center">Số lượng</th>
                                            <th className="px-6 py-4 text-right">Đơn giá</th>
                                            <th className="px-6 py-4 text-right">Thành tiền</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {order.items.map((item: any) => {
                                            // Lấy ảnh: Ưu tiên ảnh Variant chính -> ảnh Product chính
                                            const displayImage = item.variant?.images?.find((img: any) => img.isPrimary)?.url
                                                || item.variant?.product?.images?.find((img: any) => img.isPrimary)?.url;

                                            return (
                                                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-14 h-14 bg-slate-100 rounded-xl overflow-hidden flex-shrink-0 border border-slate-200">
                                                                {displayImage ? (
                                                                    <img
                                                                        src={`${BASE_URL}${displayImage}`}
                                                                        className="w-full h-full object-cover"
                                                                        alt="product"
                                                                    />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                                        <Package size={20} />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <p className="font-black text-slate-800 leading-tight line-clamp-1">{item.variantNameSnapshot}</p>
                                                                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">SKU: {item.variant?.sku || 'N/A'}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center font-bold text-slate-600">x{item.quantity}</td>
                                                    <td className="px-6 py-4 text-right font-medium text-slate-600">{Number(item.priceAtPurchase).toLocaleString()}đ</td>
                                                    <td className="px-6 py-4 text-right font-black text-blue-600">{(item.priceAtPurchase * item.quantity).toLocaleString()}đ</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-8 border-t bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="text-center md:text-left">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Tổng cộng đơn hàng</p>
                        <p className="text-3xl font-black text-blue-600">{Number(order.totalAmount).toLocaleString()}đ</p>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                        <button onClick={onClose} className="flex-1 md:flex-none px-8 py-3 rounded-2xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-all active:scale-95">
                            Đóng
                        </button>
                        {order.status === 'pending' && (
                            <button className="flex-1 md:flex-none px-8 py-3 rounded-2xl font-black bg-blue-600 text-white shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95">
                                Xác nhận đơn
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetailModal;