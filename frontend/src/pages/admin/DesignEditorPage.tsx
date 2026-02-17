import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Stage,
  Layer,
  Image as KonvaImage,
  Text,
  Transformer,
} from "react-konva";
import useImage from "use-image";
import {
  Type,
  Image as ImageIcon,
  Layout,
  Save,
  ChevronLeft,
  Trash2,
  Layers,
  List,
} from "lucide-react";
import axiosClient from "../../api/axiosClient";

const BASE_URL = "http://localhost:3000";

const DesignEditorPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [designName, setDesignName] = useState("");
  const [layers, setLayers] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mockupUrl, setMockupUrl] = useState<string | null>(null);
  const stageRef = useRef<any>(null);
  const trRef = useRef<any>(null);

  const [mockupImg] = useImage(
    mockupUrl ? `${BASE_URL}${mockupUrl}` : "",
    "anonymous",
  );

  // 1. TẢI THIẾT KẾ ĐANG CÓ TỪ BACKEND
  useEffect(() => {
    if (id) {
      axiosClient.get(`/designs/${id}`).then((res) => {
        setDesignName(res.data.designName || "");
        // Chuẩn hóa dữ liệu detail để đảm bảo mỗi layer có ID duy nhất
        const detail = (res.data.templateJson?.detail || []).map((l: any) => ({
          ...l,
          id: l.id || l.layer, // Ưu tiên id, nếu không có dùng layer làm id
        }));
        setLayers(detail);
        setMockupUrl(res.data.templateJson?.mockup || null);
      });
    }
  }, [id]);

  // 2. CẬP NHẬT TRANSFORMER KHI CHỌN LAYER
  useEffect(() => {
    if (selectedId && trRef.current) {
      const node = stageRef.current.findOne("#" + selectedId);
      if (node) {
        trRef.current.nodes([node]);
        trRef.current.getLayer().batchDraw();
      }
    }
  }, [selectedId]);

  // 3. THÊM LAYER MỚI (Vẫn giữ các layer cũ)
  const addTextLayer = () => {
    const newId = `layer_${Date.now()}`;
    const newLayer = {
      id: newId,
      layer: newId,
      type: "text",
      text: "NHẬP VĂN BẢN",
      x: 50,
      y: 50,
      fontSize: 24,
      fill: "#000000",
      fontFamily: "Arial",
      zIndex: layers.length,
      label: "Văn bản mới",
    };
    setLayers([...layers, newLayer]);
    setSelectedId(newId);
  };

  const handleSave = async () => {
    const templateJson = { mockup: mockupUrl, detail: layers };
    try {
      await axiosClient.put(`/designs/${id}`, { designName, templateJson });
      alert("Lưu thiết kế thành công!");
    } catch (err) {
      alert("Lỗi khi lưu!");
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#f0f2f5]">
      {/* HEADER: HIỂN THỊ TÊN THIẾT KẾ ĐANG SỬA */}
      <header className="h-16 bg-white border-b px-6 flex items-center justify-between shadow-sm z-20">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="font-black text-gray-800">
            {designName || "Đang tải mẫu..."}
          </span>
        </div>
        <button
          onClick={handleSave}
          className="bg-[#6366f1] text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-indigo-200"
        >
          <Save size={18} /> LƯU THIẾT KẾ
        </button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* LEFT TOOLBAR */}
        <div className="w-[300px] bg-white border-r flex flex-col p-6 shadow-lg z-10 overflow-y-auto">
          <h2 className="text-[#6366f1] font-black text-2xl italic uppercase tracking-tighter mb-8">
            Design Builder
          </h2>
          <div className="space-y-4">
            <input
              className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold text-sm focus:ring-2 focus:ring-indigo-500"
              value={designName}
              onChange={(e) => setDesignName(e.target.value)}
              placeholder="Tên mẫu..."
            />
            <label className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-100 rounded-2xl cursor-pointer hover:border-indigo-300 transition-all group">
              <Layout
                size={20}
                className="text-gray-400 group-hover:text-indigo-500"
              />
              <span className="text-xs font-black text-gray-400 group-hover:text-indigo-500 uppercase">
                Tải Mockup mới
              </span>
              <input
                type="file"
                hidden
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const formData = new FormData();
                    formData.append("files", file);
                    const res = await axiosClient.post("/upload", formData);
                    setMockupUrl(res.data.urls[0]);
                  }
                }}
              />
            </label>
            <button
              onClick={addTextLayer}
              className="w-full flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:border-indigo-500 transition-all group"
            >
              <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-indigo-50">
                <Type size={18} />
              </div>
              <span className="font-bold text-sm">Thêm Text</span>
            </button>
          </div>

          <div className="mt-10">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
              Danh sách Layer hiện có
            </p>
            <div className="space-y-2">
              {layers.map((l) => (
                <div
                  key={l.id}
                  onClick={() => setSelectedId(l.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${selectedId === l.id ? "bg-indigo-50 text-indigo-600 border border-indigo-100" : "bg-gray-50 hover:bg-gray-100"}`}
                >
                  <List size={14} />{" "}
                  <span className="text-[11px] font-bold truncate">
                    {l.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CANVAS AREA */}
        <div className="flex-1 flex items-center justify-center p-10 overflow-auto bg-[#e2e8f0]">
          <div className="bg-white shadow-2xl relative border-[10px] border-white">
            <Stage
              width={500}
              height={600}
              ref={stageRef}
              onMouseDown={(e) => {
                if (e.target === e.target.getStage()) setSelectedId(null);
              }}
            >
              <Layer>
                {mockupImg && (
                  <KonvaImage image={mockupImg} width={500} height={600} />
                )}

                {/* HIỂN THỊ CÁC LAYER ĐANG CÓ VÀ LAYER MỚI THÊM */}
                {[...layers]
                  .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
                  .map((l) => {
                    const { zIndex, ...konvaProps } = l; // Loại bỏ zIndex khỏi props truyền trực tiếp
                    return (
                      <LayerItem
                        key={l.id}
                        shapeProps={konvaProps}
                        isSelected={l.id === selectedId}
                        onSelect={() => setSelectedId(l.id)}
                        onChange={(newAttrs: any) => {
                          setLayers(
                            layers.map((lyr) =>
                              lyr.id === l.id ? newAttrs : lyr,
                            ),
                          );
                        }}
                      />
                    );
                  })}
                <Transformer
                  ref={trRef}
                  boundBoxFunc={(oldBox, newBox) => newBox}
                />
              </Layer>
            </Stage>
          </div>
        </div>

        {/* PROPERTIES PANEL */}
        <div className="w-[350px] bg-white border-l p-8 shadow-inner overflow-y-auto">
          <h3 className="font-black text-xs uppercase tracking-widest text-gray-400 mb-8 flex items-center gap-2">
            <Layers size={14} /> CHỈNH SỬA LAYER
          </h3>
          {selectedId ? (
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-2xl">
                <label className="text-[10px] font-black uppercase text-gray-400 block mb-2">
                  Nhãn quản lý
                </label>
                <input
                  className="w-full bg-transparent border-none font-bold focus:ring-0 p-0"
                  value={layers.find((l) => l.id === selectedId)?.label || ""}
                  onChange={(e) =>
                    setLayers(
                      layers.map((l) =>
                        l.id === selectedId
                          ? { ...l, label: e.target.value }
                          : l,
                      ),
                    )
                  }
                />
              </div>
              {layers.find((l) => l.id === selectedId)?.type === "text" && (
                <div className="bg-gray-50 p-4 rounded-2xl">
                  <label className="text-[10px] font-black uppercase text-gray-400 block mb-2">
                    Nội dung
                  </label>
                  <input
                    className="w-full bg-transparent border-none font-bold focus:ring-0 p-0"
                    value={layers.find((l) => l.id === selectedId)?.text || ""}
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
                </div>
              )}
              <button
                onClick={() => {
                  setLayers(layers.filter((l) => l.id !== selectedId));
                  setSelectedId(null);
                }}
                className="w-full bg-red-50 text-red-500 py-4 rounded-2xl font-black text-xs uppercase flex items-center justify-center gap-2 hover:bg-red-500 hover:text-white transition-all"
              >
                <Trash2 size={16} /> XÓA LAYER
              </button>
            </div>
          ) : (
            <p className="text-center text-gray-300 font-bold italic py-20">
              Chọn một layer trên canvas để sửa
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

const LayerItem = ({ shapeProps, isSelected, onSelect, onChange }: any) => {
  const [img] = useImage(
    shapeProps.image_url ? `${BASE_URL}${shapeProps.image_url}` : "",
    "anonymous",
  );
  const commonProps = {
    ...shapeProps,
    id: shapeProps.id,
    onClick: onSelect,
    onTap: onSelect,
    draggable: true,
    onDragEnd: (e: any) =>
      onChange({ ...shapeProps, x: e.target.x(), y: e.target.y() }),
    onTransformEnd: (e: any) => {
      const node = e.target;
      onChange({
        ...shapeProps,
        x: node.x(),
        y: node.y(),
        scaleX: node.scaleX(),
        scaleY: node.scaleY(),
        rotation: node.rotation(),
      });
    },
  };
  return shapeProps.type === "text" ? (
    <Text {...commonProps} />
  ) : (
    <KonvaImage {...commonProps} image={img} />
  );
};

export default DesignEditorPage;
