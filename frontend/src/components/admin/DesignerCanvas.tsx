import React, { useState } from "react";
import { Stage, Layer, Image as KonvaImage, Text } from "react-konva";
import useImage from "use-image";
import URLImage from "./URLImage";
import AssetManagerModal from "./AssetManagerModal";

const BASE_URL = "http://localhost:3000";

interface DesignerCanvasProps {
  backgroundUrl: string;
  layers: any[];
  setLayers: React.Dispatch<React.SetStateAction<any[]>>;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  // fileInputRef: React.RefObject<HTMLInputElement | null>;
  isUploading: boolean;
  updateSelectedLayer: (field: string, value: string | number) => void;
  activeFilter: string;
}

const DesignerCanvas: React.FC<DesignerCanvasProps> = ({
  backgroundUrl,
  layers,
  setLayers,
  selectedId,
  setSelectedId,
  isUploading,
  updateSelectedLayer,
  activeFilter,
}) => {
  const [bgImg] = useImage(
    backgroundUrl ? `${BASE_URL}${backgroundUrl}` : "",
    "anonymous",
  );

  // --- THÊM STATE QUẢN LÝ MODAL TRÊN CANVAS ---
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    targetLayerId: string | null;
  }>({
    isOpen: false,
    targetLayerId: null,
  });

  // --- HÀM XỬ LÝ KHI CHỌN ẢNH XONG ---
  const handleAssetsSelected = (urls: string[]) => {
    if (!modalConfig.targetLayerId || urls.length === 0) return;

    const selectedUrl = urls[0];

    const newLayers = layers.map((l) => {
      if (l.id === modalConfig.targetLayerId) {
        if (l.type === "dynamic_image") {
          const currentOptions = l.options || [];
          const isExist = currentOptions.find(
            (o: any) => o.image_url === selectedUrl,
          );

          let newOptions = [...currentOptions];
          if (!isExist) {
            newOptions.push({
              id: `opt_${Date.now()}`,
              name: selectedUrl.split("/").pop() || "Image",
              image_url: selectedUrl,
            });
          }

          return { ...l, image_url: selectedUrl, options: newOptions };
        }

        return { ...l, image_url: selectedUrl };
      }
      return l;
    });

    setLayers(newLayers);
  };

  return (
    <div className="flex-1 relative flex items-center justify-center bg-[#e5e7eb] overflow-hidden border-r border-gray-200">
      {/* Loading Overlay */}
      {isUploading && (
        <div className="absolute inset-0 bg-white/60 z-50 flex items-center justify-center">
          <div className="bg-white px-5 py-3 rounded-md shadow-lg border border-gray-100 flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span className="text-sm font-medium text-gray-700">
              Uploading...
            </span>
          </div>
        </div>
      )}

      {/* Canvas Area */}
      <div
        className="bg-white shadow-sm border border-gray-300 relative"
        style={{ width: 550, height: 550 }}
      >
        <Stage
          width={550}
          height={550}
          onMouseDown={(e) =>
            e.target === e.target.getStage() && setSelectedId(null)
          }
        >
          <Layer>
            {bgImg && <KonvaImage image={bgImg} width={550} height={550} />}
            {layers.map((l, i) => {
              if (l.type === "group") return null;

              if (
                activeFilter !== "ALL" &&
                l.show_condition &&
                l.show_condition !== activeFilter
              ) {
                return null;
              }

              return l.type === "text" || l.type === "dynamic_text" ? (
                <Text
                  key={l.id}
                  {...l}
                  text={l.text || ""}
                  draggable
                  fill={l.color}
                  onClick={() => setSelectedId(l.id)}
                  onDragEnd={(e) => {
                    updateSelectedLayer("x", Math.round(e.target.x()));
                    updateSelectedLayer("y", Math.round(e.target.y()));
                  }}
                />
              ) : (
                <URLImage
                  key={l.id}
                  l={l}
                  isSelected={l.id === selectedId}
                  onSelect={() => setSelectedId(l.id)}
                  onUploadClick={() =>
                    setModalConfig({ isOpen: true, targetLayerId: l.id })
                  }
                  onChange={(newProps: any) => {
                    const newLayers = [...layers];
                    newLayers[i] = { ...l, ...newProps };
                    setLayers(newLayers);
                  }}
                />
              );
            })}
          </Layer>
        </Stage>
      </div>

      {/* ---  MODAL QUẢN LÝ ẢNH --- */}
      <AssetManagerModal
        isOpen={modalConfig.isOpen}
        multiple={false}
        onClose={() => setModalConfig({ isOpen: false, targetLayerId: null })}
        onSelect={handleAssetsSelected}
      />
    </div>
  );
};

export default DesignerCanvas;
