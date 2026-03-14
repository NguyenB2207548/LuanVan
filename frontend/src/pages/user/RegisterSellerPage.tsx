import { PartnerRegisterLayout } from "../../components/user/PartnerRegisterLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Store } from "lucide-react";

const RegisterSellerPage = () => {
  return (
    <PartnerRegisterLayout
      title="Đăng ký bán hàng"
      description="Mở gian hàng quà tặng của bạn và tiếp cận hàng triệu khách hàng tiềm năng ngay hôm nay."
      accentColor="blue"
    >
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

          <div className="space-y-5">
            <div className="grid gap-2">
              <Label className="font-bold ml-1 text-slate-600">
                Tên Shop của bạn
              </Label>
              <Input
                // placeholder="VD: Gift of Love"
                className="h-14 rounded-2xl border-slate-200 px-5"
              />
            </div>
            <div className="grid gap-2">
              <Label className="font-bold ml-1 text-slate-600">
                Mô tả ngắn
              </Label>
              <Input
                // placeholder="Chuyên cốc sứ thiết kế..."
                className="h-14 rounded-2xl border-slate-200 px-5"
              />
            </div>
            <div className="grid gap-2">
              <Label className="font-bold ml-1 text-slate-600">
                Địa chỉ lấy hàng
              </Label>
              <Input
                // placeholder="Địa chỉ kho của bạn"
                className="h-14 rounded-2xl border-slate-200 px-5"
              />
            </div>
          </div>

          <Button className="w-full h-16 bg-blue-600 hover:bg-blue-700 rounded-2xl text-lg font-black shadow-xl shadow-blue-100 transition-all active:scale-95">
            Đăng ký ngay
          </Button>
        </CardContent>
      </Card>
    </PartnerRegisterLayout>
  );
};

export default RegisterSellerPage;
