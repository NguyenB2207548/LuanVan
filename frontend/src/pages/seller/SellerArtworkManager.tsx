import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  Download,
  Trash2,
  FileText,
  Image as ImageIcon,
  LayoutGrid,
  List as ListIcon,
  Palette,
  ChevronDown,
  Calendar,
} from "lucide-react";
import axiosClient from "@/api/axiosClient";

const BaseURL = "http://localhost:3000";

interface Artwork {
  id: number;
  fileName: string;
  url: string;
  fileSize: string;
  fileType: string;
  dimensions?: string;
  createdAt: string;
}

const SellerArtworkManager = () => {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchArtworks();
  }, []);

  const fetchArtworks = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get("/assets"); // Đổi endpoint nếu cần (ví dụ /artworks/seller)
      setArtworks(res.data || []);
    } catch (err) {
      console.error("Lỗi fetch artwork", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    const confirmDelete = window.confirm(
      `Bạn có chắc chắn muốn xóa thiết kế "${name}"?`,
    );
    if (!confirmDelete) return;

    try {
      setDeletingId(id);
      await axiosClient.delete(`/assets/${id}`);
      setArtworks((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      alert("Không thể xóa file thiết kế này.");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredArtworks = artworks.filter((art) => {
    const matchSearch = art.fileName
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchType =
      typeFilter === "all" || art.fileType.toLowerCase() === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <div className="w-full">
      {/* PAGE HEADER - Đồng bộ với Product Manager */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Palette className="text-blue-600" size={26} />
            Thư viện Artwork thiết kế
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

      {/* FILTER & TOOLBAR - Đồng bộ Style */}
      <div className="bg-white p-4 border border-gray-200 rounded-lg mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="text-gray-400" size={16} />
          </div>
          <input
            type="text"
            placeholder="Tìm theo tên artwork..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* File Type Filter */}
          <div className="relative w-full md:w-48">
            <select
              className="appearance-none block w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white cursor-pointer"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">Tất cả định dạng</option>
              <option value="png">PNG</option>
              <option value="svg">SVG</option>
              <option value="psd">PSD</option>
            </select>
            <ChevronDown
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              size={14}
            />
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center border border-gray-300 rounded-md overflow-hidden bg-white">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 transition-colors ${viewMode === "grid" ? "bg-blue-50 text-blue-600" : "text-gray-400 hover:text-gray-600"}`}
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 transition-colors border-l border-gray-300 ${viewMode === "list" ? "bg-blue-50 text-blue-600" : "text-gray-400 hover:text-gray-600"}`}
            >
              <ListIcon size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      {loading ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <div className="flex justify-center items-center gap-2 text-gray-500 text-sm">
            <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
            Đang tải thư viện artwork...
          </div>
        </div>
      ) : filteredArtworks.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <ImageIcon size={48} className="mx-auto text-gray-200 mb-4" />
          <p className="text-gray-500 text-sm font-medium">
            Không tìm thấy thiết kế nào.
          </p>
        </div>
      ) : viewMode === "grid" ? (
        /* GRID VIEW */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredArtworks.map((art) => (
            <div
              key={art.id}
              className="group bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-all"
            >
              <div className="aspect-square bg-gray-50 flex items-center justify-center p-3 relative group">
                {art.fileType.toLowerCase() === "psd" ? (
                  <FileText size={48} className="text-blue-500 opacity-60" />
                ) : (
                  <img
                    src={`${BaseURL}${art.url}`}
                    className="max-w-full max-h-full object-contain transition-transform group-hover:scale-105"
                    alt={art.fileName}
                  />
                )}
                {/* Hover Actions */}
                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button className="p-2 bg-white rounded-full shadow-sm text-gray-600 hover:text-blue-600 transition-colors">
                    <Download size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(art.id, art.fileName)}
                    className="p-2 bg-white rounded-full shadow-sm text-red-500 hover:text-red-700 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="p-3 border-t border-gray-100">
                <p
                  className="text-sm font-bold text-gray-900 truncate mb-1"
                  title={art.fileName}
                >
                  {art.fileName}
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-blue-600 uppercase bg-blue-50 px-1.5 py-0.5 rounded">
                    {art.fileType}
                  </span>
                  <span className="text-[10px] text-gray-400 font-medium uppercase">
                    {art.fileSize}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* LIST VIEW - Đồng bộ Table Style */
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Preview
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Tên File
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Định dạng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Ngày tạo
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredArtworks.map((art) => (
                  <tr
                    key={art.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-12 w-12 rounded border border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center">
                        {art.fileType.toLowerCase() === "psd" ? (
                          <FileText size={18} className="text-blue-500" />
                        ) : (
                          <img
                            src={`${BaseURL}${art.url}`}
                            className="h-full w-full object-contain"
                            alt=""
                          />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">
                        {art.fileName}
                      </div>
                      <div className="text-[10px] text-gray-400 font-medium uppercase">
                        {art.fileSize}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100 uppercase">
                        {art.fileType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Calendar size={12} />
                        {new Date(art.createdAt).toLocaleDateString("vi-VN")}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-3">
                        <button
                          className="text-gray-600 hover:text-blue-600 transition-colors"
                          title="Tải xuống"
                        >
                          <Download size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(art.id, art.fileName)}
                          disabled={deletingId === art.id}
                          className="text-red-500 hover:text-red-700 transition-colors disabled:text-gray-300"
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
        </div>
      )}

      {/* FOOTER - Đồng bộ Style */}
      {!loading && filteredArtworks.length > 0 && (
        <div className="mt-4 flex items-center justify-between text-sm text-gray-500 font-medium">
          <div>
            Hiển thị{" "}
            <span className="text-blue-600 font-bold">
              {filteredArtworks.length}
            </span>{" "}
            artwork thiết kế
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerArtworkManager;
