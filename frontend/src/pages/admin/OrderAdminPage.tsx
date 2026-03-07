import React, { useState, useEffect } from "react";
import {
  Package,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  X,
  CheckCircle,
  Clock,
  XCircle,
  MapPin,
  CreditCard,
  Download,
  Loader2,
} from "lucide-react";
import axiosClient from "../../api/axiosClient";

const BASE_URL = "http://localhost:3000";

const OrderAdminPage = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // State cho Modal Chi tiết
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState("");

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await axiosClient.get("/orders");
      setOrders(response.data);
    } catch (error) {
      console.error("Lỗi lấy danh sách đơn hàng:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder || !newStatus || newStatus === selectedOrder.status)
      return;

    setIsUpdatingStatus(true);
    try {
      await axiosClient.patch(`/orders/${selectedOrder.id}/status`, {
        status: newStatus,
      });
      // Cập nhật UI ngay lập tức
      setOrders(
        orders.map((o) =>
          o.id === selectedOrder.id ? { ...o, status: newStatus } : o,
        ),
      );
      setSelectedOrder({ ...selectedOrder, status: newStatus });
      alert("Cập nhật trạng thái thành công!");
    } catch (error: any) {
      alert(error.response?.data?.message || "Lỗi cập nhật trạng thái");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDownloadDesign = async (itemId: number) => {
    try {
      const res = await axiosClient.get(`/orders/items/${itemId}/design`);
      const designData = res.data.design;
      // Trong thực tế, bạn sẽ nạp JSON này vào Konva Canvas rồi export ra ảnh.
      // Tạm thời log ra để xác nhận API hoạt động
      console.log("Dữ liệu thiết kế:", designData);
      alert(
        "Đã tải JSON thiết kế! Vui lòng kiểm tra Console hoặc gắn vào tool Render.",
      );
    } catch (error) {
      alert("Không lấy được file thiết kế!");
    }
  };

  // Helper hiển thị badge trạng thái
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="bg-yellow-100 text-yellow-800 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-max">
            <Clock size={12} /> Chờ xác nhận
          </span>
        );
      case "processing":
        return (
          <span className="bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-max">
            <Package size={12} /> Đang sản xuất
          </span>
        );
      case "delivered":
        return (
          <span className="bg-green-100 text-green-800 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-max">
            <CheckCircle size={12} /> Đã giao
          </span>
        );
      case "cancelled":
        return (
          <span className="bg-red-100 text-red-800 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-max">
            <XCircle size={12} /> Đã hủy
          </span>
        );
      default:
        return (
          <span className="bg-gray-100 text-gray-800 px-2.5 py-1 rounded-full text-xs font-semibold">
            {status}
          </span>
        );
    }
  };

  // Lọc dữ liệu
  const filteredOrders = orders.filter((order) => {
    const matchStatus = filterStatus === "all" || order.status === filterStatus;
    const matchSearch =
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.recipientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.phoneNumber.includes(searchQuery);
    return matchStatus && matchSearch;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto font-sans text-gray-800">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Đơn hàng</h1>
          <p className="text-sm text-gray-500 mt-1">
            Theo dõi và xử lý đơn hàng, xuất file in ấn.
          </p>
        </div>

        {/* THANH CÔNG CỤ TÌM KIẾM & LỌC */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Tìm mã đơn, tên, SĐT..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none w-full sm:w-64"
            />
          </div>
          <div className="relative">
            <Filter
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none bg-white w-full sm:w-auto"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="pending">Chờ xác nhận</option>
              <option value="processing">Đang sản xuất</option>
              <option value="delivered">Đã giao</option>
              <option value="cancelled">Đã hủy</option>
            </select>
          </div>
        </div>
      </div>

      {/* BẢNG DỮ LIỆU */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-sm font-semibold text-gray-600 uppercase tracking-wider">
                <th className="p-4">Mã đơn</th>
                <th className="p-4">Khách hàng</th>
                <th className="p-4">Ngày đặt</th>
                <th className="p-4">Tổng tiền</th>
                <th className="p-4">Trạng thái</th>
                <th className="p-4 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center">
                    <Loader2
                      className="animate-spin text-blue-600 mx-auto"
                      size={32}
                    />
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    Không tìm thấy đơn hàng nào khớp với điều kiện.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="p-4 font-medium text-blue-600">
                      {order.orderNumber}
                    </td>
                    <td className="p-4">
                      <p className="font-semibold text-gray-900">
                        {order.recipientName}
                      </p>
                      <p className="text-gray-500 text-xs">
                        {order.phoneNumber}
                      </p>
                    </td>
                    <td className="p-4 text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="p-4 font-bold text-gray-900">
                      {parseFloat(order.totalAmount).toLocaleString()}đ
                      <p className="text-xs font-normal text-gray-500 mt-0.5">
                        {order.paymentMethod}
                      </p>
                    </td>
                    <td className="p-4">{getStatusBadge(order.status)}</td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setNewStatus(order.status);
                          }}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Xem & Cập nhật"
                        >
                          <Edit size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL CHI TIẾT & CẬP NHẬT TRẠNG THÁI */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto custom-scrollbar relative flex flex-col">
            {/* Header Modal */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50 rounded-t-xl sticky top-0 z-10">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Đơn hàng: {selectedOrder.orderNumber}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Đặt lúc:{" "}
                  {new Date(selectedOrder.createdAt).toLocaleString("vi-VN")}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Body Modal */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Cột trái: Thông tin & Trạng thái */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2 uppercase tracking-wide border-b pb-2">
                    <MapPin size={16} className="text-blue-600" /> Giao hàng tới
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg text-sm space-y-2">
                    <p>
                      <span className="text-gray-500">Người nhận:</span>{" "}
                      <span className="font-semibold">
                        {selectedOrder.recipientName}
                      </span>
                    </p>
                    <p>
                      <span className="text-gray-500">Điện thoại:</span>{" "}
                      <span className="font-semibold">
                        {selectedOrder.phoneNumber}
                      </span>
                    </p>
                    <p>
                      <span className="text-gray-500">Địa chỉ:</span>{" "}
                      {selectedOrder.shippingAddress}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2 uppercase tracking-wide border-b pb-2">
                    <CreditCard size={16} className="text-blue-600" /> Thanh
                    toán
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg text-sm space-y-2">
                    <p>
                      <span className="text-gray-500">Phương thức:</span>{" "}
                      <span className="font-semibold">
                        {selectedOrder.paymentMethod}
                      </span>
                    </p>
                    <p>
                      <span className="text-gray-500">Trạng thái tiền:</span>{" "}
                      {selectedOrder.paymentStatus === "paid" ? (
                        <span className="text-green-600 font-bold">
                          Đã thu tiền
                        </span>
                      ) : (
                        <span className="text-yellow-600 font-bold">
                          Chờ thu tiền
                        </span>
                      )}
                    </p>
                    <p className="text-lg font-bold text-gray-900 mt-2 border-t pt-2 border-gray-200">
                      Tổng:{" "}
                      {parseFloat(selectedOrder.totalAmount).toLocaleString()}đ
                    </p>
                  </div>
                </div>

                {/* KHU VỰC CẬP NHẬT TRẠNG THÁI */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <label className="block text-sm font-bold text-blue-900 mb-2">
                    Cập nhật trạng thái đơn:
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="flex-1 border border-blue-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="pending">Chờ xác nhận</option>
                      <option value="processing">Đang sản xuất</option>
                      <option value="delivered">Đã giao hoàn tất</option>
                      <option value="cancelled">Hủy đơn</option>
                    </select>
                    <button
                      onClick={handleUpdateStatus}
                      disabled={
                        isUpdatingStatus || newStatus === selectedOrder.status
                      }
                      className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      {isUpdatingStatus ? (
                        <Loader2 className="animate-spin" size={16} />
                      ) : (
                        "Lưu"
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Cột phải: Danh sách sản phẩm & In ấn */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2 uppercase tracking-wide border-b pb-2">
                  <Package size={16} className="text-blue-600" /> Sản phẩm cần
                  in
                </h3>
                <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                  {selectedOrder.items.map((item: any) => {
                    const imgUrl =
                      item.variant?.images?.[0]?.url ||
                      item.variant?.product?.images?.[0]?.url;

                    return (
                      <div
                        key={item.id}
                        className="bg-white border border-gray-200 p-3 rounded-lg flex flex-col gap-3"
                      >
                        <div className="flex gap-3">
                          <img
                            src={`${BASE_URL}${imgUrl}`}
                            alt=""
                            className="w-16 h-16 rounded object-cover bg-gray-50 border border-gray-100"
                          />
                          <div>
                            <p className="text-sm font-bold text-gray-900">
                              {item.variant?.product?.productName}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              SL: {item.quantity} x{" "}
                              {parseFloat(
                                item.priceAtPurchase,
                              ).toLocaleString()}
                              đ
                            </p>
                          </div>
                        </div>

                        {/* NÚT TẢI FILE IN (Chỉ hiện khi khách có thiết kế) */}
                        {item.customizedDesignJson && (
                          <div className="border-t border-dashed pt-3 mt-1">
                            <button
                              onClick={() => handleDownloadDesign(item.id)}
                              className="w-full flex items-center justify-center gap-2 bg-indigo-50 text-indigo-700 border border-indigo-200 py-2 rounded text-xs font-bold hover:bg-indigo-100 transition-colors"
                            >
                              <Download size={14} /> Xuất file thiết kế In Ấn
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderAdminPage;
