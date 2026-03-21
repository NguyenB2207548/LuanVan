import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Mail,
    Lock,
    Eye,
    EyeOff,
    ArrowLeft,
    Loader2,
    ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import axiosClient from "@/api/axiosClient";

const ForgotPasswordPage = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: Nhập email, 2: Nhập pass mới
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);

    const [formData, setFormData] = useState({
        email: "",
        newPassword: "",
        confirmPassword: "",
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData((prev) => ({ ...prev, [id]: value }));
    };

    // Xử lý gửi yêu cầu reset (Bước 1)
    const handleVerifyEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Giả sử API kiểm tra email tồn tại
            // await axiosClient.post("/users/check-email", { email: formData.email });
            setStep(2);
        } catch (error: any) {
            alert(error.response?.data?.message || "Email không tồn tại trong hệ thống");
        } finally {
            setLoading(false);
        }
    };

    // Xử lý đặt lại mật khẩu (Bước 2)
    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.newPassword !== formData.confirmPassword) {
            alert("Mật khẩu không khớp!");
            return;
        }

        setLoading(true);
        try {
            await axiosClient.post("/users/reset-password", {
                email: formData.email,
                newPassword: formData.newPassword,
            });
            alert("Mật khẩu đã được thay đổi thành công!");
            navigate("/login");
        } catch (error: any) {
            alert(error.response?.data?.message || "Có lỗi xảy ra");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            {/* Back Button */}
            <div className="max-w-4xl mx-auto w-full px-6 py-8">
                <Button
                    variant="ghost"
                    className="text-gray-500 hover:text-gray-900 font-semibold gap-2 px-0 hover:bg-transparent"
                    onClick={() => (step === 1 ? navigate("/login") : setStep(1))}
                >
                    <ArrowLeft size={18} /> {step === 1 ? "Quay lại đăng nhập" : "Quay lại bước trước"}
                </Button>
            </div>

            <main className="max-w-lg mx-auto w-full px-6 pb-20">
                <div className="text-center mb-8 space-y-2">
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                        {step === 1 ? "Quên mật khẩu?" : "Thiết lập mật khẩu mới"}
                    </h1>
                    <p className="text-sm text-gray-500">
                        {step === 1
                            ? "Nhập email của bạn để bắt đầu quá trình khôi phục."
                            : "Vui lòng nhập mật khẩu mới cho tài khoản " + formData.email}
                    </p>
                </div>

                <Card className="rounded-md border border-gray-200 shadow-sm bg-white overflow-hidden">
                    <CardContent className="p-8">
                        {step === 1 ? (
                            /* FORM BƯỚC 1: NHẬP EMAIL */
                            <form onSubmit={handleVerifyEmail} className="space-y-5">
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                                        Email tài khoản
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="vidu@gmail.com"
                                            required
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            className="h-11 rounded-md border-gray-200 bg-gray-50/50 pl-10 focus:bg-white outline-none"
                                        />
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    </div>
                                </div>
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-bold flex items-center justify-center gap-2 transition-all"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={18} /> : "Tiếp tục"}
                                    {!loading && <ChevronRight size={18} />}
                                </Button>
                            </form>
                        ) : (
                            /* FORM BƯỚC 2: NHẬP PASS MỚI */
                            <form onSubmit={handleResetPassword} className="space-y-5">
                                <div className="space-y-2">
                                    <Label htmlFor="newPassword" className="text-sm font-medium text-gray-700">
                                        Mật khẩu mới
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="newPassword"
                                            type={showPass ? "text" : "password"}
                                            required
                                            value={formData.newPassword}
                                            onChange={handleInputChange}
                                            className="h-11 rounded-md border-gray-200 bg-gray-50/50 pr-10 focus:bg-white outline-none"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPass(!showPass)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                                        Xác nhận mật khẩu mới
                                    </Label>
                                    <Input
                                        id="confirmPassword"
                                        type={showPass ? "text" : "password"}
                                        required
                                        value={formData.confirmPassword}
                                        onChange={handleInputChange}
                                        className="h-11 rounded-md border-gray-200 bg-gray-50/50 focus:bg-white outline-none"
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-bold transition-all flex items-center justify-center gap-2"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={18} /> : "Xác nhận thay đổi"}
                                </Button>
                            </form>
                        )}
                    </CardContent>
                </Card>

                <div className="mt-8 text-center">
                    <p className="text-xs text-gray-400">
                        Bạn gặp khó khăn? Liên hệ <span className="text-blue-600 font-medium cursor-pointer hover:underline">Hỗ trợ khách hàng</span>
                    </p>
                </div>
            </main>
        </div>
    );
};

export default ForgotPasswordPage;