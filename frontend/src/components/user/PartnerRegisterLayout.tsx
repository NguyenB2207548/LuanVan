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
    <div className="min-h-screen bg-[#fcfcfd] flex items-center justify-center p-6 lg:p-12 relative overflow-hidden">
      {/* Nền trang trí */}
      <div
        className={`absolute -top-24 -right-24 w-96 h-96 ${isBlue ? "bg-blue-50" : "bg-emerald-50"} rounded-full blur-[120px] -z-10`}
      ></div>

      <Button
        variant="ghost"
        className="absolute top-8 left-8 text-slate-500 hover:text-slate-900 font-bold gap-2"
        onClick={() => navigate("/")}
      >
        <ArrowLeft size={18} /> Quay về trang chủ
      </Button>

      <div className="max-w-6xl w-full grid lg:grid-cols-2 gap-16 items-center">
        {/* LEFT: CONTENT */}
        <div className="hidden lg:flex flex-col space-y-12">
          <div className="space-y-6">
            <h1 className="text-6xl font-black text-slate-950 tracking-tighter leading-[0.9]">
              {title} <br />
            </h1>
            <p className="text-slate-500 text-xl font-medium max-w-md leading-relaxed">
              {description}
            </p>
          </div>

          <div className="space-y-5">
            {[
              {
                icon: (
                  <ShieldCheck
                    className={isBlue ? "text-blue-600" : "text-emerald-600"}
                  />
                ),
                text: "Hệ thống quản lý minh bạch",
              },
              {
                icon: <Zap className="text-amber-500" />,
                text: "Tối ưu hóa quy trình vận hành",
              },
              {
                icon: <Star className="text-purple-500" />,
                text: "Gia tăng thu nhập bền vững",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100 w-fit pr-8 transition-transform hover:translate-x-2"
              >
                <div className="bg-slate-50 p-2 rounded-lg">{item.icon}</div>
                <span className="font-bold text-slate-700">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: FORM (Children) */}
        <div className="relative">{children}</div>
      </div>
    </div>
  );
};
