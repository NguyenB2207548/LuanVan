import React, { useState, useEffect, useRef } from "react";
import {
  Stage,
  Layer,
  Rect,
  Transformer,
  Image as KonvaImage,
} from "react-konva";
import { X, Save, RotateCcw, Info, Maximize } from "lucide-react";

interface PrintAreaModalProps {
  isOpen: boolean;
  onClose: () => void;
  mockupUrl: string;
  initialData?: { x: number; y: number; width: number; height: number };
  onSave: (data: any) => void;
}

const PrintAreaModal = ({
  isOpen,
  onClose,
  mockupUrl,
  initialData,
  onSave,
}: PrintAreaModalProps) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [rectProps, setRectProps] = useState({
    x: 50,
    y: 50,
    width: 150,
    height: 200,
  });
  const shapeRef = useRef<any>(null);
  const trRef = useRef<any>(null);

  const STAGE_DISPLAY_SIZE = 500;

  useEffect(() => {
    if (mockupUrl && isOpen) {
      const img = new window.Image();
      img.src = mockupUrl;
      img.crossOrigin = "anonymous";
      img.onload = () => {
        setImage(img);
        // QUAN TRỌNG: Quy đổi từ Pixel thật về Pixel hiển thị 500px để vẽ lên Modal
        if (initialData) {
          const ratio = STAGE_DISPLAY_SIZE / img.naturalWidth;
          setRectProps({
            x: initialData.x * ratio,
            y: initialData.y * ratio,
            width: initialData.width * ratio,
            height: initialData.height * ratio,
          });
        }
      };
    }
  }, [mockupUrl, isOpen]);

  useEffect(() => {
    if (isOpen && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isOpen, image]);

  const handleSave = () => {
    if (!image) return;
    // QUY ĐỔI NGƯỢC: Từ 500px hiển thị sang Pixel thực tế của file ảnh
    const scaleToOriginal = image.naturalWidth / STAGE_DISPLAY_SIZE;
    const finalData = {
      x: Math.round(rectProps.x * scaleToOriginal),
      y: Math.round(rectProps.y * scaleToOriginal),
      width: Math.round(rectProps.width * scaleToOriginal),
      height: Math.round(rectProps.height * scaleToOriginal),
    };
    onSave(finalData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 text-gray-800">
      <div className="bg-white rounded-2xl w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh]">
        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Maximize size={18} className="text-blue-600" /> Cấu hình Vùng In
            </h2>
            <p className="text-[11px] text-gray-500">
              Tọa độ thực tế sẽ được tự động tính toán dựa trên độ phân giải
              ảnh.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col md:flex-row overflow-hidden">
          <div className="flex-1 bg-gray-100 flex items-center justify-center p-8 overflow-auto min-h-[550px]">
            <div
              className="bg-white shadow-xl relative"
              style={{ width: STAGE_DISPLAY_SIZE, height: STAGE_DISPLAY_SIZE }}
            >
              <Stage width={STAGE_DISPLAY_SIZE} height={STAGE_DISPLAY_SIZE}>
                <Layer>
                  {image && (
                    <KonvaImage
                      image={image}
                      width={STAGE_DISPLAY_SIZE}
                      height={STAGE_DISPLAY_SIZE}
                      opacity={0.9}
                    />
                  )}
                  <Rect
                    ref={shapeRef}
                    {...rectProps}
                    fill="rgba(37, 99, 235, 0.25)"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dash={[5, 5]}
                    draggable
                    onDragEnd={(e) =>
                      setRectProps({
                        ...rectProps,
                        x: e.target.x(),
                        y: e.target.y(),
                      })
                    }
                    onTransformEnd={() => {
                      const node = shapeRef.current;
                      const scaleX = node.scaleX();
                      const scaleY = node.scaleY();
                      node.scaleX(1);
                      node.scaleY(1);
                      setRectProps({
                        x: node.x(),
                        y: node.y(),
                        width: Math.max(10, node.width() * scaleX),
                        height: Math.max(10, node.height() * scaleY),
                      });
                    }}
                  />
                  <Transformer
                    ref={trRef}
                    rotateEnabled={false}
                    keepRatio={false}
                  />
                </Layer>
              </Stage>
            </div>
          </div>

          <div className="w-full md:w-80 border-l p-6 flex flex-col bg-white">
            <div className="flex-1 space-y-6">
              <div className="bg-blue-50 p-3 rounded-lg flex gap-3 text-blue-700">
                <Info size={20} className="shrink-0" />
                <p className="text-[10px]">
                  Lưu tọa độ pixel thực: <b>{image?.naturalWidth || 0}px</b>{" "}
                  width.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(rectProps).map(([key, value]) => (
                  <div key={key} className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">
                      {key}
                    </label>
                    <div className="p-2 bg-gray-50 border rounded text-xs font-mono">
                      {Math.round(value)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="pt-6 border-t space-y-3">
              <button
                onClick={handleSave}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-100"
              >
                Lưu cấu hình
              </button>
              <button
                onClick={() =>
                  setRectProps({ x: 50, y: 50, width: 150, height: 200 })
                }
                className="w-full bg-white text-gray-600 py-3 rounded-xl font-bold border hover:bg-gray-50"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintAreaModal;
