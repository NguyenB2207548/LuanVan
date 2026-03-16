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
  ChevronDown,
  Maximize,
} from "lucide-react";
import axiosClient from "@/api/axiosClient";
import { format } from "date-fns";

const BASE_URL = "http://localhost:3000";

interface MergedDesign {
  id: string;
  designName: string;
  productName: string;
  thumbnailUrl: string;
  mergeConfig: {
    layers: any[];
    printArea: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  };
  createdAt: string;
}

const SellerDesignManager = () => {
  const navigate = useNavigate();

  // --- STATES ---
  const [mergedDesigns, setMergedDesigns] = useState<MergedDesign[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchMergedDesigns();
  }, []);

  const fetchMergedDesigns = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get("/designs/seller/list");
      setMergedDesigns(res.data || []);
    } catch (err) {
      console.error("Lỗi khi tải danh sách sản phẩm gộp", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const confirmDelete = window.confirm(
      `Bạn có chắc chắn muốn xóa sản phẩm gộp "${name}"?`,
    );
    if (!confirmDelete) return;

    try {
      setDeletingId(id);
      await axiosClient.delete(`/merged-products/${id}`);
      setMergedDesigns((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      alert("Không thể xóa sản phẩm này.");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredDesigns = mergedDesigns.filter((d) =>
    d.designName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="w-full">
      {/* PAGE HEADER - Đồng bộ Style */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Box className="text-blue-600" size={26} />
            Quản lý thiết kế
          </h1>
        </div>

        <button
          onClick={() => navigate("add")}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium text-sm rounded-md hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={16} />
          Tạo thiết kế
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
            placeholder="Tìm theo tên thiết kế"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
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

      {/* CONTENT AREA */}
      {loading ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <div className="flex justify-center items-center gap-2 text-gray-500 text-sm">
            <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
            Đang tải danh sách sản phẩm gộp...
          </div>
        </div>
      ) : filteredDesigns.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <ImageIcon size={48} className="mx-auto text-gray-200 mb-4" />
          <p className="text-gray-500 text-sm font-medium">
            Chưa có thiết kế nào.
          </p>
        </div>
      ) : viewMode === "grid" ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredDesigns.map((design) => (
            <div
              key={design.id}
              className="group bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-all"
            >
              <div className="aspect-square bg-gray-50 flex items-center justify-center p-4 relative overflow-hidden">
                <img
                  src={`${BASE_URL}${design.thumbnailUrl}`}
                  className="max-w-full max-h-full object-contain transition-transform group-hover:scale-105 duration-500"
                  alt={design.designName}
                />

                {/* Print Area Specs Info Overlay */}
                <div className="absolute bottom-2 left-2">
                  <div className="bg-white/80 backdrop-blur-sm px-1.5 py-0.5 rounded border border-gray-100 flex items-center gap-1 shadow-sm">
                    <Maximize size={10} className="text-blue-600" />
                    <span className="text-[9px] font-bold text-gray-600">
                      {design.mergeConfig?.printArea?.width}x
                      {design.mergeConfig?.printArea?.height}px
                    </span>
                  </div>
                </div>

                {/* Hover Actions */}
                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button
                    onClick={() =>
                      window.open(`${BASE_URL}${design.thumbnailUrl}`, "_blank")
                    }
                    className="p-2.5 bg-white rounded-full shadow-md text-gray-700 hover:text-blue-600 transition-all"
                  >
                    <ExternalLink size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(design.id, design.designName)}
                    disabled={deletingId === design.id}
                    className="p-2.5 bg-white rounded-full shadow-md text-red-500 hover:text-red-700 transition-all"
                  >
                    {deletingId === design.id ? (
                      <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Trash2 size={18} />
                    )}
                  </button>
                </div>
              </div>

              <div className="p-4 border-t border-gray-100">
                <h3
                  className="text-sm font-bold text-gray-900 truncate mb-1"
                  title={design.designName}
                >
                  {design.designName}
                </h3>
                <div className="flex items-center gap-1.5 mb-3">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Phôi: {design.productName}
                  </span>
                </div>

                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase">
                    <Layers size={10} />{" "}
                    {design.mergeConfig?.layers?.length || 0} Layers
                  </div>
                  <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
                    <Clock size={10} />{" "}
                    {format(new Date(design.createdAt), "dd/MM/yyyy")}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Sản phẩm gộp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Thông số in
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Cấu trúc
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Ngày gộp
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDesigns.map((design) => (
                  <tr
                    key={design.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded border border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center">
                          <img
                            src={`${BASE_URL}${design.thumbnailUrl}`}
                            className="h-full w-full object-contain"
                            alt=""
                          />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-gray-900">
                            {design.designName}
                          </div>
                          <div className="text-[10px] text-gray-400 font-medium uppercase">
                            Phôi: {design.productName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs font-bold text-gray-600">
                        {design.mergeConfig?.printArea?.width}x
                        {design.mergeConfig?.printArea?.height}px
                      </div>
                      <div className="text-[10px] text-gray-400 font-mono">
                        X:{design.mergeConfig?.printArea?.x} Y:
                        {design.mergeConfig?.printArea?.y}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100 uppercase">
                        <Layers size={10} />{" "}
                        {design.mergeConfig?.layers?.length || 0} Lớp
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 font-medium">
                      {format(new Date(design.createdAt), "dd/MM/yyyy")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() =>
                            window.open(
                              `${BASE_URL}${design.thumbnailUrl}`,
                              "_blank",
                            )
                          }
                          className="text-gray-600 hover:text-blue-600 transition-colors"
                          title="Xem ảnh"
                        >
                          <ExternalLink size={18} />
                        </button>
                        <button
                          onClick={() =>
                            handleDelete(design.id, design.designName)
                          }
                          disabled={deletingId === design.id}
                          className="text-red-500 hover:text-red-700 transition-colors disabled:text-gray-300"
                          title="Xóa"
                        >
                          {deletingId === design.id ? (
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

      {/* FOOTER */}
      {!loading && filteredDesigns.length > 0 && (
        <div className="mt-4 flex items-center justify-between text-sm text-gray-500 font-medium">
          <div>
            Hiển thị{" "}
            <span className="text-blue-600 font-bold">
              {filteredDesigns.length}
            </span>{" "}
            sản phẩm đã gộp
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerDesignManager;
