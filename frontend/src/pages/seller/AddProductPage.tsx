import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Edit2,
  Upload,
  Save,
  X,
  Check,
  Image as ImageIcon,
} from "lucide-react";

import axiosClient from "@/api/axiosClient";
import AssetManagerModal from "../../components/admin/AssetManagerModal";
import PrintAreaModal from "@/modals/PrintAreaModal";

interface Attribute {
  id: number;
  attributeName: string;
  attributeValues: {
    id: number;
    valueName: string;
    attributeId: number;
  }[];
}

interface Category {
  id: number;
  categoryName: string;
}

const AddProductPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // PRODUCT DATA
  const [productData, setProductData] = useState({
    productName: "",
    description: "",
    categoryId: "",
  });

  // PRODUCT GALLERY
  const [productImages, setProductImages] = useState<string[]>([]);

  // PRODUCT MOCKUP
  const [productMockup, setProductMockup] = useState<string | null>(null);

  // ATTRIBUTE SELECT
  const [selectedAttributeIds, setSelectedAttributeIds] = useState<number[]>(
    [],
  );

  // VARIANTS
  const [variants, setVariants] = useState<any[]>([]);

  // ASSET MODAL
  const [assetModalOpen, setAssetModalOpen] = useState(false);
  const [assetTarget, setAssetTarget] = useState<
    | "productGallery"
    | "productMockup"
    | { type: "variant"; index: number }
    | null
  >(null);

  const generateSlug = (str: string) => {
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s]/gi, "")
      .replace(/\s+/g, "")
      .toUpperCase();
  };

  const generateVariantSKU = (
    productName: string,
    selectedValues: string[],
  ) => {
    const prefix = generateSlug(productName).slice(0, 4); // Lấy 4 ký tự đầu tên SP
    const suffix = selectedValues
      .map((v) => generateSlug(v).slice(0, 3))
      .join("-");
    const randomSuffix = Math.random()
      .toString(36)
      .substring(2, 5)
      .toUpperCase(); // 3 ký tự ngẫu nhiên tránh trùng

    return `${prefix}-${suffix}-${randomSuffix}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [attrRes, catRes] = await Promise.all([
          axiosClient.get("/attributes"),
          axiosClient.get("/categories"),
        ]);
        setAttributes(attrRes.data || []);
        setCategories(catRes.data || []);
      } catch (err) {
        console.error("Fetch error", err);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (variants.length === 0) return;

    const refreshSKUs = () => {
      const newVariants = variants.map((v) => {
        const selectedValueNames: string[] = [];
        Object.entries(v.attributeValueIds).forEach(([aId, vId]) => {
          if (!vId) return;
          const attr = attributes.find((a) => a.id === Number(aId));
          const val = attr?.attributeValues.find(
            (val) => val.id === Number(vId),
          );
          if (val) selectedValueNames.push(val.valueName);
        });

        if (selectedValueNames.length > 0) {
          return {
            ...v,
            sku: generateVariantSKU(
              productData.productName,
              selectedValueNames,
            ),
          };
        }
        return v;
      });
      setVariants(newVariants);
    };

    const timer = setTimeout(refreshSKUs, 500);
    return () => clearTimeout(timer);
  }, [productData.productName]);

  const openAssetModal = (target: any) => {
    setAssetTarget(target);
    setAssetModalOpen(true);
  };

  const handleAssetSelect = (urls: string[]) => {
    if (!assetTarget) return;
    if (assetTarget === "productGallery") {
      setProductImages((prev) => [...prev, ...urls]);
    } else if (assetTarget === "productMockup") {
      setProductMockup(urls[0]);
    } else if (typeof assetTarget === "object") {
      const newVariants = [...variants];
      newVariants[assetTarget.index].mockup = urls[0];
      setVariants(newVariants);
    }
  };

  const toggleAttribute = (id: number) => {
    setSelectedAttributeIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const addVariant = () => {
    const initialAttrs: Record<number, string> = {};
    selectedAttributeIds.forEach((id) => (initialAttrs[id] = ""));
    setVariants([
      ...variants,
      {
        sku: "",
        price: 0,
        stock: 0,
        mockup: "",
        attributeValueIds: initialAttrs,
      },
    ]);
  };

  const updateVariantData = (index: number, field: string, value: any) => {
    const newVariants = [...variants];

    if (field.startsWith("attr_")) {
      const attrId = Number(field.split("_")[1]);
      newVariants[index].attributeValueIds[attrId] = value;

      // --- LOGIC TỰ ĐỘNG TẠO SKU ---
      const currentVariant = newVariants[index];
      const selectedValueNames: string[] = [];

      // Lấy tên của các giá trị đã chọn dựa trên ID hiện tại
      Object.entries(currentVariant.attributeValueIds).forEach(([aId, vId]) => {
        if (!vId) return;
        const attr = attributes.find((a) => a.id === Number(aId));
        const val = attr?.attributeValues.find((v) => v.id === Number(vId));
        if (val) selectedValueNames.push(val.valueName);
      });

      // Cập nhật SKU nếu đã chọn ít nhất 1 thuộc tính,
      // hoặc reset nếu người dùng chọn lại "Chọn thuộc tính"
      if (selectedValueNames.length > 0) {
        currentVariant.sku = generateVariantSKU(
          productData.productName || "PROD", // Fallback nếu chưa nhập tên SP
          selectedValueNames,
        );
      }
    } else {
      newVariants[index][field] = value;
    }
    setVariants(newVariants);
  };

  const [printAreaModalOpen, setPrintAreaModalOpen] = useState(false);
  const [printAreaTarget, setPrintAreaTarget] = useState<{
    type: "product" | "variant";
    index?: number;
    url: string;
    initialData: any;
  } | null>(null);

  // --- MỞ MODAL PRINT AREA ---
  const openPrintAreaModal = (type: "product" | "variant", index?: number) => {
    let url = "";
    let initialData = { x: 175, y: 135, width: 220, height: 275 };

    if (type === "product") {
      if (!productMockup) return alert("Vui lòng chọn mockup trước!");
      url = `http://localhost:3000${productMockup}`;
      // Nếu sau này bạn muốn load data cũ từ state thì lấy ở đây
    } else {
      if (index === undefined || !variants[index].mockup)
        return alert("Vui lòng chọn mockup biến thể!");
      url = `http://localhost:3000${variants[index].mockup}`;
      const v = variants[index];
      if (v.x)
        initialData = { x: v.x, y: v.y, width: v.width, height: v.height };
    }

    setPrintAreaTarget({ type, index, url, initialData });
    setPrintAreaModalOpen(true);
  };

  // --- NHẬN DỮ LIỆU TỪ CANVAS ---
  const handleSavePrintArea = (data: any) => {
    if (!printAreaTarget) return;

    if (printAreaTarget.type === "product") {
      // Lưu tọa độ vào state product (bạn có thể thêm state riêng hoặc gộp vào productData)
      setProductData((prev: any) => ({ ...prev, printArea: data }));
    } else if (
      printAreaTarget.type === "variant" &&
      printAreaTarget.index !== undefined
    ) {
      const newVariants = [...variants];
      newVariants[printAreaTarget.index] = {
        ...newVariants[printAreaTarget.index],
        ...data, // Ghi đè x, y, width, height
      };
      setVariants(newVariants);
    }
    setPrintAreaModalOpen(false);
  };

  const handleSaveProduct = async () => {
    try {
      setLoading(true);

      // BƯỚC 1: Đóng gói dữ liệu Sản phẩm & Variants
      const payload = {
        productName: productData.productName,
        description: productData.description,
        categoryId: Number(productData.categoryId),
        productImages: productImages, // Các URL từ Asset Manager
        variants: variants.map((v) => ({
          sku: v.sku.trim(),
          price: Number(v.price),
          stock: Number(v.stock),
          attributeValueIds: Object.values(v.attributeValueIds)
            .filter((val) => val !== "" && val !== null)
            .map(Number),
        })),
      };

      // Gọi API tạo Product
      const resProduct = await axiosClient.post("/products", payload);

      // LOG dữ liệu để kiểm tra Backend có trả về variants kèm ID không
      console.log("Dữ liệu Product vừa tạo:", resProduct.data);

      const productId = resProduct.data?.id;
      const variantResponses = resProduct.data?.variants; // Đây là mảng chứa các ID mới tạo

      if (!productId) {
        throw new Error("Server không trả về ID sản phẩm!");
      }

      // BƯỚC 2: Lưu Mockup cho Product chính (kèm tọa độ từ Canvas)
      if (productMockup) {
        const pArea = (productData as any).printArea || {
          x: 0,
          y: 0,
          width: 0,
          height: 0,
        };

        await axiosClient.post(`/designs/product/${productId}/mockup`, {
          url: productMockup,
          ...pArea,
        });
      }

      // BƯỚC 3: Lưu Mockup cho từng Variant (kèm tọa độ từ Canvas)
      // Kiểm tra an toàn trước khi map để tránh lỗi "reading '0'"
      if (
        variantResponses &&
        Array.isArray(variantResponses) &&
        variantResponses.length > 0
      ) {
        const uploadPromises = variants.map((v, index) => {
          if (v.mockup) {
            // Sử dụng dấu ? để tránh crash nếu index không khớp
            const vId = variantResponses[index]?.id;

            if (vId) {
              return axiosClient.post(`/designs/variant/${vId}/mockup`, {
                url: v.mockup,
                x: v.x || 0,
                y: v.y || 0,
                width: v.width || 0,
                height: v.height || 0,
              });
            }
          }
          return null;
        });

        // Đợi tất cả các tiến trình upload mockup variant hoàn thành
        await Promise.all(uploadPromises.filter((p) => p !== null));
      } else {
        console.warn(
          "Cảnh báo: Không có dữ liệu variantResponses từ server, bỏ qua lưu mockup variant.",
        );
      }

      alert("Tạo sản phẩm và cấu hình vùng in thành công!");
      navigate("/seller/products");
    } catch (error: any) {
      console.error("Lỗi chi tiết:", error);
      // Hiển thị thông báo lỗi cụ thể từ Backend nếu có
      const serverMessage = error.response?.data?.message;
      const errorMsg = Array.isArray(serverMessage)
        ? serverMessage.join(", ")
        : serverMessage;

      alert(
        "Lỗi khi lưu sản phẩm: " +
          (errorMsg || error.message || "Lỗi hệ thống"),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-20 px-4">
      {/* STICKY HEADER */}
      <div className="flex items-center justify-between mb-8 sticky top-0 bg-gray-50/90 backdrop-blur-sm py-4 z-20 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-white rounded-lg border border-gray-200 transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Thêm sản phẩm POD</h1>
        </div>
        <button
          onClick={handleSaveProduct}
          disabled={loading}
          className={`flex items-center gap-2 px-6 py-2 bg-blue-600 text-white text-sm font-bold rounded-md hover:bg-blue-700 shadow-lg transition-all ${
            loading ? "opacity-70 cursor-not-allowed" : ""
          }`}
        >
          {loading ? (
            "Đang xử lý..."
          ) : (
            <>
              <Save size={16} /> Lưu sản phẩm
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* PHẦN 1: THÔNG TIN TỔNG QUAN */}
          <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-sm font-bold text-gray-700">
                Thông tin tổng quan
              </h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    Tên sản phẩm
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
                    onChange={(e) =>
                      setProductData({
                        ...productData,
                        productName: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    Mô tả
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                    onChange={(e) =>
                      setProductData({
                        ...productData,
                        description: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              {/* GALLERY */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-3">
                  Gallery ảnh sản phẩm
                </label>
                <div className="flex flex-wrap gap-3">
                  {productImages.map((img, i) => (
                    <div
                      key={i}
                      className="w-24 h-24 rounded-lg border border-gray-200 overflow-hidden relative group"
                    >
                      <img
                        src={`http://localhost:3000${img}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() =>
                          setProductImages(
                            productImages.filter((_, idx) => idx !== i),
                          )
                        }
                        className="absolute top-1 right-1 bg-white p-1 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={12} className="text-red-500" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => openAssetModal("productGallery")}
                    className="w-24 h-24 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50"
                  >
                    <Plus size={20} className="text-gray-300" />
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* PHẦN 2: THIẾT LẬP BIẾN THỂ */}
          <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <h2 className="text-sm font-bold text-gray-700">
                Cấu hình Biến thể
              </h2>
            </div>
            <div className="p-6 space-y-8">
              {/* Bước 1: Chọn Attributes */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-3">
                  1. Chọn các thuộc tính
                </label>
                <div className="flex flex-wrap gap-2">
                  {attributes.map((attr) => (
                    <button
                      key={attr.id}
                      onClick={() => toggleAttribute(attr.id)}
                      className={`px-4 py-2 rounded-full text-xs font-bold border transition-all flex items-center gap-2 ${
                        selectedAttributeIds.includes(attr.id)
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-gray-600 border-gray-200"
                      }`}
                    >
                      {selectedAttributeIds.includes(attr.id) && (
                        <Check size={14} />
                      )}
                      {attr.attributeName}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bước 2: Danh sách Variant */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold text-gray-500 uppercase">
                    2. Danh sách biến thể
                  </label>
                  <button
                    onClick={addVariant}
                    disabled={selectedAttributeIds.length === 0}
                    className="flex items-center gap-1.5 text-blue-600 font-bold text-xs hover:bg-blue-50 px-3 py-1.5 rounded-md disabled:opacity-50"
                  >
                    <Plus size={14} /> Thêm biến thể
                  </button>
                </div>

                {variants.map((v, vIdx) => (
                  <div
                    key={vIdx}
                    className="p-4 border border-gray-100 rounded-xl bg-gray-50/30 grid grid-cols-1 md:grid-cols-12 gap-6 relative group"
                  >
                    <button
                      onClick={() =>
                        setVariants(variants.filter((_, i) => i !== vIdx))
                      }
                      className="absolute -top-2 -right-2 bg-white text-red-500 border border-gray-100 p-1 rounded-full shadow-sm hover:bg-red-50"
                    >
                      <X size={14} />
                    </button>

                    <div className="md:col-span-3">
                      <div className="relative aspect-square bg-white border-2 border-dashed rounded-lg flex items-center justify-center group/m">
                        {v.mockup ? (
                          <>
                            <img
                              src={`http://localhost:3000${v.mockup}`}
                              className="w-full h-full object-contain"
                            />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/m:opacity-100 transition-opacity gap-2">
                              {/* NÚT MỞ CANVAS CHO VARIANT */}
                              <button
                                onClick={() =>
                                  openPrintAreaModal("variant", vIdx)
                                }
                                className="p-1.5 bg-blue-600 text-white rounded shadow-sm hover:bg-blue-700"
                                title="Cấu hình vùng in"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() =>
                                  openAssetModal({
                                    type: "variant",
                                    index: vIdx,
                                  })
                                }
                                className="p-1.5 bg-white rounded text-gray-600 shadow-sm"
                              >
                                <Upload size={14} />
                              </button>
                            </div>
                          </>
                        ) : (
                          <button
                            onClick={() =>
                              openAssetModal({ type: "variant", index: vIdx })
                            }
                            className="flex flex-col items-center"
                          >
                            <Upload size={20} className="text-gray-300 mb-1" />
                            <span className="text-[9px] text-gray-400 font-bold uppercase">
                              Mockup
                            </span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="md:col-span-9 grid grid-cols-2 md:grid-cols-3 gap-4">
                      {selectedAttributeIds.map((attrId) => {
                        const attr = attributes.find((a) => a.id === attrId);
                        return (
                          <div key={attrId}>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                              {attr?.attributeName}
                            </label>
                            <select
                              className="w-full p-2 border border-gray-200 rounded-lg text-xs bg-white outline-none"
                              value={v.attributeValueIds[attrId] || ""}
                              onChange={(e) =>
                                updateVariantData(
                                  vIdx,
                                  `attr_${attrId}`,
                                  e.target.value,
                                )
                              }
                            >
                              <option value="">
                                Chọn {attr?.attributeName}
                              </option>
                              {attr?.attributeValues?.map((val) => (
                                <option key={val.id} value={val.id}>
                                  {val.valueName}
                                </option>
                              ))}
                            </select>
                          </div>
                        );
                      })}

                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                          Giá
                        </label>
                        <input
                          type="number"
                          className="w-full p-2 border border-gray-200 rounded-lg text-xs"
                          onChange={(e) =>
                            updateVariantData(vIdx, "price", e.target.value)
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* CỘT PHẢI: MOCKUP CHÍNH & PHÂN LOẠI */}
        <div className="space-y-6">
          <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
              Mockup chính
            </h2>
            <div className="relative aspect-square bg-gray-50 border-2 border-dashed rounded-xl flex items-center justify-center overflow-hidden group">
              {productMockup ? (
                <>
                  <img
                    src={`http://localhost:3000${productMockup}`}
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-3">
                    {/* NÚT MỞ CANVAS CHO PRODUCT */}
                    <button
                      onClick={() => openPrintAreaModal("product")}
                      className="p-2 bg-blue-600 text-white rounded-lg shadow-md hover:scale-110 transition-transform"
                    >
                      <Edit2 size={20} />
                    </button>
                    <button
                      onClick={() => openAssetModal("productMockup")}
                      className="p-2 bg-white rounded-lg text-gray-600 shadow-md hover:scale-110 transition-transform"
                    >
                      <Upload size={20} />
                    </button>
                  </div>
                </>
              ) : (
                <button
                  onClick={() => openAssetModal("productMockup")}
                  className="flex flex-col items-center"
                >
                  <ImageIcon size={32} className="text-gray-300 mb-2" />
                  <span className="text-xs text-gray-400 font-bold uppercase">
                    Tải Mockup Gốc
                  </span>
                </button>
              )}
            </div>
          </section>

          <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
              Phân loại
            </h2>
            <div className="space-y-4">
              <select
                className="w-full p-2 border border-gray-200 rounded-lg text-sm bg-white outline-none"
                onChange={(e) =>
                  setProductData({ ...productData, categoryId: e.target.value })
                }
              >
                <option value="">Chọn danh mục</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.categoryName}
                  </option>
                ))}
              </select>
            </div>
          </section>
        </div>
      </div>

      <AssetManagerModal
        isOpen={assetModalOpen}
        onClose={() => setAssetModalOpen(false)}
        onSelect={handleAssetSelect}
        multiple={assetTarget === "productGallery"}
      />

      {printAreaTarget && (
        <PrintAreaModal
          isOpen={printAreaModalOpen}
          mockupUrl={printAreaTarget.url}
          initialData={printAreaTarget.initialData}
          onClose={() => setPrintAreaModalOpen(false)}
          onSave={handleSavePrintArea}
        />
      )}
    </div>
  );
};

export default AddProductPage;
