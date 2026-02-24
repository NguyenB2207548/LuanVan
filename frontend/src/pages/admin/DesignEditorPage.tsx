import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import DesignerCanvas from "../../components/admin/DesignerCanvas";
import DesignerControlPanel from "../../components/admin/DesignerControlPanel";
import { Loader2 } from "lucide-react";

const DesignEditorPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);

  // Các state quản lý Design y hệt trang Create
  const [backgroundUrl, setBackgroundUrl] = useState<string>("");
  const [layers, setLayers] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [designName, setDesignName] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("ALL");

  // FETCH DỮ LIỆU CŨ KHI VÀO TRANG
  useEffect(() => {
    const fetchDesign = async () => {
      try {
        const res = await axiosClient.get(`/designs/${id}`);
        const data = res.data;

        // Đổ dữ liệu vào State
        setDesignName(data.designName || "");
        setBackgroundUrl(data.templateJson?.background || "");
        setLayers(data.templateJson?.details || []);
      } catch (error) {
        console.error("Lỗi khi tải mẫu thiết kế", error);
        alert("Không tìm thấy mẫu thiết kế!");
        navigate("/admin/designs");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchDesign();
  }, [id, navigate]);

  const updateSelectedLayer = (field: string, value: any) => {
    setLayers(
      layers.map((l) => (l.id === selectedId ? { ...l, [field]: value } : l)),
    );
  };

  const handleUpdateDesign = async (payload: any) => {
    try {
      await axiosClient.patch(`/designs/${id}`, payload);
      alert("Design updated successfully!");
    } catch (err: any) {
      alert("Error updating design: " + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <Loader2 className="animate-spin text-blue-500" size={48} />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 font-sans text-gray-800 flex-row">
      <DesignerCanvas
        backgroundUrl={backgroundUrl}
        layers={layers}
        setLayers={setLayers}
        selectedId={selectedId}
        setSelectedId={setSelectedId}
        isUploading={false} // Bỏ isUploading nếu không dùng
        updateSelectedLayer={updateSelectedLayer}
        activeFilter={activeFilter}
      />

      <DesignerControlPanel
        designName={designName}
        setDesignName={setDesignName}
        backgroundUrl={backgroundUrl}
        setBackgroundUrl={setBackgroundUrl}
        layers={layers}
        setLayers={setLayers}
        selectedId={selectedId}
        setSelectedId={setSelectedId}
        updateSelectedLayer={updateSelectedLayer}
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
        onSave={handleUpdateDesign} // Gọi hàm Update thay vì Create
      />
    </div>
  );
};

export default DesignEditorPage;
