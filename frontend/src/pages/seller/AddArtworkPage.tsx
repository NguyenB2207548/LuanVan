import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import DesignerCanvas from "../../components/common/DesignerCanvas";
import DesignerControlPanel from "../../components/seller/DesignerControlPanel";
import { Loader2 } from "lucide-react";

const AddArtworkPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(!!id);
  const [artworkName, setArtworkName] = useState("");
  const [layers, setLayers] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [activeFilter, setActiveFilter] = useState("ALL");
  const [isExtractingPsd, setIsExtractingPsd] = useState(false);

  const [canvasSize, setCanvasSize] = useState({
    width: 800,
    height: 800,
  });

  const handleSaveArtwork = async (payload: any) => {
    try {
      await axiosClient.post(`designs/seller/artworks`, payload);
      alert("Lưu thiêt kế thành công!");
      navigate("/seller/artworks");
    } catch (err) {
      alert("Lỗi khi lưu!");
    }
  };

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" size={48} />
      </div>
    );

  return (
    <div className="flex h-screen bg-[#F3F4F6] font-sans flex-row overflow-hidden">
      <DesignerCanvas
        // Truyền canvasSize vào để vẽ khung trắng caro
        canvasSize={canvasSize}
        layers={layers}
        setLayers={setLayers}
        selectedId={selectedId}
        setSelectedId={setSelectedId}
        activeFilter={activeFilter}
        mode="artwork"
        maxWidth={650}
      />
      <DesignerControlPanel
        artworkName={artworkName}
        setArtworkName={setArtworkName}
        layers={layers}
        setLayers={setLayers}
        selectedId={selectedId}
        setSelectedId={setSelectedId}
        updateSelectedLayer={(f, v) =>
          setLayers((prev) =>
            prev.map((l) => (l.id === selectedId ? { ...l, [f]: v } : l)),
          )
        }
        onSave={handleSaveArtwork}
        isExtractingPsd={isExtractingPsd}
        setIsExtractingPsd={setIsExtractingPsd}
        // Truyền state mới vào Panel
        canvasSize={canvasSize}
        setCanvasSize={setCanvasSize}
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
      />
    </div>
  );
};

export default AddArtworkPage;
