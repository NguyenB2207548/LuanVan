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

  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    targetLayerId: string | null;
  }>({
    isOpen: false,
    targetLayerId: null,
  });

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

  // === THUẬT TOÁN TÍNH SCALE ===
  // Cố định chiều rộng hiển thị trên màn hình là 550px
  const CONTAINER_WIDTH = 550;

  // Tính tỷ lệ thu nhỏ: Nếu ảnh gốc 1100px thì tỷ lệ là 0.5
  const scaleRatio = bgImg ? CONTAINER_WIDTH / bgImg.width : 1;

  // Chiều cao tự động co giãn theo tỷ lệ
  const stageHeight = bgImg ? bgImg.height * scaleRatio : 550;

  return (
    <div className="flex-1 relative flex items-center justify-center bg-[#e5e7eb] overflow-hidden border-r border-gray-200">
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

      {/* Cập nhật lại khung chứa bao bọc Stage */}
      <div
        className="bg-white shadow-sm border border-gray-300 relative"
        style={{ width: CONTAINER_WIDTH, height: stageHeight }}
      >
        <Stage
          width={CONTAINER_WIDTH}
          height={stageHeight}
          scale={{ x: scaleRatio, y: scaleRatio }} // <-- ÁP DỤNG SCALE VÀO ĐÂY
          onMouseDown={(e) => {
            // Click vào chỗ trống hoặc click vào background thì unselect
            if (
              e.target === e.target.getStage() ||
              e.target.name() === "background"
            ) {
              setSelectedId(null);
            }
          }}
        >
          <Layer>
            {/* LƯU Ý QUAN TRỌNG: Gỡ bỏ width={550} height={550} ở đây.
                Để cho Background vẽ đúng kích thước gốc, Stage sẽ tự bóp nó lại */}
            {bgImg && <KonvaImage image={bgImg} name="background" />}

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
                  x={l.x}
                  y={l.y}
                  text={l.text || ""}
                  fontSize={l.fontSize || 24}
                  fontFamily={l.fontFamily || "Arial"}
                  fill={l.color || "#000000"}
                  draggable
                  onClick={() => setSelectedId(l.id)}
                  onDragStart={() => setSelectedId(l.id)}
                  onDragEnd={(e) => {
                    const newLayers = [...layers];
                    newLayers[i] = {
                      ...l,
                      // Mặc dù kéo trên màn hình nhỏ, e.target.x() vẫn trả về đúng tọa độ của file gốc!
                      x: Math.round(e.target.x()),
                      y: Math.round(e.target.y()),
                    };
                    setLayers(newLayers);
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
