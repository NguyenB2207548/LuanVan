import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Layouts
import ClientLayout from "./layouts/ClientLayout";
import AdminLayout from "./layouts/AdminLayout";
import SellerLayout from "./layouts/SellerLayout";
import ShipperLayout from "./layouts/ShipperLayout";

// Components
import ProtectedRoute from "./routes/ProtectedRoute";
import AuthInitialize from "./components/common/AuthInitialize";
import { TooltipProvider } from "./components/ui/tooltip";

// Pages
import HomePage from "./pages/user/HomePage";
import LoginPage from "./pages/user/LoginPage";
import RegisterPage from "./pages/user/RegisterPage";
import ProductDetail from "./pages/user/ProductDetail";
import ProductPage from "./pages/user/ProductPage";
import CartPage from "./pages/user/CartPage";
import CheckoutPage from "./pages/user/CheckoutPage";
import OrderSuccessPage from "./pages/user/OrderSuccessPage";
import ProfilePage from "./pages/user/ProfilePage";
import DesignerPage from "./pages/user/DesignerPage";
import RegisterShipperPage from "./pages/user/RegisterShipperPage";
import RegisterSellerPage from "./pages/user/RegisterSellerPage";
import OrderHistoryPage from "./pages/user/OrderHistoryPage";
import ChangePasswordPage from "./pages/user/ChangePasswordPage";
import ForgotPasswordPage from "./pages/user/ForgotPasswordPage";

// Seller Pages
// import DashboardSeller from "./pages/seller/DashboardSeller"; // Giả định tên file
import SellerProductManager from "./pages/seller/SellerProductManager";
import AddProductPage from "./pages/seller/AddProductPage";
import EditProductPage from "./pages/seller/EditProductPage";
import SellerArtworkManager from "./pages/seller/SellerArtworkManager";
import AddArtworkPage from "./pages/seller/AddArtworkPage";
import SellerDesignManager from "./pages/seller/SellerDesignManager";
import AddDesignPage from "./pages/seller/AddDesignPage";
import PrintAreaConfigPage from "./pages/seller/PrintAreaConfigPage";
import SellerOrderManager from "./pages/seller/SellerOrderManager";
import SellerSettings from "./pages/seller/SellerSettings";

// Admin Pages
import DashboardAdmin from "./pages/admin/Dashboard";
import UserManagementPage from "./pages/admin/UserManagementPage";
import ApprovalManagementPage from "./pages/admin/ApprovalManagementPage";
import CategoryManagementPage from "./pages/admin/CategoryManagementPage";
import CategoryEditorPage from "./pages/admin/CategoryEditorPage";
import AttributeManagementPage from "./pages/admin/AttributeManagementPage";

// Shipper Pages
import ShipperOrderManager from "./pages/shipper/ShipperOrderManager";
import ShipperMyOrders from "./pages/shipper/ShipperMyOrders";
import ShipperSettings from "./pages/shipper/ShipperSettings";
import SellerRevenuePage from "./pages/seller/SellerRevenuePage";
import EditArtworkPage from "./pages/seller/EditArtworkPage";

function App() {
  return (
    <TooltipProvider>
      {/* Bước 1: Khởi tạo xác thực */}
      <AuthInitialize>
        <Router>
          <Routes>
            {/* --- NHÓM CUSTOMER (CÔNG KHAI) --- */}
            <Route element={<ClientLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/products" element={<ProductPage />} />
              <Route path="/products/:id" element={<ProductDetail />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/register-seller" element={<RegisterSellerPage />} />
              <Route path="/register-shipper" element={<RegisterShipperPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />

              {/* Nhóm yêu cầu đăng nhập chung (User, Seller, Admin, Shipper) */}
              <Route element={<ProtectedRoute allowedRoles={["user", "seller", "admin", "shipper"]} />}>
                <Route path="/cart" element={<CartPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/order-success" element={<OrderSuccessPage />} />
                <Route path="/order-history" element={<OrderHistoryPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/change-password" element={<ChangePasswordPage />} />
                <Route path="/designer/:productId" element={<DesignerPage />} />
              </Route>
            </Route>

            {/* --- NHÓM ADMIN --- */}
            <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<DashboardAdmin />} />
                <Route path="users" element={<UserManagementPage />} />
                <Route path="approvals" element={<ApprovalManagementPage />} />
                <Route path="categories" element={<CategoryManagementPage />} />
                <Route path="categories/add" element={<CategoryEditorPage />} />
                <Route path="categories/edit/:id" element={<CategoryEditorPage />} />
                <Route path="attributes" element={<AttributeManagementPage />} />
              </Route>
            </Route>

            {/* --- NHÓM SELLER --- */}
            <Route element={<ProtectedRoute allowedRoles={["seller"]} />}>
              <Route path="/seller" element={<SellerLayout />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<div>Dashboard Seller</div>} />
                <Route path="products" element={<SellerProductManager />} />
                <Route path="products/add" element={<AddProductPage />} />
                <Route path="products/edit/:id" element={<EditProductPage />} />
                <Route path="artworks" element={<SellerArtworkManager />} />
                <Route path="artworks/add" element={<AddArtworkPage />} />
                <Route path="artworks/edit/:id" element={<EditArtworkPage />} />
                <Route path="designs" element={<SellerDesignManager />} />
                <Route path="designs/add" element={<AddDesignPage />} />
                <Route path="orders" element={<SellerOrderManager />} />
                <Route path="revenue" element={<SellerRevenuePage />} />
                <Route path="settings" element={<SellerSettings />} />
                <Route path="products/print-area-config" element={<PrintAreaConfigPage />} />
                <Route path="products/print-area-config/:type/:id" element={<PrintAreaConfigPage />} />
              </Route>
            </Route>

            {/* --- NHÓM SHIPPER --- */}
            <Route element={<ProtectedRoute allowedRoles={["shipper"]} />}>
              <Route path="/shipper" element={<ShipperLayout />}>
                <Route index element={<Navigate to="orders" replace />} />
                <Route path="dashboard" element={<div>Dashboard Shipper</div>} />
                <Route path="orders" element={<ShipperOrderManager />} />
                <Route path="my-orders" element={<ShipperMyOrders />} />
                <Route path="history" element={<div>Lịch sử giao hàng</div>} />
                <Route path="settings" element={<ShipperSettings />} />
              </Route>
            </Route>

            {/* --- XỬ LÝ LỖI & PHÂN QUYỀN --- */}
            <Route path="/unauthorized" element={<div className="p-20 text-center font-bold">Bạn không có quyền truy cập trang này!</div>} />
            <Route path="*" element={<div className="p-20 text-center">Trang không tồn tại (404)</div>} />
          </Routes>
        </Router>
      </AuthInitialize>
    </TooltipProvider>
  );
}

export default App;