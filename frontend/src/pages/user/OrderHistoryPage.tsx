import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Package,
  Search,
  ChevronRight,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

// Giả lập dữ liệu đơn hàng
const orders = [
  {
    id: "ORD-9921",
    date: "12 Tháng 3, 2026",
    total: 450000,
    status: "delivering",
    items: [
      {
        name: "Cốc sứ thiết kế Galaxy",
        quantity: 1,
        image:
          "https://images.unsplash.com/photo-1514228742587-6b1558fbed20?w=200",
      },
    ],
  },
  {
    id: "ORD-8812",
    date: "05 Tháng 3, 2026",
    total: 1250000,
    status: "completed",
    items: [
      {
        name: "Áo thun POD Premium",
        quantity: 2,
        image:
          "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=200",
      },
      {
        name: "Móc khóa Acrylic",
        quantity: 1,
        image:
          "https://images.unsplash.com/photo-1629131726692-1accd0c53ce0?w=200",
      },
    ],
  },
];

const OrderHistoryPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  // UI Helper: Hiển thị Badge trạng thái đơn hàng
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-emerald-50 text-emerald-600 hover:bg-emerald-50 border-none font-bold px-3 py-1">
            Hoàn thành
          </Badge>
        );
      case "delivering":
        return (
          <Badge className="bg-blue-50 text-blue-600 hover:bg-blue-50 border-none font-bold px-3 py-1">
            Đang giao
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-red-50 text-red-600 hover:bg-red-50 border-none font-bold px-3 py-1">
            Đã hủy
          </Badge>
        );
      default:
        return (
          <Badge className="bg-slate-50 text-slate-600 hover:bg-slate-50 border-none font-bold px-3 py-1">
            Đang xử lý
          </Badge>
        );
    }
  };

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
        {/* TIÊU ĐỀ & TÌM KIẾM */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight">
              Đơn hàng
            </h1>
            <p className="text-slate-400 font-medium text-lg">
              Theo dõi và quản lý lịch sử mua sắm của bạn.
            </p>
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

        {/* DANH SÁCH ĐƠN HÀNG */}
        <div className="space-y-6">
          {orders.map((order) => (
            <Card
              key={order.id}
              className="rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden bg-white"
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
                        Mã đơn: {order.id}
                      </p>
                      <p className="text-xs text-slate-400 font-medium italic">
                        {order.date}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(order.status)}
                </div>

                {/* Items List */}
                <div className="p-6 space-y-4">
                  {order.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-16 h-16 rounded-2xl object-cover border border-slate-100"
                        />
                        <div>
                          <p className="font-bold text-slate-800 text-sm leading-tight">
                            {item.name}
                          </p>
                          <p className="text-xs text-slate-400 font-medium mt-1">
                            Số lượng: x{item.quantity}
                          </p>
                        </div>
                      </div>
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
                      {order.total.toLocaleString()}đ
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="rounded-xl font-bold h-11 px-6 border-slate-100 hover:bg-slate-50"
                    >
                      Chi tiết
                    </Button>
                    {order.status === "delivering" && (
                      <Button className="bg-slate-900 text-white hover:bg-black rounded-xl font-bold h-11 px-6 shadow-lg shadow-slate-200">
                        Theo dõi
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* NẾU KHÔNG CÓ ĐƠN HÀNG */}
        {orders.length === 0 && (
          <div className="py-20 text-center space-y-4">
            <div className="bg-slate-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto text-slate-300">
              <Package size={40} />
            </div>
            <p className="text-slate-400 font-bold">
              Bạn chưa có đơn hàng nào.
            </p>
            <Button
              onClick={() => navigate("/products")}
              className="bg-blue-600 rounded-full px-8 font-black"
            >
              Mua sắm ngay
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default OrderHistoryPage;
