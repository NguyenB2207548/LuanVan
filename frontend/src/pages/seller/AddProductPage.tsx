import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
  const location = useLocation();

  const [loading, setLoading] = useState(false);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Khởi tạo state mặc định để dùng cho việc Reset
  const initialProductData = {
    productName: "",
    description: "",
    categoryId: "",
    printArea: null as any,
  };

  const [productData, setProductData] = useState(initialProductData);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [productMockup, setProductMockup] = useState<string | null>(null);
  const [selectedAttributeIds, setSelectedAttributeIds] = useState<number[]>(
    [],
  );
  const [variants, setVariants] = useState<any[]>([]);
  const [assetModalOpen, setAssetModalOpen] = useState(false);
  const [assetTarget, setAssetTarget] = useState<any>(null);

  useEffect(() => {
    if (location.state) {
      const s = location.state;
      if (s.productData) setProductData(s.productData);
      if (s.productImages) setProductImages(s.productImages);
      if (s.productMockup) setProductMockup(s.productMockup);
      if (s.variants) setVariants(s.variants);
      if (s.selectedAttributeIds)
        setSelectedAttributeIds(s.selectedAttributeIds);

      if (s.updatedPrintArea) {
        const { type, index, data } = s.updatedPrintArea;
        if (type === "product") {
          setProductData((prev) => ({ ...prev, printArea: data }));
        } else if (type === "variant" && index !== undefined) {
          setVariants((prev) => {
            const newVariants = [...prev];
            newVariants[index] = { ...newVariants[index], ...data };
            return newVariants;
          });
        }
      }
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const generateSlug = (str: string) => {
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s]/gi, "")
      .replace(/\s+/g, "")
      .toUpperCase();
  };

  // Cập nhật hàm tạo SKU: Thêm index và timestamp để tránh trùng lặp hoàn toàn
  const generateVariantSKU = (
    productName: string,
    selectedValues: string[],
    index: number,
  ) => {
    const prefix = generateSlug(productName || "PROD").slice(0, 4);
    const suffix = selectedValues
      .map((v) => generateSlug(v).slice(0, 3))
      .join("-");
    const uniqueId = Date.now().toString(36).slice(-2).toUpperCase(); // 2 ký tự thời gian cuối

    // Cấu trúc: [TênSP]-[ThuộcTính]-[VịTríBiếnThể][MãDuyNhất]
    return `${prefix}-${suffix}-${index + 1}${uniqueId}`;
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
      const newVariants = variants.map((v, idx) => {
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
              idx,
            ),
          };
        }
        return v;
      });
      setVariants(newVariants);
    };
    const timer = setTimeout(refreshSKUs, 500);
    return () => clearTimeout(timer);
  }, [productData.productName, variants.length]); // Thêm variants.length để re-calculate khi add/remove

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

      const selectedValueNames: string[] = [];
      Object.entries(newVariants[index].attributeValueIds).forEach(
        ([aId, vId]) => {
          if (!vId) return;
          const attr = attributes.find((a) => a.id === Number(aId));
          const val = attr?.attributeValues.find((v) => v.id === Number(vId));
          if (val) selectedValueNames.push(val.valueName);
        },
      );

      if (selectedValueNames.length > 0) {
        newVariants[index].sku = generateVariantSKU(
          productData.productName,
          selectedValueNames,
          index,
        );
      }
    } else {
      newVariants[index][field] = value;
    }
    setVariants(newVariants);
  };

  const handleSaveProduct = async () => {
    try {
      setLoading(true);
      const payload = {
        productName: productData.productName,
        description: productData.description,
        categoryId: Number(productData.categoryId),
        productImages: productImages,
        variants: variants.map((v) => ({
          sku: v.sku.trim(),
          price: Number(v.price),
          stock: Number(v.stock),
          attributeValueIds: Object.values(v.attributeValueIds)
            .filter((val) => val !== "")
            .map(Number),
        })),
      };

      const resProduct = await axiosClient.post("/products", payload);
      const productId = resProduct.data?.id;
      const variantResponses = resProduct.data?.variants;

      if (productMockup) {
        // Đảm bảo lấy đúng các trường số, không lấy trường 'visible'
        const pArea = productData.printArea || {
          x: 250,
          y: 200,
          width: 250,
          height: 250,
        };

        await axiosClient.post(`/designs/product/${productId}/mockup`, {
          url: productMockup,
          x: Number(pArea.x),
          y: Number(pArea.y),
          width: Number(pArea.width),
          height: Number(pArea.height),
          realWidthInch: 10, // Bổ sung cho khớp DTO
          realHeightInch: 10, // Bổ sung cho khớp DTO
        });
      }

      // BƯỚC 3: Lưu Mockup cho từng Variant
      if (variantResponses) {
        await Promise.all(
          variants.map((v, index) => {
            if (v.mockup && variantResponses[index]) {
              return axiosClient.post(
                `/designs/variant/${variantResponses[index].id}/mockup`,
                {
                  url: v.mockup,
                  x: Number(v.x || 250),
                  y: Number(v.y || 200),
                  width: Number(v.width || 250),
                  height: Number(v.height || 250),
                  realWidthInch: 10, // Bổ sung cho khớp DTO
                  realHeightInch: 10, // Bổ sung cho khớp DTO
                },
              );
            }
            return null;
          }),
        );
      }

      // --- LOGIC SAU KHI LƯU THÀNH CÔNG ---
      alert("Sản phẩm đã được lưu thành công!");

      // Reset toàn bộ state về ban đầu
      setProductData(initialProductData);
      setProductImages([]);
      setProductMockup(null);
      setSelectedAttributeIds([]);
      setVariants([]);
    } catch (error: any) {
      console.error(error);
      alert(
        "Lỗi khi lưu sản phẩm: " +
          (error.response?.data?.message || "Hệ thống bận"),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleNavigateToConfig = (
    type: "product" | "variant",
    index?: number,
  ) => {
    let url = "";
    let initialData = null;
    if (type === "product") {
      if (!productMockup) return alert("Vui lòng chọn mockup trước!");
      url = `http://localhost:3000${productMockup}`;
      initialData = productData.printArea;
    } else {
      if (index === undefined || !variants[index].mockup)
        return alert("Vui lòng chọn mockup biến thể!");
      url = `http://localhost:3000${variants[index].mockup}`;
      const v = variants[index];
      initialData = v.width
        ? { x: v.x, y: v.y, width: v.width, height: v.height }
        : null;
    }

    navigate("/seller/products/print-area-config", {
      state: {
        type,
        index,
        mockupUrl: url,
        initialData: initialData || { x: 250, y: 200, width: 250, height: 250 },
        returnTo: location.pathname,
        productData,
        productImages,
        productMockup,
        variants,
        selectedAttributeIds,
        name:
          type === "product" ? productData.productName : `Biến thể #${index}`,
      },
    });
  };

  // UI (Giữ nguyên giao diện của bạn)
  return (
    <div className="max-w-6xl mx-auto pb-20 px-4">
      <div className="flex items-center justify-between mb-8 sticky top-0 bg-gray-50/90 backdrop-blur-sm py-4 z-20 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-white rounded-lg border border-gray-200 transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Thêm sản phẩm</h1>
        </div>
        <button
          onClick={handleSaveProduct}
          disabled={loading}
          className={`flex items-center gap-2 px-6 py-2 bg-blue-600 text-white text-sm font-bold rounded-md hover:bg-blue-700 shadow-lg transition-all ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
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
                    value={productData.productName}
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
                    value={productData.description}
                    onChange={(e) =>
                      setProductData({
                        ...productData,
                        description: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
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
                        alt=""
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

          <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <h2 className="text-sm font-bold text-gray-700">
                Cấu hình Biến thể
              </h2>
            </div>
            <div className="p-6 space-y-8">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-3">
                  1. Chọn các thuộc tính
                </label>
                <div className="flex flex-wrap gap-2">
                  {attributes.map((attr) => (
                    <button
                      key={attr.id}
                      onClick={() => toggleAttribute(attr.id)}
                      className={`px-4 py-2 rounded-full text-xs font-bold border transition-all flex items-center gap-2 ${selectedAttributeIds.includes(attr.id) ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200"}`}
                    >
                      {selectedAttributeIds.includes(attr.id) && (
                        <Check size={14} />
                      )}{" "}
                      {attr.attributeName}
                    </button>
                  ))}
                </div>
              </div>
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
                              alt=""
                            />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/m:opacity-100 transition-opacity gap-2">
                              <button
                                onClick={() =>
                                  handleNavigateToConfig("variant", vIdx)
                                }
                                className="p-1.5 bg-blue-600 text-white rounded shadow-sm hover:bg-blue-700"
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
                      {selectedAttributeIds.map((attrId) => (
                        <div key={attrId}>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                            {
                              attributes.find((a) => a.id === attrId)
                                ?.attributeName
                            }
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
                            <option value="">Chọn</option>
                            {attributes
                              .find((a) => a.id === attrId)
                              ?.attributeValues?.map((val) => (
                                <option key={val.id} value={val.id}>
                                  {val.valueName}
                                </option>
                              ))}
                          </select>
                        </div>
                      ))}
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                          Giá
                        </label>
                        <input
                          type="number"
                          className="w-full p-2 border border-gray-200 rounded-lg text-xs"
                          value={v.price}
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
                    alt=""
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-3">
                    <button
                      onClick={() => handleNavigateToConfig("product")}
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
            <select
              className="w-full p-2 border border-gray-200 rounded-lg text-sm bg-white outline-none"
              value={productData.categoryId}
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
          </section>
        </div>
      </div>
      <AssetManagerModal
        isOpen={assetModalOpen}
        onClose={() => setAssetModalOpen(false)}
        onSelect={handleAssetSelect}
        multiple={assetTarget === "productGallery"}
      />
    </div>
  );
};

export default AddProductPage;
