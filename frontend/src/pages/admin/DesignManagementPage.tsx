import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  Link as LinkIcon,
  Image as ImageIcon,
  Settings2,
  Copy,
  Layout,
  ListPlus, // Icon mới cho Option
  ExternalLink, // Icon mới cho Link Design
} from "lucide-react";
import axiosClient from "../../api/axiosClient";

const BASE_URL = "http://localhost:3000";

const DesignManagementPage = () => {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get("/designs"); // Đổi endpoint cho khớp với backend của bạn
      setTemplates(res.data);
    } catch (err) {
      console.error("Lỗi tải template", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  return (
    <div className="max-w-7xl mx-auto p-8 bg-gray-50 min-h-screen">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <Layout className="text-indigo-600" size={32} /> TEMPLATE THIẾT KẾ
          </h1>
          <p className="text-gray-500 font-medium">
            Thiết lập mẫu thiết kế sẵn cho từng sản phẩm và biến thể
          </p>
        </div>

        <div className="flex gap-3">
          {/* NÚT LINK ĐẾN TRANG LIÊN KẾT SẢN PHẨM */}
          <Link
            to="/admin/designs/link"
            className="bg-white text-indigo-600 border-2 border-indigo-600 px-6 py-4 rounded-2xl font-black flex items-center gap-2 hover:bg-indigo-50 transition-all shadow-sm"
          >
            <ExternalLink size={20} /> LIÊN KẾT SẢN PHẨM
          </Link>

          <Link
            to="/admin/designs/editor"
            className="bg-black text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 hover:bg-indigo-600 transition-all shadow-xl"
          >
            <Plus size={20} /> TẠO TEMPLATE MỚI
          </Link>
        </div>
      </div>

      {/* SEARCH & TOOLBAR */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="md:col-span-2 relative">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Tìm kiếm template theo tên..."
            className="w-full pl-12 pr-4 py-4 bg-white border-none rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-500 font-medium"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* TEMPLATE GRID */}
      {loading ? (
        <div className="text-center py-20 font-black text-gray-400 animate-pulse tracking-widest">
          ĐANG TẢI DỮ LIỆU...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-white rounded-[40px] overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl transition-all group"
            >
              {/* Thumbnail */}
              <div className="aspect-square bg-slate-100 relative overflow-hidden">
                <img
                  src={
                    template.templateJson?.mockup
                      ? `${BASE_URL}${template.templateJson.mockup}`
                      : "https://placehold.co/600x400?text=No+Mockup"
                  }
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  alt="template preview"
                />
              </div>

              {/* Info Area */}
              <div className="p-8 space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-black text-gray-800 text-xl leading-tight mb-1">
                      {template.designName}
                    </h3>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1">
                      ID: #{template.id} • Layers:{" "}
                      {template.templateJson?.detail?.length || 0}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    {/* NÚT LINK ĐẾN TRANG CẤU HÌNH OPTION CHO TỪNG DESIGN */}
                    <Link
                      to={`/admin/designs/option/${template.id}`}
                      className="flex-1 bg-indigo-50 text-indigo-600 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-indigo-600 hover:text-white transition-all"
                    >
                      <ListPlus size={16} /> CẤU HÌNH INPUT
                    </Link>

                    {/* NÚT QUAY LẠI TRANG EDITOR ĐỂ CHỈNH SỬA CANVAS */}
                    <Link
                      to={`/admin/designs/editor/${template.id}`}
                      className="p-3 bg-gray-50 text-gray-400 hover:text-indigo-600 rounded-xl transition-all"
                    >
                      <Edit3 size={18} />
                    </Link>
                  </div>

                  <button className="w-full p-3 bg-gray-50 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all flex items-center justify-center gap-2 text-xs font-bold">
                    <Trash2 size={16} /> XÓA MẪU
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DesignManagementPage;
