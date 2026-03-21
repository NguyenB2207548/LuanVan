import { useState } from "react";
import { PartnerRegisterLayout } from "../../components/user/PartnerRegisterLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Store, Loader2, MapPin } from "lucide-react"; // Thêm icon MapPin
import axiosClient from "@/api/axiosClient";
import toast, { Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const RegisterSellerPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    requestedRole: "seller",
    shopName: "",
    shopAddress: "",
  });

  const handleRegister = async () => {
    if (!formData.shopName.trim() || !formData.shopAddress.trim()) {
      return toast.error("Vui lòng nhập tên và địa chỉ shop");
    }

    try {
      setLoading(true);
      await axiosClient.post("/approvals/request", formData);

      toast.success("Gửi yêu cầu đăng ký thành công. Vui lòng chờ phê duyệt!");

      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (error: any) {
      const messages = error.response?.data?.message;
      const errorMsg = Array.isArray(messages) ? messages[0] : messages;
      toast.error(errorMsg || "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PartnerRegisterLayout
      title="Đăng ký bán hàng"
      description="Tham gia cộng đồng GiftShop để bắt đầu kinh doanh các sản phẩm quà tặng cá nhân hóa."
      accentColor="blue"
    >
      <Toaster position="top-right" />

      <Card className="rounded-lg border border-gray-200 shadow-sm bg-white">
        <CardContent className="p-8 sm:p-10 space-y-6">
          {/* Section Header */}
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
            <Store size={20} className="text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Thông tin cửa hàng
            </h2>
          </div>

          <div className="space-y-5">
            {/* Tên Shop */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Tên cửa hàng</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Store size={18} />
                </div>
                <Input
                  placeholder="Ví dụ: Tiệm Quà Handmade"
                  value={formData.shopName}
                  onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                  className="pl-10 h-11 rounded-md border-gray-300 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            {/* Địa chỉ */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Địa chỉ lấy hàng</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <MapPin size={18} />
                </div>
                <Input
                  placeholder="Số nhà, tên đường, phường/xã..."
                  value={formData.shopAddress}
                  onChange={(e) => setFormData({ ...formData, shopAddress: e.target.value })}
                  className="pl-10 h-11 rounded-md border-gray-300 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-4">
            <Button
              onClick={handleRegister}
              disabled={loading}
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow-sm transition-colors"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="animate-spin" size={18} />
                  <span>Đang xử lý...</span>
                </div>
              ) : (
                "Gửi yêu cầu đăng ký"
              )}
            </Button>
            <p className="text-center text-xs text-gray-500 mt-4 italic">
              * Thông tin của bạn sẽ được quản trị viên xem xét và phê duyệt trong vòng 24h.
            </p>
          </div>
        </CardContent>
      </Card>
    </PartnerRegisterLayout>
  );
};

export default RegisterSellerPage;