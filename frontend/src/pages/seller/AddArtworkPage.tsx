import { useState } from "react";
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
  const [artworkName, setArtworkName] = useState("");
  const [backgroundUrl, setBackgroundUrl] = useState("");
  const [layers, setLayers] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);

  // Thêm state này để quản lý trạng thái bóc tách PSD
  const [isExtractingPsd, setIsExtractingPsd] = useState(false);

  const [virtualPrintArea, setVirtualPrintArea] = useState({
    x: 200,
    y: 200,
    width: 250,
    height: 250,
    visible: true,
  });

  // Xử lý background
  const handleAssetsSelected = (urls: string[]) => {
    if (urls.length > 0) {
      setBackgroundUrl(urls[0]);
    }
    setIsAssetModalOpen(false);
  };

  const handleSaveArtwork = async (payload: any) => {
    try {
      await axiosClient.post(`designs/seller/artworks`, payload);
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
        artworkName={artworkName}
        setArtworkName={setArtworkName}
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
        setActiveFilter={() => { }}
        onSave={handleSaveArtwork}
        // Truyền đầy đủ props cho chức năng Import PSD
        isExtractingPsd={isExtractingPsd}
        setIsExtractingPsd={setIsExtractingPsd}
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