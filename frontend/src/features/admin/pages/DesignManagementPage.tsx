import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import axiosClient from "../../../api/axiosClient";

const BASE_URL = "http://localhost:3000";

const DesignManagementPage = () => {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      // Endpoint lấy danh sách template gốc từ backend
      const res = await axiosClient.get("/admin/design-templates");
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

        <button
          className="bg-black text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 hover:bg-indigo-600 transition-all shadow-xl"
          onClick={() => {
            /* Điều hướng tới trang tạo template */
          }}
        >
          <Plus size={20} /> TẠO TEMPLATE MỚI
        </button>
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
            placeholder="Tìm kiếm template theo tên hoặc sản phẩm liên kết..."
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
              {/* Thumbnail / Mockup */}
              <div className="aspect-square bg-slate-100 relative overflow-hidden">
                <img
                  src={
                    template.thumbnail
                      ? `${BASE_URL}${template.thumbnail}`
                      : "https://placehold.co/600x600?text=Template+Preview"
                  }
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  alt="template preview"
                />
                <div className="absolute top-4 right-4 flex gap-2">
                  <span className="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-indigo-600 shadow-sm">
                    {template.type || "Customily"}
                  </span>
                </div>
              </div>

              {/* Info Area */}
              <div className="p-8 space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-black text-gray-800 text-xl leading-tight mb-1">
                      {template.name}
                    </h3>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1">
                      ID: #{template.id} • Layers: {template.layersCount || 0}
                    </p>
                  </div>
                  <button className="text-gray-300 hover:text-indigo-600 transition-colors">
                    <Copy size={18} />
                  </button>
                </div>

                {/* Liên kết tới sản phẩm */}
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                    <LinkIcon size={12} /> Sản phẩm liên kết
                  </p>
                  {template.products?.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {template.products.map((p: any) => (
                        <span
                          key={p.id}
                          className="text-[11px] font-bold bg-white px-2 py-1 rounded-lg border border-gray-200 text-gray-600"
                        >
                          {p.productName}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] font-bold text-amber-500 italic">
                      Chưa liên kết sản phẩm
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button className="flex-1 bg-gray-900 text-white py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-indigo-600 transition-all">
                    <Settings2 size={16} /> CẤU HÌNH
                  </button>
                  <button className="p-3 bg-gray-50 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                    <Trash2 size={18} />
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
