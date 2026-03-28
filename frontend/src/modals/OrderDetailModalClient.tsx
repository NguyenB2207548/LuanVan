
import {
    X,
    Package,
    Truck,
    Store,
    MapPin,
    Phone,
    CreditCard,
    Calendar,
    Star, // Thêm icon Star
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

const BASE_URL = "http://localhost:3000";

// CẬP NHẬT INTERFACE TẠI ĐÂY
interface OrderDetailModalProps {
    order: any;
    isOpen: boolean;
    onClose: () => void;
    onOpenReview: (item: any) => void; // Thêm dòng này để hết lỗi ở trang cha
}

const OrderDetailModal = ({ order, isOpen, onClose, onOpenReview }: OrderDetailModalProps) => {
    if (!isOpen || !order) return null;

    const formatDate = (dateStr: string) => {
        return format(new Date(dateStr), "dd/MM/yyyy HH:mm", { locale: vi });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-md shadow-xl font-sans">

                {/* Header */}
                <div className="sticky top-0 bg-white px-8 py-5 flex items-center justify-between border-b border-gray-100 z-10">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800">Chi tiết đơn hàng</h2>
                        <p className="text-sm text-gray-400 mt-0.5">Mã đơn: {order.orderNumber}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-full transition-colors text-gray-400">
                        <X size={22} />
                    </button>
                </div>

                <div className="p-8 space-y-9">
                    {/* 1. Trạng thái chung */}
                    <div className="flex flex-wrap gap-y-4 justify-between items-start">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3 text-sm text-gray-500">
                                <Calendar size={16} className="text-gray-300" />
                                <span>Ngày đặt hàng: {formatDate(order.createdAt)}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-500">
                                <CreditCard size={16} className="text-gray-300" />
                                <span>Hình thức thanh toán: <span className="text-gray-700 font-medium">{order.paymentMethod}</span> <span className="text-gray-400 text-xs">({order.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa trả'})</span></span>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Tổng giá trị đơn hàng</p>
                            <p className="text-2xl font-bold text-gray-800">{Number(order.totalAmount).toLocaleString("vi-VN")}đ</p>
                        </div>
                    </div>

                    <div className="h-px bg-gray-100 w-full"></div>

                    {/* 2. Thông tin sản phẩm */}
                    <section>
                        <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-6">
                            <Package size={18} className="text-gray-400" /> Danh sách sản phẩm mua
                        </h3>
                        <div className="grid grid-cols-1 gap-6">
                            {order.items.map((item: any) => (
                                <div key={item.id} className="flex gap-6 items-center bg-gray-50/30 p-4 rounded-sm border border-gray-50">
                                    <div className="w-20 h-20 bg-white border border-gray-100 rounded overflow-hidden shrink-0">
                                        <img
                                            src={`${BASE_URL}${item.variant?.images?.find((img: any) => img.isPrimary)?.url || item.variant?.product?.images?.[0]?.url}`}
                                            alt="product"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                                        <div>
                                            <p className="text-base font-medium text-gray-800 leading-snug">{item.variant?.product?.productName}</p>
                                            <p className="text-xs text-gray-400 mt-1">Phân loại: {item.variantNameSnapshot}</p>
                                        </div>
                                        <div className="flex justify-between md:justify-end md:gap-12 items-center">
                                            <div className="text-right">
                                                <p className="text-sm text-gray-500 italic">x{item.quantity}</p>
                                                <p className="text-base font-semibold text-gray-700">{Number(item.priceAtPurchase).toLocaleString("vi-VN")}đ</p>
                                            </div>

                                            {/* NÚT ĐÁNH GIÁ TỪNG SẢN PHẨM */}
                                            {order.status === "success" && (
                                                <button
                                                    onClick={() => onOpenReview(item)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-600 border border-blue-200 rounded hover:bg-blue-50 transition-colors"
                                                >
                                                    <Star size={12} fill="currentColor" />
                                                    Đánh giá
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <div className="h-px bg-gray-100 w-full"></div>

                    {/* 3. Vận chuyển & Nhận hàng */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <section>
                            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-4">
                                <MapPin size={18} className="text-gray-400" /> Thông tin người nhận
                            </h3>
                            <div className="text-sm space-y-2 text-gray-600">
                                <p className="font-medium text-gray-800 text-base">{order.recipientName}</p>
                                <p className="flex items-center gap-2"><Phone size={14} className="text-gray-300" /> {order.phoneNumber}</p>
                                <p className="leading-relaxed bg-gray-50 p-3 rounded-sm border border-gray-50">{order.shippingAddress}</p>
                            </div>
                        </section>

                        <section>
                            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-4">
                                <Truck size={18} className="text-gray-400" /> Đơn vị vận chuyển
                            </h3>
                            {order.shipper ? (
                                <div className="text-sm space-y-2 text-gray-600">
                                    <p className="font-medium text-gray-800 text-base">{order.shipper.fullName}</p>
                                    <p className="flex items-center gap-2"><Phone size={14} className="text-gray-300" /> {order.shipper.phoneNumber}</p>
                                    {order.shipper.shipperProfile && (
                                        <p className="text-xs text-gray-400 inline-block bg-gray-100 px-2 py-1 rounded">Biển số: {order.shipper.shipperProfile.vehiclePlate}</p>
                                    )}
                                </div>
                            ) : (
                                <div className="h-24 flex items-center justify-center border-2 border-dashed border-gray-100 rounded">
                                    <p className="text-sm text-gray-400 italic">Hệ thống đang điều phối shipper...</p>
                                </div>
                            )}
                        </section>
                    </div>

                    <div className="h-px bg-gray-100 w-full"></div>

                    {/* 4. Thông tin Seller */}
                    <section>
                        <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-4">
                            <Store size={18} className="text-gray-400" /> Thông tin cửa hàng
                        </h3>
                        <div className="flex items-center justify-between bg-gray-50 p-5 rounded border border-gray-100">
                            <div className="space-y-1">
                                <p className="font-medium text-gray-800 text-base">{order.seller?.sellerProfile?.shopName || order.seller?.fullName}</p>
                                <p className="text-gray-400 text-xs italic">{order.seller?.sellerProfile?.shopAddress || "Địa chỉ chưa cập nhật"}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-tight">Độ uy tín</p>
                                <p className="text-base font-bold text-amber-500">{order.seller?.sellerProfile?.rating || "N/A"} ★</p>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Footer Button */}
                <div className="p-8 pt-0">
                    <button
                        onClick={onClose}
                        className="w-full py-3.5 bg-gray-800 text-white text-sm font-medium rounded-sm hover:bg-black transition-all"
                    >
                        Đóng chi tiết
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OrderDetailModal;