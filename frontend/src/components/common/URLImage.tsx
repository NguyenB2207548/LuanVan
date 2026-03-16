import React, { useRef, useEffect } from "react";
import { Image as KonvaImage, Transformer } from "react-konva";
import useImage from "use-image";
import Konva from "konva";

const BASE_URL = "http://localhost:3000";

// ĐỊNH NGHĨA INTERFACE CHUẨN ĐỂ KHÔNG BỊ LỖI
export interface URLImageProps {
  l: any;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (newProps: any) => void;
  onUploadClick?: () => void; // Dấu ? giúp nó không bắt buộc
  draggable: boolean; // Thuộc tính đang bị báo lỗi
}

const URLImage: React.FC<URLImageProps> = ({
  l,
  isSelected,
  onSelect,
  onChange,
  onUploadClick,
  draggable,
}) => {
  const finalUrl = l.image_url || l.url;

  const [img] = useImage(
    finalUrl
      ? finalUrl.startsWith("http")
        ? finalUrl
        : `${BASE_URL}${finalUrl}`
      : "",
    "anonymous",
  );

  const shapeRef = useRef<Konva.Image>(null);
  const trRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  return (
    <>
      <KonvaImage
        ref={shapeRef}
        image={img}
        x={l.x}
        y={l.y}
        width={l.width}
        height={l.height}
        draggable={draggable}
        onClick={onSelect}
        onTap={onSelect}
        onDblClick={onUploadClick}
        // Chặn nổi bọt triệt để ở cả 3 giai đoạn kéo
        onDragStart={(e) => {
          e.cancelBubble = true;
        }}
        onDragMove={(e) => {
          e.cancelBubble = true;
        }}
        onDragEnd={(e) => {
          e.cancelBubble = true;
          onChange({
            x: Math.round(e.target.x()),
            y: Math.round(e.target.y()),
            width: l.width,
            height: l.height,
          });
        }}
        onTransformEnd={() => {
          const node = shapeRef.current;
          if (node) {
            const scaleX = node.scaleX();
            const scaleY = node.scaleY();
            node.scaleX(1);
            node.scaleY(1);
            onChange({
              x: Math.round(node.x()),
              y: Math.round(node.y()),
              width: Math.round(Math.max(5, node.width() * scaleX)),
              height: Math.round(Math.max(5, node.height() * scaleY)),
            });
          }
        }}
      />
      {isSelected && draggable && (
        <Transformer
          ref={trRef}
          keepRatio={true}
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
