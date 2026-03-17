import React, { useState, useEffect } from "react";
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

// --- INTERFACES ---
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
  const [selectedAttributeIds, setSelectedAttributeIds] = useState<number[]>(
    [],
  );
  const [variants, setVariants] = useState<any[]>([]);
  const [assetModalOpen, setAssetModalOpen] = useState(false);
  const [assetTarget, setAssetTarget] = useState<any>(null);

  // 1. Fetch dữ liệu sản phẩm hiện tại
  useEffect(() => {
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
          p.images
            ?.filter((img: any) => !img.variantId)
            .map((img: any) => img.url) || [],
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
  }, [id]);

  // 2. Xử lý quay lại từ trang Config
  useEffect(() => {
    if (location.state?.updatedPrintArea) {
      const { type, index, data } = location.state.updatedPrintArea;
      if (type === "product") {
        setProductData((prev) => ({ ...prev, printArea: data }));
      } else if (type === "variant" && index !== undefined) {
        const newVariants = [...variants];
        newVariants[index] = { ...newVariants[index], ...data };
        setVariants(newVariants);
      }
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

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
    const suffix = selectedValues
      .map((v) => generateSlug(v).slice(0, 3))
      .join("-");

    // Thêm index và một chuỗi ngẫu nhiên 4 ký tự thay vì chỉ dùng timestamp
    const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();

    return `${prefix}-${suffix}-${index + 1}${randomStr}`;
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

  const handleNavigateToConfig = (
    type: "product" | "variant",
    index?: number,
  ) => {
    let url = "";
    let initialData = null;
    if (type === "product") {
      if (!productMockup) return alert("Chọn mockup trước!");
      url = `http://localhost:3000${productMockup}`;
      initialData = productData.printArea;
    } else {
      if (index === undefined || !variants[index].mockup)
        return alert("Chọn mockup biến thể!");
      url = `http://localhost:3000${variants[index].mockup}`;
      initialData = variants[index].width
        ? {
            x: variants[index].x,
            y: variants[index].y,
            width: variants[index].width,
            height: variants[index].height,
          }
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

  const handleUpdateProduct = async () => {
    // Tạo một ID cho toast để quản lý trạng thái loading
    const loadingToast = toast.loading("Đang cập nhật sản phẩm...");

    try {
      setLoading(true);
      const payload = {
        productName: productData.productName,
        description: productData.description,
        categoryId: Number(productData.categoryId),
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

      // Gọi API update
      const resProduct = await axiosClient.patch(`/products/${id}`, payload);
      const variantResponses = resProduct.data?.variants;

      // Xử lý Mockup chính
      if (productMockup) {
        const pArea = productData.printArea || {
          x: 250,
          y: 200,
          width: 250,
          height: 250,
        };
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

      // Xử lý Mockup Variant
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
                  realWidthInch: 10,
                  realHeightInch: 10,
                },
              );
            }
            return null;
          }),
        );
      }

      // --- THÀNH CÔNG ---
      toast.success("Cập nhật sản phẩm thành công!", { id: loadingToast }); // Cập nhật toast loading thành success

      // Đợi 1 chút để user kịp nhìn thông báo rồi mới chuyển trang
      setTimeout(() => {
        navigate("/seller/products");
      }, 1500);
    } catch (error: any) {
      console.error("Lỗi:", error);
      const errorMsg =
        error.response?.data?.message || "Cập nhật thất bại, vui lòng thử lại.";
      toast.error(errorMsg, { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  if (fetching)
    return (
      <div className="p-20 text-center font-bold">
        Đang tải dữ liệu sản phẩm...
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto pb-20 px-4">
      <Toaster position="top-right" reverseOrder={false} />
      {/* HEADER */}
      <div className="flex items-center justify-between mb-8 sticky top-0 bg-gray-50/90 backdrop-blur-sm py-4 z-20 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-white rounded-lg border border-gray-200 transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-gray-900">
            Chỉnh sửa sản phẩm
          </h1>
        </div>
        <button
          onClick={handleUpdateProduct}
          disabled={loading}
          className={`flex items-center gap-2 px-6 py-2 bg-green-600 text-white text-sm font-bold rounded-md hover:bg-green-700 shadow-lg transition-all ${loading ? "opacity-70" : ""}`}
        >
          {loading ? (
            "Đang lưu..."
          ) : (
            <>
              <Save size={16} /> Cập nhật thay đổi
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Thông tin tổng quan */}
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
                    className="w-24 h-24 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center hover:bg-gray-50"
                  >
                    <Plus size={20} className="text-gray-300" />
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Biến thể */}
          <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <h2 className="text-sm font-bold text-gray-700">
                Biến thể & Thuộc tính
              </h2>
              <button
                type="button"
                onClick={handleAddVariant}
                className="text-blue-600 font-bold text-xs hover:underline"
              >
                + Thêm biến thể mới
              </button>
            </div>
            <div className="p-6 space-y-6">
              {variants.map((v, vIdx) => (
                <div
                  key={vIdx}
                  className="p-4 border border-gray-200 rounded-xl bg-gray-50/50 grid grid-cols-1 md:grid-cols-12 gap-6 relative group"
                >
                  <button
                    type="button"
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
                              type="button"
                              onClick={() =>
                                handleNavigateToConfig("variant", vIdx)
                              }
                              className="p-1.5 bg-blue-600 text-white rounded"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                openAssetModal({
                                  type: "variantMockup",
                                  index: vIdx,
                                })
                              }
                              className="p-1.5 bg-white rounded text-gray-600"
                            >
                              <Upload size={14} />
                            </button>
                          </div>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            openAssetModal({
                              type: "variantMockup",
                              index: vIdx,
                            })
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
                  </div>
                  <div className="md:col-span-9 grid grid-cols-2 md:grid-cols-3 gap-4">
                    {selectedAttributeIds.map((attrId) => (
                      <div key={attrId}>
                        <label className="text-[10px] font-bold text-gray-400 block mb-1 uppercase">
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
                        className="w-full p-2 border border-gray-200 rounded-lg text-xs outline-none"
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
                        className="w-full p-2 border border-gray-200 rounded-lg text-xs outline-none"
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
          </section>
        </div>

        {/* Sidebar */}
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
