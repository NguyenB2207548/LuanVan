import { useState } from "react";
import { PartnerRegisterLayout } from "../../components/user/PartnerRegisterLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Store, Loader2 } from "lucide-react";
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

      // Thông báo thành công
      toast.success("Đăng ký thành công");

      // Chuyển hướng về trang chủ sau 1.5 giây để user kịp nhìn thấy toast
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
      description="Mở gian hàng quà tặng của bạn và tiếp cận hàng triệu khách hàng tiềm năng ngay hôm nay."
      accentColor="blue"
    >
      <Toaster position="top-right" /> {/* Đảm bảo Toast hiện ở góc trên bên phải */}
      <Card className="rounded-[3rem] border-none shadow-2xl bg-white p-2">
        <CardContent className="p-10 space-y-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg shadow-blue-200">
              <Store size={24} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Thông tin cửa hàng
            </h2>
          </div>

          <div className="space-y-5 mt-5">
            <div className="grid gap-2">
              <Label className="font-bold ml-1 text-slate-600">Tên Shop của bạn</Label>
              <Input
                value={formData.shopName}
                onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                className="h-14 rounded-2xl border-slate-200 px-5"
              />
            </div>
            <div className="grid gap-2">
              <Label className="font-bold ml-1 text-slate-600">Địa chỉ lấy hàng</Label>
              <Input
                value={formData.shopAddress}
                onChange={(e) => setFormData({ ...formData, shopAddress: e.target.value })}
                className="h-14 rounded-2xl border-slate-200 px-5"
              />
            </div>
          </div>

          <Button
            onClick={handleRegister}
            disabled={loading}
            className="w-full h-16 bg-blue-600 hover:bg-blue-700 rounded-2xl text-lg font-black shadow-xl shadow-blue-100 transition-all active:scale-95"
          >
            {loading ? <Loader2 className="animate-spin" /> : "Đăng ký ngay"}
          </Button>
        </CardContent>
      </Card>
    </PartnerRegisterLayout>
  );
};

export default RegisterSellerPage;