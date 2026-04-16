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
  backgroundUrl?: string;
  layers: any[];
  setLayers?: (layers: any[]) => void;
  canvasSize?: { width: number; height: number };
  virtualPrintArea?: {
    x: number;
    y: number;
    width: number;
    height: number;
    visible: boolean;
  };
  setVirtualPrintArea?: (area: any) => void;
  designOffset?: { x: number; y: number };
  setDesignOffset?: (offset: { x: number; y: number }) => void;

  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  mode: "print-area" | "artwork" | "design" | "client";
  maxWidth?: number;
  isUploading?: boolean;
  activeFilter?: string;
  scale?: number;
  stageRef?: React.RefObject<any>;
}

const DesignerCanvas: React.FC<DesignerCanvasProps> = ({
  backgroundUrl,
  layers,
  setLayers,
  canvasSize = { width: 800, height: 800 },
  virtualPrintArea,
  setVirtualPrintArea,
  designOffset = { x: 0, y: 0 },
  setDesignOffset,
  selectedId,
  setSelectedId,
  mode,
  maxWidth = 550,
  isUploading = false,
  activeFilter = "ALL",
  scale = 1,
  stageRef,
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

  const isArtworkMode = mode === "artwork";

  const WORKSPACE_SIZE = maxWidth;
  const PADDING = 60;

  const artworkScale = Math.min(
    (WORKSPACE_SIZE - PADDING) / canvasSize.width,
    (WORKSPACE_SIZE - PADDING) / canvasSize.height,
  );

  const displayScale = isArtworkMode ? artworkScale : scale;

  const stageWidth = isArtworkMode ? WORKSPACE_SIZE : maxWidth * displayScale;
  const stageHeight = isArtworkMode ? WORKSPACE_SIZE : maxWidth * displayScale;

  const paperWidth = canvasSize.width * displayScale;
  const paperHeight = canvasSize.height * displayScale;
  const paperX = isArtworkMode ? (stageWidth - paperWidth) / 2 : 0;
  const paperY = isArtworkMode ? (stageHeight - paperHeight) / 2 : 0;

  // ==================================================
  // BỘ ÁO GIÁP AN TOÀN
  // ==================================================
  const safePrintArea = {
    x: virtualPrintArea?.x || 0,
    y: virtualPrintArea?.y || 0,
    width: virtualPrintArea?.width || canvasSize.width,
    height: virtualPrintArea?.height || canvasSize.height,
    visible: virtualPrintArea?.visible ?? true,
  };

  const mappingScale = isArtworkMode
    ? 1
    : Math.min(
        safePrintArea.width / canvasSize.width,
        safePrintArea.height / canvasSize.height,
      );

  const centerX = safePrintArea.width / 2;
  const centerY = safePrintArea.height / 2;

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
      x: Math.round(node.x() / displayScale),
      y: Math.round(node.y() / displayScale),
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
      width: Math.round((node.width() * scaleX) / displayScale),
      height: Math.round((node.height() * scaleY) / displayScale),
    });
  };

  const handleLayerChange = (id: string, newProps: any) => {
    if (!setLayers) return;
    setLayers(layers.map((l) => (l.id === id ? { ...l, ...newProps } : l)));
  };

  return (
    <div
      className={`flex-1 relative flex items-center justify-center p-0 overflow-hidden ${isArtworkMode ? "bg-gray-100" : "bg-transparent"}`}
    >
      {isUploading && (
        <div className="absolute inset-0 bg-white/60 z-50 flex items-center justify-center font-bold">
          Processing...
        </div>
      )}

      <div
        className="shadow-2xl relative"
        style={{
          width: stageWidth,
          height: stageHeight,
          backgroundColor: isArtworkMode ? "#f3f4f6" : "transparent",
        }}
      >
        <Stage
          ref={stageRef}
          width={stageWidth}
          height={stageHeight}
          onPointerDown={(e) => {
            if (
              e.target === e.target.getStage() ||
              e.target.name() === "background" ||
              e.target.name() === "artwork_canvas_bg" ||
              e.target.name() === "workspace_bg"
            )
              setSelectedId(null);
          }}
        >
          <Layer>
            {isArtworkMode && (
              <Rect
                width={stageWidth}
                height={stageHeight}
                name="workspace_bg"
                fill="#f3f4f6"
              />
            )}

            {/* --- LỚP 1: NỀN --- */}
            {isArtworkMode ? (
              <Rect
                name="artwork_canvas_bg"
                x={paperX}
                y={paperY}
                width={paperWidth}
                height={paperHeight}
                fill="#ffffff"
                stroke="#3b82f6"
                strokeWidth={2}
                dash={[10, 5]}
              />
            ) : bgImg ? (
              <KonvaImage
                image={bgImg}
                name="background"
                width={stageWidth}
                height={stageHeight}
              />
            ) : (
              <Rect width={stageWidth} height={stageHeight} fill="#f3f4f6" />
            )}

            {/* --- LỚP 2: MAPPING --- */}
            {mode !== "print-area" && (
              <Group
                x={isArtworkMode ? paperX : safePrintArea.x * displayScale}
                y={isArtworkMode ? paperY : safePrintArea.y * displayScale}
                clipX={0}
                clipY={0}
                clipWidth={
                  isArtworkMode
                    ? paperWidth
                    : safePrintArea.width * displayScale
                }
                clipHeight={
                  isArtworkMode
                    ? paperHeight
                    : safePrintArea.height * displayScale
                }
              >
                <Group
                  x={
                    isArtworkMode
                      ? 0
                      : (centerX + (designOffset?.x || 0)) * displayScale
                  }
                  y={
                    isArtworkMode
                      ? 0
                      : (centerY + (designOffset?.y || 0)) * displayScale
                  }
                  offsetX={
                    isArtworkMode ? 0 : (canvasSize.width / 2) * displayScale
                  }
                  offsetY={
                    isArtworkMode ? 0 : (canvasSize.height / 2) * displayScale
                  }
                  scaleX={mappingScale}
                  scaleY={mappingScale}
                  draggable={mode === "design"}
                  onDragEnd={(e) => {
                    if (setDesignOffset && e.target === e.currentTarget) {
                      setDesignOffset({
                        x: Math.round(e.target.x() / displayScale - centerX),
                        y: Math.round(e.target.y() / displayScale - centerY),
                      });
                    }
                  }}
                >
                  {layers?.map((l) => {
                    if (
                      activeFilter !== "ALL" &&
                      l.show_condition &&
                      l.show_condition !== activeFilter
                    )
                      return null;

                    const { id, ...otherData } = l;
                    const isLayerDraggable = mode === "artwork";

                    const commonProps = {
                      x: (l.x || 0) * displayScale,
                      y: (l.y || 0) * displayScale,
                      draggable: isLayerDraggable,
                      onClick: (e: any) => {
                        e.cancelBubble = true;
                        if (isArtworkMode) setSelectedId(l.id);
                      },
                      onDblClick: (e: any) => {
                        e.cancelBubble = true;
                        if (isArtworkMode) setSelectedId(l.id);

                        if (
                          l.type === "static_image" ||
                          l.type === "dynamic_image"
                        ) {
                          window.dispatchEvent(
                            new CustomEvent("OPEN_ASSET_MODAL", {
                              detail: { type: l.type },
                            }),
                          );
                        }
                      },
                    };

                    if (l.type.includes("text")) {
                      return (
                        <Text
                          key={l.id}
                          {...commonProps}
                          text={l.text}
                          fontSize={(l.fontSize || 20) * displayScale}
                          fill={l.color || "#000"}
                          fontFamily={l.fontFamily}
                          align="center"
                          width={(l.width || 200) * displayScale}
                          offsetX={((l.width || 200) * displayScale) / 2}
                          onDragEnd={(e) => {
                            e.cancelBubble = true;
                            handleLayerChange(l.id, {
                              x: Math.round(e.target.x() / displayScale),
                              y: Math.round(e.target.y() / displayScale),
                            });
                          }}
                        />
                      );
                    }

                    return (
                      <URLImage
                        key={l.id}
                        {...commonProps}
                        l={{
                          ...l,
                          x: (l.x || 0) * displayScale,
                          y: (l.y || 0) * displayScale,
                          width: (l.width || 100) * displayScale,
                          height: (l.height || 100) * displayScale,
                          url: l.image_url || l.url,
                        }}
                        isSelected={selectedId === l.id && isArtworkMode}
                        onSelect={() => isArtworkMode && setSelectedId(l.id)}
                        draggable={isLayerDraggable}
                        onChange={(newP: any) =>
                          handleLayerChange(l.id, {
                            x: Math.round(newP.x / displayScale),
                            y: Math.round(newP.y / displayScale),
                            width: Math.round(newP.width / displayScale),
                            height: Math.round(newP.height / displayScale),
                          })
                        }
                      />
                    );
                  })}
                </Group>
              </Group>
            )}

            {/* --- LỚP 3: VIRTUAL PRINT AREA --- */}
            {!isArtworkMode && safePrintArea.visible && mode !== "client" && (
              <Rect
                ref={printAreaRef}
                x={safePrintArea.x * displayScale}
                y={safePrintArea.y * displayScale}
                width={safePrintArea.width * displayScale}
                height={safePrintArea.height * displayScale}
                stroke={selectedId === "print_area" ? "#2563eb" : "#3b82f6"}
                strokeWidth={2}
                dash={[10, 5]}
                listening={mode === "print-area"}
                name="print_area_rect"
                draggable={mode === "print-area"}
                onDragEnd={handlePrintAreaDragEnd}
                onTransformEnd={handlePrintAreaTransformEnd}
                onClick={(e) => {
                  e.cancelBubble = true;
                  setSelectedId("print_area");
                }}
              />
            )}

            {/* --- LỚP 4: TRANSFORMER (Dành riêng cho Print Area) --- */}
            {selectedId === "print_area" && !isArtworkMode && (
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
