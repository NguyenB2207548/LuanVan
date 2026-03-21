import { useState } from "react";
import { PartnerRegisterLayout } from "../../components/user/PartnerRegisterLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Truck, Loader2, MapPin, CreditCard } from "lucide-react";
import axiosClient from "@/api/axiosClient";
import toast, { Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const RegisterShipperPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    requestedRole: "shipper",
    vehiclePlate: "",
    shipperAddress: "",
  });

  const handleRegister = async () => {
    if (!formData.vehiclePlate.trim() || !formData.shipperAddress.trim()) {
      return toast.error("Vui lòng nhập đầy đủ biển số xe và địa chỉ");
    }

    try {
      setLoading(true);
      await axiosClient.post("/approvals/request", formData);

      toast.success("Gửi yêu cầu thành công. Vui lòng chờ phê duyệt!");

      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (error: any) {
      const serverMessage = error.response?.data?.message;
      const errorMsg = Array.isArray(serverMessage) ? serverMessage[0] : serverMessage;
      toast.error(errorMsg || "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PartnerRegisterLayout
      title="Đăng ký giao hàng"
      description="Trở thành đối tác vận chuyển hỏa tốc, linh hoạt thời gian và gia tăng thu nhập mỗi ngày."
      accentColor="emerald"
    >
      <Toaster position="top-right" />

      <Card className="rounded-lg border border-gray-200 shadow-sm bg-white">
        <CardContent className="p-8 sm:p-10 space-y-6">
          {/* Section Header */}
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
            <Truck size={20} className="text-emerald-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Thông tin Shipper
            </h2>
          </div>

          <div className="space-y-5">
            {/* Biển số xe */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Biển số xe</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <CreditCard size={18} />
                </div>
                <Input
                  placeholder="Ví dụ: 59-A1 123.45"
                  value={formData.vehiclePlate}
                  onChange={(e) => setFormData({ ...formData, vehiclePlate: e.target.value })}
                  className="pl-10 h-11 rounded-md border-gray-300 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                />
              </div>
            </div>

            {/* Địa chỉ hoạt động */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Địa chỉ hoạt động</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <MapPin size={18} />
                </div>
                <Input
                  placeholder="Khu vực bạn muốn nhận đơn..."
                  value={formData.shipperAddress}
                  onChange={(e) => setFormData({ ...formData, shipperAddress: e.target.value })}
                  className="pl-10 h-11 rounded-md border-gray-300 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-4">
            <Button
              onClick={handleRegister}
              disabled={loading}
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-md shadow-sm transition-colors"
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
              * Hồ sơ của bạn sẽ được xem xét và phản hồi qua email/số điện thoại sớm nhất.
            </p>
          </div>
        </CardContent>
      </Card>
    </PartnerRegisterLayout>
  );
};

export default RegisterShipperPage;