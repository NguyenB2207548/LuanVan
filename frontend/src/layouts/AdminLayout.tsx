import { Outlet, Navigate } from "react-router-dom";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AdminSidebar } from "../components/admin/admin-sidebar";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/store/useAuthStore";

const AdminLayout = () => {
  const { user } = useAuthStore();

  // Kiểm tra quyền truy cập
  if (!user || user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        {/* Top Header */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white sticky top-0 z-10">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex-1">
            <h1 className="text-sm font-medium text-muted-foreground">
              Hệ thống quản trị Gift Shop
            </h1>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-6 lg:p-8 bg-slate-50/50">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default AdminLayout;
