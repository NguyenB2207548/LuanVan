import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  Trash2,
  Image as ImageIcon,
  Palette,
  Calendar,
  Edit,
} from "lucide-react";
import axiosClient from "@/api/axiosClient";

const BaseURL = "http://localhost:3000";

interface Artwork {
  id: number;
  artworkName: string;
  createdAt: string;
  thumbnailUrl?: string;
}

const SellerArtworkManager = () => {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchArtworks();
  }, []);

  const fetchArtworks = async () => {
    try {
      setLoading(true);
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
      await axiosClient.delete(`designs/artworks/${id}`);
      setArtworks((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      alert("Không thể xóa thiết kế này.");
    } finally {
      setDeletingId(null);
    }
  };

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

      {/* FILTER TOOLBAR */}
      <div className="bg-white p-4 border border-gray-200 rounded-lg mb-6">
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
      </div>

      {/* CONTENT - TABLE ONLY */}
      {loading ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center text-gray-500 text-sm italic">
          Đang tải danh sách bản vẽ...
        </div>
      ) : filteredArtworks.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <ImageIcon size={48} className="mx-auto text-gray-200 mb-4" />
          <p className="text-gray-500 text-sm">
            Không tìm thấy thiết kế nào trong thư viện.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-4">Artwork</th>
                <th className="px-6 py-4">Ngày tạo</th>
                <th className="px-6 py-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm">
              {filteredArtworks.map((art) => (
                <tr key={art.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-gray-900">
                        {art.artworkName || `Artwork #${art.id}`}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-gray-400" />
                      {new Date(art.createdAt).toLocaleDateString("vi-VN")}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-4">
                      <button
                        onClick={() =>
                          navigate(`/seller/artworks/edit/${art.id}`)
                        }
                        className="text-gray-400 hover:text-blue-600 transition-colors"
                        title="Chỉnh sửa"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(art.id, art.artworkName)}
                        disabled={deletingId === art.id}
                        className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-30"
                        title="Xóa"
                      >
                        {deletingId === art.id ? (
                          <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <Trash2 size={18} />
                        )}
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
