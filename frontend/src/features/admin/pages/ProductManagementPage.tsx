import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  MoreHorizontal,
  Eye,
  Package,
  AlertCircle,
  ImageIcon,
} from "lucide-react";
import axiosClient from "../../../api/axiosClient";
import type { Product } from "../../../types/product";

const BASE_URL = "http://localhost:3000";

const ProductManagementPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // 1. Lấy danh sách sản phẩm từ Backend
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axiosClient.get("/products");
      setProducts(response.data);
    } catch (error) {
      console.error("Lỗi khi tải danh sách sản phẩm:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // 2. Logic xóa sản phẩm
  const handleDelete = async (id: number) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa sản phẩm này không?")) {
      try {
        await axiosClient.delete(`/products/${id}`);
        setProducts(products.filter((p) => p.id !== id));
        alert("Đã xóa sản phẩm thành công");
      } catch (error) {
        alert("Lỗi khi xóa sản phẩm");
      }
    }
  };

  // 3. Lọc sản phẩm theo tìm kiếm
  const filteredProducts = products.filter((p) =>
    p.productName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">
            QUẢN LÝ SẢN PHẨM
          </h1>
          <p className="text-sm text-gray-500 font-medium">
            Bạn đang có {products.length} sản phẩm trong cửa hàng
          </p>
        </div>

        <Link
          to="/admin/products/add"
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all"
        >
          <Plus size={20} /> THÊM SẢN PHẨM
        </Link>
      </div>

      {/* Toolbar Section */}
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên sản phẩm..."
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <select className="bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm font-bold text-gray-600 focus:ring-2 focus:ring-indigo-500">
            <option>Tất cả danh mục</option>
          </select>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-20 text-center animate-pulse text-gray-400 font-bold uppercase tracking-widest">
            Đang tải dữ liệu...
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-50">
                <th className="px-6 py-5">Sản phẩm</th>
                <th className="px-6 py-5">Danh mục</th>
                <th className="px-6 py-5">Giá & Kho</th>
                <th className="px-6 py-5">Trạng thái</th>
                <th className="px-6 py-5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredProducts.map((product) => {
                // Lấy ảnh hiển thị
                const displayImg =
                  product.images?.find((i) => i.isPrimary)?.url ||
                  product.images?.[0]?.url;
                // Lấy khoảng giá
                const prices = product.variants?.flatMap(
                  (v) =>
                    v.prices?.map((p) => parseFloat(p.amount.toString())) || [],
                );
                const minPrice = prices.length ? Math.min(...prices) : 0;

                return (
                  <tr
                    key={product.id}
                    className="hover:bg-gray-50/50 transition-colors group"
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gray-100 flex-shrink-0 overflow-hidden border border-gray-100">
                          {displayImg ? (
                            <img
                              src={`${BASE_URL}${displayImg}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                              <ImageIcon size={20} />
                            </div>
                          )}
                        </div>
                        <div>
                          {/* Bọc tên bằng Link */}
                          <Link
                            to={`/admin/products/${product.id}`}
                            className="font-bold text-gray-800 line-clamp-1 hover:text-indigo-600 transition-colors"
                          >
                            {product.productName}
                          </Link>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                            ID: #{product.id}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-xs font-bold text-gray-600 bg-gray-100 px-3 py-1 rounded-full uppercase">
                        {product.category?.categoryName || "Chưa phân loại"}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-indigo-600">
                          {minPrice.toLocaleString()}đ
                        </span>
                        <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1 mt-1">
                          <Package size={10} /> Kho: {product.stock}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          product.status === "active"
                            ? "bg-green-50 text-green-600"
                            : "bg-red-50 text-red-600"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${product.status === "active" ? "bg-green-500" : "bg-red-500"}`}
                        />
                        {product.status === "active" ? "Hiển thị" : "Ẩn"}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        {/* NÚT XEM CHI TIẾT MỚI THÊM */}
                        <Link
                          to={`/admin/products/${product.id}`} // Đường dẫn đến trang Detail
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                          title="Xem chi tiết"
                        >
                          <Eye size={18} />
                        </Link>

                        <Link
                          to={`/admin/products/edit/${product.id}`}
                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                        >
                          <Edit3 size={18} />
                        </Link>

                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ProductManagementPage;
