import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import DesignerCanvas from "../../components/common/DesignerCanvas";
import DesignerControlPanel from "../../components/seller/DesignerControlPanel";
import AssetManagerModal from "../../components/admin/AssetManagerModal";
import { Loader2 } from "lucide-react";

const AddArtworkPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(!!id);
  const [designName, setDesignName] = useState("");
  const [backgroundUrl, setBackgroundUrl] = useState("");
  const [layers, setLayers] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [virtualPrintArea, setVirtualPrintArea] = useState({
    x: 0,
    y: 0,
    width: 300,
    height: 300,
    visible: true,
  });

  useEffect(() => {
    if (!id) return;
    const fetchDesign = async () => {
      try {
        const res = await axiosClient.get(`/designs/${id}`);
        const data = res.data;
        setDesignName(data.designName || "");
        if (data.templateJson) {
          setBackgroundUrl(
            data.templateJson.internalMockup || data.thumbnailUrl || "",
          );
          setLayers(data.templateJson.details || []);
          if (data.templateJson.printArea)
            setVirtualPrintArea(data.templateJson.printArea);
        }
      } catch (error) {
        alert("Lỗi tải thiết kế");
        navigate("/seller/artworks");
      } finally {
        setLoading(false);
      }
    };
    fetchDesign();
  }, [id]);

  const handleAssetsSelected = (urls: string[]) => {
    if (urls.length > 0) {
      setBackgroundUrl(urls[0]);
      const img = new Image();
      img.src = `http://localhost:3000${urls[0]}`;
      img.onload = () => {
        setVirtualPrintArea((prev) => ({
          ...prev,
          x: Math.round((img.width - prev.width) / 2),
          y: Math.round((img.height - prev.height) / 2),
        }));
      };
    }
    setIsAssetModalOpen(false);
  };

  const handleSaveDesign = async (payload: any) => {
    const finalPayload = {
      ...payload,
      // Nếu backgroundUrl trống, ta có thể gửi null hoặc giá trị mặc định tùy Backend
      thumbnailUrl: backgroundUrl || "",
    };

    try {
      if (id) await axiosClient.patch(`/designs/${id}`, finalPayload);
      else await axiosClient.post(`/artworks`, finalPayload);
      alert("Lưu Artwork thành công!");
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
        backgroundUrl={backgroundUrl}
        layers={layers}
        setLayers={setLayers}
        virtualPrintArea={virtualPrintArea}
        setVirtualPrintArea={setVirtualPrintArea}
        selectedId={selectedId}
        setSelectedId={setSelectedId}
        mode="artwork"
        maxWidth={650}
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
        updateSelectedLayer={(f, v) =>
          setLayers((prev) =>
            prev.map((l) => (l.id === selectedId ? { ...l, [f]: v } : l)),
          )
        }
        activeFilter="ALL"
        setActiveFilter={() => {}}
        onSave={handleSaveDesign}
        isExtractingPsd={false}
        virtualPrintArea={virtualPrintArea}
        setVirtualPrintArea={setVirtualPrintArea}
        onOpenBgSelect={() => setIsAssetModalOpen(true)}
      />
      <AssetManagerModal
        isOpen={isAssetModalOpen}
        multiple={false}
        onClose={() => setIsAssetModalOpen(false)}
        onSelect={handleAssetsSelected}
      />
    </div>
  );
};

export default AddArtworkPage;
