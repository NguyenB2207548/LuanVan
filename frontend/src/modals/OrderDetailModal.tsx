import {
    X, Package, User, MapPin, Phone, CreditCard,
    ShoppingBag, Clock, Truck, CircleCheck, CircleX, Calendar, Hash
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

const BASE_URL = "http://localhost:3000";

interface OrderDetailModalProps {
    order: any;
    isOpen: boolean;
    onClose: () => void;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
    pending: { label: "Chờ xác nhận", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
    confirmed: { label: "Đã xác nhận", color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" },
    shipped: { label: "Đang giao", color: "text-violet-700", bg: "bg-violet-50", border: "border-violet-200" },
    success: { label: "Hoàn thành", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
    failed: { label: "Thất bại", color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200" },
    cancelled: { label: "Đã hủy", color: "text-rose-700", bg: "bg-rose-50", border: "border-rose-200" },
};

const PAYMENT_STATUS: Record<string, { label: string; color: string }> = {
    pending: { label: "Chưa thanh toán", color: "text-amber-600" },
    paid: { label: "Đã thanh toán", color: "text-emerald-600" },
    failed: { label: "Thanh toán thất bại", color: "text-rose-600" },
};

const OrderDetailModal = ({ order, isOpen, onClose }: OrderDetailModalProps) => {
    if (!isOpen || !order) return null;

    const statusCfg = STATUS_CONFIG[order.status] || { label: order.status, color: "text-gray-600", bg: "bg-gray-50", border: "border-gray-200" };
    const paymentCfg = PAYMENT_STATUS[order.paymentStatus] || { label: order.paymentStatus, color: "text-gray-600" };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
            <div
                className="bg-white w-full max-w-2xl max-h-[90vh] rounded-xl shadow-xl overflow-hidden flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gray-900 rounded-lg flex items-center justify-center">
                            <ShoppingBag size={18} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-gray-900">Chi tiết đơn hàng</h2>
                            <p className="text-xs text-gray-400 font-mono mt-0.5">{order.orderNumber}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="overflow-y-auto flex-1">
                    {/* Status bar */}
                    <div className={`px-6 py-3 border-b ${statusCfg.bg} ${statusCfg.border} border-b flex items-center justify-between`}>
                        <span className={`text-sm font-medium ${statusCfg.color}`}>{statusCfg.label}</span>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1"><Calendar size={12} /> Đặt: {format(new Date(order.createdAt), "dd/MM/yyyy HH:mm", { locale: vi })}</span>
                            <span className="flex items-center gap-1"><Clock size={12} /> Cập nhật: {format(new Date(order.updatedAt), "dd/MM/yyyy HH:mm", { locale: vi })}</span>
                        </div>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Info grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Recipient */}
                            <div className="border border-gray-100 rounded-lg p-4 space-y-3">
                                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide flex items-center gap-1.5"><MapPin size={12} />Thông tin giao hàng</p>
                                <div className="space-y-1.5 text-sm">
                                    <div className="flex justify-between gap-2">
                                        <span className="text-gray-500 shrink-0">Người nhận</span>
                                        <span className="font-medium text-gray-900 text-right">{order.recipientName}</span>
                                    </div>
                                    <div className="flex justify-between gap-2">
                                        <span className="text-gray-500 shrink-0 flex items-center gap-1"><Phone size={11} />SĐT</span>
                                        <span className="font-medium text-gray-900">{order.phoneNumber}</span>
                                    </div>
                                    <div className="flex justify-between gap-4">
                                        <span className="text-gray-500 shrink-0">Địa chỉ</span>
                                        <span className="text-gray-800 text-right leading-relaxed">{order.shippingAddress}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Customer + Payment */}
                            <div className="space-y-3">
                                <div className="border border-gray-100 rounded-lg p-4 space-y-2">
                                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide flex items-center gap-1.5"><User size={12} />Khách hàng</p>
                                    <p className="text-sm font-medium text-gray-900">{order.user.fullName}</p>
                                    <p className="text-xs text-gray-500">{order.user.email}</p>
                                    <p className="text-xs text-gray-500">{order.user.phoneNumber}</p>
                                </div>

                                <div className="border border-gray-100 rounded-lg p-4 space-y-2">
                                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide flex items-center gap-1.5"><CreditCard size={12} />Thanh toán</p>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600">{order.paymentMethod}</span>
                                        <span className={`text-xs font-medium ${paymentCfg.color}`}>{paymentCfg.label}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Shipper */}
                        {order.shipper && (
                            <div className="border border-violet-100 bg-violet-50/40 rounded-lg p-4">
                                <p className="text-xs font-medium text-violet-500 uppercase tracking-wide flex items-center gap-1.5 mb-2"><Truck size={12} />Shipper phụ trách</p>
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="w-7 h-7 rounded-full bg-violet-200 flex items-center justify-center text-violet-700 font-semibold text-xs">
                                        {order.shipper.fullName.charAt(0)}
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-900">{order.shipper.fullName}</span>
                                        <span className="text-gray-500 ml-2">{order.shipper.phoneNumber}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Products */}
                        <div>
                            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide flex items-center gap-1.5 mb-3"><Package size={12} />Sản phẩm ({order.items.length})</p>
                            <div className="border border-gray-100 rounded-lg overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 border-b border-gray-100">
                                        <tr>
                                            <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Sản phẩm</th>
                                            <th className="px-4 py-2.5 text-center text-xs font-medium text-gray-500 w-20">SL</th>
                                            <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 w-28">Đơn giá</th>
                                            <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 w-28">Thành tiền</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {order.items.map((item: any) => {
                                            const variantImg = item.variant?.images?.find((i: any) => i.isPrimary)?.url;
                                            const productImg = item.variant?.product?.images?.find((i: any) => i.isPrimary)?.url;
                                            const img = variantImg || productImg;

                                            return (
                                                <tr key={item.id} className="hover:bg-gray-50/50">
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-11 h-11 rounded-lg border border-gray-100 bg-gray-50 overflow-hidden shrink-0">
                                                                {img
                                                                    ? <img src={`${BASE_URL}${img}`} className="w-full h-full object-cover" alt="" />
                                                                    : <div className="w-full h-full flex items-center justify-center"><Package size={14} className="text-gray-300" /></div>
                                                                }
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-sm text-gray-800 font-medium leading-snug line-clamp-2">{item.variantNameSnapshot}</p>
                                                                {item.variant?.sku && (
                                                                    <p className="text-xs text-gray-400 font-mono mt-0.5">{item.variant.sku}</p>
                                                                )}
                                                                {item.customizedDesignJson && (
                                                                    <p className="text-xs text-violet-600 mt-0.5">✦ Thiết kế tuỳ chỉnh</p>
                                                                )}
                                                                {!item.variant && (
                                                                    <p className="text-xs text-rose-400 mt-0.5">Variant đã bị xóa</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-center text-gray-600">x{item.quantity}</td>
                                                    <td className="px-4 py-3 text-right text-gray-600">{item.priceAtPurchase.toLocaleString("vi-VN")}đ</td>
                                                    <td className="px-4 py-3 text-right font-medium text-gray-900">{(item.priceAtPurchase * item.quantity).toLocaleString("vi-VN")}đ</td>
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
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-gray-400 mb-0.5">Tổng giá trị đơn hàng</p>
                        <p className="text-xl font-semibold text-gray-900">{Number(order.totalAmount).toLocaleString("vi-VN")}đ</p>
                    </div>
                    <button onClick={onClose} className="px-5 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OrderDetailModal;