import React, { useState, useRef, useEffect } from "react";
import {
  Stage,
  Layer,
  Image as KonvaImage,
  Text,
  Transformer,
  Rect,
  Group,
} from "react-konva";
import {
  Plus,
  Type,
  Image as ImageIcon,
  Upload,
  Save,
  Trash2,
  List,
  X,
} from "lucide-react";
import axiosClient from "../../../api/axiosClient";
import useImage from "use-image";
import Konva from "konva";

const BASE_URL = "http://localhost:3000";

const uploadSingleFile = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("files", file);
  const res = await axiosClient.post("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.urls[0];
};

// Component hiển thị ảnh/placeholder cho Konva
const URLImage = ({
  l,
  isSelected,
  onSelect,
  onChange,
  onUploadClick,
}: any) => {
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
        onClick={(e) => {
          onSelect();
          // Nếu là type image_option và chưa có ảnh thực tế (đang là placeholder), trigger upload
          if (l.type === "image_option" && l.options.length === 0) {
            onUploadClick();
          }
        }}
        onTap={onSelect}
        onDragEnd={(e) => onChange({ x: e.target.x(), y: e.target.y() })}
        onTransformEnd={() => {
          const node = shapeRef.current;
          if (node) {
            onChange({
              x: node.x(),
              y: node.y(),
              width: node.width() * node.scaleX(),
              height: node.height() * node.scaleY(),
            });
            node.scaleX(1);
            node.scaleY(1);
          }
        }}
      />
      {isSelected && <Transformer ref={trRef} />}
    </>
  );
};

