import React, { useState, useEffect } from "react";
import {
  Save,
  Store,
  MapPin,
  Phone,
  Mail,
  CheckCircle2,
  Lock,
  AlertCircle,
} from "lucide-react";
import axiosClient from "../../api/axiosClient";
import { useAuthStore } from "../../store/useAuthStore";
import AddressSelector from "../../components/user/AddressSelector"; // Import component địa chỉ chuẩn
import { Toaster } from "react-hot-toast";
import { showErrorToast, showSuccessToast } from "@/components/common/toast";

const SellerSettings = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    shopName: "",
    shopAddress: "", // Đây là địa chỉ cũ từ DB (dạng chuỗi)
  });

  // State riêng cho địa chỉ mới từ AddressSelector
  const [newAddress, setNewAddress] = useState({
    province: "",
    district: "",
    ward: "",
    addressDetail: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axiosClient.get("/users/seller/profile");
        setFormData({
          shopName: res.data.shopName || "",
          shopAddress: res.data.shopAddress || "",
        });
      } catch (error) {
        console.error("Lỗi khi lấy thông tin cửa hàng", error);
      }
    };
    fetchProfile();
  }, []);

  const handleAddressChange = (data: any) => {
    setNewAddress(data);
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Kiểm tra nếu Seller muốn đổi địa chỉ thì phải chọn đủ 4 trường
    const isChangingAddress =
      newAddress.province ||
      newAddress.district ||
      newAddress.ward ||
      newAddress.addressDetail;

    if (isChangingAddress) {
      if (
        !newAddress.province ||
        !newAddress.district ||
        !newAddress.ward ||
        !newAddress.addressDetail
      ) {
        return showErrorToast(
          "Nếu muốn thay đổi địa chỉ, vui lòng chọn đầy đủ các cấp hành chính.",
        );
      }
    }

    setLoading(true);
    try {
      const payload = {
        shopName: formData.shopName,
        // Chỉ gửi địa chỉ mới lên nếu có sự thay đổi
        ...(isChangingAddress ? newAddress : {}),
      };

      await axiosClient.patch("/users/seller/profile", payload);

      // Cập nhật lại hiển thị địa chỉ cũ sau khi lưu thành công
      if (isChangingAddress) {
        const fullStr = `${newAddress.addressDetail}, ${newAddress.ward}, ${newAddress.district}, ${newAddress.province}`;
        setFormData((prev) => ({ ...prev, shopAddress: fullStr }));
      }

      setSuccess(true);
      showSuccessToast("Cập nhật thông tin thành công");
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      showErrorToast("Cập nhật thất bại, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans">
      <Toaster position="top-right" />

      <div className="flex justify-between items-end border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">
            Cài đặt cửa hàng
          </h1>
        </div>
        {success && (
          <div className="flex items-center gap-2 text-emerald-600 text-sm font-bold bg-emerald-50 px-4 py-2 border border-emerald-100 rounded">
            <CheckCircle2 size={16} /> Đã cập nhật thành công
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
              <Store size={14} /> Cấu hình hiển thị
            </h3>
          </div>

          <div className="p-6 space-y-8">
            {/* Tên cửa hàng */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                Tên cửa hàng
              </label>
              <div className="relative">
                <input
                  name="shopName"
                  value={formData.shopName}
                  onChange={(e) =>
                    setFormData({ ...formData, shopName: e.target.value })
                  }
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 text-sm text-gray-700 font-medium outline-none focus:border-gray-400 transition-all rounded-md"
                  placeholder="Tên shop hiển thị với khách hàng"
                  required
                />
                <Store
                  className="absolute left-3.5 top-3 text-gray-400"
                  size={16}
                />
              </div>
            </div>

            {/* Địa chỉ hiện tại */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                Địa chỉ lấy hàng hiện tại
              </label>
              <div className="flex items-start gap-3 p-3 bg-gray-50/50 border border-gray-200 rounded-md">
                <MapPin className="text-gray-400 shrink-0 mt-0.5" size={16} />
                <p className="text-sm text-gray-700 leading-snug font-medium">
                  {formData.shopAddress || "Chưa có thông tin địa chỉ"}
                </p>
              </div>
            </div>

            {/* Bộ chọn địa chỉ mới */}
            <div className="pt-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-px bg-gray-100 flex-1"></div>
                <span className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.2em]">
                  Thay đổi địa chỉ
                </span>
                <div className="h-px bg-gray-100 flex-1"></div>
              </div>
              <AddressSelector onAddressChange={handleAddressChange} />
              <p className="mt-3 text-[11px] text-gray-400 flex items-center gap-1.5">
                <AlertCircle size={12} /> Để nguyên nếu không muốn thay đổi địa
                chỉ lấy hàng.
              </p>
            </div>
          </div>
        </div>

        {/* Thông tin tài khoản (Read-only) */}
        <div className="bg-white border border-gray-100 rounded-md opacity-70">
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
              <Lock size={14} /> Thông tin tài khoản hệ thống
            </h3>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-400 uppercase">
                Email
              </label>
              <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                <Mail size={14} className="text-gray-300" /> {user?.email}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-400 uppercase">
                Số điện thoại
              </label>
              <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                <Phone size={14} className="text-gray-300" />{" "}
                {user?.phoneNumber || "N/A"}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-10 py-3 bg-gray-800 text-white text-[11px] font-bold uppercase tracking-widest rounded-sm hover:bg-black transition-all disabled:bg-gray-300 shadow-sm"
          >
            {loading ? (
              "Đang xử lý..."
            ) : (
              <>
                <Save size={16} /> Lưu thay đổi
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SellerSettings;
