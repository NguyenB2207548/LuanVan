import { PartnerRegisterLayout } from "../../components/user/PartnerRegisterLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Truck } from "lucide-react";

const RegisterShipperPage = () => {
  return (
    <PartnerRegisterLayout
      title="Đăng ký giao hàng"
      description="Trở thành đối tác vận chuyển hỏa tốc, linh hoạt thời gian và gia tăng thu nhập mỗi ngày."
      accentColor="emerald"
    >
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

          <div className="space-y-5">
            <div className="grid gap-2">
              <Label className="font-bold ml-1 text-slate-600">
                Số điện thoại
              </Label>
              <Input
                // placeholder="Nhập SĐT để nhận đơn"
                className="h-14 rounded-2xl border-slate-200 px-5 focus-visible:ring-emerald-500"
              />
            </div>
            <div className="grid gap-2">
              <Label className="font-bold ml-1 text-slate-600">
                Loại phương tiện
              </Label>
              <Input
                // placeholder="VD: Xe máy (Honda Vision...)"
                className="h-14 rounded-2xl border-slate-200 px-5"
              />
            </div>
            <div className="grid gap-2">
              <Label className="font-bold ml-1 text-slate-600">
                Khu vực hoạt động
              </Label>
              <Input
                // placeholder="Quận/Huyện muốn nhận đơn"
                className="h-14 rounded-2xl border-slate-200 px-5"
              />
            </div>
          </div>

          <Button className="w-full h-16 bg-emerald-600 hover:bg-emerald-700 rounded-2xl text-lg font-black shadow-xl shadow-emerald-100 transition-all active:scale-95">
            Đăng ký ngay
          </Button>
        </CardContent>
      </Card>
    </PartnerRegisterLayout>
  );
};

export default RegisterShipperPage;
