import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Search,
  UserPlus,
  UserX,
  Edit2,
  ShieldCheck,
} from "lucide-react";

// Mock data - Sau này bạn sẽ thay bằng dữ liệu từ API
const users = [
  {
    id: 1,
    name: "Nguyễn Văn A",
    email: "vana@gmail.com",
    role: "admin",
    status: "active",
  },
  {
    id: 2,
    name: "Trần Thị B",
    email: "seller_b@gmail.com",
    role: "seller",
    status: "active",
  },
  {
    id: 3,
    name: "Lê Văn C",
    email: "shipper_c@gmail.com",
    role: "shipper",
    status: "inactive",
  },
  {
    id: 4,
    name: "Phạm Minh D",
    email: "user_d@gmail.com",
    role: "user",
    status: "active",
  },
];

const UserManagementPage = () => {
  const [searchTerm, setSearchTerm] = useState("");

  // Hàm hiển thị Badge cho Role
  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
            Admin
          </Badge>
        );
      case "seller":
        return (
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
            Seller
          </Badge>
        );
      case "shipper":
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
            Shipper
          </Badge>
        );
      default:
        return <Badge variant="secondary">User</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Quản lý người dùng
          </h2>
          <p className="text-muted-foreground">
            Quản lý danh sách thành viên và phân quyền hệ thống.
          </p>
        </div>
        <Button className="w-full md:w-auto gap-2">
          <UserPlus size={18} /> Thêm người dùng
        </Button>
      </div>

      {/* Filter Area */}
      <div className="flex items-center gap-2 max-w-sm border rounded-lg px-3 bg-white">
        <Search className="text-muted-foreground" size={18} />
        <Input
          placeholder="Tìm theo tên hoặc email..."
          className="border-none shadow-none focus-visible:ring-0"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Table Area */}
      <div className="rounded-md border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/50">
              <TableHead className="w-[80px]">ID</TableHead>
              <TableHead>Người dùng</TableHead>
              <TableHead>Vai trò</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">#{user.id}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{user.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {user.email}
                    </span>
                  </div>
                </TableCell>
                <TableCell>{getRoleBadge(user.role)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-2 w-2 rounded-full ${user.status === "active" ? "bg-green-500" : "bg-slate-300"}`}
                    />
                    <span className="text-sm">
                      {user.status === "active" ? "Đang hoạt động" : "Đã khóa"}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Hành động</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="gap-2">
                        <Edit2 size={14} /> Chỉnh sửa
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2">
                        <ShieldCheck size={14} /> Thay đổi quyền
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="gap-2 text-red-600 focus:text-red-600">
                        <UserX size={14} /> Khóa tài khoản
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Placeholder */}
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button variant="outline" size="sm" disabled>
          Trước
        </Button>
        <Button variant="outline" size="sm">
          Tiếp theo
        </Button>
      </div>
    </div>
  );
};

export default UserManagementPage;
