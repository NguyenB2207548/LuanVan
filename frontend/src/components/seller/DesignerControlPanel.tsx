import React, { useState, useMemo } from "react";
import {
  Upload,
  Save,
  Layers,
  UploadCloud,
  Loader2,
  ImageIcon,
  Eye,
  EyeOff,
  Move,
} from "lucide-react";
import AssetManagerModal from "../admin/AssetManagerModal";
import AddLayerButtons from "./AddLayerButtons";
import LayerListManager from "./LayerListManager";
import LayerPropertiesPanel from "./LayerPropertiesPanel";
import type { DesignLayer, ModalTarget } from "../../types/designer";

const BASE_URL = "http://localhost:3000";

interface DesignerControlPanelProps {
  designName: string;
  setDesignName: (name: string) => void;
  backgroundUrl: string;
  setBackgroundUrl: (url: string) => void;
  layers: DesignLayer[];
  setLayers: React.Dispatch<React.SetStateAction<DesignLayer[]>>;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  updateSelectedLayer: (field: string, value: any) => void;
  activeFilter: string;
  setActiveFilter: (filter: string) => void;
  onSave: (templateData: any) => Promise<void>;
  isExtractingPsd: boolean;
  // Bổ sung props để khớp với trang cha
  virtualPrintArea: any;
  setVirtualPrintArea: (area: any) => void;
  onOpenBgSelect: () => void;
}

