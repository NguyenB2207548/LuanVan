import React, { useState, useMemo } from "react";
import { Save, Layers, ImageIcon, Eye, EyeOff, Move, FileCode, Sparkles } from "lucide-react";
import AssetManagerModal from "../admin/AssetManagerModal";
import AddLayerButtons from "./AddLayerButtons";
import LayerListManager from "./LayerListManager";
import LayerPropertiesPanel from "./LayerPropertiesPanel";
import type { DesignLayer, ModalTarget } from "../../types/designer";
import axiosClient from "../../api/axiosClient";
import AiLayerModal from "../../modals/AiLayerModal";

const BASE_URL = "http://localhost:3000";

interface DesignerControlPanelProps {
  artworkName: string;
  setArtworkName: (name: string) => void;
  backgroundUrl: string;
  setBackgroundUrl: (url: string) => void;
  layers: DesignLayer[];
  setLayers: React.Dispatch<React.SetStateAction<DesignLayer[]>>;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  updateSelectedLayer: (field: string, value: any) => void;
  activeFilter: string;
  setActiveFilter: (filter: string) => void;
  onSave: (layersData: any) => Promise<void>;
  isExtractingPsd: boolean;
  setIsExtractingPsd: (loading: boolean) => void; // Thêm prop này để control loading từ bên ngoài nếu cần
  virtualPrintArea: any;
  setVirtualPrintArea: (area: any) => void;
  onOpenBgSelect: () => void;
}

