import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Edit,
  Package,
  Layers,
  Tag,
  Info,
  Eye,
  Box,
  ImageIcon,
} from "lucide-react";
import axiosClient from "../../../api/axiosClient";
import type { Product } from "../../../types/product";

const BASE_URL = "http://localhost:3000";

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await axiosClient.get(`/products/${id}`);
        setProduct(res.data);
      } catch (err) {
        console.error("Lỗi tải chi tiết sản phẩm", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading)
    return (
      <div className="p-10 text-center font-black animate-pulse">
        ĐANG TẢI DỮ LIỆU...
      </div>
    );
  if (!product)
    return (
      <div className="p-10 text-center text-red-500">
        Không tìm thấy sản phẩm!
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen font-sans pb-20">
      {/* HEADER CONTROL */}
      <div className="flex justify-between items-center mb-10">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 hover:text-black transition-all font-bold"
        >
          <ArrowLeft size={20} /> QUAY LẠI
        </button>
        <button
          onClick={() => navigate(`/admin/products/edit/${id}`)}
          className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black flex items-center gap-2 hover:bg-black transition-all shadow-lg shadow-indigo-100"
        >
          <Edit size={18} /> CHỈNH SỬA
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* CỘT TRÁI: HÌNH ẢNH & THÔNG TIN CHÍNH */}
        <div className="lg:col-span-2 space-y-10">
          {/* 1. THÔNG TIN CƠ BẢN */}
          <section className="bg-white p-10 rounded-[40px] shadow-sm border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8">
              <span
                className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest ${
                  product.status === "active"
                    ? "bg-green-100 text-green-600"
                    : "bg-red-100 text-red-600"
                }`}
              >
                {product.status}
              </span>
            </div>

            <div className="flex items-start gap-4 mb-6">
              <div className="p-4 bg-indigo-50 rounded-3xl text-indigo-600">
                <Box size={32} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-gray-400 text-xs font-black uppercase tracking-widest">
                  Sản phẩm #{product.id}
                </p>
                <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase">
                  {product.productName}
                </h1>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="flex items-center gap-2 font-black text-gray-800 text-sm uppercase tracking-tight">
                <Info size={16} className="text-indigo-600" /> Mô tả sản phẩm
              </h3>
              <p className="text-gray-500 leading-relaxed bg-gray-50 p-6 rounded-3xl border border-gray-100 italic">
                {product.description || "Chưa có mô tả cho sản phẩm này."}
              </p>
            </div>
          </section>

          {/* 2. CHI TIẾT BIẾN THỂ (VARIANTS) */}
          <section className="space-y-6">
            <h2 className="text-xl font-black text-gray-800 uppercase italic flex items-center gap-2 px-4">
              <Layers className="text-indigo-600" /> Danh sách mẫu & Biến thể
            </h2>

            <div className="grid gap-6">
              {product.variants.map((variant) => (
                <div
                  key={variant.id}
                  className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 hover:shadow-xl transition-all group"
                >
                  <div className="flex flex-col md:flex-row gap-8">
                    {/* Ảnh của Variant */}
                    <div className="w-full md:w-40 space-y-3">
                      <div className="aspect-square rounded-3xl overflow-hidden border border-gray-100 shadow-inner bg-gray-50">
                        {variant.images && variant.images.length > 0 ? (
                          <img
                            src={`${BASE_URL}${variant.images[0].url}`}
                            alt="variant"
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <ImageIcon />
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {variant.images.slice(1).map((img) => (
                          <img
                            key={img.id}
                            src={`${BASE_URL}${img.url}`}
                            className="w-10 h-10 rounded-lg object-cover border"
                          />
                        ))}
                      </div>
                    </div>

                    {/* Thông tin variant */}
                    <div className="flex-1 space-y-6">
                      <div className="flex flex-wrap gap-2">
                        {variant.attributeValues.map((val) => (
                          <span
                            key={val.id}
                            className="px-4 py-2 bg-gray-100 rounded-xl text-xs font-bold text-gray-600 border border-gray-200"
                          >
                            {val.valueName}
                          </span>
                        ))}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        <div className="p-4 bg-indigo-50 rounded-2xl">
                          <p className="text-[10px] font-black text-indigo-400 uppercase mb-1">
                            Giá hiện tại
                          </p>
                          <p className="text-xl font-black text-indigo-700">
                            {variant.prices && variant.prices.length > 0
                              ? Number(
                                  variant.prices[0].amount,
                                ).toLocaleString()
                              : "0"}{" "}
                            <span className="text-xs uppercase">VND</span>
                          </p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-2xl">
                          <p className="text-[10px] font-black text-gray-400 uppercase mb-1">
                            Tồn kho
                          </p>
                          <p
                            className={`text-xl font-black ${variant.stock > 0 ? "text-gray-800" : "text-red-500"}`}
                          >
                            {variant.stock}{" "}
                            <span className="text-xs uppercase">Sản phẩm</span>
                          </p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-2xl flex items-center justify-center border-2 border-dashed border-gray-100">
                          <Eye size={20} className="text-gray-300" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* CỘT PHẢI: PHÂN LOẠI & GALLERY */}
        <div className="space-y-10">
          {/* Danh mục */}
          <section className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
            <h3 className="font-black text-gray-800 mb-6 flex items-center gap-2">
              <Tag className="text-indigo-600" size={20} /> PHÂN LOẠI
            </h3>
            <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                Danh mục sản phẩm
              </p>
              <p className="text-lg font-black text-gray-800">
                {product.category.categoryName}
              </p>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                  Tổng tồn kho hệ thống
                </p>
                <p className="text-2xl font-black text-indigo-600">
                  {product.stock} <span className="text-xs">mẫu</span>
                </p>
              </div>
            </div>
          </section>

          {/* Gallery chung */}
          <section className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
            <h3 className="font-black text-gray-800 mb-6 flex items-center gap-2">
              <ImageIcon className="text-indigo-600" size={20} /> BỘ SƯU TẬP ẢNH
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {product.images && product.images.length > 0 ? (
                product.images.map((img) => (
                  <div
                    key={img.id}
                    className="aspect-square rounded-2xl overflow-hidden border border-gray-100 shadow-sm group"
                  >
                    <img
                      src={`${BASE_URL}${img.url}`}
                      alt="gallery"
                      className="w-full h-full object-cover group-hover:scale-125 transition-all duration-700"
                    />
                  </div>
                ))
              ) : (
                <div className="col-span-2 p-10 bg-gray-50 rounded-3xl text-center text-gray-300 italic text-sm border-2 border-dashed">
                  Chưa có ảnh gallery cho sản phẩm này
                </div>
              )}
            </div>
          </section>

          {/* Metadata */}
          <div className="px-8 text-[10px] font-bold text-gray-300 uppercase tracking-widest space-y-1">
            <p>Ngày tạo: {new Date(product.createdAt).toLocaleString()}</p>
            <p>Cập nhật cuối: {new Date(product.updatedAt).toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
