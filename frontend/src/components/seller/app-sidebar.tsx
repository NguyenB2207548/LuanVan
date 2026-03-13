import {
  LayoutDashboard,
  Package,
  ClipboardList,
  Settings,
  Store,
  Box,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Link } from "react-router-dom";

const items = [
  { title: "Tổng quan", url: "/seller/dashboard", icon: LayoutDashboard },
  { title: "Sản phẩm của tôi", url: "/seller/products", icon: Package },
  { title: "Đơn hàng mới", url: "/seller/orders", icon: ClipboardList },
  { title: "Quản lý kho", url: "/seller/inventory", icon: Box },
  { title: "Cấu hình Shop", url: "/seller/settings", icon: Settings },
];

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="flex items-center justify-center py-4">
        <div className="flex items-center gap-2 font-bold text-xl text-primary">
          <Store className="h-6 w-6" />
          <span className="group-data-[collapsible=icon]:hidden">
            GIFT SELLER
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Quản lý</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