const DesignerControlPanel: React.FC<DesignerControlPanelProps> = ({
  designName,
  setDesignName,
  backgroundUrl,
  setBackgroundUrl,
  layers,
  setLayers,
  selectedId,
  setSelectedId,
  updateSelectedLayer,
  activeFilter,
  setActiveFilter,
  onSave,
  isExtractingPsd,
  virtualPrintArea,
  setVirtualPrintArea,
  onOpenBgSelect,
}) => {
  const selectedLayer = layers.find((l) => l.id === selectedId);

  // Khôi phục hàm bị thiếu
  const updatePrintArea = (field: string, value: any) => {
    setVirtualPrintArea({ ...virtualPrintArea, [field]: value });
  };

  // --- STATE QUẢN LÝ MODAL ---
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    multiple: boolean;
    target: ModalTarget | null;
  }>({ isOpen: false, multiple: false, target: null });

  // --- LOGIC XỬ LÝ ẢNH ---
  const handleAssetsSelected = (urls: string[]) => {
    if (!modalConfig.target || urls.length === 0) return;
    const { type, index } = modalConfig.target;

    if (type === "background") {
      setBackgroundUrl(urls[0]);
    } else if (
      type === "group_option" &&
      index !== undefined &&
      selectedLayer
    ) {
      const newOptions = [...(selectedLayer.options || [])];
      newOptions[index].image_url = urls[0];
      updateSelectedLayer("options", newOptions);
    } else if (type === "dynamic_image" && selectedLayer) {
      const newOptions = urls.map((url, i) => ({
        id: `opt_${Date.now()}_${i}`,
        name: url.split("/").pop() || `Image`,
        image_url: url,
      }));
      updateSelectedLayer("options", [
        ...(selectedLayer.options || []),
        ...newOptions,
      ]);
      if (!selectedLayer.image_url && urls.length > 0)
        updateSelectedLayer("image_url", urls[0]);
    } else if (type === "static_image" && selectedLayer) {
      updateSelectedLayer("image_url", urls[0]);
    }
    setModalConfig({ isOpen: false, multiple: false, target: null });
  };
  const handleSaveDesign = async () => {
    // CHỈ kiểm tra designName, KHÔNG kiểm tra backgroundUrl nữa
    if (!designName) {
      return alert("Vui lòng nhập tên thiết kế.");
    }

    const templateData = {
      details: layers,
      internalMockup: backgroundUrl || "", // Cho phép rỗng
      printArea: virtualPrintArea,
    };

    // Gọi hàm onSave được truyền từ cha
    await onSave({
      designName,
      templateJson: templateData,
      thumbnailUrl: backgroundUrl || "", // Thumbnail cũng trở thành optional
    });
  };

  // Tự động tính toán các option để làm Condition
  const allGroupOptions = useMemo(() => {
    return layers
      .filter((l) => l.type === "group")
      .flatMap((group) =>
        (group.options || []).map((opt) => ({
          groupId: group.id,
          groupLabel: group.label,
          optId: opt.id,
          optName: opt.name,
        })),
      );
  }, [layers]);

  return (
    <div className="w-[350px] bg-white h-full flex flex-col shadow-sm z-10 border-l border-gray-200 overflow-hidden relative">
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <h1 className="text-sm font-bold uppercase tracking-wider text-gray-700 flex items-center gap-2">
          <Layers size={18} className="text-blue-600" /> Artwork Studio
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar pb-24">
        {/* BASIC INFO */}
        <section className="space-y-3">
          <label className="text-[10px] font-black text-gray-400 uppercase">
            Tên thiết kế
          </label>
          <input
            className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold outline-none focus:border-blue-500"
            value={designName}
            onChange={(e) => setDesignName(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onOpenBgSelect}
              className="flex items-center justify-center gap-2 p-2 bg-gray-900 text-white rounded-xl text-[11px] font-bold hover:bg-blue-600 transition-all"
            >
              <ImageIcon size={14} /> Mockup Phôi
            </button>
            <button
              onClick={() =>
                updatePrintArea("visible", !virtualPrintArea.visible)
              }
              className={`flex items-center justify-center gap-2 p-2 rounded-xl text-[11px] font-bold border transition-all ${
                virtualPrintArea.visible
                  ? "bg-blue-50 border-blue-200 text-blue-600"
                  : "bg-white border-gray-200 text-gray-400"
              }`}
            >
              {virtualPrintArea.visible ? (
                <Eye size={14} />
              ) : (
                <EyeOff size={14} />
              )}{" "}
              Vùng in
            </button>
          </div>

          <button
            onClick={() => document.getElementById("hidden-psd-input")?.click()}
            disabled={isExtractingPsd}
            className="mt-3 w-full flex justify-center items-center gap-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 py-2 rounded border border-indigo-200 font-medium text-sm transition-colors"
          >
            {isExtractingPsd ? (
              <>
                <Loader2 className="animate-spin" size={16} /> Extracting PSD...
              </>
            ) : (
              <>
                <UploadCloud size={16} /> Import PSD File
              </>
            )}
          </button>
        </section>

        <hr className="border-gray-200" />

        <AddLayerButtons
          onAddLayer={(layer) => {
            setLayers([...layers, layer]);
            setSelectedId(layer.id);
          }}
          currentLayerCount={layers.length}
        />

        <hr className="border-gray-200" />

        <LayerListManager
          layers={layers}
          selectedId={selectedId}
          onSelect={setSelectedId}
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
          allGroupOptions={allGroupOptions}
        />

        {selectedLayer ? (
          <LayerPropertiesPanel
            layer={selectedLayer}
            allGroupOptions={allGroupOptions}
            onUpdate={updateSelectedLayer}
            onDelete={() => {
              setLayers(layers.filter((l) => l.id !== selectedId));
              setSelectedId(null);
            }}
            onOpenModal={(target, multiple) =>
              setModalConfig({ isOpen: true, multiple, target })
            }
          />
        ) : selectedId === "print_area" ? (
          <div className="p-6 bg-blue-50 border border-blue-100 rounded-2xl text-center">
            <Move size={24} className="mx-auto text-blue-400 mb-2" />
            <p className="text-[10px] font-black text-blue-700 uppercase">
              Đang điều chỉnh vùng in
            </p>
          </div>
        ) : (
          <div className="text-center py-10 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
            <p className="text-[10px] font-bold text-gray-300 uppercase">
              Chọn Layer để cấu hình
            </p>
          </div>
        )}
      </div>

      {/* SAVE BUTTON */}
      <div className="p-4 border-t border-gray-200 bg-gray-50 absolute bottom-0 w-full shadow-lg">
        <button
          onClick={handleSaveDesign}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all"
        >
          <Save size={18} className="inline mr-2" /> Lưu Artwork
        </button>
      </div>

      <AssetManagerModal
        isOpen={modalConfig.isOpen}
        multiple={modalConfig.multiple}
        onClose={() =>
          setModalConfig({ isOpen: false, multiple: false, target: null })
        }
        onSelect={handleAssetsSelected}
      />
    </div>
  );
};

export default DesignerControlPanel;
