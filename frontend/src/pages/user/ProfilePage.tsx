import { useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import {
  ShieldCheck,
  Camera,
  History,
  User,
  Lock,
  Store,
  ArrowLeft,
  Mail,
  MapPin,
  Smartphone,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

const ProfilePage = () => {
  const { user } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();

  const getInitials = (name: string) => name?.charAt(0).toUpperCase() || "U";

  return (
    <div className="min-h-screen bg-[#fcfcfd] flex flex-col">
      {/* TOP NAVIGATION BAR */}
      <div className="max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between">
        <Button
          variant="ghost"
          className="text-slate-500 hover:text-slate-900 font-bold gap-2"
          onClick={() => navigate("/")}
        >
          <ArrowLeft size={18} /> Quay về trang chủ
        </Button>
      </div>

      <main className="max-w-6xl mx-auto w-full px-6 grid lg:grid-cols-12 gap-12 pt-4 pb-20">
        {/* LEFT COLUMN: TỔNG QUAN HỒ SƠ */}
        <div className="lg:col-span-4 space-y-8">
          <div className="space-y-2">
            <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight">
              Hồ sơ
            </h1>
            <p className="text-slate-400 font-medium">
              Quản lý thông tin cá nhân và bảo mật tài khoản của bạn.
            </p>
          </div>

          {/* User Card - Giảm Radius xuống cho hiện đại */}
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex flex-col items-center text-center">
            <div className="relative group">
              <Avatar className="h-24 w-24 border-4 border-white shadow-xl">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback className="bg-slate-900 text-white text-3xl font-bold">
                  {getInitials(user?.fullName)}
                </AvatarFallback>
              </Avatar>
              <button className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full border-2 border-white shadow-lg hover:scale-110 transition-transform">
                <Camera size={14} />
              </button>
            </div>

            <div className="mt-6 space-y-1">
              <h2 className="text-xl font-bold text-slate-900">
                {user?.fullName}
              </h2>
              <p className="text-sm text-slate-400 font-medium">
                {user?.email}
              </p>
            </div>

            <div className="w-full h-px bg-slate-50 my-6" />

            <div className="w-full space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-bold uppercase tracking-wider">
                  Vai trò
                </span>
                <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-bold">
                  {user?.role?.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-bold uppercase tracking-wider">
                  Trạng thái
                </span>
                <span className="flex items-center gap-1 text-emerald-600 font-bold">
                  <ShieldCheck size={14} /> Đã xác minh
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-3 text-slate-500 text-sm font-medium">
              <History size={16} /> Gia nhập từ tháng 3, 2026
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: CHI TIẾT CÀI ĐẶT (Thay thế Tabs) */}
        <div className="lg:col-span-8 space-y-6">
          {/* SECTION: THÔNG TIN CÁ NHÂN */}
          <Card className="rounded-3xl border-none shadow-sm bg-white overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900">
                Thông tin chi tiết
              </h3>
              <Button
                variant={isEditing ? "destructive" : "outline"}
                onClick={() => setIsEditing(!isEditing)}
                className="rounded-xl font-bold px-6"
              >
                {isEditing ? "Hủy" : "Chỉnh sửa"}
              </Button>
            </div>
            <CardContent className="p-8 space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="font-bold text-slate-400 text-xs uppercase tracking-widest ml-1">
                    Họ và tên
                  </Label>
                  <Input
                    disabled={!isEditing}
                    defaultValue={user?.fullName}
                    className="h-12 rounded-xl border-slate-100 bg-slate-50/50 font-bold focus:bg-white transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-slate-400 text-xs uppercase tracking-widest ml-1">
                    Số điện thoại
                  </Label>
                  <Input
                    disabled={!isEditing}
                    placeholder="Chưa cập nhật"
                    className="h-12 rounded-xl border-slate-100 bg-slate-50/50 font-bold focus:bg-white transition-all"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="font-bold text-slate-400 text-xs uppercase tracking-widest ml-1">
                    Địa chỉ giao hàng
                  </Label>
                  <Input
                    disabled={!isEditing}
                    placeholder="Nhập địa chỉ nhận quà của bạn"
                    className="h-12 rounded-xl border-slate-100 bg-slate-50/50 font-bold focus:bg-white transition-all"
                  />
                </div>
              </div>

              {isEditing && (
                <Button className="w-full h-14 bg-slate-900 hover:bg-black text-white rounded-xl font-bold transition-all shadow-lg">
                  Lưu thay đổi hồ sơ
                </Button>
              )}
            </CardContent>
          </Card>

          {/* SECTION: BẢO MẬT & TÀI KHOẢN */}
          <div className="grid gap-4">
            <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group cursor-pointer hover:border-blue-200 transition-all">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
                  <Lock size={20} />
                </div>
                <div>
                  <p className="font-bold text-slate-900">Mật khẩu</p>
                  <p className="text-sm text-slate-400">
                    Cập nhật mật khẩu để bảo vệ tài khoản
                  </p>
                </div>
              </div>
              <ChevronRight className="text-slate-300 group-hover:text-blue-600 transition-colors" />
            </div>

            {user?.role !== "user" && (
              <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group cursor-pointer hover:border-emerald-200 transition-all">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
                    <Store size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">
                      Thông tin đối tác
                    </p>
                    <p className="text-sm text-slate-400">
                      Quản lý các thông tin về quyền {user?.role}
                    </p>
                  </div>
                </div>
                <ChevronRight className="text-slate-300 group-hover:text-emerald-600 transition-colors" />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;
