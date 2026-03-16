import React, { useRef, useEffect } from "react";
import {
  Stage,
  Layer,
  Image as KonvaImage,
  Text,
  Rect,
  Transformer,
  Group,
} from "react-konva";
import useImage from "use-image";
import URLImage from "./URLImage";
import Konva from "konva";

const BASE_URL = "http://localhost:3000";

interface DesignerCanvasProps {
  backgroundUrl: string;
  layers: any[];
  setLayers?: (layers: any[]) => void;
  virtualPrintArea: {
    x: number;
    y: number;
    width: number;
    height: number;
    visible: boolean;
  };
  setVirtualPrintArea?: (area: any) => void;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  mode: "print-area" | "artwork" | "design" | "client";
  maxWidth?: number;
  isUploading?: boolean;
  activeFilter?: string;
  scale?: number;
}

const DesignerCanvas: React.FC<DesignerCanvasProps> = ({
  backgroundUrl,
  layers,
  setLayers,
  virtualPrintArea,
  setVirtualPrintArea,
  selectedId,
  setSelectedId,
  mode,
  maxWidth = 550,
  isUploading = false,
  activeFilter = "ALL",
  scale = 1,
}) => {
  const [bgImg] = useImage(
    backgroundUrl
      ? backgroundUrl.startsWith("http")
        ? backgroundUrl
        : `${BASE_URL}${backgroundUrl}`
      : "",
    "anonymous",
  );

  const trRef = useRef<Konva.Transformer>(null);
  const printAreaRef = useRef<Konva.Rect>(null);

  const stageWidth = maxWidth * scale;
  const stageHeight = maxWidth * scale;

  useEffect(() => {
    if (!trRef.current) return;
    const nodes: Konva.Node[] = [];
    if (selectedId === "print_area" && printAreaRef.current)
      nodes.push(printAreaRef.current);
    trRef.current.nodes(nodes);
    trRef.current.getLayer()?.batchDraw();
  }, [selectedId, virtualPrintArea]);

  const handlePrintAreaDragEnd = (e: any) => {
    if (!setVirtualPrintArea) return;
    if (e.target !== e.currentTarget) return;
    const node = e.target;
    setVirtualPrintArea({
      ...virtualPrintArea,
      x: Math.round(node.x() / scale),
      y: Math.round(node.y() / scale),
    });
  };

  const handlePrintAreaTransformEnd = () => {
    if (!setVirtualPrintArea || !printAreaRef.current) return;
    const node = printAreaRef.current;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    node.scaleX(1);
    node.scaleY(1);

    setVirtualPrintArea({
      ...virtualPrintArea,
      width: Math.round((node.width() * scaleX) / scale),
      height: Math.round((node.height() * scaleY) / scale),
    });
  };

  const handleLayerChange = (id: string, newProps: any) => {
    if (!setLayers) return;
    setLayers(layers.map((l) => (l.id === id ? { ...l, ...newProps } : l)));
  };

  return (
    // <div className="flex-1 relative flex items-center justify-center bg-[#e5e7eb] p-10 overflow-hidden border-r border-gray-200">
    <div className="flex-1 relative flex items-center justify-center bg-transparent p-0 overflow-hidden">
      {isUploading && (
        <div className="absolute inset-0 bg-white/60 z-50 flex items-center justify-center font-bold">
          Processing...
        </div>
      )}

      <div
        className="bg-white shadow-2xl relative"
        style={{ width: stageWidth, height: stageHeight }}
      >
        <Stage
          width={stageWidth}
          height={stageHeight}
          onPointerDown={(e) => {
            if (
              e.target === e.target.getStage() ||
              e.target.name() === "background"
            )
              setSelectedId(null);
          }}
        >
          <Layer>
            {bgImg ? (
              <KonvaImage
                image={bgImg}
                name="background"
                width={stageWidth}
                height={stageHeight}
              />
            ) : (
              <Rect width={stageWidth} height={stageHeight} fill="#ffffff" />
            )}

            {(virtualPrintArea.visible ?? true) && (
              <Group
                x={virtualPrintArea.x * scale}
                y={virtualPrintArea.y * scale}
                draggable={mode !== "client"}
                onDragEnd={handlePrintAreaDragEnd}
                onClick={(e) => {
                  if (e.target.name() === "print_area_rect") {
                    mode !== "client" && setSelectedId("print_area");
                  }
                }}
                clipFunc={(ctx) => {
                  ctx.rect(
                    0,
                    0,
                    virtualPrintArea.width * scale,
                    virtualPrintArea.height * scale,
                  );
                }}
              >
                <Rect
                  ref={printAreaRef}
                  x={0}
                  y={0}
                  width={virtualPrintArea.width * scale}
                  height={virtualPrintArea.height * scale}
                  stroke={
                    mode === "client"
                      ? undefined
                      : selectedId === "print_area"
                        ? "#2563eb"
                        : "#3b82f6"
                  }
                  strokeWidth={mode === "client" ? 0 : 2}
                  dash={[10, 5]}
                  fill={
                    mode === "client"
                      ? "transparent"
                      : "rgba(59, 130, 246, 0.05)"
                  }
                  name="print_area_rect"
                  onTransformEnd={handlePrintAreaTransformEnd}
                />

                {mode !== "print-area" &&
                  layers.map((l) => {
                    if (
                      activeFilter !== "ALL" &&
                      l.show_condition &&
                      l.show_condition !== activeFilter
                    )
                      return null;

                    const commonProps = {
                      key: l.id,
                      x: (l.x || 0) * scale,
                      y: (l.y || 0) * scale,
                      draggable: mode === "artwork",
                      onClick: (e: any) => {
                        e.cancelBubble = true;
                        setSelectedId(l.id);
                      },
                    };

                    if (l.type.includes("text")) {
                      return (
                        <Text
                          {...commonProps}
                          text={l.text}
                          fontSize={(l.fontSize || 20) * scale}
                          fill={l.color || "#000"}
                          fontFamily={l.fontFamily}
                          onDragMove={(e) => {
                            e.cancelBubble = true;
                          }}
                          onDragEnd={(e) => {
                            e.cancelBubble = true;
                            handleLayerChange(l.id, {
                              x: Math.round(e.target.x() / scale),
                              y: Math.round(e.target.y() / scale),
                              width: l.width,
                              height: l.height,
                              fontSize: l.fontSize,
                            });
                          }}
                        />
                      );
                    }

                    return (
                      <URLImage
                        {...commonProps}
                        l={{
                          ...l,
                          width: (l.width || 100) * scale,
                          height: (l.height || 100) * scale,
                          url: l.image_url || l.url,
                        }}
                        isSelected={selectedId === l.id}
                        onSelect={() => setSelectedId(l.id)}
                        draggable={mode === "artwork"}
                        onUploadClick={() => {}}
                        onChange={(newP: any) =>
                          handleLayerChange(l.id, {
                            x: Math.round(newP.x / scale),
                            y: Math.round(newP.y / scale),
                            width: Math.round(newP.width / scale),
                            height: Math.round(newP.height / scale),
                          })
                        }
                      />
                    );
                  })}
              </Group>
            )}

            {selectedId === "print_area" && (
              <Transformer
                ref={trRef}
                rotateEnabled={false}
                keepRatio={false}
                enabledAnchors={mode === "design" ? [] : undefined}
              />
            )}
          </Layer>
        </Stage>
      </div>
    </div>
  );
};

export default DesignerCanvas;
