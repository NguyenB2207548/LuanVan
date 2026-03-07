import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ChevronRight,
  ShieldCheck,
  CreditCard,
  Banknote,
  Loader2,
  MapPin,
} from "lucide-react";
import axiosClient from "../../api/axiosClient";

const BASE_URL = "http://localhost:3000";

const CheckoutPage = () => {
  const navigate = useNavigate();

  // State Giỏ hàng (Để hiển thị Order Summary)
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loadingCart, setLoadingCart] = useState(true);

  // State Form Đặt hàng
  const [formData, setFormData] = useState({
    recipientName: "",
    phoneNumber: "",
    shippingAddress: "",
    paymentMethod: "COD", // Mặc định là COD
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Lấy dữ liệu giỏ hàng để hiển thị tóm tắt
  useEffect(() => {
    const fetchCart = async () => {
      try {
        const response = await axiosClient.get("/carts");
        const items = response.data?.items || [];
        if (items.length === 0) {
          // Nếu giỏ hàng trống thì đá về trang sản phẩm
          navigate("/products");
        } else {
          setCartItems(items);
        }
      } catch (error) {
        console.error("Lỗi lấy giỏ hàng:", error);
      } finally {
        setLoadingCart(false);
      }
    };
    fetchCart();
  }, [navigate]);

  const subtotal = cartItems.reduce((acc, item) => {
    const price = item.variant?.prices?.[0]?.amount || 0;
    return acc + parseFloat(price) * item.quantity;
  }, 0);

  // Xử lý thay đổi input
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Hàm Đặt hàng
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await axiosClient.post("/orders/checkout", formData);
      const order = response.data;

      // Xử lý luồng thanh toán
      if (formData.paymentMethod === "COD") {
        // Đặt thành công COD -> Chuyển sang trang Cảm ơn
        navigate(`/order-success?orderId=${order.id}`);
      } else {
        // TODO: Nếu là VNPAY, gọi API tạo link thanh toán rồi redirect
        // const paymentRes = await axiosClient.post('/payments/vnpay-url', { orderId: order.id });
        // window.location.href = paymentRes.data.paymentUrl;
        alert("Chức năng thanh toán Online đang được tích hợp!");
        setIsSubmitting(false);
      }
    } catch (error: any) {
      alert(
        error.response?.data?.message || "Lỗi khi đặt hàng, vui lòng thử lại!",
      );
      setIsSubmitting(false);
    }
  };

  // Helper lấy ảnh
  const getDisplayImage = (item: any) => {
    const variantImg = item.variant?.images?.[0]?.url;
    const productImg = item.variant?.product?.images?.[0]?.url;
    const finalUrl = variantImg || productImg;
    return finalUrl ? `${BASE_URL}${finalUrl}` : "";
  };

  if (loadingCart) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-20">
      {/* BREADCRUMB NẰM CHUNG NỀN */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
        <nav className="flex text-sm text-gray-500 items-center gap-2">
          <Link to="/cart" className="hover:text-blue-600 transition-colors">
            Giỏ hàng
          </Link>
          <ChevronRight size={14} />
          <span className="text-gray-900 font-medium">Thanh toán</span>
        </nav>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-2 flex flex-col lg:flex-row gap-10">
        {/* CỘT TRÁI: FORM ĐIỀN THÔNG TIN */}
        <div className="lg:w-3/5 xl:w-2/3">
          <form
            id="checkout-form"
            onSubmit={handlePlaceOrder}
            className="space-y-8"
          >
            {/* THÔNG TIN GIAO HÀNG */}
            <div className="bg-white p-6 sm:p-8 rounded-lg border border-gray-200 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <MapPin className="text-blue-600" size={24} />
                Thông tin giao hàng
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Họ và tên người nhận
                  </label>
                  <input
                    type="text"
                    name="recipientName"
                    value={formData.recipientName}
                    onChange={handleChange}
                    required
                    placeholder=""
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-md focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    required
                    placeholder=""
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-md focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Địa chỉ nhận hàng (Số nhà, đường, Phường/Xã, Quận/Huyện...)
                  </label>
                  <textarea
                    name="shippingAddress"
                    value={formData.shippingAddress}
                    onChange={handleChange}
                    required
                    rows={3}
                    placeholder=""
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-md focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                  ></textarea>
                </div>
              </div>
            </div>

            {/* PHƯƠNG THỨC THANH TOÁN */}
            <div className="bg-white p-6 sm:p-8 rounded-lg border border-gray-200 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <CreditCard className="text-blue-600" size={24} />
                Phương thức thanh toán
              </h2>

              <div className="space-y-4">
                {/* Lựa chọn 1: COD */}
                <label
                  className={`flex items-start p-4 border rounded-lg cursor-pointer transition-all ${formData.paymentMethod === "COD" ? "border-blue-600 bg-blue-50/50 ring-1 ring-blue-600" : "border-gray-200 hover:border-gray-300"}`}
                >
                  <div className="flex items-center h-5">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="COD"
                      checked={formData.paymentMethod === "COD"}
                      onChange={handleChange}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="flex items-center gap-2">
                      <Banknote size={20} className="text-gray-600" />
                      <span className="block text-sm font-medium text-gray-900">
                        Thanh toán khi nhận hàng (COD)
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      Thanh toán bằng tiền mặt khi bưu tá giao hàng tới địa chỉ
                      của bạn.
                    </p>
                  </div>
                </label>

                {/* Lựa chọn 2: VNPAY / Online */}
                <label
                  className={`flex items-start p-4 border rounded-lg cursor-pointer transition-all ${formData.paymentMethod === "VNPAY" ? "border-blue-600 bg-blue-50/50 ring-1 ring-blue-600" : "border-gray-200 hover:border-gray-300"}`}
                >
                  <div className="flex items-center h-5">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="VNPAY"
                      checked={formData.paymentMethod === "VNPAY"}
                      onChange={handleChange}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="flex items-center gap-2">
                      <CreditCard size={20} className="text-gray-600" />
                      <span className="block text-sm font-medium text-gray-900">
                        Thanh toán Online (VNPay / Thẻ ATM)
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      Chuyển hướng đến cổng thanh toán an toàn để hoàn tất đơn
                      hàng.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </form>
        </div>

        {/* CỘT PHẢI: ORDER SUMMARY */}
        <div className="lg:w-2/5 xl:w-1/3 mt-8 lg:mt-0">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 sticky top-24">
            <h2 className="text-lg font-bold text-gray-900 mb-6 pb-4 border-b border-gray-100">
              Đơn hàng của bạn
            </h2>

            {/* Danh sách mini item */}
            <div className="space-y-4 mb-6 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
              {cartItems.map((item) => {
                const price = parseFloat(
                  item.variant?.prices?.[0]?.amount || 0,
                );
                const displayImage = getDisplayImage(item);
                return (
                  <div key={item.id} className="flex gap-4">
                    <div className="w-16 h-16 bg-gray-50 border border-gray-200 rounded-md overflow-hidden relative flex-shrink-0">
                      <img
                        src={displayImage}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute -top-2 -right-2 bg-gray-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold border-2 border-white">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      <p className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug">
                        {item.variant?.product?.productName}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {price.toLocaleString()}đ
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="space-y-3 text-sm text-gray-600 mb-6 border-t border-gray-100 pt-4">
              <div className="flex justify-between">
                <span>Tạm tính</span>
                <span className="font-medium text-gray-900">
                  {subtotal.toLocaleString()}đ
                </span>
              </div>
              <div className="flex justify-between">
                <span>Phí vận chuyển</span>
                <span className="font-medium text-green-600">Miễn phí</span>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-base font-bold text-gray-900">
                  Tổng thanh toán
                </span>
                <span className="text-2xl font-bold text-blue-600">
                  {subtotal.toLocaleString()}đ
                </span>
              </div>
            </div>

            {/* Sử dụng form="checkout-form" để kích hoạt submit của form bên cột trái */}
            <button
              type="submit"
              form="checkout-form"
              disabled={isSubmitting}
              className="w-full bg-blue-600 text-white py-4 px-4 rounded-md font-bold text-base hover:bg-blue-700 transition-colors shadow-sm flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  Đặt hàng ngay <ShieldCheck size={20} />
                </>
              )}
            </button>

            <p className="text-xs text-gray-500 mt-4 text-center">
              Bằng việc đặt hàng, bạn đồng ý với Điều khoản sử dụng và Chính
              sách bảo mật của chúng tôi.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
