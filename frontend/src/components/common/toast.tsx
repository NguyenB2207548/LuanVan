import toast from "react-hot-toast";
import { AlertCircle, CheckCircle2, X } from "lucide-react";

const ToastContent = ({ t, message, icon: Icon, bgColor }: any) => {
    return (
        <div
            className={`${t.visible ? "animate-toast-in" : "animate-toast-out"
                } w-[320px] bg-white/95 backdrop-blur-md shadow-[0_20px_50px_rgba(0,0,0,0.1)] 
      pointer-events-auto flex flex-col rounded-xl overflow-hidden border border-gray-100/50`}
        >
            <div className="flex items-center p-5 flex-1">
                <div
                    className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${bgColor}15` }} // Màu nền icon nhạt (15% opacity)
                >
                    <Icon className="h-6 w-6" style={{ color: bgColor }} />
                </div>

                <div className="ml-4 flex-1">
                    <p className="text-[14px] font-semibold text-gray-800 leading-snug">
                        {message}
                    </p>
                </div>

                <div className="ml-2 flex-shrink-0">
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="p-1 rounded-md text-gray-300 hover:text-gray-500 hover:bg-gray-50 transition-all"
                    >
                        <X size={16} strokeWidth={2.5} />
                    </button>
                </div>
            </div>

            {/* Thanh Progress Bar siêu mỏng */}
            <div className="h-[3px] bg-gray-50 w-full">
                <div
                    className="h-full transition-all"
                    style={{
                        backgroundColor: bgColor,
                        animation: `toast-progress ${t.duration || 4000}ms linear forwards`,
                        boxShadow: `0 0 8px ${bgColor}80` // Hiệu ứng phát sáng cho thanh progress
                    }}
                />
            </div>

            <style>{`
        @keyframes toast-progress {
          from { width: 100%; }
          to { width: 0%; }
        }
        @keyframes toast-in {
          from { transform: scale(0.9) translateY(10px); opacity: 0; }
          to { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes toast-out {
          from { transform: scale(1); opacity: 1; }
          to { transform: scale(0.95); opacity: 0; }
        }
        .animate-toast-in { animation: toast-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-toast-out { animation: toast-out 0.2s ease-in forwards; }
      `}</style>
        </div>
    );
};

export const showSuccessToast = (message: string) => {
    toast.custom((t) => (
        <ToastContent t={{ ...t, duration: 1000 }} message={message} icon={CheckCircle2} bgColor="#10b981" />
    ), { duration: 1000 });
};

export const showErrorToast = (message: string) => {
    toast.custom((t) => (
        <ToastContent t={{ ...t, duration: 1000 }} message={message} icon={AlertCircle} bgColor="#ef4444" />
    ), { duration: 2000 });
};