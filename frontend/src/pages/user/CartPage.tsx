import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Trash2,
  Plus,
  Minus,
  ArrowLeft,
  ShoppingBag,
  Loader2,
} from "lucide-react";
import axiosClient from "../../api/axiosClient";

const BASE_URL = "http://localhost:3000";

const CartPage = () => {
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  // Gọi API lấy giỏ hàng
  const fetchCart = async () => {
    try {
      const response = await axiosClient.get("/carts");
      setCartItems(response.data?.items || []);
    } catch (error) {
      console.error("Lỗi lấy giỏ hàng:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  // Tính tổng tiền dựa trên data thật
  const subtotal = cartItems.reduce((acc, item) => {
    const price = item.variant?.prices?.[0]?.amount || 0;
    return acc + parseFloat(price) * item.quantity;
  }, 0);

  const updateQuantity = async (
    cartItemId: number,
    currentQuantity: number,
    delta: number,
  ) => {
    const newQuantity = currentQuantity + delta;
    if (newQuantity < 1) return;

    setUpdatingId(cartItemId);
    try {
      await axiosClient.patch(`/carts/items/${cartItemId}`, {
        quantity: newQuantity,
      });
      await fetchCart();
    } catch (error: any) {
      alert(error.response?.data?.message || "Không thể cập nhật số lượng");
    } finally {
      setUpdatingId(null);
    }
  };

  // Logic gọi API Xóa sản phẩm khỏi giỏ
  const removeItem = async (cartItemId: number) => {
    if (
      !window.confirm("Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng?")
    )
      return;

    setUpdatingId(cartItemId);
    try {
      await axiosClient.delete(`/carts/items/${cartItemId}`);
      setCartItems((items) => items.filter((item) => item.id !== cartItemId));
    } catch (error) {
      alert("Lỗi khi xóa sản phẩm");
    } finally {
      setUpdatingId(null);
    }
  };

  // Helper function: Lấy ảnh hiển thị
  const getDisplayImage = (item: any) => {
    const variantImg = item.variant?.images?.[0]?.url;
    const productImg = item.variant?.product?.images?.[0]?.url;
    const finalUrl = variantImg || productImg;
    return finalUrl ? `${BASE_URL}${finalUrl}` : "";
  };

  // Trạng thái Loading ban đầu
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  // Trạng thái Giỏ hàng trống
  if (cartItems.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <div className="bg-gray-50 p-6 rounded-full mb-6">
          <ShoppingBag size={48} className="text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Giỏ hàng của bạn đang trống
        </h2>
        <p className="text-gray-500 mb-8 text-center max-w-md">
          Có vẻ như bạn chưa thêm sản phẩm nào. Hãy cùng khám phá những món quà
          độc đáo nhé!
        </p>
        <Link
          to="/products"
          className="bg-blue-600 text-white px-8 py-3 rounded-md font-medium hover:bg-blue-700 transition-colors shadow-sm"
        >
          Tiếp tục mua sắm
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-sans">
      <div className="flex items-center gap-2 mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Giỏ hàng</h1>
        <span className="text-lg text-gray-500 font-medium">
          ({cartItems.length} sản phẩm)
        </span>
      </div>

      <div className="flex flex-col lg:flex-row gap-10">
        {/* CỘT TRÁI: DANH SÁCH SẢN PHẨM */}
        <div className="lg:w-2/3">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="hidden sm:grid grid-cols-12 gap-4 p-4 border-b border-gray-200 bg-gray-50 text-sm font-semibold text-gray-600 uppercase tracking-wider">
              <div className="col-span-6">Sản phẩm</div>
              <div className="col-span-3 text-center">Số lượng</div>
              <div className="col-span-3 text-right">Tổng cộng</div>
            </div>

            <ul className="divide-y divide-gray-200">
              {cartItems.map((item) => {
                const price = parseFloat(
                  item.variant?.prices?.[0]?.amount || 0,
                );
                const displayImage = getDisplayImage(item);
                const isItemUpdating = updatingId === item.id;

                return (
                  <li
                    key={item.id}
                    className={`p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-12 gap-4 sm:gap-6 items-center transition-opacity ${isItemUpdating ? "opacity-50 pointer-events-none" : ""}`}
                  >
                    {/* Cột Info */}
                    <div className="col-span-1 sm:col-span-6 flex gap-4">
                      <div className="w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0 bg-gray-100 rounded-md border border-gray-200 overflow-hidden">
                        {displayImage ? (
                          <img
                            src={displayImage}
                            alt="Product"
                            className="w-full h-full object-cover object-center"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <ShoppingBag size={24} />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col justify-center">
                        <Link
                          to={`/products/${item.variant?.product?.id}`}
                          className="text-base font-medium text-gray-900 line-clamp-2 hover:text-blue-600 transition-colors"
                        >
                          {item.variant?.product?.productName || "Sản phẩm"}
                        </Link>
                        <p className="text-sm font-semibold text-gray-900 mt-1 sm:hidden">
                          {price.toLocaleString()}đ
                        </p>

                        {/* Hiển thị Tùy chọn thiết kế */}
                        {item.customizedDesignJson &&
                          Object.keys(item.customizedDesignJson).length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded border border-indigo-100">
                                Có thiết kế riêng
                              </span>
                            </div>
                          )}
                      </div>
                    </div>

                    {/* Cột Quantity */}
                    <div className="col-span-1 sm:col-span-3 flex sm:justify-center items-center mt-2 sm:mt-0">
                      <div className="flex items-center border border-gray-300 rounded-md bg-white">
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity, -1)
                          }
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                          disabled={item.quantity <= 1 || isItemUpdating}
                        >
                          <Minus size={16} />
                        </button>
                        <span className="w-10 text-center text-sm font-medium text-gray-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity, 1)
                          }
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                          disabled={isItemUpdating}
                        >
                          <Plus size={16} />
                        </button>
                      </div>

                      {/* Nút xóa trên Mobile */}
                      <button
                        onClick={() => removeItem(item.id)}
                        className="ml-auto sm:hidden text-red-500 hover:text-red-700 p-2"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>

                    {/* Cột Total */}
                    <div className="col-span-1 sm:col-span-3 flex justify-between sm:justify-end items-center mt-2 sm:mt-0">
                      <span className="hidden sm:block text-base font-bold text-gray-900">
                        {(price * item.quantity).toLocaleString()}đ
                      </span>
                      {/* Nút xóa trên Desktop */}
                      <button
                        onClick={() => removeItem(item.id)}
                        className="hidden sm:block ml-4 text-gray-400 hover:text-red-500 transition-colors"
                        title="Xóa sản phẩm"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="mt-6 flex justify-between items-center">
            <Link
              to="/products"
              className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
            >
              <ArrowLeft size={16} /> Tiếp tục mua sắm
            </Link>
          </div>
        </div>

        {/* CỘT PHẢI: ORDER SUMMARY */}
        <div className="lg:w-1/3">
          <div className="bg-gray-50 border border-gray-200 rounded-lg shadow-sm p-6 sticky top-24">
            <h2 className="text-lg font-bold text-gray-900 mb-6">
              Tổng đơn hàng
            </h2>

            {/* Đã xóa Phí vận chuyển, chỉ giữ Tạm tính kèm số lượng */}
            <div className="text-sm text-gray-600 mb-6">
              <div className="flex justify-between items-center">
                <span>Tạm tính ({cartItems.length} sản phẩm)</span>
                <span className="font-medium text-gray-900">
                  {subtotal.toLocaleString()}đ
                </span>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4 mb-6">
              <div className="flex justify-between items-end mb-1">
                <span className="text-base font-bold text-gray-900 mb-1">
                  Tổng cộng
                </span>
                <span className="text-2xl font-bold text-[#ff4d6d]">
                  {subtotal.toLocaleString()}đ
                </span>
              </div>
            </div>

            <Link
              to="/checkout"
              className="w-full bg-[#ff4d6d] text-white py-3.5 px-4 rounded-md font-bold text-base hover:bg-[#e63958] transition-colors shadow-sm flex justify-center items-center gap-2"
            >
              Tiến hành thanh toán
            </Link>

            <div className="mt-6 flex flex-col items-center gap-3">
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <svg
                  className="w-4 h-4 text-green-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                Thanh toán bảo mật & an toàn
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
