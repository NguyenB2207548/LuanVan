import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axiosClient from "@/api/axiosClient";
import DesignerCanvas from "../../components/common/DesignerCanvas";
import { Save, RotateCcw, ArrowLeft, Maximize, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

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

  // State lưu trữ dữ liệu vùng in đang chỉnh sửa
  const [virtualPrintArea, setVirtualPrintArea] = useState(DEFAULT_PRINT_AREA);
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Ưu tiên dữ liệu từ state (đang chỉnh sửa dở)
        if (location.state?.mockupUrl) {
          setMockupUrl(location.state.mockupUrl);
          setTargetName(location.state.name || "Sản phẩm");

          if (location.state.initialData) {
            setVirtualPrintArea({ ...location.state.initialData, visible: true });
            setLoading(false);
            return;
          }
        }

        // Nếu không có state, fetch trực tiếp từ DB dựa trên id từ URL
        if (id && id !== 'new') {
          const endpoint = type === "product" ? `/products/${id}` : `/variants/${id}`;
          const res = await axiosClient.get(endpoint);
          const data = res.data;

          // Cấu trúc: data.mockup.printArea
          const dbMockup = data.mockup;
          setMockupUrl(dbMockup?.url || "");

          if (dbMockup?.printArea) {
            setVirtualPrintArea({ ...dbMockup.printArea, visible: true });
          } else {
            setVirtualPrintArea(DEFAULT_PRINT_AREA);
          }
        }
      } catch (err) {
        setVirtualPrintArea(DEFAULT_PRINT_AREA);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, type, location.state]);

  const handleSaveConfig = async () => {
    // Giải quyết vấn đề 1 & 3: Đồng bộ ngược lại trang EditProductPage
    if (location.state?.returnTo) {
      navigate(location.state.returnTo, {
        state: {
          ...location.state, // Giữ lại toàn bộ dữ liệu form đang nhập
          updatedPrintArea: {
            type: location.state.type,
            index: location.state.index,
            data: virtualPrintArea, // Truyền tọa độ mới về
          },
        },
      });
      return;
    }

    // Nếu là chế độ edit trực tiếp (ít dùng trong luồng của bạn)
    try {
      const endpoint = type === "product" ? `/products/${id}` : `/variants/${id}`;
      await axiosClient.patch(endpoint, { printArea: virtualPrintArea });
      toast.success("Đã cập nhật vùng in");
      navigate(-1);
    } catch (err) {
      toast.error("Lỗi cập nhật");
    }
  };

  const handleReset = () => {
    setVirtualPrintArea(DEFAULT_PRINT_AREA);
  };

  const handleInputChange = (key: string, value: string) => {
    const numValue = value === "" ? 0 : parseInt(value);
    setVirtualPrintArea((prev) => ({ ...prev, [key]: numValue }));
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={32} /></div>;

  return (
    <div className="flex flex-col h-screen bg-white text-gray-800">
      <div className="h-12 bg-gray-100 border-b px-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1 hover:bg-gray-200 border rounded-sm"><ArrowLeft size={18} /></button>
          <h1 className="text-xs font-bold uppercase">Vùng In: <span className="text-blue-600">{targetName}</span></h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleReset} className="px-3 py-1.5 text-xs font-bold text-gray-600 border rounded-sm hover:bg-gray-200"><RotateCcw size={14} /> Reset</button>
          <button onClick={handleSaveConfig} className="bg-blue-700 text-white px-4 py-1.5 rounded-sm font-bold text-xs uppercase shadow-sm">Xác nhận & Quay lại</button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-64 bg-gray-50 border-r p-4 overflow-y-auto">
          <section>
            <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-2 mb-4"><Maximize size={12} /> Dimensions (Pixels)</label>
            <div className="grid grid-cols-1 gap-3">
              {["x", "y", "width", "height"].map((key) => (
                <div key={key} className="flex items-center justify-between bg-white border p-2 rounded-sm shadow-sm">
                  <label className="text-[10px] font-bold text-gray-400 uppercase w-10">{key}</label>
                  <input
                    type="number"
                    className="w-20 font-mono text-xs text-blue-700 font-bold text-right outline-none"
                    value={Math.round(virtualPrintArea[key as keyof typeof DEFAULT_PRINT_AREA] as number)}
                    onChange={(e) => handleInputChange(key, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </section>
        </div>
        <div className="flex-1 bg-gray-200 p-8 flex items-center justify-center overflow-auto">
          <div className="bg-white p-2 shadow-md">
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