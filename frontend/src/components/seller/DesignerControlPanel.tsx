import React, { useState, useMemo, useEffect } from "react";
import {
  Save,
  Layers,
  FileCode,
  Sparkles,
  RefreshCw,
  Frame,
  Download, // Dùng icon Frame cho Canvas
} from "lucide-react";
import AssetManagerModal from "../admin/AssetManagerModal";
import AddLayerButtons from "./AddLayerButtons";
import LayerListManager from "./LayerListManager";
import LayerPropertiesPanel from "./LayerPropertiesPanel";
import type { DesignLayer, ModalTarget } from "../../types/designer";
import axiosClient from "../../api/axiosClient";
import AiLayerModal from "../../modals/AiLayerModal";

interface DesignerControlPanelProps {
  artworkName: string;
  setArtworkName: (name: string) => void;
  layers: DesignLayer[];
  setLayers: React.Dispatch<React.SetStateAction<DesignLayer[]>>;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  updateSelectedLayer: (field: string, value: any) => void;
  activeFilter: string;
  setActiveFilter: (filter: string) => void;
  onSave: (layersData: any) => Promise<void>;
  isExtractingPsd: boolean;
  setIsExtractingPsd: (loading: boolean) => void;
  // MỚI: Nhận props canvasSize thay vì background & printArea
  canvasSize: { width: number; height: number };
  setCanvasSize: (size: { width: number; height: number }) => void;
  isEditMode?: boolean;
}

