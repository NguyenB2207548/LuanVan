import { useEffect, useState } from "react";
import { useAuthStore } from "../../store/useAuthStore";
import axiosClient from "../../api/axiosClient";
import { Loader2 } from "lucide-react";

const AuthInitialize = ({ children }: { children: React.ReactNode }) => {
    const { logout, setUser } = useAuthStore();
    // Chỉ show loading khi mở app đã có sẵn token (F5) — không show khi vừa login xong
    const [checking, setChecking] = useState(!!localStorage.getItem("access_token"));

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem("access_token");

            if (token) {
                try {
                    const response = await axiosClient.get("/users/me");
                    if (response.data) {
                        setUser(response.data);
                    }
                } catch (error: any) {
                    if (error.response?.status === 401) {
                        logout();
                    }
                }
            }

            setChecking(false);
        };

        checkAuth();
    }, []);

    if (checking) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-white">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin text-blue-600" size={32} />
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                        Xác thực phiên làm việc...
                    </p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
};

export default AuthInitialize;