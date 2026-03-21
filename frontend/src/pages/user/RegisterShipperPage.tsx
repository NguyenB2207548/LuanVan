import { useState } from "react";
import { PartnerRegisterLayout } from "../../components/user/PartnerRegisterLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Truck, Loader2 } from "lucide-react";
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

      toast.success("Đăng ký thành công");

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
      <Card className="rounded-[3rem] border-none shadow-2xl bg-white p-2">
        <CardContent className="p-10 space-y-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="bg-emerald-600 p-3 rounded-2xl text-white shadow-lg shadow-emerald-200">
              <Truck size={24} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Thông tin Shipper
            </h2>
          </div>

          <div className="space-y-5 mt-5">
            <div className="grid gap-2">
              <Label className="font-bold ml-1 text-slate-600">Biển số xe</Label>
              <Input
                value={formData.vehiclePlate}
                onChange={(e) => setFormData({ ...formData, vehiclePlate: e.target.value })}
                className="h-14 rounded-2xl border-slate-200 px-5 focus-visible:ring-emerald-500"
              />
            </div>
            <div className="grid gap-2">
              <Label className="font-bold ml-1 text-slate-600">Địa chỉ hoạt động</Label>
              <Input
                value={formData.shipperAddress}
                onChange={(e) => setFormData({ ...formData, shipperAddress: e.target.value })}
                className="h-14 rounded-2xl border-slate-200 px-5 focus-visible:ring-emerald-500"
              />
            </div>
          </div>

          <Button
            onClick={handleRegister}
            disabled={loading}
            className="w-full h-16 bg-emerald-600 hover:bg-emerald-700 rounded-2xl text-lg font-black shadow-xl shadow-emerald-100 transition-all active:scale-95"
          >
            {loading ? <Loader2 className="animate-spin" /> : "Đăng ký ngay"}
          </Button>
        </CardContent>
      </Card>
    </PartnerRegisterLayout>
  );
};

export default RegisterShipperPage;