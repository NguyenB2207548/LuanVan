import React, { useState, useMemo } from "react";
import { Upload, Save, Layers, UploadCloud, Loader2 } from "lucide-react";
import axiosClient from "../../api/axiosClient";
import AssetManagerModal from "./AssetManagerModal";
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
}) => {
  const selectedLayer = layers.find((l) => l.id === selectedId);

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
  };

  const handleSaveDesign = async () => {
    if (!designName || !backgroundUrl)
      return alert("Please enter design name and background.");

    const templateData = {
      type: "F",
      background: backgroundUrl,
      details: layers,
    };

    await onSave({ designName, templateJson: templateData });
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
    <div className="w-[350px] bg-white flex flex-col shadow-sm z-10 border-l border-gray-200 overflow-hidden relative">
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <h1 className="text-sm font-bold uppercase tracking-wider text-gray-700 flex items-center gap-2">
          <Layers size={18} /> Design Builder
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* BASIC INFO */}
        <section className="space-y-3">
          <label className="text-xs font-semibold text-gray-600 block">
            Design Name <span className="text-red-500">*</span>
          </label>
          <input
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
            value={designName}
            onChange={(e) => setDesignName(e.target.value)}
          />

          {/* === NÚT IMPORT PSD ĐƯỢC THÊM VÀO ĐÂY === */}
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

          <label className="text-xs font-semibold text-gray-600 block mt-4">
            Background Image <span className="text-red-500">*</span>
          </label>
          <div
            onClick={() =>
              setModalConfig({
                isOpen: true,
                multiple: false,
                target: { type: "background" },
              })
            }
            className="flex flex-col items-center justify-center p-4 border border-dashed border-gray-300 rounded cursor-pointer hover:bg-gray-50 transition-colors bg-white relative overflow-hidden group"
          >
            {backgroundUrl ? (
              <>
                <img
                  src={`${BASE_URL}${backgroundUrl}`}
                  className="w-full h-24 object-cover rounded"
                  alt="bg"
                />
                <div className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center text-white text-xs font-bold gap-1">
                  <UploadCloud size={16} /> Change
                </div>
              </>
            ) : (
              <>
                <Upload size={20} className="text-gray-400 mb-2" />
                <span className="text-xs text-gray-500">
                  Choose from Assets
                </span>
              </>
            )}
          </div>
        </section>
        <hr className="border-gray-200" />

        {/* CÁC THÀNH PHẦN ĐÃ ĐƯỢC TÁCH COMPONENT */}
        <AddLayerButtons
          onAddLayer={(layer) => {
            setLayers([...layers, layer]);
            setSelectedId(layer.id);
          }}
        />
        <hr className="border-gray-200" />

        <LayerListManager
          layers={layers}
          selectedId={selectedId}
          onSelect={setSelectedId}
          // Truyền 3 props mới này vào
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
        ) : (
          <div className="text-center py-10">
            <p className="text-sm text-gray-400">Select a layer</p>
          </div>
        )}
      </div>

      {/* SAVE BUTTON */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <button
          onClick={handleSaveDesign}
          className="w-full bg-blue-600 text-white py-2.5 rounded-md font-medium text-sm hover:bg-blue-700 flex items-center justify-center gap-2"
        >
          <Save size={18} /> Save Design
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
