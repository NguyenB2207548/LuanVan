import { useState, useEffect } from "react";
import axiosClient from "@/api/axiosClient";
import DesignerCanvas from "../../components/common/DesignerCanvas";
import {
  Loader2,
  Package,
  Palette,
  CheckCircle2,
  Save,
  Layers,
  Info,
} from "lucide-react";

const BASE_URL = "http://localhost:3000";

const AddDesignPage = () => {
  // --- DATA STATES ---
  const [products, setProducts] = useState<any[]>([]);
  const [artworks, setArtworks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- SELECTION STATES ---
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedArtwork, setSelectedArtwork] = useState<any>(null);

  // --- CANVAS PREVIEW STATES ---
  const [layers, setLayers] = useState<any[]>([]);
  const [virtualPrintArea, setVirtualPrintArea] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    visible: true,
  });

  // 1. Fetch dữ liệu từ API đúng theo Endpoint bạn cung cấp
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [prodRes, artRes] = await Promise.all([
          axiosClient.get("/products/seller"), // API danh sách sản phẩm của seller
          axiosClient.get("/designs/seller/artworks"), // API danh sách artwork của seller
        ]);
        // Lưu ý: prodRes.data.data dựa trên JSON phân trang bạn gửi
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

  // 2. Xử lý khi chọn Phôi: Lấy dữ liệu từ mockup và printArea bên trong
  const handleSelectProduct = (product: any) => {
    setSelectedProduct(product);

    if (product.mockup && product.mockup.printArea) {
      const area = product.mockup.printArea;
      setVirtualPrintArea({
        x: Number(area.x),
        y: Number(area.y),
        width: Number(area.width),
        height: Number(area.height),
        visible: true,
      });
    } else {
      alert("Sản phẩm này chưa được cấu hình Vùng In (Print Area)!");
      setVirtualPrintArea({ x: 0, y: 0, width: 0, height: 0, visible: false });
    }
  };

  // 3. Xử lý khi chọn Artwork: Map đúng trường layersJson từ Backend
  const handleSelectArtwork = (artwork: any) => {
    setSelectedArtwork(artwork);
    // Giả sử artwork lưu cấu hình canvas trong trường layersJson (theo các bước trước bạn làm)
    if (artwork.layersJson?.details) {
      setLayers(artwork.layersJson.details);
    } else {
      setLayers([]);
    }
  };

  const handleSave = async () => {
    if (!selectedProduct || !selectedArtwork) return;

    const payload = {
      designName: `${selectedProduct.productName} - ${selectedArtwork.artworkName}`,
      productId: selectedProduct.id,
      artworkId: selectedArtwork.id,
    };

    try {
      await axiosClient.post("/designs", payload);
      alert("Đã lưu thành công!");
    } catch (err) {
      alert("Lỗi khi lưu.");
    }
  };

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center bg-white text-gray-500 text-sm">
        <Loader2 className="animate-spin text-blue-600 mr-2" size={24} />
        Đang tải thư viện dữ liệu...
      </div>
    );

  return (
    <div className="flex h-screen bg-[#F1F5F9] overflow-hidden">
      {/* SIDEBAR ĐIỀU KHIỂN */}
      <div className="w-[400px] bg-white border-r border-gray-200 flex flex-col shadow-sm z-20">
        <div className="p-4 border-b bg-gray-50/50">
          <h1 className="text-sm font-bold uppercase tracking-tight text-gray-700 flex items-center gap-2">
            <Layers className="text-blue-600" size={18} /> Gộp Artwork vào Phôi
          </h1>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-8 custom-scrollbar">
          {/* PHẦN 1: CHỌN SẢN PHẨM PHÔI */}
          <section>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-3">
              <Package size={14} /> 1. Chọn sản phẩm phôi
            </label>
            <div className="grid grid-cols-2 gap-3">
              {products.map((p) => (
                <div
                  key={p.id}
                  onClick={() => handleSelectProduct(p)}
                  className={`relative p-2 rounded-lg border-2 transition-all cursor-pointer ${
                    selectedProduct?.id === p.id
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-100 bg-white hover:border-gray-300"
                  }`}
                >
                  <div className="aspect-square bg-gray-50 rounded flex items-center justify-center overflow-hidden">
                    {p.mockup?.url ? (
                      <img
                        src={`${BASE_URL}${p.mockup.url}`}
                        className="w-full h-full object-contain"
                        alt=""
                      />
                    ) : (
                      <Info size={20} className="text-gray-300" />
                    )}
                  </div>
                  <p className="text-[10px] font-bold mt-2 text-center text-gray-700 truncate px-1">
                    {p.productName}
                  </p>
                  {selectedProduct?.id === p.id && (
                    <div className="absolute top-1 right-1 bg-blue-600 text-white rounded-full p-0.5">
                      <CheckCircle2 size={12} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* PHẦN 2: CHỌN ARTWORK */}
          <section>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-3">
              <Palette size={14} /> 2. Chọn Artwork thiết kế
            </label>
            <div className="space-y-2">
              {artworks.map((art) => (
                <div
                  key={art.id}
                  onClick={() => handleSelectArtwork(art)}
                  className={`flex items-center gap-3 p-2 rounded-lg border-2 transition-all cursor-pointer ${
                    selectedArtwork?.id === art.id
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-100 bg-white hover:border-gray-300"
                  }`}
                >
                  <div className="w-10 h-10 bg-gray-100 rounded border border-gray-200 flex-shrink-0 flex items-center justify-center overflow-hidden text-gray-400">
                    <Palette size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-gray-800 truncate">
                      {art.artworkName || `Artwork #${art.id}`}
                    </p>
                    <p className="text-[9px] text-gray-400 font-medium">
                      ID: {art.id}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* NÚT LƯU */}
        <div className="p-4 border-t bg-gray-50">
          <button
            disabled={!selectedProduct || !selectedArtwork}
            onClick={handleSave}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-blue-700 disabled:bg-gray-300 transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            Tạo Sản Phẩm Gộp <Save size={16} />
          </button>
        </div>
      </div>

      {/* CANVAS PREVIEW AREA */}
      <div className="flex-1 relative flex flex-col bg-gray-200">
        <div className="absolute top-4 right-4 z-10">
          <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded border border-gray-300 flex items-center gap-2 shadow-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-bold text-gray-600 uppercase">
              Live Preview
            </span>
          </div>
        </div>

        <DesignerCanvas
          backgroundUrl={selectedProduct?.mockup?.url || ""}
          layers={layers}
          setLayers={setLayers}
          selectedId={null}
          setSelectedId={() => {}}
          isUploading={false}
          activeFilter="ALL"
          virtualPrintArea={virtualPrintArea}
          setVirtualPrintArea={setVirtualPrintArea}
          mode="design" // Mode này giúp khóa kéo thả print area nếu cần
          maxWidth={650}
        />

        {/* EMPTY STATE OVERLAY */}
        {(!selectedProduct || !selectedArtwork) && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100/20 backdrop-blur-[1px] z-30">
            <div className="text-center">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gray-200 shadow-sm">
                <Info className="text-blue-400" size={32} />
              </div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                Vui lòng chọn Phôi & Artwork
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddDesignPage;
