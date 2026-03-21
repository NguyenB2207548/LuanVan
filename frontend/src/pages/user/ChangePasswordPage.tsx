import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import {
    Eye,
    EyeOff,
    ArrowLeft,
    Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import axiosClient from "@/api/axiosClient";

const ChangePasswordPage = () => {
    const { user } = useAuthStore();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [showPasswords, setShowPasswords] = useState({
        old: false,
        new: false,
        confirm: false,
    });

    const [formData, setFormData] = useState({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData((prev) => ({ ...prev, [id]: value }));
    };

    const toggleVisibility = (field: keyof typeof showPasswords) => {
        setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        // Kiểm tra mật khẩu khớp nhau
        if (formData.newPassword !== formData.confirmPassword) {
            alert("Mật khẩu mới và nhập lại mật khẩu không khớp!");
            return;
        }

        if (formData.newPassword.length < 6) {
            alert("Mật khẩu mới phải có ít nhất 6 ký tự!");
            return;
        }

        setLoading(true);
        try {
            // Giả sử API của bạn là PATCH /users/change-password hoặc tương tự
            await axiosClient.patch(`/users/change-password/${user?.id}`, {
                oldPassword: formData.oldPassword,
                newPassword: formData.newPassword,
            });

            alert("Thay đổi mật khẩu thành công!");
            navigate("/profile");
        } catch (error: any) {
            alert(error.response?.data?.message || "Mật khẩu cũ không chính xác");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            {/* Top Bar */}
            <div className="max-w-4xl mx-auto w-full px-6 py-8">
                <Button
                    variant="ghost"
                    className="text-gray-500 hover:text-gray-900 font-semibold gap-2 px-0 hover:bg-transparent"
                    onClick={() => navigate("/profile")}
                >
                    <ArrowLeft size={18} /> Quay lại hồ sơ
                </Button>
            </div>

            <main className="max-w-lg mx-auto w-full px-6 pb-20">
                <div className="text-center mb-8 space-y-2">
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                        Thay đổi mật khẩu
                    </h1>
                </div>

                <Card className="rounded-md border border-gray-200 shadow-sm bg-white overflow-hidden">
                    <CardContent className="p-8">
                        <form onSubmit={handleChangePassword} className="space-y-5">

                            {/* Mật khẩu cũ */}
                            <div className="space-y-2">
                                <Label htmlFor="oldPassword" className="text-sm font-medium text-gray-700">
                                    Mật khẩu hiện tại
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="oldPassword"
                                        type={showPasswords.old ? "text" : "password"}
                                        required
                                        value={formData.oldPassword}
                                        onChange={handleInputChange}
                                        className="h-11 rounded-md border-gray-200 bg-gray-50/50 pr-10 focus:bg-white outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => toggleVisibility("old")}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPasswords.old ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                <div className="flex justify-end">
                                    <button
                                        type="button"
                                        onClick={() => navigate("/forgot-password")}
                                        className="text-xs font-medium text-blue-600 hover:underline mt-1"
                                    >
                                        Quên mật khẩu?
                                    </button>
                                </div>
                            </div>

                            <div className="h-px bg-gray-100 my-2" />

                            {/* Mật khẩu mới */}
                            <div className="space-y-2">
                                <Label htmlFor="newPassword" className="text-sm font-medium text-gray-700">
                                    Mật khẩu mới
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="newPassword"
                                        type={showPasswords.new ? "text" : "password"}
                                        required
                                        value={formData.newPassword}
                                        onChange={handleInputChange}
                                        className="h-11 rounded-md border-gray-200 bg-gray-50/50 pr-10 focus:bg-white outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => toggleVisibility("new")}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPasswords.new ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            {/* Nhập lại mật khẩu mới */}
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                                    Xác nhận mật khẩu mới
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="confirmPassword"
                                        type={showPasswords.confirm ? "text" : "password"}
                                        required
                                        value={formData.confirmPassword}
                                        onChange={handleInputChange}
                                        className="h-11 rounded-md border-gray-200 bg-gray-50/50 pr-10 focus:bg-white outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => toggleVisibility("confirm")}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPasswords.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-bold shadow-sm mt-4 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                            >
                                {loading ? <Loader2 className="animate-spin" size={18} /> : "Xác nhận đổi mật khẩu"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
};

export default ChangePasswordPage;