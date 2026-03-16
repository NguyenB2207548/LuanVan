import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosClient from "@/api/axiosClient";
import DesignerCanvas from "../../components/common/DesignerCanvas";
import {
  Save,
  RotateCcw,
  ArrowLeft,
  Info,
  Maximize,
  Loader2,
  CheckCircle2,
} from "lucide-react";

const PrintAreaConfigPage = () => {
  const { type, id } = useParams(); // type: 'product' hoặc 'variant'
  const navigate = useNavigate();

  // --- STATES ---
  const [loading, setLoading] = useState(true);
  const [mockupUrl, setMockupUrl] = useState("");
  const [targetName, setTargetName] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Dữ liệu Print Area (Pixel thực tế)
  const [virtualPrintArea, setVirtualPrintArea] = useState({
    x: 100,
    y: 100,
    width: 300,
    height: 400,
    visible: true,
  });

  // 1. Fetch thông tin Mockup ban đầu
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Tùy vào type là product hay variant mà gọi API tương ứng
        const endpoint =
          type === "product" ? `/products/${id}` : `/variants/${id}`;
        const res = await axiosClient.get(endpoint);

        const data = res.data;
        setTargetName(data.name || "Sản phẩm không tên");
        setMockupUrl(data.thumbnail || data.mockupUrl || "");

        // Nếu đã có cấu hình printArea từ trước thì nạp vào
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
  }, [id, type]);

  // 2. Lưu cấu hình vào Database
  const handleSaveConfig = async () => {
    try {
      const endpoint =
        type === "product" ? `/products/${id}` : `/variants/${id}`;

      // Gửi nguyên object virtualPrintArea (đã là pixel thực nhờ DesignerCanvas xử lý)
      await axiosClient.patch(endpoint, {
        printArea: virtualPrintArea,
      });

      alert("Cấu hình Vùng In đã được lưu thành công!");
    } catch (err) {
      alert("Lỗi khi lưu cấu hình.");
    }
  };

  const handleReset = () => {
    setVirtualPrintArea({
      x: 100,
      y: 100,
      width: 300,
      height: 400,
      visible: true,
    });
    setSelectedId(null);
  };

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );

  return (
    <div className="flex flex-col h-screen bg-[#F8FAFC]">
      {/* TOPBAR */}
      <div className="h-16 bg-white border-b px-6 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-sm font-black text-gray-900 uppercase tracking-tighter">
              Thiết lập Vùng In:{" "}
              <span className="text-blue-600">{targetName}</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-700 transition-all"
          >
            <RotateCcw size={16} /> Reset
          </button>
          <button
            onClick={handleSaveConfig}
            className="flex items-center gap-2 bg-gray-900 text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg active:scale-95"
          >
            Lưu cấu hình <Save size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* SIDEBAR: THÔNG SỐ */}
        <div className="w-80 bg-white border-r p-6 overflow-y-auto">
          <div className="space-y-8">
            <section>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                <Maximize size={14} /> Tọa độ Natural Pixel
              </label>

              <div className="grid grid-cols-2 gap-4">
                {["x", "y", "width", "height"].map((key) => (
                  <div key={key} className="space-y-1">
                    <label className="text-[9px] font-bold text-gray-500 uppercase">
                      {key}
                    </label>
                    <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl font-mono text-sm text-blue-700 font-bold">
                      {Math.round(
                        virtualPrintArea[
                          key as keyof typeof virtualPrintArea
                        ] as number,
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-gray-400 mt-4 leading-relaxed italic">
                * Mọi tọa độ được tính toán dựa trên kích thước thật của file
                ảnh gốc để đảm bảo độ chính xác khi in ấn.
              </p>
            </section>

            <section className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
              <h4 className="text-xs font-black text-blue-900 mb-2 flex items-center gap-2">
                <Info size={14} /> Hướng dẫn
              </h4>
              <ul className="text-[11px] text-blue-700 space-y-2 font-medium">
                <li className="flex gap-2">
                  <CheckCircle2 size={12} className="shrink-0" />
                  Click vào khung xanh để bắt đầu điều chỉnh.
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 size={12} className="shrink-0" />
                  Kéo các điểm neo để thay đổi kích thước vùng in.
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 size={12} className="shrink-0" />
                  Di chuyển vùng in đến vị trí mong muốn trên mockup.
                </li>
              </ul>
            </section>
          </div>
        </div>

        {/* MAIN CANVAS AREA */}
        <div className="flex-1 bg-[#E2E8F0] p-10 flex items-center justify-center overflow-auto">
          <DesignerCanvas
            backgroundUrl={mockupUrl}
            layers={[]} // Mode print-area không cần layers
            virtualPrintArea={virtualPrintArea}
            setVirtualPrintArea={setVirtualPrintArea}
            selectedId={selectedId}
            setSelectedId={setSelectedId}
            mode="print-area" // Chế độ chuyên dụng cho trang này
            maxWidth={600}
          />
        </div>
      </div>
    </div>
  );
};

export default PrintAreaConfigPage;
