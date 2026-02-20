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
    l.image_url.startsWith("http") ? l.image_url : `${BASE_URL}${l.image_url}`,
    "anonymous",
  );
  const trRef = useRef<Konva.Transformer>(null);
  const shapeRef = useRef<Konva.Image>(null);

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

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
        onClick={() => {
          onSelect();
          if (l.type === "dynamic_image" && l.options.length === 0) {
            onUploadClick();
          }
        }}
        onTap={onSelect}
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
