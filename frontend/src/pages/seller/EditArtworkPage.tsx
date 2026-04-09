import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import DesignerCanvas from "../../components/common/DesignerCanvas";
import DesignerControlPanel from "../../components/seller/DesignerControlPanel";
import { Loader2 } from "lucide-react";
import { Toaster } from "react-hot-toast";
import { showErrorToast, showSuccessToast } from "@/components/common/toast";

const EditArtworkPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [artworkName, setArtworkName] = useState("");
  const [layers, setLayers] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [activeFilter, setActiveFilter] = useState("ALL");
  const [isExtractingPsd, setIsExtractingPsd] = useState(false);

  // MỚI: State quản lý kích thước Canvas
  const [canvasSize, setCanvasSize] = useState({
    width: 800,
    height: 800,
  });

  // 1. Fetch dữ liệu Artwork cũ khi vào trang
  useEffect(() => {
    const fetchArtworkDetail = async () => {
      try {
        setLoading(true);
        const res = await axiosClient.get(`designs/seller/artworks/${id}`);
        const data = res.data;

        setArtworkName(data.artworkName || "");

        // --- NẠP LẠI LAYERS ---
        if (data.layers) {
          setLayers(
            Array.isArray(data.layers) ? data.layers : JSON.parse(data.layers),
          );
        }

        // --- NẠP LẠI KÍCH THƯỚC CANVAS ---
        // Hỗ trợ tương thích ngược: Nạp từ format mới hoặc fallback về printArea cũ
        if (data.canvasSize) {
          setCanvasSize(data.canvasSize);
        } else if (data.layersJson?.canvasSize) {
          setCanvasSize(data.layersJson.canvasSize);
        } else if (data.printArea) {
          setCanvasSize({
            width: data.printArea.width || 2000,
            height: data.printArea.height || 2000,
          });
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
        canvasSize={canvasSize}
        layers={layers}
        setLayers={setLayers}
        selectedId={selectedId}
        setSelectedId={setSelectedId}
        mode="artwork"
        maxWidth={650}
        activeFilter={activeFilter}
      />

      {/* Bảng điều khiển bên phải */}
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
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
        onSave={handleUpdateArtwork}
        isExtractingPsd={isExtractingPsd}
        setIsExtractingPsd={setIsExtractingPsd}
        canvasSize={canvasSize}
        setCanvasSize={setCanvasSize}
        isEditMode={true}
      />
    </div>
  );
};

export default EditArtworkPage;
