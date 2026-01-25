import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProductDetail from "./pages/ProductDetail";
import AdminLayout from "./layouts/AdminLayout";
import ClientLayout from "./layouts/ClientLayout";

function App() {
  return (
    <Router>
      <Routes>
        {/* NHÓM 1: Chỉ nhóm này có Header/Footer nhờ ClientLayout */}
        <Route element={<ClientLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* NHÓM 2: Nhóm này hoàn toàn tách biệt, dùng AdminLayout */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<div>Admin Dashboard</div>} />
          <Route path="products" element={<div>Quản lý sản phẩm</div>} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
