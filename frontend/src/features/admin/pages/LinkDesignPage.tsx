import { useState, useEffect } from "react";
import { Link as LinkIcon, Box, Layers, CheckCircle2 } from "lucide-react";
import axiosClient from "../../../api/axiosClient";

const LinkDesignPage = () => {
  const [designs, setDesigns] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedDesign, setSelectedDesign] = useState("");
  const [ownerType, setOwnerType] = useState("product");
  const [ownerId, setOwnerId] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const [resDesign, resProd] = await Promise.all([
        axiosClient.get("/designs"),
        axiosClient.get("/products"),
      ]);
      setDesigns(resDesign.data);
      setProducts(resProd.data);
    };
    fetchData();
  }, []);

  const handleLink = async () => {
    if (!selectedDesign || !ownerId) return alert("Vui lòng chọn đủ thông tin");
    try {
      await axiosClient.post("designs/link", {
        designId: Number(selectedDesign),
        ownerType,
        ownerId: Number(ownerId),
      });
      alert("Liên kết thiết kế thành công!");
    } catch (err) {
      alert("Lỗi khi liên kết");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="bg-white rounded-[40px] p-10 shadow-xl border border-gray-100">
        <h1 className="text-2xl font-black mb-8 flex items-center gap-3">
          <LinkIcon className="text-indigo-600" /> LIÊN KẾT THIẾT KẾ
        </h1>

        <div className="space-y-8">
          {/* 1. Chọn Mẫu Design */}
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3">
              1. Chọn mẫu thiết kế gốc
            </label>
            <select
              className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold shadow-inner"
              value={selectedDesign}
              onChange={(e) => setSelectedDesign(e.target.value)}
            >
              <option value="">-- Chọn Design --</option>
              {designs.map((d: any) => (
                <option key={d.id} value={d.id}>
                  {d.designName}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Chọn Loại đối tượng */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => {
                setOwnerType("product");
                setOwnerId("");
              }}
              className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-2 ${ownerType === "product" ? "border-indigo-600 bg-indigo-50 text-indigo-600" : "border-gray-100 text-gray-400"}`}
            >
              <Box />{" "}
              <span className="font-black text-xs uppercase">
                Áp dụng cho Sản phẩm
              </span>
            </button>
            <button
              onClick={() => {
                setOwnerType("variant");
                setOwnerId("");
              }}
              className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-2 ${ownerType === "variant" ? "border-indigo-600 bg-indigo-50 text-indigo-600" : "border-gray-100 text-gray-400"}`}
            >
              <Layers />{" "}
              <span className="font-black text-xs uppercase">
                Áp dụng cho Biến thể
              </span>
            </button>
          </div>

          {/* 3. Chọn ID Sản phẩm hoặc Biến thể */}
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3">
              2. Chọn {ownerType === "product" ? "Sản phẩm" : "Biến thể cụ thể"}
            </label>
            <select
              className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold shadow-inner"
              value={ownerId}
              onChange={(e) => setOwnerId(e.target.value)}
            >
              <option value="">-- Chọn đối tượng --</option>
              {ownerType === "product"
                ? products.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.productName}
                    </option>
                  ))
                : products
                    .flatMap((p: any) => p.variants)
                    .map((v: any) => (
                      <option key={v.id} value={v.id}>
                        ID Variant: {v.id} (Thuộc SP: {v.productName})
                      </option>
                    ))}
            </select>
          </div>

          <button
            onClick={handleLink}
            className="w-full bg-black text-white py-5 rounded-[2rem]font-black flex items-center justify-center gap-3 hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-100"
          >
            <CheckCircle2 size={20} /> XÁC NHẬN LIÊN KẾT
          </button>
        </div>
      </div>
    </div>
  );
};

export default LinkDesignPage;
