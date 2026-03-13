import { Outlet, NavLink } from "react-router-dom";
import { PackageSearch, Truck, History, UserCircle, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ShipperLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Header cho Mobile */}
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-white px-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback>SP</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-xs text-muted-foreground">Xin chào,</p>
            <p className="text-sm font-bold">Shipper Nam</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2 flex h-2 w-2 rounded-full bg-red-500"></span>
        </Button>
      </header>

      {/* Nội dung chính (Danh sách đơn hàng...) */}
      <main className="flex-1 pb-20 p-4">
        <Outlet />
      </main>

      {/* Bottom Navigation (Thanh điều hướng dưới cùng) */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 flex h-16 items-center justify-around border-t bg-white px-2 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <NavButton
          to="/shipper/available"
          icon={<PackageSearch />}
          label="Đơn mới"
        />
        <NavButton to="/shipper/my-orders" icon={<Truck />} label="Đang giao" />
        <NavButton to="/shipper/history" icon={<History />} label="Lịch sử" />
        <NavButton
          to="/shipper/profile"
          icon={<UserCircle />}
          label="Cá nhân"
        />
      </nav>
    </div>
  );
}

// Component con cho các nút điều hướng
function NavButton({
  to,
  icon,
  label,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex flex-col items-center justify-center gap-1 transition-colors ${
          isActive
            ? "text-primary font-semibold"
            : "text-muted-foreground hover:text-primary"
        }`
      }
    >
      <div className="h-6 w-6">{icon}</div>
      <span className="text-[10px] uppercase tracking-wider">{label}</span>
    </NavLink>
  );
}
