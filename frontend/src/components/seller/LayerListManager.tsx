import React from "react";
import {
  Type,
  Upload,
  Layers,
  FolderTree,
  Image as ImageIcon,
  TextCursorInput,
  FileImage,
} from "lucide-react";
import type { DesignLayer, LayerType } from "../../types/designer";

const getLayerIcon = (type: LayerType) => {
  switch (type) {
    case "text":
      return <Type size={14} className="text-blue-500" />;
    case "dynamic_text":
      return <TextCursorInput size={14} className="text-pink-500" />;
    case "upload":
      return <Upload size={14} className="text-orange-500" />;
    case "dynamic_image":
      return <ImageIcon size={14} className="text-green-500" />;
    case "static_image":
      return <FileImage size={14} className="text-teal-500" />;
    case "group":
      return <FolderTree size={14} className="text-purple-500" />;
    default:
      return <Layers size={14} />;
  }
};

interface LayerListManagerProps {
  layers: DesignLayer[];
  selectedId: string | null;
  onSelect: (id: string | null) => void; // Cho phép null để bỏ chọn

  // === THÊM CÁC PROPS MỚI CHO BỘ LỌC ===
  activeFilter: string;
  setActiveFilter: (filter: string) => void;
  allGroupOptions: any[];
}

const LayerListManager: React.FC<LayerListManagerProps> = ({
  layers,
  selectedId,
  onSelect,
  activeFilter,
  setActiveFilter,
  allGroupOptions,
}) => {
  const sortedLayers = [...layers].sort(
    (a, b) => (b.zIndex || 0) - (a.zIndex || 0),
  );

  return (
    <section className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-xs font-semibold text-gray-600 block">
          Layers Manager
        </label>
        <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-500 border border-gray-200">
          {layers.length} items
        </span>
      </div>

      {/* ===  BỘ LỌC WORKSPACE === */}
      {allGroupOptions.length > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded p-1.5 mb-2">
          <select
            className="w-full bg-transparent text-xs text-indigo-800 font-bold focus:outline-none cursor-pointer"
            value={activeFilter}
            onChange={(e) => {
              setActiveFilter(e.target.value);
              onSelect(null);
            }}
          >
            <option value="ALL"> View All</option>
            {allGroupOptions.map((opt: any) => (
              <option key={opt.optId} value={opt.optId}>
                Only Edit: {opt.optName}
              </option>
            ))}
          </select>
        </div>
      )}
      {/* ========================================== */}

      <div className="border border-gray-200 rounded-md overflow-hidden bg-gray-50 max-h-[200px] overflow-y-auto">
        {sortedLayers.length === 0 ? (
          <div className="text-center py-4 text-xs text-gray-400 italic">
            No layers
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-gray-200">
            {sortedLayers.map((l) => {
              const isFilteredOut =
                activeFilter !== "ALL" &&
                l.show_condition &&
                l.show_condition !== activeFilter;

              return (
                <div
                  key={l.id}
                  onClick={() => {
                    if (!isFilteredOut) onSelect(l.id);
                  }}
                  className={`flex items-center gap-3 p-2 text-sm transition-colors 
                    ${isFilteredOut ? "opacity-30 cursor-not-allowed bg-gray-100" : "cursor-pointer"} 
                    ${selectedId === l.id ? "bg-blue-100 border-l-4 border-blue-500" : "bg-white border-l-4 border-transparent hover:bg-gray-50"}
                  `}
                >
                  <div className="w-5 flex justify-center">
                    {getLayerIcon(l.type)}
                  </div>
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <span
                      className={`font-medium truncate text-[13px] ${isFilteredOut ? "line-through text-gray-400" : "text-gray-700"}`}
                    >
                      {l.label || "Unnamed Layer"}
                    </span>
                    <span className="text-[10px] text-gray-400 truncate font-mono">
                      {l.id}
                    </span>
                  </div>
                  <div
                    className="text-[10px] font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-500"
                    title="Z-Index"
                  >
                    Z: {l.zIndex}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default LayerListManager;
