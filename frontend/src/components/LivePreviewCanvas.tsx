// src/components/LivePreviewCanvas.tsx
import React, { useEffect, useState, useRef } from "react";
import { Stage, Layer, Image as KonvaImage, Text } from "react-konva";

// SỬA LẠI HÀM NÀY: Truyền thêm toàn bộ cấu trúc layers vào
const checkLayerCondition = (
  layer: any,
  currentChoices: Record<string, any>,
  allLayers: any[],
): boolean => {
  if (!layer.show_condition) {
    return true;
  }

  const parentGroup = allLayers.find(
    (l) =>
      l.type === "group" &&
      l.options?.some((opt: any) => opt.id === layer.show_condition),
  );

  if (!parentGroup) return false;

  if (!checkLayerCondition(parentGroup, currentChoices, allLayers)) {
    return false;
  }

  const activeOptionIdForGroup =
    currentChoices[parentGroup.id] !== undefined
      ? currentChoices[parentGroup.id]
      : parentGroup.options?.[0]?.id;

  return activeOptionIdForGroup === layer.show_condition;
};

const useImageLoader = (url: string | null) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    if (!url) {
      setImage(null);
      return;
    }
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => setImage(img);
    img.onerror = () => {
      console.warn("CORS error, retrying without crossOrigin:", url);
      const fallbackImg = new window.Image();
      fallbackImg.onload = () => setImage(fallbackImg);
      fallbackImg.src = url;
    };
    img.src = url;
  }, [url]);
  return image;
};

