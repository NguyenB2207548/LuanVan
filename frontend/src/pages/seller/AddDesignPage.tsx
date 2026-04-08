import { useState, useEffect } from "react";
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
} from "lucide-react";

const BASE_URL = "http://localhost:3000";

const AddDesignPage = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [artworks, setArtworks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [selectedArtwork, setSelectedArtwork] = useState<any>(null);

  const [layers, setLayers] = useState<any[]>([]);
  const [virtualPrintArea, setVirtualPrintArea] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    visible: true,
  });

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [prodRes, artRes] = await Promise.all([
          axiosClient.get("/products/seller"),
          axiosClient.get("/designs/seller/artworks"),
        ]);
        setProducts(prodRes.data.data || []);
        setArtworks(artRes.data || []);
      } catch (err) {
        console.error("Lỗi tải dữ liệu", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Lấy mockup url: ưu tiên variant, fallback về product
  const getActiveMockup = () => {
    if (selectedVariant?.mockup?.url) return selectedVariant.mockup;
    return selectedProduct?.mockup || null;
  };

  const getActivePrintArea = () => {
    if (selectedVariant?.mockup?.printArea)
      return selectedVariant.mockup.printArea;
    return selectedProduct?.mockup?.printArea || null;
  };

  const applyPrintArea = (printArea: any) => {
    if (printArea) {
      setVirtualPrintArea({
        x: Number(printArea.x),
        y: Number(printArea.y),
        width: Number(printArea.width),
        height: Number(printArea.height),
        visible: true,
      });
    } else {
      setVirtualPrintArea({ x: 0, y: 0, width: 0, height: 0, visible: false });
    }
  };

  const handleSelectProduct = (product: any) => {
    setSelectedProduct(product);
    setSelectedVariant(null);
    const printArea = product.mockup?.printArea;
    if (!printArea) {
      alert("Sản phẩm này chưa được cấu hình Print Area!");
    }
    applyPrintArea(printArea || null);
  };

  const handleSelectVariant = (variant: any) => {
    setSelectedVariant(variant);
    // Ưu tiên print area của variant, fallback về product
    const printArea =
      variant.mockup?.printArea || selectedProduct?.mockup?.printArea;
    applyPrintArea(printArea || null);
  };

  const handleSelectArtwork = (artwork: any) => {
    setSelectedArtwork(artwork);
    setLayers(artwork.layersJson?.details || []);
  };

  const handleSave = async () => {
    if (!selectedProduct || !selectedArtwork) return;
    setSaving(true);
    setSaveSuccess(false);
    try {
      await axiosClient.post("/designs", {
        designName: `${selectedProduct.productName} - ${selectedArtwork.artworkName}`,
        productId: selectedProduct.id,
        artworkId: selectedArtwork.id,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      alert("Lỗi khi lưu thiết kế.");
    } finally {
      setSaving(false);
    }
  };

  const activeMockup = getActiveMockup();
  const canSave = selectedProduct && selectedArtwork;
  const variants = selectedProduct?.variants || [];

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="animate-spin" size={18} />
          Đang tải dữ liệu...
        </div>
      </div>
    );

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* ── SIDEBAR ── */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col shrink-0 z-10">
        {/* Sidebar header */}
        <div className="px-5 py-4 border-b border-gray-100">
          <h1 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <Layers size={17} className="text-gray-500" />
            Lưu thiết kế
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Gắn artwork vào sản phẩm phôi
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* ── STEP 1: Product ── */}
          <div className="px-5 py-4 border-b border-gray-100">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-3">
              <Package size={11} /> Bước 1 · Chọn sản phẩm phôi
            </p>
            <div className="space-y-1.5">
              {products.map((p) => {
                const thumb =
                  p.images?.find((i: any) => i.isPrimary)?.url ||
                  p.mockup?.url ||
                  null;
                const isSelected = selectedProduct?.id === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => handleSelectProduct(p)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-colors ${
                      isSelected
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "border-gray-200 bg-white hover:border-gray-400 text-gray-700"
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-lg overflow-hidden shrink-0 border ${isSelected ? "border-white/20" : "border-gray-100"} bg-gray-50 flex items-center justify-center`}
                    >
                      {thumb ? (
                        <img
                          src={`${BASE_URL}${thumb}`}
                          className="w-full h-full object-contain"
                          alt=""
                        />
                      ) : (
                        <ImageIcon size={14} className="text-gray-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-medium truncate ${isSelected ? "text-white" : "text-gray-800"}`}
                      >
                        {p.productName}
                      </p>
                      <p
                        className={`text-xs mt-0.5 ${isSelected ? "text-white/60" : "text-gray-400"}`}
                      >
                        {p.variants?.length || 0} biến thể
                      </p>
                    </div>
                    {isSelected && (
                      <CheckCircle2 size={16} className="text-white shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── STEP 2: Variant (chỉ hiện sau khi chọn product + artwork) ── */}
          {selectedProduct && selectedArtwork && variants.length > 0 && (
            <div className="px-5 py-4 border-b border-gray-100">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                <ChevronDown size={11} /> Bước 2 · Xem theo biến thể
              </p>
              <div className="grid grid-cols-3 gap-1.5">
                {/* Option: mockup gốc của product */}
                <button
                  onClick={() => handleSelectVariant(null)}
                  className={`flex flex-col items-center p-2 rounded-lg border text-center transition-colors ${
                    !selectedVariant
                      ? "border-gray-900 bg-gray-900 text-white"
                      : "border-gray-200 hover:border-gray-400 text-gray-600"
                  }`}
                >
                  <div className="w-10 h-10 rounded-lg border border-gray-100 bg-gray-50 overflow-hidden mb-1.5 flex items-center justify-center">
                    {selectedProduct.mockup?.url ? (
                      <img
                        src={`${BASE_URL}${selectedProduct.mockup.url}`}
                        className="w-full h-full object-contain"
                        alt=""
                      />
                    ) : (
                      <ImageIcon size={12} className="text-gray-300" />
                    )}
                  </div>
                  <p
                    className={`text-[10px] leading-tight ${!selectedVariant ? "text-white/80" : "text-gray-500"}`}
                  >
                    Mặc định
                  </p>
                </button>

                {variants.map((v: any) => {
                  const vThumb =
                    v.mockup?.url ||
                    v.images?.find((i: any) => i.isPrimary)?.url ||
                    null;
                  const isSelected = selectedVariant?.id === v.id;
                  return (
                    <button
                      key={v.id}
                      onClick={() => handleSelectVariant(v)}
                      className={`flex flex-col items-center p-2 rounded-lg border text-center transition-colors ${
                        isSelected
                          ? "border-gray-900 bg-gray-900 text-white"
                          : "border-gray-200 hover:border-gray-400 text-gray-600"
                      }`}
                    >
                      <div className="w-10 h-10 rounded-lg border border-gray-100 bg-gray-50 overflow-hidden mb-1.5 flex items-center justify-center">
                        {vThumb ? (
                          <img
                            src={`${BASE_URL}${vThumb}`}
                            className="w-full h-full object-contain"
                            alt=""
                          />
                        ) : (
                          <ImageIcon size={12} className="text-gray-300" />
                        )}
                      </div>
                      <p
                        className={`text-[10px] leading-tight truncate w-full ${isSelected ? "text-white/80" : "text-gray-500"}`}
                      >
                        {v.sku || `#${v.id}`}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── STEP 3: Artwork ── */}
          <div className="px-5 py-4">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-3">
              <Palette size={11} />{" "}
              {selectedProduct && variants.length > 0 ? "Bước 3" : "Bước 2"} ·
              Chọn artwork
            </p>
            {artworks.length === 0 ? (
              <p className="text-xs text-gray-400 italic">
                Chưa có artwork nào
              </p>
            ) : (
              <div className="space-y-1.5">
                {artworks.map((art) => {
                  const isSelected = selectedArtwork?.id === art.id;
                  return (
                    <button
                      key={art.id}
                      onClick={() => handleSelectArtwork(art)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-colors ${
                        isSelected
                          ? "border-gray-900 bg-gray-900 text-white"
                          : "border-gray-200 bg-white hover:border-gray-400 text-gray-700"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center ${isSelected ? "bg-white/10" : "bg-gray-100"}`}
                      >
                        <Palette
                          size={14}
                          className={
                            isSelected ? "text-white/70" : "text-gray-400"
                          }
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm font-medium truncate ${isSelected ? "text-white" : "text-gray-800"}`}
                        >
                          {art.artworkName || `Artwork #${art.id}`}
                        </p>
                        <p
                          className={`text-xs mt-0.5 ${isSelected ? "text-white/50" : "text-gray-400"}`}
                        >
                          {art.layersJson?.details?.length || 0} layers
                        </p>
                      </div>
                      {isSelected && (
                        <CheckCircle2
                          size={15}
                          className="text-white shrink-0"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Save button */}
        <div className="px-5 py-4 border-t border-gray-100">
          <button
            disabled={!canSave || saving}
            onClick={handleSave}
            className={`w-full py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              saveSuccess
                ? "bg-emerald-600 text-white"
                : canSave
                  ? "bg-gray-900 text-white hover:bg-black"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            {saving ? (
              <>
                <Loader2 size={15} className="animate-spin" /> Đang lưu...
              </>
            ) : saveSuccess ? (
              <>
                <CheckCircle2 size={15} /> Đã lưu thành công
              </>
            ) : (
              <>
                <Save size={15} /> Lưu thiết kế
              </>
            )}
          </button>
          {!canSave && (
            <p className="text-[11px] text-gray-400 text-center mt-2">
              Vui lòng chọn sản phẩm và artwork
            </p>
          )}
        </div>
      </div>

      {/* ── CANVAS AREA ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Canvas topbar */}
        <div className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-5 shrink-0">
          <div className="flex items-center gap-4 text-sm text-gray-500">
            {selectedProduct && (
              <span className="flex items-center gap-1.5">
                <Package size={14} className="text-gray-400" />
                <span className="text-gray-700 font-medium">
                  {selectedProduct.productName}
                </span>
              </span>
            )}
            {selectedProduct && selectedArtwork && (
              <span className="text-gray-300">/</span>
            )}
            {selectedArtwork && (
              <span className="flex items-center gap-1.5">
                <Palette size={14} className="text-gray-400" />
                <span className="text-gray-700 font-medium">
                  {selectedArtwork.artworkName}
                </span>
              </span>
            )}
            {selectedVariant && (
              <>
                <span className="text-gray-300">/</span>
                <span className="text-xs text-violet-600 font-medium bg-violet-50 border border-violet-200 px-2 py-0.5 rounded">
                  {selectedVariant.sku || `Variant #${selectedVariant.id}`}
                </span>
              </>
            )}
            {!selectedProduct && !selectedArtwork && (
              <span className="text-gray-400">
                Chọn sản phẩm và artwork để bắt đầu
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-xs text-gray-400">Live Preview</span>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative flex items-center justify-center bg-gray-100 overflow-hidden">
          <DesignerCanvas
            backgroundUrl={activeMockup?.url || ""}
            layers={layers}
            setLayers={setLayers}
            selectedId={null}
            setSelectedId={() => {}}
            isUploading={false}
            activeFilter="ALL"
            virtualPrintArea={virtualPrintArea}
            setVirtualPrintArea={setVirtualPrintArea}
            mode="design"
            maxWidth={650}
          />

          {/* Empty state */}
          {(!selectedProduct || !selectedArtwork) && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100/80 backdrop-blur-[2px]">
              <div className="text-center">
                <div className="w-14 h-14 bg-white border border-gray-200 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-sm">
                  <Layers size={24} className="text-gray-300" />
                </div>
                <p className="text-sm font-medium text-gray-500">
                  {!selectedProduct
                    ? "Chọn sản phẩm phôi"
                    : "Chọn artwork thiết kế"}
                </p>
                <p className="text-xs text-gray-400 mt-1">từ thanh bên trái</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddDesignPage;
