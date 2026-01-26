import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProductDetail from "./pages/ProductDetail";
import AdminLayout from "./layouts/AdminLayout";
import ClientLayout from "./layouts/ClientLayout";
import AddProductPage from "./features/admin/pages/AddProductPage";
import ProductManagementPage from "./features/admin/pages/ProductManagementPage";

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
        </Route>

        {/* ADMIN */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<div>Admin Dashboard</div>} />
          <Route path="products" element={<ProductManagementPage />} />
          <Route path="products/add" element={<AddProductPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
