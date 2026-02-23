import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/user/HomePage";
import LoginPage from "./pages/user/LoginPage";
import RegisterPage from "./pages/user/RegisterPage";
import ProductDetail from "./pages/user/ProductDetail";
import AdminLayout from "./layouts/AdminLayout";
import ClientLayout from "./layouts/ClientLayout";
import AddProductPage from "./pages/admin/AddProductPage";
import ProductManagementPage from "./pages/admin/ProductManagementPage";
import ProductEditorAdminPage from "./pages/admin/ProductEditorAdminPage";
import DesignManagementPage from "./pages/admin/DesignManagementPage";
import LinkDesignPage from "./pages/admin/LinkDesignPage";
import DesignOptionManager from "./pages/admin/DesignOptionManager";
import DesignerPage from "./pages/user/DesignerPage";
import DesignEditorPage from "./pages/admin/DesignEditorPage";
import DesignerAdminPage from "./pages/admin/DesginerAdminPage";
import Dashboard from "./pages/admin/Dashboard";
import UserManagementPage from "./pages/admin/UserManagementPage";
import AddUserPage from "./pages/admin/AddUserPage";
import EditUserPage from "./pages/admin/EditUserPage";

function App() {
  return (
    <Router>
      <Routes>
        {/* USER */}
        <Route element={<ClientLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/designer/:productId" element={<DesignerPage />} />
        </Route>

        {/* ADMIN */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="users" element={<UserManagementPage />} />
          <Route path="users/add" element={<AddUserPage />} />
          <Route path="users/edit/:id" element={<EditUserPage />} />
          <Route path="products" element={<ProductManagementPage />} />
          <Route path="products/add" element={<AddProductPage />} />
          <Route path="products/:id" element={<ProductEditorAdminPage />} />
          <Route path="designs" element={<DesignManagementPage />} />
          <Route path="designs/editor" element={<DesignerAdminPage />} />
          <Route path="designs/link" element={<LinkDesignPage />} />
          <Route path="designs/option/:id" element={<DesignOptionManager />} />
          <Route path="designs/editor/:id" element={<DesignEditorPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
