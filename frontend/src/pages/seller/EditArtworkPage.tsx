import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import DesignerCanvas from "../../components/common/DesignerCanvas";
import DesignerControlPanel from "../../components/seller/DesignerControlPanel";
import AssetManagerModal from "../../components/admin/AssetManagerModal";
import { Loader2 } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { showErrorToast, showSuccessToast } from "@/components/common/toast";

const EditArtworkPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [artworkName, setArtworkName] = useState("");
  const [backgroundUrl, setBackgroundUrl] = useState("");
  const [layers, setLayers] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [isExtractingPsd, setIsExtractingPsd] = useState(false);

  const [virtualPrintArea, setVirtualPrintArea] = useState({
    x: 200,
    y: 200,
    width: 250,
    height: 250,
    visible: false,
  });

  // 1. Fetch dữ liệu Artwork cũ khi vào trang
  useEffect(() => {
    const fetchArtworkDetail = async () => {
      try {
        setLoading(true);
        const res = await axiosClient.get(`designs/seller/artworks/${id}`);
        const data = res.data;

        // --- CẬP NHẬT STATE KHỚP VỚI CẤU TRÚC JSON ---
        setArtworkName(data.artworkName || "");

        setBackgroundUrl(data.mockupUrl || "");

        if (data.layers) {
          setLayers(
            Array.isArray(data.layers) ? data.layers : JSON.parse(data.layers),
          );
        }

        if (data.printArea) {
          setVirtualPrintArea(data.printArea);
        }
      } catch (err) {
        console.error("Lỗi khi tải Artwork:", err);
        showErrorToast("Không thể tải thông tin Artwork.");
        navigate("/seller/artworks");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchArtworkDetail();
  }, [id, navigate]);

  // 2. Xử lý lưu cập nhật
  const handleUpdateArtwork = async (payload: any) => {
    try {
      setLoading(true);
      await axiosClient.patch(`designs/seller/artworks/${id}`, payload);

      showSuccessToast("Cập nhật Artwork thành công!");

      setTimeout(() => navigate("/seller/artworks"), 1500);
    } catch (err) {
      console.error("Lỗi khi cập nhật:", err);

      showErrorToast("Lỗi khi cập nhật Artwork!");
    } finally {
      setLoading(false);
    }
  };

  const handleAssetsSelected = (urls: string[]) => {
    if (urls.length > 0) {
      setBackgroundUrl(urls[0]);
    }
    setIsAssetModalOpen(false);
  };

  // Sửa lỗi Loading: Kiểm tra loading và kiểm tra ID có tồn tại không
  // (Bỏ điều kiện !artworkName để tránh đứng màn hình loading khi dữ liệu chưa về kịp)
  if (loading && layers.length === 0)
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-[#F8F9FA] gap-3">
        <Loader2 className="animate-spin text-blue-600" size={40} />
        <span className="text-sm font-medium text-gray-500">
          Đang đồng bộ dữ liệu thiết kế...
        </span>
      </div>
    );

  return (
    <div className="flex h-screen bg-[#F8F9FA] font-sans flex-row overflow-hidden">
      <Toaster position="top-right" />

      {/* Khu vực Canvas bên trái */}
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

      {/* Bảng điều khiển bên phải */}
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
        setActiveFilter={() => {}}
        onSave={handleUpdateArtwork}
        isExtractingPsd={isExtractingPsd}
        setIsExtractingPsd={setIsExtractingPsd}
        virtualPrintArea={virtualPrintArea}
        setVirtualPrintArea={setVirtualPrintArea}
        onOpenBgSelect={() => setIsAssetModalOpen(true)}
        isEditMode={true}
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

export default EditArtworkPage;
