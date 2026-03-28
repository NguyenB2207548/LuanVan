import React, { useState, useEffect } from "react";
import { Save, Truck, MapPin, Phone, Mail, CheckCircle2, Lock, AlertCircle, CreditCard } from "lucide-react";
import axiosClient from "../../api/axiosClient";
import { useAuthStore } from "../../store/useAuthStore";
import AddressSelector from "../../components/user/AddressSelector";
import toast, { Toaster } from "react-hot-toast";

const ShipperSettings = () => {
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        vehiclePlate: "",
        address: "", // ĐÃ ĐỔI TỪ shipperAddress -> address
    });

    // State cho địa chỉ mới từ API
    const [newAddress, setNewAddress] = useState({
        province: "",
        district: "",
        ward: "",
        addressDetail: "",
    });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await axiosClient.get("/users/shipper/profile");
                setFormData({
                    vehiclePlate: res.data.vehiclePlate || "",
                    address: res.data.address || "", // ĐỔI Ở ĐÂY
                });
            } catch (error) {
                console.error("Lỗi khi lấy thông tin shipper", error);
            }
        };
        fetchProfile();
    }, []);

    const handleAddressChange = (data: any) => {
        setNewAddress(data);
        setSuccess(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Kiểm tra thay đổi địa chỉ
        const isChangingAddress = newAddress.province || newAddress.district || newAddress.ward || newAddress.addressDetail;

        if (isChangingAddress) {
            if (!newAddress.province || !newAddress.district || !newAddress.ward || !newAddress.addressDetail) {
                return toast.error("Vui lòng hoàn tất việc chọn địa chỉ mới.");
            }
        }

        setLoading(true);
        try {
            const payload = {
                vehiclePlate: formData.vehiclePlate,
                ...(isChangingAddress ? newAddress : {})
            };

            await axiosClient.patch("/users/shipper/profile", payload);

            if (isChangingAddress) {
                // Gộp chuỗi để cập nhật hiển thị UI ngay lập tức
                const fullStr = `${newAddress.addressDetail}, ${newAddress.ward}, ${newAddress.district}, ${newAddress.province}`;
                setFormData(prev => ({ ...prev, address: fullStr }));
            }

            setSuccess(true);
            toast.success("Thông tin đã được cập nhật");
            setTimeout(() => setSuccess(false), 3000);
        } catch (error) {
            toast.error("Cập nhật thất bại, vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 font-sans text-gray-800">
            <Toaster position="top-right" />

            {/* Header */}
            <div className="flex justify-between items-end border-b border-gray-100 pb-4">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-800">Hồ sơ vận chuyển</h1>
                </div>
                {success && (
                    <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold bg-emerald-50 px-4 py-2 border border-emerald-100 rounded">
                        <CheckCircle2 size={14} /> HỆ THỐNG ĐÃ GHI NHẬN
                    </div>
                )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Thông tin vận hành */}
                <div className="bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                        <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                            <Truck size={14} /> Thông tin phương tiện & Khu vực
                        </h3>
                    </div>

                    <div className="p-6 space-y-8">
                        {/* Biển số xe */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                Biển số xe
                            </label>
                            <div className="relative">
                                <input
                                    value={formData.vehiclePlate}
                                    onChange={(e) => setFormData({ ...formData, vehiclePlate: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 text-sm text-gray-700 font-medium outline-none focus:border-gray-400 transition-all rounded-md"
                                    placeholder="Ví dụ: 59-A1 123.45"
                                    required
                                />
                                <CreditCard className="absolute left-3.5 top-3 text-gray-400" size={16} />
                            </div>
                        </div>

                        {/* Khu vực hoạt động hiện tại */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                Khu vực hoạt động hiện tại
                            </label>
                            <div className="flex items-start gap-3 p-3 bg-gray-50/50 border border-gray-200 rounded-md">
                                <MapPin className="text-gray-400 shrink-0 mt-0.5" size={16} />
                                <p className="text-sm text-gray-700 leading-snug font-medium">
                                    {formData.address || "Chưa cập nhật khu vực hoạt động"}
                                </p>
                            </div>
                        </div>

                        {/* Bộ chọn địa chỉ mới */}
                        <div className="pt-2">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="h-px bg-gray-100 flex-1"></div>
                                <span className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.2em]">Thay đổi địa chỉ hoạt động</span>
                                <div className="h-px bg-gray-100 flex-1"></div>
                            </div>
                            <AddressSelector onAddressChange={handleAddressChange} />
                            <p className="mt-3 text-[11px] text-gray-400 flex items-center gap-1.5 font-medium">
                                <AlertCircle size={12} /> Việc thay đổi địa chỉ có thể ảnh hưởng đến danh sách đơn hàng được đề xuất.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Thông tin tài khoản (ReadOnly) */}
                <div className="bg-white border border-gray-100 rounded-md opacity-70">
                    <div className="p-4 border-b border-gray-100">
                        <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                            <Lock size={14} /> Thông tin xác thực
                        </h3>
                    </div>

                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-gray-400 uppercase">Email đối tác</label>
                            <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                                <Mail size={14} className="text-gray-300" /> {user?.email}
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-gray-400 uppercase">Số điện thoại</label>
                            <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                                <Phone size={14} className="text-gray-300" /> {user?.phoneNumber || "N/A"}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Button */}
                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 px-10 py-3 bg-gray-800 text-white text-[11px] font-bold uppercase tracking-widest rounded-sm hover:bg-black transition-all disabled:bg-gray-300 shadow-sm"
                    >
                        {loading ? "Đang xử lý..." : <><Save size={16} /> Lưu thông tin</>}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ShipperSettings;