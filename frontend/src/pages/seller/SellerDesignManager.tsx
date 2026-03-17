import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Trash2,
  LayoutGrid,
  List as ListIcon,
  Image as ImageIcon,
  Layers,
  Clock,
  ExternalLink,
  Box,
  Maximize,
} from "lucide-react";
import axiosClient from "@/api/axiosClient";
import { format } from "date-fns";

const BASE_URL = "http://localhost:3000";

// --- INTERFACES CẬP NHẬT THEO API THẬT ---
interface MergedDesign {
  id: number;
  designName: string;
  createdAt: string;
  product: {
    id: number;
    productName: string;
    images: { url: string; isPrimary: boolean }[];
  } | null;
  artwork: {
    id: number;
    artworkName: string;
    layersJson: {
      details: any[];
      printArea: {
        x: number;
        y: number;
        width: number;
        height: number;
      };
    };
  };
}

const SellerDesignManager = () => {
  const navigate = useNavigate();
  const [mergedDesigns, setMergedDesigns] = useState<MergedDesign[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    fetchMergedDesigns();
  }, []);

  const fetchMergedDesigns = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get("/designs/seller/list");
      setMergedDesigns(res.data || []);
    } catch (err) {
      console.error("Lỗi khi tải danh sách thiết kế", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Xóa thiết kế "${name}"?`)) return;
    try {
      setDeletingId(id);
      await axiosClient.delete(`/designs/${id}`);
      setMergedDesigns((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      alert("Không thể xóa thiết kế này.");
    } finally {
      setDeletingId(null);
    }
  };

  // --- HELPER: LẤY ẢNH ĐẠI DIỆN ---
  const getThumbnail = (design: MergedDesign) => {
    if (!design.product || !design.product.images) return null;
    const primaryImg = design.product.images.find((img) => img.isPrimary);
    const displayImg = primaryImg
      ? primaryImg.url
      : design.product.images[0]?.url;
    return displayImg ? `${BASE_URL}${displayImg}` : null;
  };

  const filteredDesigns = mergedDesigns.filter((d) =>
    d.designName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="w-full">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Box className="text-blue-600" size={26} />
          Quản lý thiết kế
        </h1>
        <button
          onClick={() => navigate("add")}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium text-sm rounded-md hover:bg-blue-700 transition-all"
        >
          <Plus size={16} /> Tạo thiết kế
        </button>
      </div>

      {/* TOOLBAR */}
      <div className="bg-white p-4 border border-gray-200 rounded-lg mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={16}
          />
          <input
            type="text"
            placeholder="Tìm theo tên thiết kế..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex border border-gray-300 rounded-md overflow-hidden bg-white">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 ${viewMode === "grid" ? "bg-blue-50 text-blue-600" : "text-gray-400"}`}
          >
            <LayoutGrid size={18} />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 border-l border-gray-300 ${viewMode === "list" ? "bg-blue-50 text-blue-600" : "text-gray-400"}`}
          >
            <ListIcon size={18} />
          </button>
        </div>
      </div>

      {/* CONTENT */}
      {loading ? (
        <div className="p-12 text-center text-gray-500">
          Đang tải dữ liệu...
        </div>
      ) : filteredDesigns.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <ImageIcon size={48} className="mx-auto text-gray-200 mb-2" />
          <p className="text-gray-500 text-sm">Chưa có thiết kế nào phù hợp.</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredDesigns.map((design) => {
            const thumb = getThumbnail(design);
            const printArea = design.artwork.layersJson.printArea;
            return (
              <div
                key={design.id}
                className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all flex flex-col"
              >
                <div className="aspect-square bg-gray-50 relative flex items-center justify-center p-4">
                  {thumb ? (
                    <img
                      src={thumb}
                      className="max-w-full max-h-full object-contain transition-transform group-hover:scale-110 duration-500"
                      alt=""
                    />
                  ) : (
                    <ImageIcon className="text-gray-200" size={40} />
                  )}

                  {/* Badge Specs */}
                  <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-[10px] font-bold text-gray-700 border border-gray-100 flex items-center gap-1">
                    <Maximize size={10} className="text-blue-600" />
                    {printArea.width}x{printArea.height}px
                  </div>

                  {/* Actions Overlay */}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button
                      onClick={() => thumb && window.open(thumb, "_blank")}
                      className="p-3 bg-white rounded-full shadow-lg text-gray-700 hover:text-blue-600"
                    >
                      <ExternalLink size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(design.id, design.designName)}
                      disabled={deletingId === design.id}
                      className="p-3 bg-white rounded-full shadow-lg text-red-500 hover:text-red-700"
                    >
                      {deletingId === design.id ? (
                        <div className="animate-spin w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full" />
                      ) : (
                        <Trash2 size={18} />
                      )}
                    </button>
                  </div>
                </div>

                <div className="p-4 flex flex-col flex-1">
                  <h3 className="text-sm font-bold text-gray-900 line-clamp-2 mb-2 min-h-[40px]">
                    {design.designName}
                  </h3>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">
                    Phôi: {design.product?.productName || "N/A"}
                  </div>

                  <div className="mt-auto flex items-center justify-between">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      <Layers size={10} />{" "}
                      {design.artwork.layersJson.details?.length || 0} Layers
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-gray-400 font-bold">
                      <Clock size={10} />{" "}
                      {format(new Date(design.createdAt), "dd/MM/yyyy")}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">
                  Sản phẩm
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">
                  Thông số in
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">
                  Ngày gộp
                </th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-widest">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredDesigns.map((design) => {
                const thumb = getThumbnail(design);
                const printArea = design.artwork.layersJson.printArea;
                return (
                  <tr key={design.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 flex items-center gap-3">
                      <div className="w-12 h-12 rounded border border-gray-100 bg-gray-50 flex items-center justify-center overflow-hidden">
                        {thumb ? (
                          <img
                            src={thumb}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <ImageIcon className="text-gray-200" size={20} />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-900 line-clamp-1">
                          {design.designName}
                        </div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                          Phôi: {design.product?.productName}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs font-bold text-gray-700">
                        {printArea.width}x{printArea.height}px
                      </div>
                      <div className="text-[10px] text-gray-400 font-mono">
                        X:{printArea.x} Y:{printArea.y}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500 font-bold">
                      {format(new Date(design.createdAt), "dd/MM/yyyy")}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => thumb && window.open(thumb, "_blank")}
                          className="text-gray-400 hover:text-blue-600 transition-colors"
                        >
                          <ExternalLink size={18} />
                        </button>
                        <button
                          onClick={() =>
                            handleDelete(design.id, design.designName)
                          }
                          className="text-gray-400 hover:text-red-600 transition-colors"
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
        </div>
      )}
    </div>
  );
};

export default SellerDesignManager;