const DesignEditorPage = () => {
  const [mockupUrl, setMockupUrl] = useState<string>("");
  const [layers, setLayers] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [designName, setDesignName] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mockupImg] = useImage(
    mockupUrl ? `${BASE_URL}${mockupUrl}` : "",
    "anonymous",
  );

  // 1. Thêm Text
  const addTextLayer = () => {
    const id = `layer_${Date.now()}`;
    setLayers([
      ...layers,
      {
        id,
        type: "text",
        label: "Text",
        text: "Text",
        x: 50,
        y: 50,
        fontSize: 24,
        fontFamily: "Roboto",
        color: "#000000",
        zIndex: layers.length + 1,
      },
    ]);
    setSelectedId(id);
  };

  // 2. Thêm Vùng Upload cho Khách
  const addUploadPlaceholder = () => {
    const id = `layer_${Date.now()}`;
    setLayers([
      ...layers,
      {
        id,
        type: "user_upload",
        label: "Upload",
        image_url:
          "https://placehold.co/200x200/6366f1/ffffff?text=Vùng+Khách+Tải+Ảnh",
        x: 150,
        y: 150,
        width: 150,
        height: 150,
        zIndex: layers.length + 1,
      },
    ]);
    setSelectedId(id);
  };

  // 3. Tạo Layer Bộ sưu tập (Chỉ hiện Placeholder trên Canvas trước)
  const addImageOptionPlaceholder = () => {
    const id = `layer_${Date.now()}`;
    setLayers([
      ...layers,
      {
        id,
        type: "image_option",
        label: "Bộ ảnh có sẵn",
        image_url:
          "https://placehold.co/200x200/e2e8f0/475569?text=Nhấp+để+tải+bộ+ảnh",
        options: [], // Trống ban đầu
        x: 100,
        y: 100,
        width: 150,
        height: 150,
        zIndex: layers.length + 1,
      },
    ]);
    setSelectedId(id);
  };

  interface DesignOption {
    id: string;
    name: string;
    image_url: string;
  }

  // 4. Xử lý khi Admin nhấp vào Placeholder trên Canvas để tải nhiều ảnh
  const handleStageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !selectedId) return;

    setIsUploading(true);
    const uploadedOptions: DesignOption[] = [];
    for (let i = 0; i < files.length; i++) {
      try {
        const url = await uploadSingleFile(files[i]);
        uploadedOptions.push({
          id: `opt_${Date.now()}_${i}`,
          name: files[i].name,
          image_url: url,
        });
      } catch (err) {
        console.error("Lỗi upload", files[i].name);
      }
    }

    if (uploadedOptions.length > 0) {
      setLayers(
        layers.map((l) =>
          l.id === selectedId
            ? {
                ...l,
                options: [...l.options, ...uploadedOptions],
                image_url: uploadedOptions[0].image_url,
              }
            : l,
        ),
      );
    }
    setIsUploading(false);
  };
  const handleSaveDesign = async () => {
    // Kiểm tra dữ liệu bắt buộc trước khi gửi
    if (!designName) return alert("Vui lòng nhập tên mẫu thiết kế");
    if (!mockupUrl) return alert("Vui lòng tải ảnh mockup nền");

    // Cấu trúc lại Object để khớp với DTO: templateJson là 1 Object
    const templateData = {
      type: "F", // Có thể mở rộng thêm "B" nếu có mặt sau
      mockup: mockupUrl,
      detail: layers.map((l) => ({
        layer: l.id,
        type: l.type,
        label: l.label,
        zIndex: l.zIndex,
        x: l.x,
        y: l.y,
        width: l.width,
        height: l.height,
        fontFamily: l.fontFamily,
        fontSize: l.fontSize,
        color: l.color,
        defaultValue: l.type === "text" ? l.text : undefined,
        options: l.options || [],
      })),
    };

    try {
      // Gửi đúng tên trường: designName và templateJson
      await axiosClient.post("/designs", {
        designName: designName, // Khớp @IsString() designName
        templateJson: templateData, // Khớp @IsObject() templateJson
      });

      alert("Lưu template thành công!");
      // Reset form hoặc chuyển hướng nếu cần
    } catch (err: any) {
      console.error("Lỗi khi lưu:", err.response?.data);
      alert(
        "Lỗi: " + (err.response?.data?.message || "Không thể lưu template"),
      );
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans overflow-hidden">
      {/* INPUT FILE ẨN ĐỂ TRIGGER TỪ CANVAS */}
      <input
        type="file"
        hidden
        multiple
        ref={fileInputRef}
        onChange={handleStageUpload}
      />

      {/* CANVAS */}
      <div className="flex-1 flex flex-col items-center justify-center p-10 relative">
        {isUploading && (
          <div className="absolute inset-0 bg-white/50 z-50 flex items-center justify-center backdrop-blur-sm">
            <div className="bg-white p-6 rounded-3xl shadow-xl flex items-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <span className="font-black text-indigo-600 uppercase tracking-widest text-xs">
                Đang tải bộ sưu tập...
              </span>
            </div>
          </div>
        )}
        <div className="bg-white shadow-2xl rounded-3xl overflow-hidden border-8 border-white relative">
          <Stage
            width={500}
            height={600}
            onMouseDown={(e) =>
              e.target === e.target.getStage() && setSelectedId(null)
            }
          >
            <Layer>
              {mockupImg && (
                <KonvaImage image={mockupImg} width={500} height={600} />
              )}
              {layers.map((l, i) =>
                l.type === "text" ? (
                  <Text
                    key={l.id}
                    {...l}
                    text={l.text || ""}
                    draggable
                    fill={l.color}
                    onClick={() => setSelectedId(l.id)}
                    onDragEnd={(e) => {
                      const newLayers = [...layers];
                      newLayers[i] = { ...l, x: e.target.x(), y: e.target.y() };
                      setLayers(newLayers);
                    }}
                  />
                ) : (
                  <URLImage
                    key={l.id}
                    l={l}
                    isSelected={l.id === selectedId}
                    onSelect={() => setSelectedId(l.id)}
                    onUploadClick={() => fileInputRef.current?.click()}
                    onChange={(newProps: any) => {
                      const newLayers = [...layers];
                      newLayers[i] = { ...l, ...newProps };
                      setLayers(newLayers);
                    }}
                  />
                ),
              )}
            </Layer>
          </Stage>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="w-96 bg-white border-l border-gray-200 p-8 overflow-y-auto space-y-6">
        <h1 className="text-xl font-black italic uppercase text-indigo-600">
          Design Builder
        </h1>

        <div className="space-y-4">
          <input
            className="w-full p-3 bg-gray-50 rounded-xl border-none font-bold"
            placeholder="Tên mẫu..."
            value={designName}
            onChange={(e) => setDesignName(e.target.value)}
          />
          <label className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-100 rounded-2xl cursor-pointer hover:bg-indigo-50">
            <Upload size={20} className="text-gray-400" />
            <span className="text-sm font-bold text-gray-500">Tải Mockup</span>
            <input
              type="file"
              hidden
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) setMockupUrl(await uploadSingleFile(file));
              }}
            />
          </label>
        </div>

        <section className="space-y-3">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Thành phần thiết kế
          </label>
          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={addTextLayer}
              className="p-3 bg-gray-50 rounded-xl flex items-center gap-3 hover:bg-indigo-50 transition-all font-bold text-sm"
            >
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <Type size={18} />
              </div>{" "}
              Text
            </button>
            <button
              onClick={addUploadPlaceholder}
              className="p-3 bg-gray-50 rounded-xl flex items-center gap-3 hover:bg-indigo-50 transition-all font-bold text-sm"
            >
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <ImageIcon size={18} />
              </div>{" "}
              Upload
            </button>
            <button
              onClick={addImageOptionPlaceholder}
              className="p-3 bg-indigo-600 text-white rounded-xl flex items-center gap-3 hover:bg-black transition-all font-bold text-sm shadow-lg shadow-indigo-100"
            >
              <div className="p-2 bg-white/20 rounded-lg">
                <List size={18} />
              </div>{" "}
              Tạo Bộ Ảnh Có Sẵn
            </button>
          </div>
        </section>

        {/* SETTINGS LAYER */}
        {selectedId && (
          <section className="p-5 bg-gray-50 rounded-[2rem] space-y-4 animate-in slide-in-from-right-4">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-[10px] font-black uppercase text-indigo-500">
                Cấu hình Layer
              </span>
              <button
                onClick={() =>
                  setLayers(layers.filter((l) => l.id !== selectedId))
                }
                className="text-red-500"
              >
                <Trash2 size={16} />
              </button>
            </div>

            {layers.find((l) => l.id === selectedId)?.type === "text" && (
              <div className="space-y-3">
                <input
                  className="w-full p-3 text-sm border-none rounded-xl font-bold bg-white shadow-sm"
                  value={layers.find((l) => l.id === selectedId).text}
                  onChange={(e) =>
                    setLayers(
                      layers.map((l) =>
                        l.id === selectedId
                          ? { ...l, text: e.target.value }
                          : l,
                      ),
                    )
                  }
                />
                <input
                  type="color"
                  className="w-full h-10 cursor-pointer rounded-xl"
                  value={layers.find((l) => l.id === selectedId).color}
                  onChange={(e) =>
                    setLayers(
                      layers.map((l) =>
                        l.id === selectedId
                          ? { ...l, color: e.target.value }
                          : l,
                      ),
                    )
                  }
                />
              </div>
            )}

            {layers.find((l) => l.id === selectedId)?.type ===
              "image_option" && (
              <div className="space-y-4">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2 bg-white border border-indigo-200 rounded-xl text-[10px] font-black text-indigo-600 uppercase"
                >
                  + Tải thêm ảnh vào bộ
                </button>
                <div className="grid grid-cols-4 gap-2">
                  {layers
                    .find((l) => l.id === selectedId)
                    .options.map((opt: any) => (
                      <img
                        key={opt.id}
                        src={`${BASE_URL}${opt.image_url}`}
                        className="w-full aspect-square object-cover rounded-lg border border-white shadow-sm"
                      />
                    ))}
                </div>
              </div>
            )}
          </section>
        )}

        <button
          onClick={handleSaveDesign}
          className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-xl hover:bg-black transition-all flex items-center justify-center gap-2 mt-auto"
        >
          <Save size={20} /> LƯU TEMPLATE
        </button>
      </div>
    </div>
  );
};

export default DesignEditorPage;
