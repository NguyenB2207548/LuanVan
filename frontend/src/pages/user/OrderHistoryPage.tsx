import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Package,
  Search,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import axiosClient from "@/api/axiosClient";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import toast from "react-hot-toast";

interface OrderItem {
  id: number;
  quantity: number;
  priceAtPurchase: string;
  variantNameSnapshot: string;
  variant?: {
    images?: { url: string; isPrimary: boolean }[];
    product?: { images?: { url: string; isPrimary: boolean }[] };
  };
}

interface Order {
  id: number;
  orderNumber: string;
  totalAmount: string;
  status: "pending" | "confirmed" | "shipping" | "success" | "failed" | "cancelled";
  createdAt: string;
  items: OrderItem[];
}

const OrderHistoryPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchOrderHistory();
  }, []);

  const fetchOrderHistory = async () => {
    try {
      setLoading(true);
      // Gọi API lấy lịch sử đơn hàng của User
      const res = await axiosClient.get("/orders/my-orders");
      // Giả định backend trả về { data: Order[] }
      setOrders(res.data.data || res.data);
    } catch (err) {
      console.error(err);
      toast.error("Không thể tải lịch sử đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  // Hàm xử lý hủy đơn hàng
  const handleCancelOrder = async (orderId: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn hủy đơn hàng này không?")) return;
    try {
      await axiosClient.patch(`/orders/${orderId}/cancel`);
      toast.success("Hủy đơn hàng thành công");
      fetchOrderHistory(); // Tải lại danh sách sau khi hủy
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Không thể hủy đơn hàng");
    }
  };

  // Helper lấy ảnh đại diện của sản phẩm trong đơn
  const getItemImage = (item: OrderItem) => {
    const variantImg = item.variant?.images?.find((img) => img.isPrimary)?.url;
    const productImg = item.variant?.product?.images?.find((img) => img.isPrimary)?.url;
    return variantImg || productImg || "https://via.placeholder.com/150";
  };

  // Ánh xạ trạng thái đơn hàng theo yêu cầu của bạn
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-amber-50 text-amber-600 hover:bg-amber-50 border-none font-bold gap-1">
            <Clock size={12} /> Chờ xác nhận
          </Badge>
        );
      case "confirmed":
        return (
          <Badge className="bg-blue-50 text-blue-600 hover:bg-blue-50 border-none font-bold gap-1">
            <CheckCircle2 size={12} /> Đã xác nhận
          </Badge>
        );
      case "shipping":
        return (
          <Badge className="bg-purple-50 text-purple-600 hover:bg-purple-50 border-none font-bold gap-1">
            <Truck size={12} /> Đang giao
          </Badge>
        );
      case "success":
        return (
          <Badge className="bg-emerald-50 text-emerald-600 hover:bg-emerald-50 border-none font-bold gap-1">
            <CheckCircle2 size={12} /> Hoàn thành
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-orange-50 text-orange-600 hover:bg-orange-50 border-none font-bold gap-1">
            <AlertTriangle size={12} /> Giao hàng thất bại
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-red-50 text-red-600 hover:bg-red-50 border-none font-bold gap-1">
            <XCircle size={12} /> Đã hủy
          </Badge>
        );
      default:
        return <Badge variant="outline">Không xác định</Badge>;
    }
  };

  // Lọc đơn hàng theo mã đơn hàng nhập vào ô tìm kiếm
  const filteredOrders = orders.filter((order) =>
    order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#fcfcfd] pb-20">
      {/* HEADER NAV */}
      <div className="max-w-7xl mx-auto w-full px-6 py-8">
        <Button
          variant="ghost"
          className="text-slate-500 hover:text-slate-900 font-bold gap-2 p-0"
          onClick={() => navigate("/profile")}
        >
          <ArrowLeft size={18} /> Quay về hồ sơ
        </Button>
      </div>

      <main className="max-w-4xl mx-auto w-full px-6 space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight">
              Đơn hàng
            </h1>
            <p className="text-slate-500 font-medium">Theo dõi và quản lý các đơn hàng của bạn</p>
          </div>
          <div className="relative w-full md:w-80">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <Input
              placeholder="Tìm mã đơn hàng..."
              className="h-12 pl-12 rounded-2xl border-slate-100 bg-white shadow-sm focus:ring-blue-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="animate-spin text-blue-600" size={40} />
            <p className="text-slate-400 font-bold">Đang tải lịch sử đơn hàng...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order) => (
                <Card
                  key={order.id}
                  className="rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden bg-white"
                >
                  <CardContent className="p-0">
                    {/* Order Header */}
                    <div className="p-6 border-b border-slate-50 flex flex-wrap justify-between items-center gap-4 bg-slate-50/30">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-white rounded-2xl text-slate-900 shadow-sm border border-slate-100">
                          <Package size={22} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 tracking-tight">
                            {order.orderNumber}
                          </p>
                          <p className="text-xs text-slate-400 font-medium italic">
                            {format(new Date(order.createdAt), "dd 'Tháng' M, yyyy", { locale: vi })}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(order.status)}
                    </div>

                    {/* Items List */}
                    <div className="p-6 space-y-4">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <img
                              src={getItemImage(item)}
                              alt={item.variantNameSnapshot}
                              className="w-16 h-16 rounded-2xl object-cover border border-slate-100"
                            />
                            <div>
                              <p className="font-bold text-slate-800 text-sm leading-tight line-clamp-1">
                                {item.variantNameSnapshot}
                              </p>
                              <p className="text-xs text-slate-400 font-medium mt-1">
                                Số lượng: x{item.quantity}
                              </p>
                            </div>
                          </div>
                          <p className="text-sm font-bold text-slate-700">
                            {Number(item.priceAtPurchase).toLocaleString()}đ
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Order Footer */}
                    <div className="p-6 border-t border-slate-50 flex items-center justify-between bg-white">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">
                          Tổng thanh toán
                        </p>
                        <p className="text-xl font-black text-blue-600">
                          {Number(order.totalAmount).toLocaleString()}đ
                        </p>
                      </div>
                      <div className="flex gap-3">
                        {order.status === "pending" && (
                          <Button
                            variant="ghost"
                            className="rounded-xl font-bold h-11 px-6 text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleCancelOrder(order.id)}
                          >
                            Hủy đơn
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          className="rounded-xl font-bold h-11 px-6 border-slate-100 hover:bg-slate-50"
                          onClick={() => navigate(`/order/${order.id}`)}
                        >
                          Chi tiết
                        </Button>
                        {order.status === "shipping" && (
                          <Button
                            className="bg-slate-900 text-white hover:bg-black rounded-xl font-bold h-11 px-6 shadow-lg shadow-slate-200"
                            onClick={() => navigate(`/order-tracking/${order.id}`)}
                          >
                            Theo dõi
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="py-20 text-center space-y-4 bg-white rounded-3xl border border-dashed border-slate-200">
                <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto text-slate-300">
                  <Package size={40} />
                </div>
                <p className="text-slate-400 font-bold">
                  {searchTerm ? "Không tìm thấy đơn hàng phù hợp." : "Bạn chưa có đơn hàng nào."}
                </p>
                {!searchTerm && (
                  <Button
                    onClick={() => navigate("/products")}
                    className="bg-blue-600 rounded-full px-8 font-black shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
                  >
                    Mua sắm ngay
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default OrderHistoryPage;