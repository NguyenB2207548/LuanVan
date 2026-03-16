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
    width: 250,
    height: 250,
    visible: true,
  });

  // 1. Fetch dữ liệu Phôi và Artwork
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [prodRes, artRes] = await Promise.all([
          axiosClient.get("/products"), // Lấy phôi sản phẩm
          axiosClient.get("/designs"), // Lấy các mẫu artwork đã thiết kế
        ]);
        setProducts(prodRes.data || []);
        setArtworks(artRes.data || []);
      } catch (err) {
        console.error("Lỗi tải dữ liệu", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 2. Khi chọn Phôi (Product): Cập nhật Vùng In của Phôi lên Canvas
  const handleSelectProduct = (product: any) => {
    setSelectedProduct(product);

    // GIẢ ĐỊNH: Product của bạn có trường printArea cấu hình sẵn trong DB
    if (product.printArea) {
      setVirtualPrintArea({
        ...product.printArea,
        visible: true,
      });
    } else {
      // Fallback nếu phôi chưa cấu hình vùng in
      setVirtualPrintArea({
        x: 100,
        y: 100,
        width: 300,
        height: 400,
        visible: true,
      });
    }
  };

  // 3. Khi chọn Artwork: Đổ các Layers vào Canvas
  const handleSelectArtwork = (artwork: any) => {
    setSelectedArtwork(artwork);

    // Lấy các lớp (details) từ templateJson của artwork
    if (artwork.templateJson?.details) {
      setLayers(artwork.templateJson.details);
    }
  };

  const handleSaveMergedProduct = async () => {
    if (!selectedProduct || !selectedArtwork) {
      alert("Vui lòng chọn đầy đủ phôi và artwork!");
      return;
    }

    const payload = {
      productId: selectedProduct.id,
      artworkId: selectedArtwork.id,
      designName: `${selectedProduct.name} - ${selectedArtwork.designName}`,
      // Gửi cấu hình cuối cùng để backend render
      finalConfig: {
        background: selectedProduct.thumbnail,
        printArea: virtualPrintArea,
        layers: layers,
      },
    };

    try {
      await axiosClient.post("/merged-products", payload);
      alert("Đã gộp và tạo sản phẩm mới thành công!");
    } catch (err) {
      alert("Lỗi khi lưu gộp sản phẩm.");
    }
  };

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );

  return (
    <div className="flex h-screen bg-[#F3F4F6] overflow-hidden">
      {/* CỘT TRÁI: ĐIỀU KHIỂN GỘP */}
      <div className="w-[450px] bg-white border-r flex flex-col shadow-2xl z-20">
        <div className="p-6 border-b bg-gray-50/50">
          <h1 className="text-xl font-black text-gray-800 flex items-center gap-2 uppercase tracking-tighter">
            <Layers className="text-blue-600" size={24} /> Trình Gộp Sản Phẩm
          </h1>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-10">
          {/* PHẦN 1: CHỌN PHÔI */}
          <section>
            <div className="flex justify-between items-center mb-4">
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Package size={14} /> 1. Chọn sản phẩm phôi
              </label>
              {selectedProduct && (
                <span className="text-[10px] text-green-600 font-bold">
                  Đã chọn
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {products.map((p) => (
                <div
                  key={p.id}
                  onClick={() => handleSelectProduct(p)}
                  className={`group relative p-2 rounded-2xl border-2 transition-all duration-300 cursor-pointer ${
                    selectedProduct?.id === p.id
                      ? "border-blue-600 bg-blue-50 shadow-md"
                      : "border-gray-100 hover:border-blue-200 bg-white"
                  }`}
                >
                  <img
                    src={`${BASE_URL}${p.thumbnail}`}
                    className="w-full aspect-square object-contain rounded-xl"
                    alt=""
                  />
                  <p className="text-[10px] font-black mt-2 text-center text-gray-700 truncate px-1">
                    {p.name}
                  </p>
                  {selectedProduct?.id === p.id && (
                    <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full p-0.5 shadow-sm">
                      <CheckCircle2 size={14} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* PHẦN 2: CHỌN ARTWORK */}
          <section>
            <div className="flex justify-between items-center mb-4">
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Palette size={14} /> 2. Chọn Artwork thiết kế
              </label>
              {selectedArtwork && (
                <span className="text-[10px] text-green-600 font-bold">
                  Đã chọn
                </span>
              )}
            </div>
            <div className="space-y-3">
              {artworks.map((art) => (
                <div
                  key={art.id}
                  onClick={() => handleSelectArtwork(art)}
                  className={`flex items-center gap-4 p-3 rounded-2xl border-2 transition-all duration-300 cursor-pointer ${
                    selectedArtwork?.id === art.id
                      ? "border-blue-600 bg-blue-50 shadow-sm"
                      : "border-gray-100 hover:border-blue-200 bg-white"
                  }`}
                >
                  <div className="w-14 h-14 bg-gray-50 rounded-xl overflow-hidden border border-gray-100 p-1 flex-shrink-0">
                    <img
                      src={`${BASE_URL}${art.thumbnailUrl}`}
                      className="w-full h-full object-cover rounded-lg"
                      alt=""
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-gray-800 truncate">
                      {art.designName}
                    </p>
                    <p className="text-[9px] font-bold text-gray-400 uppercase mt-1 tracking-tighter">
                      {art.templateJson?.details?.length || 0} Layers
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* NÚT LƯU GỘP */}
        <div className="p-6 bg-gray-50 border-t">
          <button
            disabled={!selectedProduct || !selectedArtwork}
            onClick={handleSaveMergedProduct}
            className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-sm shadow-xl hover:bg-blue-600 disabled:bg-gray-200 disabled:text-gray-400 transition-all duration-300 flex items-center justify-center gap-2 uppercase tracking-widest"
          >
            Lưu Sản Phẩm Gộp <Save size={18} />
          </button>
        </div>
      </div>

      {/* CỘT PHẢI: CANVAS PREVIEW CHẾ ĐỘ READ-ONLY */}
      <div className="flex-1 flex flex-col relative bg-[#E5E7EB]">
        {/* Chỉ dẫn Preview */}
        <div className="absolute top-6 right-6 z-10">
          <div className="bg-gray-900/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-3">
            <span className="text-[10px] font-black text-white uppercase tracking-tighter">
              Preview Mode
            </span>
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          </div>
        </div>

        {/* CANVAS: Lấy nền từ Product, Layer từ Artwork */}
        <DesignerCanvas
          backgroundUrl={selectedProduct?.thumbnail || ""}
          layers={layers}
          setLayers={setLayers}
          selectedId={null} // Truyền null để Transformer không hiện lên, chỉ để xem
          setSelectedId={() => {}}
          isUploading={false}
          activeFilter="ALL"
          virtualPrintArea={virtualPrintArea} // Vùng in lấy từ Product
          setVirtualPrintArea={setVirtualPrintArea}
        />

        {/* Overlay nếu chưa chọn đủ */}
        {(!selectedProduct || !selectedArtwork) && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-200/40 backdrop-blur-[2px] z-30 pointer-events-none">
            <div className="bg-white p-8 rounded-3xl shadow-2xl text-center border border-gray-100 max-w-sm">
              <Layers className="mx-auto text-blue-200 mb-4" size={60} />
              <h2 className="text-lg font-black text-gray-800 uppercase tracking-tighter">
                Chế độ xem trước
              </h2>
              <p className="text-sm text-gray-500 mt-2 font-medium">
                Vui lòng chọn đủ <b>Phôi sản phẩm</b> và <b>Mẫu Artwork</b> bên
                trái để xem kết quả gộp.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddDesignPage;
