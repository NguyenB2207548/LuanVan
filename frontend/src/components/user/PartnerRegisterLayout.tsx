import type { ReactNode } from "react";
import { ArrowLeft, ShieldCheck, Zap, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface LayoutProps {
  children: ReactNode;
  title: string;
  description: string;
  accentColor: string; // "blue" cho Seller, "emerald" cho Shipper
}

export const PartnerRegisterLayout = ({
  children,
  title,
  description,
  accentColor,
}: LayoutProps) => {
  const navigate = useNavigate();
  const isBlue = accentColor === "blue";

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center p-6 lg:p-12 pt-24 lg:pt-28 relative overflow-hidden font-sans">
      {/* Nút quay về - Đã giảm khoảng cách với phần content bằng pt ở trên */}
      <Button
        variant="ghost"
        className="absolute top-8 left-8 text-gray-500 hover:text-gray-900 transition-colors gap-2"
        onClick={() => navigate("/")}
      >
        <ArrowLeft size={16} />
        <span className="text-sm font-medium">Quay về trang chủ</span>
      </Button>

      <div className="max-w-6xl w-full grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
        {/* LEFT: CONTENT */}
        <div className="hidden lg:flex flex-col space-y-10">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-gray-900 tracking-tight leading-tight">
              {title}
            </h1>
            <p className="text-gray-500 text-lg leading-relaxed max-w-md">
              {description}
            </p>
          </div>

          <div className="space-y-4 flex flex-col items-start">
            {[
              {
                icon: (
                  <ShieldCheck
                    size={20}
                    className={isBlue ? "text-blue-600" : "text-emerald-600"}
                  />
                ),
                text: "Hệ thống quản lý minh bạch",
              },
              {
                icon: <Zap size={20} className="text-amber-500" />,
                text: "Tối ưu hóa quy trình vận hành",
              },
              {
                icon: <Star size={20} className="text-purple-500" />,
                text: "Gia tăng thu nhập bền vững",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-4 bg-white p-4 rounded-lg border border-gray-200 shadow-sm w-full max-w-[320px]"
              >
                <div className="bg-gray-50 p-2 rounded-md shrink-0">{item.icon}</div>
                <span className="text-sm font-semibold text-gray-700 leading-tight">
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: FORM (Children) */}
        <div className="relative w-full max-w-md mx-auto lg:max-w-none">
          {children}
        </div>
      </div>
    </div>
  );
};