const DesignerControlPanel: React.FC<DesignerControlPanelProps> = ({
  artworkName,
  setArtworkName,
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
  canvasSize,
  setCanvasSize,
  isEditMode = false,
}) => {
  const selectedLayer = layers.find((l) => l.id === selectedId);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importProducts, setImportProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    multiple: boolean;
    target: ModalTarget | null;
  }>({ isOpen: false, multiple: false, target: null });

  useEffect(() => {
    const handleOpenAssetModal = (e: any) => {
      const { type } = e.detail;
      setModalConfig({
        isOpen: true,
        multiple: type === "dynamic_image",
        target: { type },
      });
    };

    window.addEventListener("OPEN_ASSET_MODAL", handleOpenAssetModal);
    return () => {
      window.removeEventListener("OPEN_ASSET_MODAL", handleOpenAssetModal);
    };
  }, []);

  const handleOpenImportPrintArea = async () => {
    setIsImportModalOpen(true);
    setLoadingProducts(true);
    try {
      const res = await axiosClient.get("/products/seller");
      setImportProducts(res.data.data || []);
    } catch (err) {
      console.error("Lỗi fetch products", err);
      alert("Không thể tải danh sách sản phẩm.");
    } finally {
      setLoadingProducts(false);
    }
  };

  // Hàm áp dụng Print Area vào Canvas Size
  const applyProductPrintArea = (product: any) => {
    const printArea = product.mockup?.printArea;
    if (printArea && printArea.width && printArea.height) {
      setCanvasSize({
        width: Math.round(Number(printArea.width)),
        height: Math.round(Number(printArea.height)),
      });
      setIsImportModalOpen(false);
    } else {
      alert("Sản phẩm này chưa được cấu hình Print Area!");
    }
  };

  // --- IMPORT PSD ---
  const handlePsdUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setIsExtractingPsd(true);
    try {
      const response = await axiosClient.post("/psd/extract", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Lấy đúng canvasSize và details từ Backend trả về
      const { details, canvasSize: psdCanvasSize } = response.data;

      // Cập nhật lại kích thước tờ giấy
      if (psdCanvasSize) {
        setCanvasSize({
          width: psdCanvasSize.width,
          height: psdCanvasSize.height,
        });
      }

      // Đổ layer vào màn hình
      if (details && details.length > 0) {
        setLayers(details);
        setSelectedId(details[details.length - 1].id);
      }
      alert("Bóc tách PSD thành công!");
    } catch (error) {
      console.error("PSD Error:", error);
      alert("Lỗi khi bóc tách file PSD. Vui lòng kiểm tra định dạng.");
    } finally {
      setIsExtractingPsd(false);
      e.target.value = "";
    }
  };

  const handleApplyAiLayers = (aiLayers: any[]) => {
    setLayers((prev) => [...prev, ...aiLayers]);
    if (aiLayers.length > 0) {
      setSelectedId(aiLayers[aiLayers.length - 1].id);
    }
  };

  const handleAssetsSelected = (urls: string[]) => {
    if (!modalConfig.target || urls.length === 0) return;
    const { type, index } = modalConfig.target;

    if (type === "group_option" && index !== undefined && selectedLayer) {
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
      if (urls.length > 0) {
        updateSelectedLayer("image_url", urls[0]);
      }
    } else if (type === "static_image" && selectedLayer) {
      updateSelectedLayer("image_url", urls[0]);
    }
    setModalConfig({ isOpen: false, multiple: false, target: null });
  };

  // --- LƯU ARTWORK ---
  const handleSaveDesign = async () => {
    if (!artworkName) return alert("Vui lòng nhập tên thiết kế.");
    // Cấu trúc mới: Chỉ lưu canvasSize và layers
    const layersData = {
      canvasSize: canvasSize,
      details: layers,
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
      <div className="p-3 border-b border-gray-300 bg-gray-100 flex justify-between items-center">
        <h1 className="text-xs font-bold uppercase flex items-center gap-2">
          <Layers size={16} /> {isEditMode ? "Edit Artwork" : "Designer Panel"}
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-5 custom-scrollbar pb-20">
        <section className="space-y-4">
          {/* Tên Thiết Kế */}
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

          <input
            id="hidden-psd-input"
            type="file"
            accept=".psd"
            className="hidden"
            onChange={handlePsdUpload}
          />

          <div className="flex gap-2 w-full">
            <button
              onClick={() =>
                document.getElementById("hidden-psd-input")?.click()
              }
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

            <button
              onClick={() => setIsAiModalOpen(true)}
              className="flex-1 py-2 bg-linear-to-r from-purple-600 to-indigo-600 text-white text-[10px] font-bold uppercase rounded-sm hover:from-purple-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <Sparkles size={14} /> AI Tool
            </button>
          </div>

          {/* MỚI: BẢNG CHỈNH KÍCH THƯỚC CANVAS */}
          <div className="p-3 border border-gray-300 bg-white space-y-3">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <label className="text-[11px] font-bold uppercase flex items-center gap-2 text-gray-700">
                <Frame size={12} /> Canvas Size (px)
              </label>
              {/* 👇 NÚT IMPORT MỚI ĐƯỢC THÊM VÀO ĐÂY 👇 */}
              <button
                onClick={handleOpenImportPrintArea}
                className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 px-2 py-1 bg-blue-50 rounded transition-colors"
                title="Lấy kích thước từ Print Area của Sản phẩm phôi"
              >
                <Download size={10} /> Get Print Area
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-gray-500 font-semibold">
                  Width
                </span>
                <input
                  type="number"
                  className="w-full p-1.5 border border-gray-200 text-sm font-mono focus:border-blue-400 outline-none rounded-sm"
                  value={Math.round(canvasSize.width)}
                  onChange={(e) =>
                    setCanvasSize({
                      ...canvasSize,
                      width: Number(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-gray-500 font-semibold">
                  Height
                </span>
                <input
                  type="number"
                  className="w-full p-1.5 border border-gray-200 text-sm font-mono focus:border-blue-400 outline-none rounded-sm"
                  value={Math.round(canvasSize.height)}
                  onChange={(e) =>
                    setCanvasSize({
                      ...canvasSize,
                      height: Number(e.target.value) || 0,
                    })
                  }
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

      <div className="p-3 border-t border-gray-300 bg-gray-100 absolute bottom-0 w-full">
        <button
          onClick={handleSaveDesign}
          className={`w-full ${isEditMode ? "bg-emerald-600 hover:bg-emerald-700" : "bg-blue-700 hover:bg-blue-800"} text-white py-2.5 rounded-sm font-bold text-xs uppercase transition-colors`}
        >
          {isEditMode ? (
            <>
              <RefreshCw size={16} className="inline mr-2" /> Update Artwork
            </>
          ) : (
            <>
              <Save size={16} className="inline mr-2" /> Lưu thiết kế
            </>
          )}
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

      {/* MODAL IMPORT PRINT AREA */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-100 max-h-[80vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-sm text-gray-800">
                Lấy kích thước từ Sản phẩm
              </h3>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-gray-400 hover:text-red-500"
              >
                ✕
              </button>
            </div>

            <div className="p-2 overflow-y-auto flex-1 custom-scrollbar">
              {loadingProducts ? (
                <div className="flex justify-center py-10">
                  <RefreshCw className="animate-spin text-blue-500" size={24} />
                </div>
              ) : importProducts.length === 0 ? (
                <div className="text-center py-8 text-sm text-gray-500 italic">
                  Chưa có sản phẩm nào
                </div>
              ) : (
                <div className="space-y-1">
                  {importProducts.map((p) => {
                    const thumb =
                      p.images?.find((i: any) => i.isPrimary)?.url ||
                      p.mockup?.url;

                    const printArea = p.mockup?.printArea;
                    const hasPrintArea = !!printArea;

                    return (
                      <button
                        key={p.id}
                        onClick={() => applyProductPrintArea(p)}
                        className="w-full flex items-center gap-3 p-2 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100 text-left group"
                      >
                        <div className="w-10 h-10 rounded border border-gray-200 bg-white overflow-hidden shrink-0 flex items-center justify-center">
                          {thumb ? (
                            <img
                              src={`http://localhost:3000${thumb}`}
                              className="w-full h-full object-contain"
                              alt=""
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-100" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-700 truncate group-hover:text-blue-700">
                            {p.productName}
                          </p>
                          {hasPrintArea ? (
                            <p className="text-[10px] text-gray-500">
                              Print Area:{" "}
                              <span className="font-mono text-blue-600">
                                {Math.round(printArea.width)} x{" "}
                                {Math.round(printArea.height)}
                              </span>
                            </p>
                          ) : (
                            <p className="text-[10px] text-red-500 italic">
                              Chưa cấu hình Print Area
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DesignerControlPanel;
