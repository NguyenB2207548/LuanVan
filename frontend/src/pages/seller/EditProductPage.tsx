import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
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
import toast, { Toaster } from "react-hot-toast";

import axiosClient from "@/api/axiosClient";
import AssetManagerModal from "../../components/admin/AssetManagerModal";

const DEFAULT_PRINT_AREA = {
  x: 250,
  y: 200,
  width: 250,
  height: 250,
  visible: true,
};

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

const EditProductPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [productData, setProductData] = useState({
    productName: "",
    description: "",
    categoryId: "",
    printArea: null as any,
  });
  const [productImages, setProductImages] = useState<string[]>([]);
  const [productMockup, setProductMockup] = useState<string | null>(null);
  const [selectedAttributeIds, setSelectedAttributeIds] = useState<number[]>([]);
  const [variants, setVariants] = useState<any[]>([]);
  const [assetModalOpen, setAssetModalOpen] = useState(false);
  const [assetTarget, setAssetTarget] = useState<any>(null);

  // Flag để biết có đang quay về từ trang config hay không
  // Nếu có, bỏ qua toàn bộ fetch DB để tránh ghi đè state đã restore
  const isReturningFromConfig = useRef(false);

  useEffect(() => {
    // Trường hợp 1: Đang quay về từ PrintAreaConfigPage
    // location.state.updatedPrintArea có nghĩa là vừa confirm từ config page
    if (location.state?.updatedPrintArea) {
      isReturningFromConfig.current = true;

      const { type, index, data } = location.state.updatedPrintArea;

      // Restore toàn bộ form state từ snapshot được lưu lúc navigate đi
      // Snapshot này chứa trạng thái form tại thời điểm người dùng bấm "Cấu hình vùng in"
      if (location.state.productData) setProductData(location.state.productData);
      if (location.state.productImages) setProductImages(location.state.productImages);
      if (location.state.productMockup !== undefined) setProductMockup(location.state.productMockup);
      if (location.state.variants) setVariants(location.state.variants);
      if (location.state.selectedAttributeIds) setSelectedAttributeIds(location.state.selectedAttributeIds);
      // Restore lookup data — không có chúng thì dropdown attributes/categories bị trống
      if (location.state.attributes) setAttributes(location.state.attributes);
      if (location.state.categories) setCategories(location.state.categories);

      // Sau đó apply đúng print area mới trả về
      if (type === "product") {
        setProductData((prev) => ({
          ...(location.state.productData || prev),
          printArea: data,
        }));
      } else if (type === "variant" && index !== undefined) {
        setVariants((prevVariants) => {
          // Dùng snapshot variants từ state (đã restore ở trên) làm base
          const base = location.state.variants || prevVariants;
          const updated = [...base];
          updated[index] = {
            ...updated[index],
            x: data.x,
            y: data.y,
            width: data.width,
            height: data.height,
          };
          return updated;
        });
      }

      // Xóa updatedPrintArea khỏi history state để tránh re-trigger khi F5
      const cleanState = { ...location.state };
      delete cleanState.updatedPrintArea;
      window.history.replaceState(cleanState, document.title);

      setFetching(false);
      return; // Không fetch DB
    }

    // Trường hợp 2: Load trang bình thường — fetch từ DB
    if (isReturningFromConfig.current) {
      // Guard phòng trường hợp effect chạy lại sau khi đã xử lý return
      isReturningFromConfig.current = false;
      return;
    }

    const fetchProductDetails = async () => {
      try {
        setFetching(true);
        const [attrRes, catRes, prodRes] = await Promise.all([
          axiosClient.get("/attributes"),
          axiosClient.get("/categories"),
          axiosClient.get(`/products/${id}`),
        ]);

        setAttributes(attrRes.data || []);
        setCategories(catRes.data || []);

        const p = prodRes.data;
        setProductData({
          productName: p.productName,
          description: p.description,
          categoryId: p.categories?.[0]?.id.toString() || "",
          printArea: p.mockup?.printArea || null,
        });

        setProductImages(
          p.images?.filter((img: any) => !img.variantId).map((img: any) => img.url) || []
        );
        setProductMockup(p.mockup?.url || null);

        const mappedVariants = p.variants.map((v: any) => ({
          id: v.id,
          sku: v.sku,
          price: v.price,
          stock: v.stock,
          mockup: v.mockup?.url || "",
          x: v.mockup?.printArea?.x,
          y: v.mockup?.printArea?.y,
          width: v.mockup?.printArea?.width,
          height: v.mockup?.printArea?.height,
          images: v.images?.map((img: any) => img.url) || [],
          attributeValueIds: v.attributeValues.reduce((acc: any, cur: any) => {
            acc[cur.attributeId] = cur.id.toString();
            return acc;
          }, {}),
        }));

        setVariants(mappedVariants);

        const attrIds = new Set<number>();
        p.variants.forEach((v: any) => {
          v.attributeValues.forEach((av: any) => attrIds.add(av.attributeId));
        });
        setSelectedAttributeIds(Array.from(attrIds));
      } catch (err) {
        console.error("Lỗi khi tải thông tin sản phẩm", err);
      } finally {
        setFetching(false);
      }
    };

    fetchProductDetails();
  }, [id, location.state]);

  // --- HELPERS ---
  const generateSlug = (str: string) =>
    str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s]/gi, "")
      .replace(/\s+/g, "")
      .toUpperCase();

  const generateVariantSKU = (
    productName: string,
    selectedValues: string[],
    index: number,
  ) => {
    const prefix = generateSlug(productName || "PROD").slice(0, 4);
    const suffix = selectedValues.map((v) => generateSlug(v).slice(0, 3)).join("-");
    const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${suffix}-${index + 1}${randomStr}`;
  };

  const toggleAttribute = (id: number) => {
    setSelectedAttributeIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

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
      if (assetTarget.type === "variantMockup") {
        newVariants[assetTarget.index].mockup = urls[0];
      } else if (assetTarget.type === "variantGallery") {
        newVariants[assetTarget.index].images = [
          ...(newVariants[assetTarget.index].images || []),
          ...urls,
        ];
      }
      setVariants(newVariants);
    }
  };

  const updateVariantData = (index: number, field: string, value: any) => {
    const newVariants = [...variants];
    const updatedVariant = { ...newVariants[index] };

    if (field.startsWith("attr_")) {
      const attrId = Number(field.split("_")[1]);
      updatedVariant.attributeValueIds = {
        ...updatedVariant.attributeValueIds,
        [attrId]: value,
      };

      const selectedValueNames: string[] = [];
      Object.entries(updatedVariant.attributeValueIds).forEach(([aId, vId]) => {
        if (!vId) return;
        const attr = attributes.find((a) => a.id === Number(aId));
        const val = attr?.attributeValues.find((v) => v.id === Number(vId));
        if (val) selectedValueNames.push(val.valueName);
      });

      if (selectedValueNames.length > 0) {
        updatedVariant.sku = generateVariantSKU(
          productData.productName,
          selectedValueNames,
          index,
        );
      }
    } else {
      updatedVariant[field] = value;
    }
    newVariants[index] = updatedVariant;
    setVariants(newVariants);
  };

  const handleAddVariant = () => {
    const initialAttrs: Record<number, string> = {};
    selectedAttributeIds.forEach((id) => (initialAttrs[id] = ""));
    setVariants([
      ...variants,
      {
        sku: "",
        price: 0,
        stock: 0,
        mockup: "",
        images: [],
        attributeValueIds: initialAttrs,
      },
    ]);
  };

  const handleNavigateToConfig = (type: "product" | "variant", index?: number) => {
    let url = "";
    let initialData = null;

    if (type === "product") {
      if (!productMockup) return alert("Chọn mockup trước!");
      url = `http://localhost:3000${productMockup}`;
      initialData = productData.printArea;
    } else {
      if (index === undefined || !variants[index].mockup) return alert("Chọn mockup biến thể!");
      url = `http://localhost:3000${variants[index].mockup}`;
      const v = variants[index];
      initialData = v.width
        ? { x: v.x, y: v.y, width: v.width, height: v.height }
        : null;
    }

    navigate(`/seller/products/print-area-config/${type}/${id || "new"}`, {
      state: {
        type,
        index,
        mockupUrl: url,
        // Truyền initialData hiện tại (hoặc default nếu chưa có)
        initialData: initialData || DEFAULT_PRINT_AREA,
        returnTo: location.pathname,
        // Snapshot toàn bộ form state — dùng để restore khi quay về
        productData,
        productImages,
        productMockup,
        variants,
        selectedAttributeIds,
        // Snapshot lookup data để restore dropdown khi quay về
        attributes,
        categories,
        name:
          type === "product"
            ? productData.productName
            : `Biến thể #${(index ?? 0) + 1}`,
      },
    });
  };

  const handleUpdateProduct = async () => {
    const loadingToast = toast.loading("Đang cập nhật sản phẩm...");
    try {
      setLoading(true);
      const payload = {
        productName: productData.productName,
        description: productData.description,
        categoryId: productData.categoryId ? Number(productData.categoryId) : null,
        productImages: productImages,
        variants: variants.map((v) => ({
          ...(v.id ? { id: v.id } : {}),
          sku: v.sku.trim(),
          price: Number(v.price),
          stock: Number(v.stock),
          attributeValueIds: Object.values(v.attributeValueIds)
            .filter((val) => val !== "" && val !== null)
            .map(Number),
          images: v.images || [],
        })),
      };

      const resProduct = await axiosClient.patch(`/products/${id}`, payload);
      const variantResponses = resProduct.data?.variants;

      if (productMockup) {
        const pArea = productData.printArea || DEFAULT_PRINT_AREA;
        await axiosClient.post(`/designs/product/${id}/mockup`, {
          url: productMockup,
          x: Number(pArea.x),
          y: Number(pArea.y),
          width: Number(pArea.width),
          height: Number(pArea.height),
          realWidthInch: 10,
          realHeightInch: 10,
        });
      }

      if (variantResponses) {
        await Promise.all(
          variants.map((v, index) => {
            const vIdInDb = v.id || variantResponses[index]?.id;
            if (v.mockup && vIdInDb) {
              return axiosClient.post(`/designs/variant/${vIdInDb}/mockup`, {
                url: v.mockup,
                x: Number(v.x || 250),
                y: Number(v.y || 200),
                width: Number(v.width || 250),
                height: Number(v.height || 250),
                realWidthInch: 10,
                realHeightInch: 10,
              });
            }
            return null;
          })
        );
      }

      toast.success("Cập nhật thành công!", { id: loadingToast });
      setTimeout(() => navigate("/seller/products"), 1500);
    } catch (error: any) {
      toast.error("Lỗi khi lưu dữ liệu", { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  if (fetching)
    return (
      <div className="p-20 text-center font-bold">Đang tải dữ liệu sản phẩm...</div>
    );

  return (
    <div className="max-w-6xl mx-auto pb-20 px-4">
      <Toaster position="top-right" reverseOrder={false} />
      <div className="flex items-center justify-between mb-8 sticky top-0 bg-gray-50/90 backdrop-blur-sm py-4 z-20 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-white rounded-lg border border-gray-200 transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Chỉnh sửa sản phẩm</h1>
        </div>
        <button
          onClick={handleUpdateProduct}
          disabled={loading}
          className={`flex items-center gap-2 px-6 py-2 bg-green-600 text-white text-sm font-bold rounded-md hover:bg-green-700 shadow-lg transition-all ${loading ? "opacity-70" : ""}`}
        >
          {loading ? "Đang lưu..." : <><Save size={16} /> Cập nhật thay đổi</>}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-sm font-bold text-gray-700">
                Thông tin sản phẩm #{id}
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
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none"
                    value={productData.productName}
                    onChange={(e) =>
                      setProductData({ ...productData, productName: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    Mô tả
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none text-sm"
                    value={productData.description}
                    onChange={(e) =>
                      setProductData({ ...productData, description: e.target.value })
                    }
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-3">
                  Thư viện ảnh
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
                          setProductImages(productImages.filter((_, idx) => idx !== i))
                        }
                        className="absolute top-1 right-1 bg-white p-1 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={12} className="text-red-500" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => openAssetModal("productGallery")}
                    className="w-24 h-24 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center hover:bg-gray-50"
                  >
                    <Plus size={20} className="text-gray-300" />
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <h2 className="text-sm font-bold text-gray-700">Biến thể & Thuộc tính</h2>
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
                      className={`px-4 py-2 rounded-full text-xs font-bold border transition-all flex items-center gap-2 ${selectedAttributeIds.includes(attr.id)
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-gray-600 border-gray-200"
                        }`}
                    >
                      {selectedAttributeIds.includes(attr.id) && <Check size={14} />}{" "}
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
                    onClick={handleAddVariant}
                    disabled={selectedAttributeIds.length === 0}
                    className="flex items-center gap-1.5 text-blue-600 font-bold text-xs hover:bg-blue-50 px-3 py-1.5 rounded-md disabled:opacity-50"
                  >
                    <Plus size={14} /> Thêm biến thể mới
                  </button>
                </div>

                {variants.map((v, vIdx) => (
                  <div
                    key={vIdx}
                    className="p-4 border border-gray-200 rounded-xl bg-gray-50/50 grid grid-cols-1 md:grid-cols-12 gap-6 relative group"
                  >
                    <button
                      onClick={() =>
                        setVariants(variants.filter((_, i) => i !== vIdx))
                      }
                      className="absolute -top-2 -right-2 bg-white text-red-500 border border-gray-200 p-1.5 rounded-full shadow-sm hover:bg-red-50 z-30 transition-all"
                    >
                      <X size={14} />
                    </button>

                    <div className="md:col-span-3 space-y-3">
                      <div className="relative aspect-square bg-white border rounded-lg flex items-center justify-center overflow-hidden group/m">
                        {v.mockup ? (
                          <>
                            <img
                              src={`http://localhost:3000${v.mockup}`}
                              className="w-full h-full object-contain"
                              alt=""
                            />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/m:opacity-100 transition-opacity gap-2">
                              <button
                                onClick={() => handleNavigateToConfig("variant", vIdx)}
                                className="p-1.5 bg-blue-600 text-white rounded"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() =>
                                  openAssetModal({ type: "variantMockup", index: vIdx })
                                }
                                className="p-1.5 bg-white rounded text-gray-600"
                              >
                                <Upload size={14} />
                              </button>
                            </div>
                          </>
                        ) : (
                          <button
                            onClick={() =>
                              openAssetModal({ type: "variantMockup", index: vIdx })
                            }
                            className="flex flex-col items-center gap-1"
                          >
                            <Upload size={20} className="text-gray-300" />
                            <span className="text-[10px] text-gray-400 font-bold uppercase">
                              Mockup
                            </span>
                          </button>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {v.images?.map((img: string, iIdx: number) => (
                          <div
                            key={iIdx}
                            className="w-10 h-10 rounded border border-gray-200 overflow-hidden relative group/vimg"
                          >
                            <img
                              src={`http://localhost:3000${img}`}
                              className="w-full h-full object-cover"
                              alt=""
                            />
                            <button
                              onClick={() => {
                                const newVariants = [...variants];
                                newVariants[vIdx].images = newVariants[vIdx].images.filter(
                                  (_: any, i: number) => i !== iIdx
                                );
                                setVariants(newVariants);
                              }}
                              className="absolute top-0 right-0 bg-white p-0.5 rounded-bl opacity-0 group-hover/vimg:opacity-100 transition-opacity"
                            >
                              <Trash2 size={8} className="text-red-500" />
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() =>
                            openAssetModal({ type: "variantGallery", index: vIdx })
                          }
                          className="w-10 h-10 border border-dashed border-gray-300 rounded flex items-center justify-center text-gray-400 hover:bg-white"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>

                    <div className="md:col-span-9 grid grid-cols-2 md:grid-cols-3 gap-4">
                      {selectedAttributeIds.map((attrId) => (
                        <div key={attrId}>
                          <label className="text-[10px] font-bold text-gray-400 block mb-1 uppercase">
                            {attributes.find((a) => a.id === attrId)?.attributeName}
                          </label>
                          <select
                            className="w-full p-2 border border-gray-200 rounded-lg text-xs bg-white outline-none"
                            value={v.attributeValueIds[attrId] || ""}
                            onChange={(e) =>
                              updateVariantData(vIdx, `attr_${attrId}`, e.target.value)
                            }
                          >
                            <option value="">Chọn</option>
                            {attributes
                              .find((a) => a.id === attrId)
                              ?.attributeValues.map((val) => (
                                <option key={val.id} value={val.id}>
                                  {val.valueName}
                                </option>
                              ))}
                          </select>
                        </div>
                      ))}
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 block mb-1 uppercase">
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
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 block mb-1 uppercase">
                          Kho
                        </label>
                        <input
                          type="number"
                          className="w-full p-2 border border-gray-200 rounded-lg text-xs"
                          value={v.stock}
                          onChange={(e) =>
                            updateVariantData(vIdx, "stock", e.target.value)
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
              Mockup gốc sản phẩm
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
                      className="p-2 bg-blue-600 text-white rounded-lg shadow-md"
                    >
                      <Edit2 size={20} />
                    </button>
                    <button
                      onClick={() => openAssetModal("productMockup")}
                      className="p-2 bg-white rounded-lg text-gray-600 shadow-md"
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
                    Chọn Mockup
                  </span>
                </button>
              )}
            </div>
          </section>

          <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
              Danh mục
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
        multiple={
          assetTarget === "productGallery" ||
          assetTarget?.type === "variantGallery"
        }
      />
    </div>
  );
};

export default EditProductPage;