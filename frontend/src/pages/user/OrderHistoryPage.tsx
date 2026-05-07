import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package,
  Search,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  AlertTriangle,
  Loader2,
  MapPin,
  Phone,
  User,
  CreditCard,
  Store,
  Star,
  X, // Thêm icon Star cho Modal Review
} from "lucide-react";
import axiosClient from "@/api/axiosClient";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import toast from "react-hot-toast";
import OrderDetailModal from "@/modals/OrderDetailModalClient";

const BASE_URL = "http://localhost:3000";

interface OrderItem {
  id: number;
  quantity: number;
  priceAtPurchase: number;
  variantNameSnapshot: string;
  variant?: {
    images?: { url: string; isPrimary: boolean }[];
    product?: {
      id: number; // Đã thêm id vào đây
      productName: string;
      images?: { url: string; isPrimary: boolean }[];
    };
  };
  customizedDesignJson?: Record<string, string> | null;
  previewDesign?: string | null;
}

interface SellerInfo {
  id: number;
  fullName: string;
  phoneNumber: string;
  sellerProfile: {
    shopName: string;
    shopAddress: string;
    rating: string;
  } | null;
}

interface ShipperInfo {
  id: number;
  fullName: string;
  phoneNumber: string;
  shipperProfile: {
    vehiclePlate: string;
    address: string;
    workStatus: string;
  } | null;
}

interface Order {
  id: number;
  orderNumber: string;
  totalAmount: string;
  status:
    | "pending"
    | "confirmed"
    | "shipping"
    | "success"
    | "failed"
    | "cancelled";
  recipientName: string;
  phoneNumber: string;
  shippingAddress: string;
  paymentMethod: "COD" | "MOMO";
  paymentStatus: "pending" | "paid";
  createdAt: string;
  items: OrderItem[];
  seller: SellerInfo | null;
  shipper: ShipperInfo | null;
}

// --- COMPONENT REVIEW MODAL ---
const ReviewModal = ({ isOpen, onClose, productInfo, onSuccess }: any) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !productInfo) return null;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await axiosClient.post("/reviews", {
        productId: productInfo.id,
        rating,
        comment,
      });
      toast.success("Đánh giá thành công!");
      onSuccess();
      onClose();
      setRating(5);
      setComment("");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi khi gửi đánh giá");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-lg shadow-xl overflow-hidden font-sans text-black">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-lg">Viết đánh giá</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-black">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-6">
          <div className="flex gap-4 items-center bg-gray-50 p-3 rounded">
            <img
              src={productInfo.image}
              className="w-12 h-12 object-cover rounded border"
              alt=""
            />
            <div className="min-w-0 text-sm">
              <p className="font-bold truncate">{productInfo.name}</p>
              {/* <p className="text-gray-500">{productInfo.variantName}</p> */}
            </div>
          </div>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <button key={s} onClick={() => setRating(s)}>
                <Star
                  size={32}
                  fill={rating >= s ? "#EAB308" : "none"}
                  className={rating >= s ? "text-yellow-500" : "text-gray-200"}
                />
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Chia sẻ cảm nhận của bạn về sản phẩm..."
            className="w-full min-h-[100px] p-3 text-sm border border-gray-200 rounded-md outline-none focus:border-gray-400"
          />
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-3 bg-black text-white font-bold rounded hover:bg-gray-800 disabled:bg-gray-400 flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 size={16} className="animate-spin" />} Gửi
            đánh giá
          </button>
        </div>
      </div>
    </div>
  );
};

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  pending: {
    label: "Chờ xác nhận",
    color: "text-amber-700 bg-amber-50 border border-amber-200",
    icon: <Clock size={12} />,
  },
  confirmed: {
    label: "Đã xác nhận",
    color: "text-blue-700 bg-blue-50 border border-blue-200",
    icon: <CheckCircle2 size={12} />,
  },
  shipping: {
    label: "Đang giao",
    color: "text-violet-700 bg-violet-50 border border-violet-200",
    icon: <Truck size={12} />,
  },
  success: {
    label: "Hoàn thành",
    color: "text-emerald-700 bg-emerald-50 border border-emerald-200",
    icon: <CheckCircle2 size={12} />,
  },
  failed: {
    label: "Giao thất bại",
    color: "text-orange-700 bg-orange-50 border border-orange-200",
    icon: <AlertTriangle size={12} />,
  },
  cancelled: {
    label: "Đã hủy",
    color: "text-red-700 bg-red-50 border border-red-200",
    icon: <XCircle size={12} />,
  },
};

const getItemImage = (item: OrderItem): string => {
  const variantImg = item.variant?.images?.find((i) => i.isPrimary)?.url;
  const productImg = item.variant?.product?.images?.find(
    (i) => i.isPrimary,
  )?.url;
  const url = variantImg || productImg;
  return url ? `${BASE_URL}${url}` : "";
};

const OrderHistoryPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeStatus, setActiveStatus] = useState<string>("all");

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // --- STATE CHO REVIEW ---
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewProduct, setReviewProduct] = useState<any>(null);

  const openDetail = (order: Order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const openReview = (item: OrderItem) => {
    const displayImg = item.previewDesign || getItemImage(item);

    setReviewProduct({
      id: item.variant?.product?.id,
      name: item.variant?.product?.productName,
      image: displayImg,
      variantName: item.variantNameSnapshot,
    });

    setIsReviewModalOpen(true);
  };

  useEffect(() => {
    fetchOrderHistory();
  }, []);

  const fetchOrderHistory = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get("/orders/my-orders");
      setOrders(res.data.data || res.data);
    } catch {
      toast.error("Không thể tải lịch sử đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn hủy đơn hàng này không?"))
      return;
    try {
      await axiosClient.patch(`/orders/${orderId}/cancel`);
      toast.success("Hủy đơn hàng thành công");
      fetchOrderHistory();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Không thể hủy đơn hàng");
    }
  };

  const statusTabs = [
    { key: "all", label: "Tất cả" },
    { key: "pending", label: "Chờ xác nhận" },
    { key: "confirmed", label: "Đã xác nhận" },
    { key: "shipping", label: "Đang giao" },
    { key: "success", label: "Hoàn thành" },
    { key: "cancelled", label: "Đã hủy" },
  ];

  const filteredOrders = orders.filter((order) => {
    const matchSearch =
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.recipientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = activeStatus === "all" || order.status === activeStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Lịch sử đặt hàng</h1>
        </div>

        {/* Search + Filter */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5">
          <div className="relative mb-4">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Tìm theo mã đơn hàng, tên người nhận..."
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400 transition-colors"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            {statusTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveStatus(tab.key)}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors border ${
                  activeStatus === tab.key
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:text-gray-800"
                }`}
              >
                {tab.label}
                {tab.key !== "all" && (
                  <span className="ml-1.5 opacity-60">
                    ({orders.filter((o) => o.status === tab.key).length})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="py-24 flex flex-col items-center gap-3">
            <Loader2 className="animate-spin text-gray-400" size={30} />
            <p className="text-sm text-gray-400">Đang tải...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-24 text-center bg-white border border-gray-200 rounded-xl">
            <Package className="mx-auto text-gray-300 mb-3" size={44} />
            <p className="text-sm text-gray-500 font-medium">
              {searchTerm || activeStatus !== "all"
                ? "Không tìm thấy đơn hàng phù hợp"
                : "Bạn chưa có đơn hàng nào"}
            </p>
            {!searchTerm && activeStatus === "all" && (
              <button
                onClick={() => navigate("/products")}
                className="mt-5 px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-black transition-colors"
              >
                Mua sắm ngay
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const statusCfg =
                STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
              const firstItem = order.items[0];
              const extraCount = order.items.length - 1;

              return (
                <div
                  key={order.id}
                  className="bg-white border border-gray-200 rounded-xl overflow-hidden"
                >
                  {/* Top bar */}
                  <div className="px-6 py-3.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-gray-900 tracking-tight">
                        {order.orderNumber}
                      </span>
                      <span className="text-xs text-gray-400">
                        {format(new Date(order.createdAt), "dd/MM/yyyy HH:mm", {
                          locale: vi,
                        })}
                      </span>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${statusCfg.color}`}
                    >
                      {statusCfg.icon}
                      {statusCfg.label}
                    </span>
                  </div>

                  <div className="px-6 py-5">
                    {/* Sản phẩm */}
                    {(() => {
                      const displayImg =
                        firstItem.previewDesign || getItemImage(firstItem);

                      return (
                        <div className="flex items-start gap-4 mb-5">
                          {/* 👇 2. Đổi bg-gray-50 thành bg-white */}
                          <div className="shrink-0 w-20 h-20 rounded-lg border border-gray-100 overflow-hidden bg-white">
                            {displayImg ? (
                              <img
                                src={displayImg}
                                alt={firstItem.variantNameSnapshot}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-50">
                                <Package size={24} className="text-gray-300" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0 pt-1">
                            <p className="text-base font-semibold text-gray-900 line-clamp-1">
                              {firstItem.variant?.product?.productName ||
                                firstItem.variantNameSnapshot}
                            </p>
                            <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">
                              {firstItem.variantNameSnapshot}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              x{firstItem.quantity} &nbsp;·&nbsp;
                              {Number(firstItem.priceAtPurchase).toLocaleString(
                                "vi-VN",
                              )}
                              đ/sp
                            </p>
                            {extraCount > 0 && (
                              <p className="text-xs text-gray-400 mt-1">
                                + {extraCount} sản phẩm khác
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {/* 4 ô thông tin */}
                    <div className="grid grid-cols-2 gap-5 py-5 border-t border-b border-gray-100 mb-5">
                      {/* Giao hàng */}
                      <div>
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">
                          Thông tin giao hàng
                        </p>
                        <div className="space-y-2">
                          <div className="flex items-start gap-2 text-sm text-gray-700">
                            <User
                              size={14}
                              className="shrink-0 text-gray-400 mt-0.5"
                            />
                            <span className="font-medium">
                              {order.recipientName}
                            </span>
                          </div>
                          <div className="flex items-start gap-2 text-sm text-gray-600">
                            <Phone
                              size={14}
                              className="shrink-0 text-gray-400 mt-0.5"
                            />
                            <span>{order.phoneNumber}</span>
                          </div>
                          <div className="flex items-start gap-2 text-sm text-gray-600">
                            <MapPin
                              size={14}
                              className="shrink-0 text-gray-400 mt-0.5"
                            />
                            <span>{order.shippingAddress}</span>
                          </div>
                        </div>
                      </div>

                      {/* Thanh toán */}
                      <div>
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">
                          Thanh toán
                        </p>
                        <div className="space-y-2">
                          <div className="flex items-start gap-2 text-sm text-gray-600">
                            <CreditCard
                              size={14}
                              className="shrink-0 text-gray-400 mt-0.5"
                            />
                            <span>
                              {order.paymentMethod === "COD"
                                ? "Thanh toán khi nhận hàng (COD)"
                                : "Ví MoMo"}
                            </span>
                          </div>
                          <div className="flex items-start gap-2 text-sm">
                            <span className="w-3.5 shrink-0" />
                            <span
                              className={
                                order.paymentStatus === "paid"
                                  ? "text-emerald-600 font-medium"
                                  : "text-amber-600 font-medium"
                              }
                            >
                              {order.paymentStatus === "paid"
                                ? "Đã thanh toán"
                                : "Chưa thanh toán"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Người bán */}
                      <div>
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">
                          Người bán
                        </p>
                        <div className="space-y-2">
                          <div className="flex items-start gap-2 text-sm text-gray-700">
                            <Store
                              size={14}
                              className="shrink-0 text-gray-400 mt-0.5"
                            />
                            <span className="font-medium">
                              {order.seller?.sellerProfile?.shopName ||
                                order.seller?.fullName ||
                                "—"}
                            </span>
                          </div>
                          {order.seller?.phoneNumber && (
                            <div className="flex items-start gap-2 text-sm text-gray-600">
                              <Phone
                                size={14}
                                className="shrink-0 text-gray-400 mt-0.5"
                              />
                              <span>{order.seller.phoneNumber}</span>
                            </div>
                          )}
                          {order.seller?.sellerProfile?.shopAddress && (
                            <div className="flex items-start gap-2 text-sm text-gray-600">
                              <MapPin
                                size={14}
                                className="shrink-0 text-gray-400 mt-0.5"
                              />
                              <span>
                                {order.seller.sellerProfile.shopAddress}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Shipper */}
                      {order.shipper ? (
                        <div>
                          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">
                            Shipper
                          </p>
                          <div className="space-y-2">
                            <div className="flex items-start gap-2 text-sm text-gray-700">
                              <Truck
                                size={14}
                                className="shrink-0 text-gray-400 mt-0.5"
                              />
                              <span className="font-medium">
                                {order.shipper.fullName}
                              </span>
                            </div>
                            <div className="flex items-start gap-2 text-sm text-gray-600">
                              <Phone
                                size={14}
                                className="shrink-0 text-gray-400 mt-0.5"
                              />
                              <span>{order.shipper.phoneNumber}</span>
                            </div>
                            {order.shipper.shipperProfile?.vehiclePlate && (
                              <div className="flex items-start gap-2 text-sm text-gray-500">
                                <span className="w-3.5 shrink-0" />
                                <span>
                                  Biển số:{" "}
                                  {order.shipper.shipperProfile.vehiclePlate}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">
                            Shipper
                          </p>
                          <p className="text-sm text-gray-400 italic">
                            Chưa có shipper
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">
                          Tổng tiền
                        </p>
                        <p className="text-xl font-bold text-gray-900">
                          {Number(order.totalAmount).toLocaleString("vi-VN")}đ
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {order.status === "pending" && (
                          <button
                            onClick={() => handleCancelOrder(order.id)}
                            className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                          >
                            Hủy đơn
                          </button>
                        )}
                        <button
                          onClick={() => openDetail(order)}
                          className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Xem chi tiết
                        </button>
                        {order.status === "success" && (
                          <button
                            onClick={() => openDetail(order)}
                            className="px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-black transition-colors"
                          >
                            Đánh giá
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL CHI TIẾT */}
      <OrderDetailModal
        order={selectedOrder}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onOpenReview={openReview} // Truyền hàm này vào để Modal chi tiết có thể gọi
      />

      {/* MODAL ĐÁNH GIÁ */}
      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        productInfo={reviewProduct}
        onSuccess={fetchOrderHistory}
      />
    </div>
  );
};

export default OrderHistoryPage;
