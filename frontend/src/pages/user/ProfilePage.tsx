import { useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import {
  Camera,
  Lock,
  Store,
  ArrowLeft,
  ChevronRight,
  Loader2, // Thêm icon loading
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import axiosClient from "@/api/axiosClient"; // Đảm bảo import axiosClient

const ProfilePage = () => {
  const { user, setUser } = useAuthStore(); // Lấy setUser để cập nhật store sau khi update thành công
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // State quản lý form
  const [formData, setFormData] = useState({
    fullName: user?.fullName || "",
    phoneNumber: user?.phoneNumber || "",
    // address: user?.address || "",
  });

  const getInitials = (name: string) => name?.charAt(0).toUpperCase() || "U";

  // Hàm xử lý thay đổi input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  // Hàm gọi API Update
  const handleUpdateProfile = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      // Gọi API Patch: @Patch(':id')
      const response = await axiosClient.patch(`/users/${user.id}`, formData);

      // Cập nhật lại dữ liệu trong Store toàn cục
      setUser(response.data);

      setIsEditing(false);
      alert("Cập nhật hồ sơ thành công!");
    } catch (error: any) {
      console.error("Update error:", error);
      alert(error.response?.data?.message || "Có lỗi xảy ra khi cập nhật");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* TOP NAVIGATION BAR */}
      <div className="max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between">
        <Button
          variant="ghost"
          className="text-gray-500 hover:text-gray-900 font-semibold gap-2 px-0 hover:bg-transparent"
          onClick={() => navigate("/")}
        >
          <ArrowLeft size={18} /> Quay về trang chủ
        </Button>
      </div>

      <main className="max-w-6xl mx-auto w-full px-6 grid lg:grid-cols-12 gap-8 pt-4 pb-20">
        {/* LEFT COLUMN: TỔNG QUAN HỒ SƠ */}
        <div className="lg:col-span-4 space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Hồ sơ của tôi</h1>
            <p className="text-gray-500 text-sm">Quản lý thông tin cá nhân và bảo mật tài khoản.</p>
          </div>

          <div className="bg-white rounded-md p-8 border border-gray-200 shadow-sm flex flex-col items-center text-center">
            <div className="relative">
              <Avatar className="h-24 w-24 border-2 border-gray-100 shadow-sm">
                <AvatarFallback className="bg-gray-900 text-white text-3xl font-bold">
                  {getInitials(user?.fullName ?? "")}
                </AvatarFallback>
              </Avatar>
              <button className="absolute bottom-0 right-0 bg-white text-gray-900 p-2 rounded-full border border-gray-200 shadow-md hover:bg-gray-50">
                <Camera size={14} />
              </button>
            </div>

            <div className="mt-6 space-y-1">
              <h2 className="text-lg font-bold text-gray-900">{user?.fullName}</h2>
              <p className="text-sm text-gray-400">{user?.email}</p>
            </div>

            <div className="w-full h-px bg-gray-100 my-6" />

            <div className="w-full space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Vai trò</span>
                <span className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-md font-bold uppercase">
                  {user?.role}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: CHI TIẾT CÀI ĐẶT */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="rounded-md border border-gray-200 shadow-sm bg-white overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Thông tin chi tiết</h3>
              <Button
                variant="outline"
                onClick={() => setIsEditing(!isEditing)}
                className={`rounded-md font-semibold text-sm px-6 h-9 ${isEditing ? "border-red-200 text-red-600 hover:bg-red-50" : ""
                  }`}
              >
                {isEditing ? "Hủy bỏ" : "Chỉnh sửa"}
              </Button>
            </div>
            <CardContent className="p-8 space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="font-semibold text-gray-400 text-xs uppercase tracking-wider">Họ và tên</Label>
                  <Input
                    id="fullName"
                    disabled={!isEditing}
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="h-11 rounded-md border-gray-200 bg-gray-50/50 font-medium focus:bg-white outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold text-gray-400 text-xs uppercase tracking-wider">Email đăng ký</Label>
                  <Input
                    disabled
                    defaultValue={user?.email}
                    className="h-11 rounded-md border-gray-200 bg-gray-100 font-medium cursor-not-allowed text-gray-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber" className="font-semibold text-gray-400 text-xs uppercase tracking-wider">Số điện thoại</Label>
                  <Input
                    id="phoneNumber"
                    disabled={!isEditing}
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    placeholder="Chưa cập nhật"
                    className="h-11 rounded-md border-gray-200 bg-gray-50/50 font-medium focus:bg-white outline-none"
                  />
                </div>
                {/* <div className="space-y-2">
                  <Label htmlFor="address" className="font-semibold text-gray-400 text-xs uppercase tracking-wider">Địa chỉ nhận hàng</Label>
                  <Input
                    id="address"
                    disabled={!isEditing}
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Nhập địa chỉ của bạn"
                    className="h-11 rounded-md border-gray-200 bg-gray-50/50 font-medium focus:bg-white outline-none"
                  />
                </div> */}
              </div>

              {isEditing && (
                <Button
                  onClick={handleUpdateProfile}
                  disabled={loading}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-bold shadow-sm mt-4 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin" size={18} /> : "Cập nhật hồ sơ"}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* CÁC BOX CHỨC NĂNG KHÁC */}
          <div className="grid gap-3">
            <div
              onClick={() => navigate("/change-password")}
              className="p-5 bg-white rounded-md border border-gray-200 shadow-sm flex items-center justify-between group cursor-pointer hover:border-blue-300 transition-all active:scale-[0.98]"
            >
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-gray-50 rounded-md text-gray-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                  <Lock size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Mật khẩu</p>
                  <p className="text-xs text-gray-400">Thay đổi mật khẩu định kỳ để bảo mật</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-gray-300 group-hover:text-gray-600 transition-colors" />
            </div>

            {/* Hiển thị thêm box Quản lý nếu không phải user thường */}
            {user?.role !== "user" && (
              <div
                className="p-5 bg-white rounded-md border border-gray-200 shadow-sm flex items-center justify-between group cursor-pointer hover:border-emerald-300 transition-all active:scale-[0.98]"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-gray-50 rounded-md text-gray-600 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                    <Store size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 uppercase">
                      Quản lý {user?.role}
                    </p>
                    <p className="text-xs text-gray-400">
                      Cài đặt cửa hàng và vận chuyển
                    </p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-gray-300 group-hover:text-gray-600 transition-colors" />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;