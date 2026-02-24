import React, { useRef, useEffect } from "react";
import { Image as KonvaImage, Transformer } from "react-konva";
import useImage from "use-image";
import Konva from "konva";

const BASE_URL = "http://localhost:3000";

interface URLImageProps {
  l: any;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (newProps: any) => void;
  onUploadClick: () => void;
}

const URLImage: React.FC<URLImageProps> = ({
  l,
  isSelected,
  onSelect,
  onChange,
  onUploadClick,
}) => {
  const [img] = useImage(
    l.image_url?.startsWith("http") ? l.image_url : `${BASE_URL}${l.image_url}`,
    "anonymous",
  );

  const trRef = useRef<Konva.Transformer>(null);
  const shapeRef = useRef<Konva.Image>(null);

  const prevImageSrc = useRef<string | null>(null);

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  // === THUẬT TOÁN GIỮ ĐÚNG KÍCH THƯỚC VÀ TỶ LỆ ===
  useEffect(() => {
    if (img && img.src !== prevImageSrc.current) {
      prevImageSrc.current = img.src;

      // 1. KHI TẢI ẢNH LÊN LẦN ĐẦU (Layer mới thêm có mặc định là 60x60)
      // -> Bê nguyên 100% kích thước thật của ảnh gốc
      if (l.width === 60 && l.height === 60) {
        onChange({
          width: img.width,
          height: img.height,
        });
      }
      // 2. KHI ĐỔI OPTION TRONG DYNAMIC IMAGE
      // -> Giữ nguyên Chiều Rộng (Width) hiện tại trên canvas
      // -> Tự động tính lại Chiều Cao (Height) theo tỷ lệ gốc của ảnh mới
      else {
        const currentW = l.width;
        // Tính chiều cao mới: Rộng hiện tại * (Cao thật / Rộng thật)
        const newH = currentW * (img.height / img.width);

        onChange({
          width: Math.round(currentW),
          height: Math.round(newH),
        });
      }
    }
  }, [img]);
  // ====================================================

  return (
    <>
      <KonvaImage
        image={img}
        x={l.x}
        y={l.y}
        width={l.width}
        height={l.height}
        draggable
        ref={shapeRef}
        // 1. CLICK CHỈ ĐỂ CHỌN LAYER
        onClick={onSelect}
        onTap={onSelect}
        // 2. NHÁY ĐÚP CHUỘT THAY ẢNH
        onDblClick={() => {
          if (
            l.type === "dynamic_image" ||
            l.type === "upload" ||
            l.type === "static_image"
          ) {
            onUploadClick();
          }
        }}
        onDblTap={() => {
          if (
            l.type === "dynamic_image" ||
            l.type === "upload" ||
            l.type === "static_image"
          ) {
            onUploadClick();
          }
        }}
        onDragEnd={(e) =>
          onChange({ x: Math.round(e.target.x()), y: Math.round(e.target.y()) })
        }
        onTransformEnd={() => {
          const node = shapeRef.current;
          if (node) {
            onChange({
              x: Math.round(node.x()),
              y: Math.round(node.y()),
              width: Math.round(Math.max(5, node.width() * node.scaleX())),
              height: Math.round(Math.max(5, node.height() * node.scaleY())),
            });
            node.scaleX(1);
            node.scaleY(1);
          }
        }}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          keepRatio={true} // Bắt buộc giữ tỷ lệ khi user cầm góc kéo dãn
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 5 || newBox.height < 5) return oldBox;
            return newBox;
          }}
        />
      )}
    </>
  );
};

export default URLImage;
