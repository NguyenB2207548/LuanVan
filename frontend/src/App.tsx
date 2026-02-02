import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProductDetail from "./pages/ProductDetail";
import AdminLayout from "./layouts/AdminLayout";
import ClientLayout from "./layouts/ClientLayout";
import AddProductPage from "./features/admin/pages/AddProductPage";
import ProductManagementPage from "./features/admin/pages/ProductManagementPage";
import ProductDetailAdminPage from "./features/admin/pages/ProductDetailAdminPage";
import DesignManagementPage from "./features/admin/pages/DesignManagementPage";
import LinkDesignPage from "./features/admin/pages/LinkDesignPage";
import DesignOptionManager from "./features/admin/pages/DesignOptionManager";
import DesignerPage from "./pages/DesignerPage";
import DesignEditorPage from "./features/admin/pages/DesignEditorPage";
import DesignerAdminPage from "./features/admin/pages/DesginerAdminPage";

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
          <Route index element={<div>Admin Dashboard</div>} />
          <Route path="products" element={<ProductManagementPage />} />
          <Route path="products/add" element={<AddProductPage />} />
          <Route path="products/:id" element={<ProductDetailAdminPage />} />
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