const DesignerControlPanel: React.FC<DesignerControlPanelProps> = ({
  artworkName,
  setArtworkName,
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
  setIsExtractingPsd,
  virtualPrintArea,
  setVirtualPrintArea,
  onOpenBgSelect,
}) => {
  const selectedLayer = layers.find((l) => l.id === selectedId);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  const updatePrintArea = (field: string, value: any) => {
    setVirtualPrintArea({ ...virtualPrintArea, [field]: value });
  };

  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    multiple: boolean;
    target: ModalTarget | null;
  }>({ isOpen: false, multiple: false, target: null });

  // --- IMPORT PSD ---
  const handlePsdUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setIsExtractingPsd(true);
    try {
      // Gọi tới endpoint bóc tách PSD của bạn
      const response = await axiosClient.post("/psd/extract", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("PSD Data:", response.data);

      const { mockup, details, printArea: psdPrintArea } = response.data;

      // Cập nhật các trạng thái từ file PSD
      if (mockup) setBackgroundUrl(mockup);
      if (psdPrintArea) setVirtualPrintArea(psdPrintArea);
      if (details && details.length > 0) {
        setLayers(details);
        setSelectedId(details[details.length - 1].id); // Chọn layer trên cùng
      }

      alert("Bóc tách PSD thành công!");
    } catch (error) {
      console.error("PSD Error:", error);
      alert("Lỗi khi bóc tách file PSD. Vui lòng kiểm tra định dạng.");
    } finally {
      setIsExtractingPsd(false);
      e.target.value = ""; // Reset input
    }
  };

  const handleApplyAiLayers = (aiLayers: any[]) => {
    // Option 1: Ghi đè toàn bộ layer cũ
    // setLayers(aiLayers); 

    // Option 2: Thêm nối tiếp vào layer hiện có
    setLayers(prev => [...prev, ...aiLayers]);

    // Thông thường layer cuối cùng của AI là background
    if (aiLayers.length > 0) {
      setSelectedId(aiLayers[aiLayers.length - 1].id);
    }
  };

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
    if (!artworkName) return alert("Vui lòng nhập tên thiết kế.");
    const layersData = {
      details: layers,
      mockup: backgroundUrl || "",
      printArea: virtualPrintArea,
    };
    await onSave({ artworkName, layersJson: layersData });
  };

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
    <div className="w-[320px] bg-white h-full flex flex-col border-l border-gray-300 relative text-gray-800">
      {/* HEADER - Sharp edges */}
      <div className="p-3 border-b border-gray-300 bg-gray-100 flex justify-between items-center">
        <h1 className="text-xs font-bold uppercase flex items-center gap-2">
          <Layers size={16} /> Designer Panel
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-5 custom-scrollbar pb-20">
        {/* BASIC INFO SECTION */}
        <section className="space-y-4">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-gray-600 uppercase">
              Tên thiết kế
            </label>
            <input
              className="w-full p-2 bg-white border border-gray-300 rounded-sm text-sm outline-none focus:border-blue-500"
              value={artworkName}
              onChange={(e) => setArtworkName(e.target.value)}
            />
          </div>

          {/* Hidden PSD Input */}
          <input
            id="hidden-psd-input"
            type="file"
            accept=".psd"
            className="hidden"
            onChange={handlePsdUpload}
          />

          <div className="flex gap-2 w-full">
            {/* Nút Import PSD */}
            <button
              onClick={() => document.getElementById("hidden-psd-input")?.click()}
              disabled={isExtractingPsd}
              className="flex-1 py-2 bg-gray-800 text-white text-[10px] font-bold uppercase rounded-sm hover:bg-black transition-colors disabled:bg-gray-400 flex items-center justify-center gap-2"
            >
              {isExtractingPsd ? (
                <span className="flex items-center gap-2">
                  <FileCode size={14} className="animate-pulse" /> ...
                </span>
              ) : (
                <>
                  <FileCode size={14} /> PSD
                </>
              )}
            </button>

            {/* Nút AI Layer Tool */}
            <button
              onClick={() => setIsAiModalOpen(true)}
              className="flex-1 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[10px] font-bold uppercase rounded-sm hover:from-purple-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <Sparkles size={14} /> AI Tool
            </button>
          </div>
          {/* MOCKUP AREA - Minimal radius */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-gray-600 uppercase">
              Mockup
            </label>
            <div
              onClick={onOpenBgSelect}
              className="relative aspect-video bg-gray-100 border border-gray-300 rounded-sm flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200 overflow-hidden"
            >
              {backgroundUrl ? (
                <img
                  src={`${BASE_URL}${backgroundUrl}`}
                  className="w-full h-full object-contain"
                  alt="mockup"
                />
              ) : (
                <div className="flex flex-col items-center">
                  <ImageIcon size={20} className="text-gray-400 mb-1" />
                  <span className="text-[10px] text-gray-500">
                    Click to upload
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* PRINT AREA - Clean table style */}
          <div className="p-3 border border-gray-300 bg-white space-y-3">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <label className="text-[11px] font-bold uppercase flex items-center gap-2">
                <Move size={12} /> Print Area
              </label>
              <button
                onClick={() =>
                  updatePrintArea("visible", !virtualPrintArea.visible)
                }
                className="text-gray-500 hover:text-blue-600"
              >
                {virtualPrintArea.visible ? (
                  <Eye size={16} />
                ) : (
                  <EyeOff size={16} />
                )}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-gray-500">Width (px)</span>
                <input
                  type="number"
                  className="w-full p-1 border border-gray-200 text-sm font-mono"
                  value={Math.round(virtualPrintArea.width)}
                  onChange={(e) =>
                    updatePrintArea("width", Number(e.target.value))
                  }
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-gray-500">Height (px)</span>
                <input
                  type="number"
                  className="w-full p-1 border border-gray-200 text-sm font-mono"
                  value={Math.round(virtualPrintArea.height)}
                  onChange={(e) =>
                    updatePrintArea("height", Number(e.target.value))
                  }
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-gray-500">X Position</span>
                <input
                  type="number"
                  className="w-full p-1 border border-gray-200 text-sm font-mono"
                  value={Math.round(virtualPrintArea.x)}
                  onChange={(e) => updatePrintArea("x", Number(e.target.value))}
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-gray-500">Y Position</span>
                <input
                  type="number"
                  className="w-full p-1 border border-gray-200 text-sm font-mono"
                  value={Math.round(virtualPrintArea.y)}
                  onChange={(e) => updatePrintArea("y", Number(e.target.value))}
                />
              </div>
            </div>
          </div>
        </section>

        <div className="h-px bg-gray-300" />

        <AddLayerButtons
          onAddLayer={(layer) => {
            setLayers([...layers, layer]);
            setSelectedId(layer.id);
          }}
          currentLayerCount={layers.length}
        />

        <div className="h-px bg-gray-300" />

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
        ) : (
          <div className="text-center py-6 border border-dashed border-gray-300 text-[10px] text-gray-400 uppercase">
            No layer selected
          </div>
        )}
      </div>

      {/* SAVE BUTTON - Solid and sharp */}
      <div className="p-3 border-t border-gray-300 bg-gray-100 absolute bottom-0 w-full">
        <button
          onClick={handleSaveDesign}
          className="w-full bg-blue-700 text-white py-2.5 rounded-sm font-bold text-xs uppercase hover:bg-blue-800 transition-colors"
        >
          <Save size={16} className="inline mr-2" /> Save Design
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

      <AiLayerModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onApply={handleApplyAiLayers}
      />
    </div>
  );
};

export default DesignerControlPanel;