const KonvaImageLayer = ({
  source,
  layerProps,
}: {
  source: string | File;
  layerProps: any;
}) => {
  const [imgSrc, setImgSrc] = useState<string | null>(null);

  useEffect(() => {
    if (source instanceof File) {
      const url = URL.createObjectURL(source);
      setImgSrc(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setImgSrc(source);
    }
  }, [source]);

  const image = useImageLoader(imgSrc);
  if (!image) return null;

  return (
    <KonvaImage
      image={image}
      x={layerProps.x}
      y={layerProps.y}
      width={layerProps.width || image.width}
      height={layerProps.height || image.height}
    />
  );
};

interface LivePreviewCanvasProps {
  designData: any;
  designChoices: Record<number, any>;
  baseUrl: string;
}

const ADMIN_STAGE_WIDTH = 550;
const ADMIN_STAGE_HEIGHT = 550;

const LivePreviewCanvas: React.FC<LivePreviewCanvasProps> = ({
  designData,
  designChoices,
  baseUrl,
}) => {
  const backgroundUrl = designData?.templateJson?.background
    ? `${baseUrl}${designData.templateJson.background}`
    : null;
  const bgImage = useImageLoader(backgroundUrl);

  // Lưu lại danh sách gốc chưa sort để check condition
  const rawLayers = designData?.templateJson?.details || [];

  const layers = designData?.templateJson?.details
    ? [...designData.templateJson.details].sort(
        (a, b) => (a.zIndex || 0) - (b.zIndex || 0),
      )
    : [];

  // const containerRef = useRef<HTMLDivElement>(null);

  // const [stageConfig, setStageConfig] = useState({
  //   width: ADMIN_STAGE_WIDTH,
  //   height: ADMIN_STAGE_HEIGHT,
  //   scale: 1,
  // });

  // useEffect(() => {
  //   const calculateFitSize = () => {
  //     if (!containerRef.current) return;

  //     const containerWidth = containerRef.current.clientWidth;
  //     const containerHeight = containerRef.current.clientHeight;

  //     const scaleX = containerWidth / ADMIN_STAGE_WIDTH;
  //     const scaleY = containerHeight / ADMIN_STAGE_HEIGHT;
  //     const fitScale = Math.min(scaleX, scaleY);

  //     setStageConfig({
  //       width: ADMIN_STAGE_WIDTH * fitScale,
  //       height: ADMIN_STAGE_HEIGHT * fitScale,
  //       scale: fitScale,
  //     });
  //   };

  //   calculateFitSize();
  //   window.addEventListener("resize", calculateFitSize);
  //   return () => window.removeEventListener("resize", calculateFitSize);
  // }, []);

  const containerRef = useRef<HTMLDivElement>(null);

  const [stageConfig, setStageConfig] = useState({
    width: 0,
    height: 0,
    scale: 1,
  });

  // === THUẬT TOÁN TÍNH SCALE RESPONSIVE CHO CLIENT ===
  useEffect(() => {
    const calculateFitSize = () => {
      // 1. Phải chờ cả container và ảnh nền load xong
      if (!containerRef.current || !bgImage) return;

      const container = containerRef.current;
      const bgWidth = bgImage.width;
      const bgHeight = bgImage.height;

      // 2. Lấy không gian tối đa mà trình duyệt cấp cho cái div chứa canvas
      const availableWidth = container.clientWidth;
      const availableHeight = container.clientHeight;

      // 3. Tính tỷ lệ Scale sao cho hình Nền (bgImage) NHÉT VỪA vặn vào div
      // mà KHÔNG bị bóp méo tỷ lệ (giống thuộc tính object-fit: contain của CSS)
      const scaleX = availableWidth / bgWidth;
      const scaleY = availableHeight / bgHeight;
      const fitScale = Math.min(scaleX, scaleY); // Chọn tỷ lệ nhỏ hơn để không bị tràn màn hình

      // 4. Cập nhật cấu hình Stage
      setStageConfig({
        width: bgWidth * fitScale, // Bề rộng hiển thị trên màn hình
        height: bgHeight * fitScale, // Chiều cao hiển thị trên màn hình
        scale: fitScale, // Tỷ lệ bóp nhỏ nội bộ Konva
      });
    };

    calculateFitSize();
    window.addEventListener("resize", calculateFitSize);
    return () => window.removeEventListener("resize", calculateFitSize);

    // Khi ảnh nền thay đổi hoặc load xong, phải chạy lại hàm tính toán này
  }, [bgImage]);

  // Nếu chưa có ảnh nền thì không cần render Stage để tránh lỗi 0x0
  if (!bgImage) {
    return (
      <div className="w-full h-full flex items-center justify-center p-4">
        <span className="text-gray-400 animate-pulse">Loading preview...</span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex items-center justify-center p-4 relative"
    >
      <Stage
        width={stageConfig.width}
        height={stageConfig.height}
        scaleX={stageConfig.scale}
        scaleY={stageConfig.scale}
        style={{
          boxShadow:
            "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
          borderRadius: "8px",
          overflow: "hidden",
        }}
      >
        <Layer>
          {bgImage && (
            <KonvaImage
              image={bgImage}
              x={0}
              y={0}
              // width={ADMIN_STAGE_WIDTH}
              // height={ADMIN_STAGE_HEIGHT}
            />
          )}

          {layers.map((layer: any) => {
            // SỬ DỤNG HÀM CHECK MỚI Ở ĐÂY, TRUYỀN THÊM rawLayers
            if (!checkLayerCondition(layer, designChoices, rawLayers)) {
              return null;
            }

            if (layer.type === "group") {
              return null;
            }

            if (layer.type === "text" || layer.type === "dynamic_text") {
              const text =
                designChoices[layer.id] !== undefined
                  ? designChoices[layer.id]
                  : layer.options?.[0]?.name || layer.text || ""; // Sửa lại cho dynamic_text có chữ mặc định
              return (
                <Text
                  key={layer.id}
                  x={layer.x}
                  y={layer.y}
                  width={layer.width}
                  scaleX={layer.scaleX || 1}
                  scaleY={layer.scaleY || 1}
                  rotation={layer.rotation || 0}
                  text={text}
                  fontSize={layer.fontSize || 24}
                  fontFamily={layer.fontFamily || "Arial"}
                  fill={layer.color || "#000000"}
                />
              );
            }

            if (layer.type === "static_image") {
              if (layer.image_url) {
                return (
                  <KonvaImageLayer
                    key={layer.id}
                    source={
                      layer.image_url.startsWith("http")
                        ? layer.image_url
                        : `${baseUrl}${layer.image_url}`
                    }
                    layerProps={layer}
                  />
                );
              }
            }

            if (layer.type === "dynamic_image") {
              const selectedId = designChoices[layer.id];
              let opt =
                layer.options?.find((o: any) => o.id === selectedId) ||
                layer.options?.[0];
              if (opt?.image_url) {
                return (
                  <KonvaImageLayer
                    key={layer.id}
                    source={`${baseUrl}${opt.image_url}`}
                    layerProps={layer}
                  />
                );
              }
            }

            if (layer.type === "upload" && designChoices[layer.id]) {
              return (
                <KonvaImageLayer
                  key={layer.id}
                  source={designChoices[layer.id]}
                  layerProps={layer}
                />
              );
            }

            return null;
          })}
        </Layer>
      </Stage>
    </div>
  );
};

export default LivePreviewCanvas;
