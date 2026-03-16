import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  Trash2,
  Image as ImageIcon,
  LayoutGrid,
  List as ListIcon,
  Palette,
  Calendar,
  Edit,
} from "lucide-react";
import axiosClient from "@/api/axiosClient";

const BaseURL = "http://localhost:3000";

// 1. Cập nhật Interface khớp chính xác với JSON Backend gửi về
interface Artwork {
  id: number;
  artworkName: string; // Đã đổi từ fileName
  createdAt: string;
  thumbnailUrl?: string; // Optional vì backend chưa trả về
}

const SellerArtworkManager = () => {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchArtworks();
  }, []);

  const fetchArtworks = async () => {
    try {
      setLoading(true);
      // Endpoint khớp với API bạn đã viết ở bước trước
      const res = await axiosClient.get("designs/seller/artworks");
      setArtworks(res.data || []);
    } catch (err) {
      console.error("Lỗi fetch artwork", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    const confirmDelete = window.confirm(
      `Bạn có chắc chắn muốn xóa bản vẽ "${name || "không tên"}"?`,
    );
    if (!confirmDelete) return;

    try {
      setDeletingId(id);
      // Lưu ý: Endpoint xóa cần khớp với Backend (thường là designs/artworks/:id)
      await axiosClient.delete(`designs/artworks/${id}`);
      setArtworks((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      alert("Không thể xóa thiết kế này.");
    } finally {
      setDeletingId(null);
    }
  };

  // Logic lọc theo tên
  const filteredArtworks = artworks.filter((art) =>
    (art.artworkName || "").toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="w-full">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Palette className="text-blue-600" size={26} />
            Thư viện Artwork
          </h1>
        </div>

        <button
          onClick={() => navigate("/seller/artworks/add")}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium text-sm rounded-md hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={16} />
          Tạo artwork
        </button>
      </div>

      {/* FILTER & TOOLBAR */}
      <div className="bg-white p-4 border border-gray-200 rounded-lg mb-6 flex items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="text-gray-400" size={16} />
          </div>
          <input
            type="text"
            placeholder="Tìm theo tên bản vẽ..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center border border-gray-300 rounded-md overflow-hidden bg-white">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 transition-colors ${viewMode === "grid" ? "bg-blue-50 text-blue-600" : "text-gray-400"}`}
          >
            <LayoutGrid size={18} />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 transition-colors border-l border-gray-300 ${viewMode === "list" ? "bg-blue-50 text-blue-600" : "text-gray-400"}`}
          >
            <ListIcon size={18} />
          </button>
        </div>
      </div>

      {/* CONTENT */}
      {loading ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center text-gray-500 text-sm">
          Đang tải dữ liệu...
        </div>
      ) : filteredArtworks.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <ImageIcon size={48} className="mx-auto text-gray-200 mb-4" />
          <p className="text-gray-500 text-sm">Không tìm thấy thiết kế nào.</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredArtworks.map((art) => (
            <div
              key={art.id}
              className="group bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-all"
            >
              <div className="aspect-square bg-gray-50 flex items-center justify-center relative">
                {/* 2. Xử lý hiển thị khi chưa có ảnh preview */}
                {art.thumbnailUrl ? (
                  <img
                    src={`${BaseURL}${art.thumbnailUrl}`}
                    className="max-w-full max-h-full object-contain"
                    alt=""
                  />
                ) : (
                  <div className="flex flex-col items-center text-gray-300">
                    <ImageIcon size={32} />
                    <span className="text-[10px] uppercase font-bold mt-2">
                      No Preview
                    </span>
                  </div>
                )}

                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => navigate(`/seller/artworks/edit/${art.id}`)}
                    className="p-2 bg-white rounded-full shadow-sm text-blue-600 hover:bg-blue-50"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(art.id, art.artworkName)}
                    className="p-2 bg-white rounded-full shadow-sm text-red-500 hover:bg-red-50"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="p-3 border-t border-gray-100">
                <p className="text-sm font-bold text-gray-900 truncate">
                  {art.artworkName || `Artwork #${art.id}`}
                </p>
                <p className="text-[10px] text-gray-400 mt-1 uppercase">
                  ID: {art.id}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr className="text-left text-xs font-semibold text-gray-500 uppercase">
                <th className="px-6 py-3">Bản vẽ</th>
                <th className="px-6 py-3">Ngày tạo</th>
                <th className="px-6 py-3 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm">
              {filteredArtworks.map((art) => (
                <tr key={art.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-gray-900">
                    {art.artworkName || `Artwork #${art.id}`}
                  </td>
                  <td className="px-6 py-4 text-gray-500 flex items-center gap-2">
                    <Calendar size={14} />
                    {new Date(art.createdAt).toLocaleDateString("vi-VN")}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() =>
                          navigate(`/seller/artworks/edit/${art.id}`)
                        }
                        className="text-gray-400 hover:text-blue-600"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(art.id, art.artworkName)}
                        disabled={deletingId === art.id}
                        className="text-gray-400 hover:text-red-500 disabled:opacity-30"
                      >
                        {deletingId === art.id ? "..." : <Trash2 size={18} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SellerArtworkManager;
