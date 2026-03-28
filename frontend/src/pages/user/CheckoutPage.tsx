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
import AddressSelector from "../../components/user/AddressSelector"; // Import component mới

const BASE_URL = "http://localhost:3000";

const CheckoutPage = () => {
  const navigate = useNavigate();

  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loadingCart, setLoadingCart] = useState(true);

  // CẬP NHẬT STATE FORM ĐỦ CÁC TRƯỜNG ĐỊA CHỈ
  const [formData, setFormData] = useState({
    recipientName: "",
    phoneNumber: "",
    province: "",
    district: "",
    ward: "",
    addressDetail: "",
    paymentMethod: "COD",
    shippingAddress: "", // Giữ lại để tránh lỗi logic nếu cần, nhưng Backend sẽ dùng 4 trường trên
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const response = await axiosClient.get("/carts");
        const items = response.data?.items || [];
        if (items.length === 0) {
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
    const price = item.variant?.price || 0;
    return acc + price * item.quantity;
  }, 0);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // HÀM XỬ LÝ KHI ĐỊA CHỈ THAY ĐỔI TỪ COMPONENT CON
  const handleAddressChange = (addressData: any) => {
    setFormData((prev) => ({
      ...prev,
      ...addressData,
    }));
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate địa chỉ đơn giản
    if (!formData.province || !formData.district || !formData.ward || !formData.addressDetail) {
      alert("Vui lòng nhập đầy đủ thông tin địa chỉ giao hàng.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Gửi formData chứa cả province, district, ward, addressDetail
      const response = await axiosClient.post("/orders/checkout", formData);
      const { orders, payUrl } = response.data;

      if (formData.paymentMethod === "MOMO" || formData.paymentMethod === "VNPAY") {
        if (payUrl) {
          window.location.href = payUrl;
        } else {
          alert("Lỗi: Không lấy được link thanh toán.");
          setIsSubmitting(false);
        }
      } else {
        const firstOrderId = orders[0]?.id;
        navigate(`/order-success?orderId=${firstOrderId}`);
      }
    } catch (error: any) {
      alert(error.response?.data?.message || "Lỗi khi đặt hàng, vui lòng thử lại!");
      setIsSubmitting(false);
    }
  };

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
        <nav className="flex text-sm text-gray-500 items-center gap-2">
          <Link to="/cart" className="hover:text-blue-600 transition-colors">Giỏ hàng</Link>
          <ChevronRight size={14} />
          <span className="text-gray-900 font-medium">Thanh toán</span>
        </nav>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-2 flex flex-col lg:flex-row gap-10">
        <div className="lg:w-3/5 xl:w-2/3">
          <form id="checkout-form" onSubmit={handlePlaceOrder} className="space-y-8">
            <div className="bg-white p-6 sm:p-8 rounded-lg border border-gray-200 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <MapPin className="text-blue-600" size={24} />
                Thông tin giao hàng
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Họ và tên người nhận</label>
                  <input
                    type="text"
                    name="recipientName"
                    value={formData.recipientName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-md focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Số điện thoại</label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-md focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>

                {/* THAY THẾ TEXTAREA BẰNG BỘ CHỌN ĐỊA CHỈ API */}
                <div className="sm:col-span-2 mt-2">
                  <AddressSelector onAddressChange={handleAddressChange} />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-lg border border-gray-200 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <CreditCard className="text-blue-600" size={24} />
                Phương thức thanh toán
              </h2>

              <div className="space-y-4">
                <label className={`flex items-start p-4 border rounded-lg cursor-pointer transition-all ${formData.paymentMethod === "COD" ? "border-blue-600 bg-blue-50/50 ring-1 ring-blue-600" : "border-gray-200 hover:border-gray-300"}`}>
                  <div className="flex items-center h-5">
                    <input type="radio" name="paymentMethod" value="COD" checked={formData.paymentMethod === "COD"} onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })} className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="flex items-center gap-2">
                      <Banknote size={20} className="text-gray-600" />
                      <span className="block text-sm font-medium text-gray-900">Thanh toán khi nhận hàng (COD)</span>
                    </div>
                  </div>
                </label>

                <label className={`flex items-start p-4 border rounded-lg cursor-pointer transition-all ${formData.paymentMethod === "VNPAY" ? "border-blue-600 bg-blue-50/50 ring-1 ring-blue-600" : "border-gray-200 hover:border-gray-300"}`}>
                  <div className="flex items-center h-5">
                    <input type="radio" name="paymentMethod" value="VNPAY" checked={formData.paymentMethod === "VNPAY"} onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })} className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="flex items-center gap-2">
                      <CreditCard size={20} className="text-gray-600" />
                      <span className="block text-sm font-medium text-gray-900">Thanh toán Online (VNPay / Thẻ ATM)</span>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </form>
        </div>

        <div className="lg:w-2/5 xl:w-1/3 mt-8 lg:mt-0">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 sticky top-24">
            <h2 className="text-lg font-bold text-gray-900 mb-6 pb-4 border-b border-gray-100">Đơn hàng của bạn</h2>
            <div className="space-y-4 mb-6 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
              {cartItems.map((item) => (
                <div key={item.id} className="flex gap-4">
                  <div className="w-16 h-16 rounded border border-gray-100 overflow-hidden shrink-0">
                    <img src={getDisplayImage(item)} className="w-full h-full object-cover" alt="" />
                  </div>
                  <div className="flex-1 flex flex-col justify-center text-sm">
                    <p className="font-medium text-gray-900 line-clamp-2">{item.variant?.product?.productName}</p>
                    <p className="text-[11px] text-gray-400 uppercase font-semibold">
                      {item.variant?.attributeValues?.map((v: any) => v.valueName).join(" / ")}
                    </p>
                    <p className="text-gray-500 mt-1">{(item.variant?.price || 0).toLocaleString()}đ x {item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3 text-sm text-gray-600 mb-6 border-t border-gray-100 pt-4">
              <div className="flex justify-between">
                <span>Tạm tính</span>
                <span className="font-medium text-gray-900">{subtotal.toLocaleString()}đ</span>
              </div>
              <div className="flex justify-between">
                <span>Phí vận chuyển</span>
                <span className="font-medium text-green-600">Miễn phí</span>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4 mb-6 flex justify-between items-center">
              <span className="text-base font-bold text-gray-900">Tổng thanh toán</span>
              <span className="text-2xl font-bold text-blue-600">{subtotal.toLocaleString()}đ</span>
            </div>

            <button
              type="submit"
              form="checkout-form"
              disabled={isSubmitting}
              className="w-full bg-blue-600 text-white py-4 rounded-md font-bold hover:bg-blue-700 transition-colors flex justify-center items-center gap-2 disabled:opacity-70"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <>Đặt hàng ngay <ShieldCheck size={20} /></>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;