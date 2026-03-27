import React, { useState, useEffect } from "react";
import { Save, Store, MapPin, Phone, Mail, Info, CheckCircle2, Lock } from "lucide-react";
import axiosClient from "../../api/axiosClient";
import { useAuthStore } from "../../store/useAuthStore"; // Giả định bạn dùng store này để lấy info user

const SellerSettings = () => {
    const { user } = useAuthStore(); // Lấy thông tin user hiện tại
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({
        shopName: "",
        shopAddress: "",
    });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await axiosClient.get("/users/seller/profile");
                // Chỉ set các field mà backend cho phép update
                setFormData({
                    shopName: res.data.shopName || "",
                    shopAddress: res.data.shopAddress || "",
                });
            } catch (error) {
                console.error("Lỗi khi lấy thông tin cửa hàng", error);
            }
        };
        fetchProfile();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setSuccess(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Chỉ gửi shopName và shopAddress lên Backend
            await axiosClient.patch("/users/seller/profile", formData);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (error) {
            alert("Cập nhật thất bại, vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Cài đặt cửa hàng</h1>
                </div>
                {success && (
                    <div className="flex items-center gap-2 text-green-600 text-sm font-bold bg-green-50 px-4 py-2 border border-green-200">
                        <CheckCircle2 size={16} /> Đã cập nhật thành công
                    </div>
                )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Phần 1: Thông tin có thể chỉnh sửa */}
                <div className="bg-white border border-gray-200 shadow-sm">
                    <div className="p-4 border-b border-gray-100 bg-gray-50">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-600 flex items-center gap-2">
                            <Store size={14} /> Cấu hình hiển thị
                        </h3>
                    </div>

                    <div className="p-6 space-y-6">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-gray-600 uppercase">Tên cửa hàng</label>
                            <div className="relative">
                                <input
                                    name="shopName"
                                    value={formData.shopName}
                                    onChange={handleChange}
                                    className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 text-sm outline-none focus:border-blue-600 transition-colors"
                                    placeholder="Tên shop hiển thị với khách hàng"
                                    required
                                />
                                <Store className="absolute left-3 top-2.5 text-gray-400" size={16} />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-gray-600 uppercase">Địa chỉ lấy hàng / Liên hệ</label>
                            <div className="relative">
                                <input
                                    name="shopAddress"
                                    value={formData.shopAddress}
                                    onChange={handleChange}
                                    className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 text-sm outline-none focus:border-blue-600 transition-colors"
                                    placeholder="Địa chỉ chi tiết..."
                                    required
                                />
                                <MapPin className="absolute left-3 top-2.5 text-gray-400" size={16} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Phần 2: Thông tin hệ thống (Read-only) */}
                <div className="bg-gray-50 border border-gray-200 shadow-sm opacity-80">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-600 flex items-center gap-2">
                            <Lock size={14} /> Thông tin tài khoản
                        </h3>

                    </div>

                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-gray-600 uppercase">Email tài khoản</label>
                            <div className="relative">
                                <input
                                    value={user?.email || ""}
                                    disabled
                                    className="w-full pl-9 pr-4 py-2 bg-gray-100 border border-gray-200 text-sm text-gray-500 cursor-not-allowed"
                                />
                                <Mail className="absolute left-3 top-2.5 text-gray-500" size={16} />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-gray-600 uppercase">Số điện thoại</label>
                            <div className="relative">
                                <input
                                    value={user?.phoneNumber || "Chưa cập nhật"}
                                    disabled
                                    className="w-full pl-9 pr-4 py-2 bg-gray-100 border border-gray-200 text-sm text-gray-500 cursor-not-allowed"
                                />
                                <Phone className="absolute left-3 top-2.5 text-gray-500" size={16} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 px-8 py-3 bg-gray-900 text-white text-xs font-bold uppercase hover:bg-black transition-all disabled:bg-gray-400 shadow-lg"
                    >
                        {loading ? "Đang lưu..." : <><Save size={16} /> Lưu thay đổi</>}
                    </button>
                </div>
            </form>

        </div>
    );
};

export default SellerSettings;