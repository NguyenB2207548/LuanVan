import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import ClientLayout from "./layouts/ClientLayout";
import AdminLayout from "./layouts/AdminLayout";
import SellerLayout from "./layouts/SellerLayout";
import ShipperLayout from "./layouts/ShipperLayout";

import ProtectedRoute from "./routes/ProtectedRoute";

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

import Dashboard from "./pages/admin/Dashboard";
import UserManagementPage from "./pages/admin/UserManagementPage";
import { TooltipProvider } from "./components/ui/tooltip";
import ApprovalManagementPage from "./pages/admin/ApprovalManagementPage";
import RegisterShipperPage from "./pages/user/RegisterShipperPage";
import RegisterSellerPage from "./pages/user/RegisterSellerPage";
import OrderHistoryPage from "./pages/user/OrderHistoryPage";
import SellerProductManager from "./pages/seller/SellerProductManager";
import AddProductPage from "./pages/seller/AddProductPage";
import SellerArtworkManager from "./pages/seller/SellerArtworkManager";
import AddArtworkPage from "./pages/seller/AddArtworkPage";
import SellerDesignManager from "./pages/seller/SellerDesignManager";
import AddDesignPage from "./pages/seller/AddDesignPage";
import PrintAreaConfigPage from "./pages/seller/PrintAreaConfigPage";

function App() {
  return (
    <TooltipProvider>
      <Router>
        <Routes>
          {/* --- CUSTOMER --- */}
          <Route element={<ClientLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/products" element={<ProductPage />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/register-seller" element={<RegisterSellerPage />} />
            <Route path="/register-shipper" element={<RegisterShipperPage />} />
            <Route path="/order-history" element={<OrderHistoryPage />} />

            {/* Routes yêu cầu đăng nhập */}
            <Route
              element={
                <ProtectedRoute
                  allowedRoles={["user", "seller", "admin", "shipper"]}
                />
              }
            >
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/order-success" element={<OrderSuccessPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/designer/:productId" element={<DesignerPage />} />
            </Route>
          </Route>

          {/* --- ADMIN --- */}
          <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="users" element={<UserManagementPage />} />
              <Route path="approvals" element={<ApprovalManagementPage />} />
            </Route>
          </Route>

          {/* --- SELLER --- */}
          <Route element={<ProtectedRoute allowedRoles={["seller"]} />}>
            <Route path="/seller" element={<SellerLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<div>Dashboard Seller</div>} />
              <Route path="products" element={<SellerProductManager />} />
              <Route path="products/add" element={<AddProductPage />} />
              <Route path="artworks" element={<SellerArtworkManager />} />
              <Route path="artworks/add" element={<AddArtworkPage />} />
              <Route path="artworks/edit/:id" element={<AddArtworkPage />} />
              <Route path="designs" element={<SellerDesignManager />} />
              <Route path="designs/add" element={<AddDesignPage />} />
              <Route
                path="products/print-area-config"
                element={<PrintAreaConfigPage />}
              />
              <Route path="orders" element={<div>Đơn hàng của Shop</div>} />
            </Route>
          </Route>

          {/* --- SHIPPER --- */}
          <Route element={<ProtectedRoute allowedRoles={["shipper"]} />}>
            <Route path="/shipper" element={<ShipperLayout />}>
              <Route index element={<Navigate to="available" replace />} />
              <Route path="available" element={<div>Đơn hàng sẵn sàng</div>} />
              <Route path="my-orders" element={<div>Đơn đang giao</div>} />
              <Route path="history" element={<div>Lịch sử giao hàng</div>} />
            </Route>
          </Route>

          {/* --- 404 & TRANG KHÔNG CÓ QUYỀN --- */}
          <Route
            path="/unauthorized"
            element={<div>Bạn không có quyền truy cập trang này!</div>}
          />
          <Route path="*" element={<div>Trang không tồn tại</div>} />
        </Routes>
      </Router>
    </TooltipProvider>
  );
}

export default App;
