import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosClient from "@/api/axiosClient";
import DesignerCanvas from "../../components/common/DesignerCanvas";
import {
  Loader2,
  Package,
  Palette,
  CheckCircle2,
  Save,
  ChevronDown,
  ImageIcon,
  Layers,
  ArrowLeft,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { showErrorToast, showSuccessToast } from "@/components/common/toast";

const BASE_URL = "http://localhost:3000";

const EditDesignPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [products, setProducts] = useState<any[]>([]);
  const [artworks, setArtworks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [selectedArtwork, setSelectedArtwork] = useState<any>(null);
  const [designName, setDesignName] = useState("");

  const [layers, setLayers] = useState<any[]>([]);
  const [virtualPrintArea, setVirtualPrintArea] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    visible: true,
  });

  const [saving, setSaving] = useState(false);

  // 1. Fetch toàn bộ danh sách và thông tin chi tiết Design cần edit
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const [prodRes, artRes, designRes] = await Promise.all([
          axiosClient.get("/products/seller"),
          axiosClient.get("/designs/seller/artworks"),
          axiosClient.get(`/designs/seller/designs/${id}`),
        ]);

        const allProducts = prodRes.data.data || [];
        const allArtworks = artRes.data || [];
        const currentDesign = designRes.data;

        setProducts(allProducts);
        setArtworks(allArtworks);

        // Map thông tin cũ vào state
        setDesignName(currentDesign.designName);

        const foundProduct = allProducts.find(
          (p: any) => p.id === currentDesign.product?.id,
        );
        const foundArtwork = allArtworks.find(
          (a: any) => a.id === currentDesign.artwork?.id,
        );

        if (foundProduct) setSelectedProduct(foundProduct);
        if (foundArtwork) {
          setSelectedArtwork(foundArtwork);
          setLayers(foundArtwork.layersJson?.details || []);
        }

        // Apply Print Area từ mockup của product/variant cũ
        const printArea = foundProduct?.mockup?.printArea;
        if (printArea) {
          setVirtualPrintArea({
            x: Number(printArea.x),
            y: Number(printArea.y),
            width: Number(printArea.width),
            height: Number(printArea.height),
            visible: true,
          });
        }
      } catch (err) {
        console.error("Lỗi tải dữ liệu edit:", err);
        showErrorToast("Không thể tải dữ liệu thiết kế.");
        navigate("/seller/designs");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchInitialData();
  }, [id, navigate]);

  const getActiveMockup = () => {
    if (selectedVariant?.mockup?.url) return selectedVariant.mockup;
    return selectedProduct?.mockup || null;
  };

  const handleSelectProduct = (product: any) => {
    setSelectedProduct(product);
    setSelectedVariant(null);
    const printArea = product.mockup?.printArea;
    if (printArea) {
      setVirtualPrintArea({
        x: Number(printArea.x),
        y: Number(printArea.y),
        width: Number(printArea.width),
        height: Number(printArea.height),
        visible: true,
      });
    }
  };

  const handleSelectArtwork = (artwork: any) => {
    setSelectedArtwork(artwork);
    setLayers(artwork.layersJson?.details || []);
  };

  const handleUpdate = async () => {
    if (!selectedProduct || !selectedArtwork) return;
    setSaving(true);
    try {
      await axiosClient.patch(`/designs/${id}`, {
        designName:
          designName ||
          `${selectedProduct.productName} - ${selectedArtwork.artworkName}`,
        productId: selectedProduct.id,
        artworkId: selectedArtwork.id,
      });
      showSuccessToast("Cập nhật thiết kế thành công!");
      setTimeout(() => navigate("/seller/designs"), 1500);
    } catch {
      showErrorToast("Lỗi khi cập nhật thiết kế.");
    } finally {
      setSaving(false);
    }
  };

  const activeMockup = getActiveMockup();
  const variants = selectedProduct?.variants || [];

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center bg-[#F8F9FA]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-blue-600" size={32} />
          <span className="text-sm font-medium text-gray-500">
            Đang tải cấu hình thiết kế...
          </span>
        </div>
      </div>
    );

  return (
    <div className="flex h-screen bg-[#F8F9FA] overflow-hidden">
      <Toaster position="top-right" />

      {/* ── SIDEBAR ── */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col shrink-0 z-10 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
          <button
            onClick={() => navigate("/seller/designs")}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft size={18} className="text-gray-500" />
          </button>
          <div>
            <h1 className="text-base font-bold text-gray-900">
              Chỉnh sửa thiết kế
            </h1>
            <p className="text-[10px] text-gray-400">
              Cập nhật sự kết hợp sản phẩm & artwork
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Tên thiết kế */}
          <div className="px-5 py-4 border-b border-gray-100">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">
              Tên hiển thị
            </label>
            <input
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 transition-all"
              value={designName}
              onChange={(e) => setDesignName(e.target.value)}
              placeholder="Nhập tên thiết kế..."
            />
          </div>

          {/* STEP 1: Product */}
          <div className="px-5 py-4 border-b border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-3">
              <Package size={11} /> Sản phẩm phôi
            </p>
            <div className="space-y-1.5">
              {products.map((p) => {
                const thumb =
                  p.images?.find((i: any) => i.isPrimary)?.url || p.mockup?.url;
                const isSelected = selectedProduct?.id === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => handleSelectProduct(p)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg border text-left transition-all ${
                      isSelected
                        ? "border-blue-600 bg-blue-50/50 shadow-sm"
                        : "border-gray-100 bg-white hover:border-gray-300"
                    }`}
                  >
                    <div className="w-10 h-10 rounded border border-gray-100 bg-white overflow-hidden shrink-0">
                      {thumb ? (
                        <img
                          src={`${BASE_URL}${thumb}`}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <ImageIcon size={14} className="text-gray-300" />
                      )}
                    </div>
                    <span
                      className={`text-sm font-medium truncate flex-1 ${isSelected ? "text-blue-700" : "text-gray-700"}`}
                    >
                      {p.productName}
                    </span>
                    {isSelected && (
                      <CheckCircle2 size={16} className="text-blue-600" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 2: Artwork */}
          <div className="px-5 py-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-3">
              <Palette size={11} /> Artwork thiết kế
            </p>
            <div className="space-y-1.5">
              {artworks.map((art) => {
                const isSelected = selectedArtwork?.id === art.id;
                return (
                  <button
                    key={art.id}
                    onClick={() => handleSelectArtwork(art)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg border text-left transition-all ${
                      isSelected
                        ? "border-blue-600 bg-blue-50/50 shadow-sm"
                        : "border-gray-100 bg-white hover:border-gray-300"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded shrink-0 flex items-center justify-center ${isSelected ? "bg-blue-100" : "bg-gray-50"}`}
                    >
                      <Palette
                        size={14}
                        className={
                          isSelected ? "text-blue-600" : "text-gray-400"
                        }
                      />
                    </div>
                    <span
                      className={`text-sm font-medium truncate flex-1 ${isSelected ? "text-blue-700" : "text-gray-700"}`}
                    >
                      {art.artworkName}
                    </span>
                    {isSelected && (
                      <CheckCircle2 size={16} className="text-blue-600" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-5 py-4 border-t border-gray-100 bg-gray-50/50">
          <button
            disabled={saving}
            onClick={handleUpdate}
            className="w-full py-2.5 rounded-lg bg-gray-900 text-white text-sm font-bold hover:bg-black transition-all flex items-center justify-center gap-2 shadow-md disabled:bg-gray-400"
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            Cập nhật thiết kế
          </button>
        </div>
      </div>

      {/* ── CANVAS AREA ── */}
      <div className="flex-1 flex flex-col">
        <div className="h-12 bg-white border-b border-gray-200 flex items-center px-5 gap-4">
          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
            Chế độ chỉnh sửa
          </span>
          <span className="text-sm text-gray-500 font-medium truncate">
            {designName}
          </span>
        </div>

        <div className="flex-1 relative flex items-center justify-center">
          <DesignerCanvas
            backgroundUrl={activeMockup?.url || ""}
            layers={layers}
            setLayers={setLayers}
            selectedId={null}
            setSelectedId={() => {}}
            activeFilter="ALL"
            virtualPrintArea={virtualPrintArea}
            setVirtualPrintArea={setVirtualPrintArea}
            mode="design"
            maxWidth={650}
          />
        </div>
      </div>
    </div>
  );
};

export default EditDesignPage;
