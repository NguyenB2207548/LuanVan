import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axiosClient from "@/api/axiosClient";
import DesignerCanvas from "../../components/common/DesignerCanvas";
import { Save, RotateCcw, ArrowLeft, Maximize, Loader2 } from "lucide-react";

const DEFAULT_PRINT_AREA = {
  x: 250,
  y: 200,
  width: 250,
  height: 250,
  visible: true,
};

const PrintAreaConfigPage = () => {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [mockupUrl, setMockupUrl] = useState("");
  const [targetName, setTargetName] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [virtualPrintArea, setVirtualPrintArea] = useState(DEFAULT_PRINT_AREA);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        if (location.state?.mockupUrl) {
          setMockupUrl(location.state.mockupUrl);
          setTargetName(location.state.name || "Sản phẩm mới");
          if (location.state.initialData) {
            setVirtualPrintArea({
              ...location.state.initialData,
              visible: true,
            });
          }
          setLoading(false);
          return;
        }

        const endpoint =
          type === "product" ? `/products/${id}` : `/variants/${id}`;
        const res = await axiosClient.get(endpoint);

        const data = res.data;
        setTargetName(data.name || "Sản phẩm không tên");
        setMockupUrl(data.thumbnail || data.mockupUrl || "");

        if (data.printArea) {
          setVirtualPrintArea({
            ...data.printArea,
            visible: true,
          });
        }
      } catch (err) {
        console.error("Lỗi tải thông tin mockup", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, type, location.state]);

  const handleSaveConfig = async () => {
    // Nếu là từ trang tạo mới (AddProductPage) gửi sang
    if (location.state?.returnTo) {
      navigate(location.state.returnTo, {
        state: {
          // QUAN TRỌNG: Giữ lại toàn bộ state cũ (bao gồm ảnh mockupUrl, name, v.v.)
          ...location.state,
          // Cập nhật hoặc thêm mới thông tin vùng in
          updatedPrintArea: {
            type: location.state.type,
            index: location.state.index,
            data: virtualPrintArea,
          },
        },
      });
      return;
    }

    // Luồng edit trực tiếp vào Database (giữ nguyên)
    try {
      const endpoint =
        type === "product" ? `/products/${id}` : `/variants/${id}`;

      await axiosClient.patch(endpoint, {
        printArea: virtualPrintArea,
      });

      alert("Cấu hình Vùng In đã được lưu thành công!");
      navigate(-1);
    } catch (err) {
      alert("Lỗi khi lưu cấu hình.");
    }
  };

  const handleReset = () => {
    setVirtualPrintArea(DEFAULT_PRINT_AREA);
    setSelectedId(null);
  };

  // Hàm xử lý khi thay đổi giá trị trong ô input
  const handleInputChange = (key: string, value: string) => {
    const numValue = value === "" ? 0 : parseInt(value);
    setVirtualPrintArea((prev) => ({
      ...prev,
      [key]: numValue,
    }));
  };

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );

  return (
    <div className="flex flex-col h-screen bg-white text-gray-800 font-sans">
      <div className="h-12 bg-gray-100 border-b border-gray-300 px-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1 hover:bg-gray-200 border border-gray-300 rounded-sm transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-xs font-bold uppercase tracking-tight">
            Thiết lập Vùng In:{" "}
            <span className="text-blue-600">{targetName}</span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-200 border border-gray-300 rounded-sm transition-all"
          >
            <RotateCcw size={14} /> Reset
          </button>
          <button
            onClick={handleSaveConfig}
            className="flex items-center gap-1 bg-blue-700 text-white px-4 py-1.5 rounded-sm font-bold text-xs uppercase hover:bg-blue-800 transition-all shadow-sm"
          >
            Xác nhận cấu hình <Save size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-64 bg-gray-50 border-r border-gray-300 p-4 overflow-y-auto">
          <div className="space-y-6">
            <section>
              <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-2 mb-4">
                <Maximize size={12} /> Dimensions (Pixels)
              </label>

              <div className="grid grid-cols-1 gap-3">
                {["x", "y", "width", "height"].map((key) => (
                  <div
                    key={key}
                    className="flex items-center justify-between bg-white border border-gray-200 p-2 rounded-sm shadow-sm"
                  >
                    <label className="text-[10px] font-bold text-gray-400 uppercase w-10">
                      {key}
                    </label>
                    {/* Thay đổi div thành input để có thể điền số */}
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        className="w-20 font-mono text-xs text-blue-700 font-bold text-right outline-none focus:bg-blue-50"
                        value={Math.round(
                          virtualPrintArea[
                            key as keyof typeof virtualPrintArea
                          ] as number,
                        )}
                        onChange={(e) => handleInputChange(key, e.target.value)}
                      />
                      <span className="text-[10px] text-gray-400 font-mono">
                        px
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        <div className="flex-1 bg-gray-200 p-8 flex items-center justify-center overflow-auto">
          <div className="bg-white border border-gray-300 p-2 shadow-md">
            <DesignerCanvas
              backgroundUrl={mockupUrl}
              layers={[]}
              virtualPrintArea={virtualPrintArea}
              setVirtualPrintArea={setVirtualPrintArea}
              selectedId={selectedId}
              setSelectedId={setSelectedId}
              mode="print-area"
              maxWidth={650}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintAreaConfigPage;
