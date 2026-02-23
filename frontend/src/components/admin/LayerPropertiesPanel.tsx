import React from "react";
import {
  Settings,
  Trash2,
  PlusCircle,
  XCircle,
  Upload,
  Image as ImageIcon,
  Eye,
} from "lucide-react";
import type { DesignLayer, ModalTarget } from "../../types/designer";

const BASE_URL = "http://localhost:3000";

interface LayerPropertiesPanelProps {
  layer: DesignLayer;
  allGroupOptions: any[];
  onUpdate: (field: string, value: any) => void;
  onDelete: () => void;
  onOpenModal: (target: ModalTarget, multiple: boolean) => void;
}

const LayerPropertiesPanel: React.FC<LayerPropertiesPanelProps> = ({
  layer,
  allGroupOptions,
  onUpdate,
  onDelete,
  onOpenModal,
}) => {
  const validConditionOptions = allGroupOptions.filter(
    (opt) => opt.groupId !== layer.id,
  );
  return (
    <section className="space-y-4 bg-blue-50/30 p-4 -mx-4 border-y border-blue-100 mt-4">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-xs font-bold text-blue-800 flex items-center gap-1">
          <Settings size={14} />{" "}
          {layer.type === "group" ? "Group Properties" : "Layer Properties"}
        </h3>
        <button
          onClick={onDelete}
          className="text-red-500 hover:text-red-700 p-1"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* GENERAL PROPS */}
      <div>
        <label className="text-[10px] uppercase text-gray-500 font-semibold mb-1 block">
          Label
        </label>
        <input
          className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
          value={layer.label}
          onChange={(e) => onUpdate("label", e.target.value)}
        />
      </div>
      <div>
        <label className="text-[10px] uppercase text-gray-500 font-semibold mb-1 block">
          Z-Index
        </label>
        <input
          type="number"
          className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
          value={layer.zIndex || 0}
          onChange={(e) => onUpdate("zIndex", Number(e.target.value))}
        />
      </div>

      {/* CONDITION */}
      {validConditionOptions.length > 0 && (
        <div className="bg-orange-50 p-2 rounded border border-orange-200">
          <label className="text-[10px] uppercase font-bold mb-1 block text-orange-800">
            Show Condition
          </label>
          <select
            className="w-full px-2 py-1.5 border border-orange-300 text-orange-900 rounded text-sm focus:outline-none bg-white"
            value={layer.show_condition || ""}
            onChange={(e) => onUpdate("show_condition", e.target.value)}
          >
            <option value="">-- Always Show --</option>
            {validConditionOptions.map((opt) => (
              <option key={opt.optId} value={opt.optId}>
                {/* Hiển thị thêm Tên Group cha để Admin dễ phân biệt */}
                {opt.groupLabel} : {opt.optName}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* DIMENSIONS */}
      {layer.type !== "group" && (
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div>
            <label className="text-[10px] uppercase text-gray-500 mb-1 block">
              X
            </label>
            <input
              type="number"
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
              value={Math.round(layer.x || 0)}
              onChange={(e) => onUpdate("x", Number(e.target.value))}
            />
          </div>
          <div>
            <label className="text-[10px] uppercase text-gray-500 mb-1 block">
              Y
            </label>
            <input
              type="number"
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
              value={Math.round(layer.y || 0)}
              onChange={(e) => onUpdate("y", Number(e.target.value))}
            />
          </div>
          {layer.type !== "text" && layer.type !== "dynamic_text" && (
            <>
              <div>
                <label className="text-[10px] uppercase text-gray-500 mb-1 block">
                  Width
                </label>
                <input
                  type="number"
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                  value={Math.round(layer.width || 100)}
                  onChange={(e) => onUpdate("width", Number(e.target.value))}
                />
              </div>
              <div>
                <label className="text-[10px] uppercase text-gray-500 mb-1 block">
                  Height
                </label>
                <input
                  type="number"
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                  value={Math.round(layer.height || 100)}
                  onChange={(e) => onUpdate("height", Number(e.target.value))}
                />
              </div>
            </>
          )}
        </div>
      )}

      {/* SPECIFIC PROPS: GROUP */}
      {layer.type === "group" && (
        <div className="space-y-3 pt-2 border-t border-blue-200">
          <label className="text-[10px] uppercase text-gray-500 font-semibold block">
            Options
          </label>
          {layer.options?.map((opt, index) => (
            <div
              key={opt.id}
              className="flex gap-2 items-center bg-white p-2 rounded border border-gray-200"
            >
              <div
                onClick={() =>
                  onOpenModal({ type: "group_option", index }, false)
                }
                className="w-14 h-14 flex-shrink-0 border border-dashed border-gray-300 rounded cursor-pointer flex items-center justify-center bg-gray-50 hover:bg-gray-100 overflow-hidden group relative"
              >
                {opt.image_url ? (
                  <>
                    <img
                      src={
                        opt.image_url.startsWith("http")
                          ? opt.image_url
                          : `${BASE_URL}${opt.image_url}`
                      }
                      className="w-full h-full object-cover"
                      alt="thumb"
                    />
                    <div className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center transition-all">
                      <Upload size={14} className="text-white" />
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center text-gray-400">
                    <Upload size={14} />
                    <span className="text-[8px] mt-1 font-medium">Asset</span>
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <input
                  placeholder="Option ID (e.g., layout_2)"
                  className="w-full text-xs border-b border-gray-200 pb-1 focus:outline-none focus:border-blue-500"
                  value={opt.id}
                  onChange={(e) => {
                    const newOptions = [...(layer.options || [])];
                    newOptions[index].id = e.target.value;
                    onUpdate("options", newOptions);
                  }}
                />
                <input
                  placeholder="Display Name (e.g., 2 People)"
                  className="w-full text-xs border-b border-gray-200 pb-1 focus:outline-none focus:border-blue-500"
                  value={opt.name}
                  onChange={(e) => {
                    const newOptions = [...(layer.options || [])];
                    newOptions[index].name = e.target.value;
                    onUpdate("options", newOptions);
                  }}
                />
              </div>
              <button
                className="text-red-400 hover:text-red-600"
                onClick={() =>
                  onUpdate(
                    "options",
                    layer.options?.filter((_, i) => i !== index),
                  )
                }
              >
                <XCircle size={16} />
              </button>
            </div>
          ))}
          <button
            onClick={() =>
              onUpdate("options", [
                ...(layer.options || []),
                { id: `opt_${Date.now()}`, name: "New Option", image_url: "" },
              ])
            }
            className="w-full py-1.5 border border-dashed border-blue-400 text-blue-600 rounded text-xs hover:bg-blue-50 flex items-center justify-center gap-1"
          >
            <PlusCircle size={14} /> Add Option
          </button>
        </div>
      )}

      {/* SPECIFIC PROPS: TEXT */}
      {layer.type === "text" ||
        (layer.type === "dynamic_text" && (
          <div className="space-y-3 pt-2 border-t border-blue-200">
            <label className="text-[10px] uppercase text-gray-500 font-semibold mb-1 block">
              Default Text
            </label>
            <input
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none"
              value={layer.text || ""}
              onChange={(e) => onUpdate("text", e.target.value)}
            />
          </div>
        ))}

      {/* SPECIFIC PROPS: DYNAMIC TEXT */}
      {layer.type === "dynamic_text" && (
        <div className="space-y-3 pt-2 border-t border-blue-200">
          <label className="text-[10px] uppercase text-gray-500 font-semibold block">
            Text Options ({layer.options?.length || 0})
          </label>
          {layer.options?.map((opt, index) => (
            <div
              key={opt.id}
              className="flex gap-2 items-center bg-white p-2 rounded border border-gray-200"
            >
              <div className="flex-1 space-y-2">
                <input
                  placeholder="Option ID (e.g., quote_1)"
                  className="w-full text-xs border-b border-gray-200 pb-1 focus:outline-none focus:border-blue-500"
                  value={opt.id}
                  onChange={(e) => {
                    const newOptions = [...(layer.options || [])];
                    newOptions[index].id = e.target.value;
                    onUpdate("options", newOptions);
                  }}
                />
                <input
                  placeholder="Text Value (e.g., Best Friends Forever)"
                  className="w-full text-xs border-b border-gray-200 pb-1 focus:outline-none focus:border-blue-500"
                  value={opt.name}
                  onChange={(e) => {
                    const newOptions = [...(layer.options || [])];
                    newOptions[index].name = e.target.value;
                    onUpdate("options", newOptions);
                  }}
                />
              </div>

              {/* CÁC NÚT THAO TÁC (XEM THỬ VÀ XÓA) */}
              <div className="flex flex-col gap-1">
                <button
                  className={`p-1.5 rounded transition-colors ${
                    layer.text === opt.name
                      ? "bg-blue-100 text-blue-600"
                      : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                  }`}
                  title="Preview on Canvas"
                  onClick={() => onUpdate("text", opt.name)} // Bấm vào để hiện text này lên Canvas
                >
                  <Eye size={14} />
                </button>
                <button
                  className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  onClick={() =>
                    onUpdate(
                      "options",
                      layer.options?.filter((_, i) => i !== index),
                    )
                  }
                >
                  <XCircle size={14} />
                </button>
              </div>
            </div>
          ))}

          {/* NÚT THÊM OPTION TEXT MỚI */}
          <button
            onClick={() =>
              onUpdate("options", [
                ...(layer.options || []),
                { id: `opt_${Date.now()}`, name: "New Quote" },
              ])
            }
            className="w-full py-1.5 border border-dashed border-blue-400 text-blue-600 rounded text-xs hover:bg-blue-50 flex items-center justify-center gap-1"
          >
            <PlusCircle size={14} /> Add Text Option
          </button>
        </div>
      )}

      {layer.type === "static_image" && (
        <div className="space-y-2 pt-2 border-t border-blue-200">
          <label className="text-[10px] uppercase text-gray-500 font-semibold block">
            Image Source
          </label>
          <div
            onClick={() => onOpenModal({ type: "static_image" }, false)}
            className="w-full h-24 border border-dashed border-gray-300 rounded cursor-pointer flex items-center justify-center bg-gray-50 hover:bg-gray-100 overflow-hidden relative group"
          >
            {layer.image_url ? (
              <>
                <img
                  src={
                    layer.image_url.startsWith("http")
                      ? layer.image_url
                      : `${BASE_URL}${layer.image_url}`
                  }
                  className="w-full h-full object-contain"
                  alt="static"
                />
                <div className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center transition-all">
                  <Upload size={20} className="text-white" />
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center text-gray-400">
                <Upload size={20} />
                <span className="text-[10px] mt-1">Select Image</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SPECIFIC PROPS: DYNAMIC IMAGE */}
      {layer.type === "dynamic_image" && (
        <div className="space-y-2 pt-2 border-t border-blue-200">
          <label className="text-[10px] uppercase text-gray-500 font-semibold block">
            Image Options ({layer.options?.length || 0})
          </label>
          <button
            onClick={() => onOpenModal({ type: "dynamic_image" }, true)}
            className="w-full py-1.5 border border-blue-300 bg-white text-blue-600 rounded text-xs hover:bg-blue-50 transition-colors flex justify-center items-center gap-2"
          >
            <ImageIcon size={14} /> Choose from Assets
          </button>
          <div className="grid grid-cols-4 gap-2 mt-2">
            {layer.options?.map((opt) => (
              <div
                key={opt.id}
                className={`relative rounded cursor-pointer overflow-hidden border-2 transition-all ${layer.image_url === opt.image_url ? "border-blue-500 shadow-md" : "border-gray-200 hover:border-gray-400"}`}
                onClick={() => onUpdate("image_url", opt.image_url)}
                title={opt.name}
              >
                <img
                  src={
                    opt.image_url?.startsWith("http")
                      ? opt.image_url
                      : `${BASE_URL}${opt.image_url}`
                  }
                  className="w-full aspect-square object-cover bg-gray-50"
                  alt="option"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default LayerPropertiesPanel;
