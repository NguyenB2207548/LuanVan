import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Package,
  Layers,
  Tag,
  ImageIcon,
  LayoutTemplate,
  Link as LinkIcon,
  CheckCircle2,
} from "lucide-react";
import axiosClient from "../../api/axiosClient";
import type { Product } from "../../types/product";

const BASE_URL = "http://localhost:3000";

const ProductEditorAdminPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // States
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [productOriginal, setProductOriginal] = useState<Product | null>(null);

  // Form States
  const [formData, setFormData] = useState({
    productName: "",
    description: "",
    status: "active",
  });

  // Dùng state này để render và lưu tạm giá trị thay đổi của variant
  const [variants, setVariants] = useState<any[]>([]);

  // Templates List for Dropdown
  const [templates, setTemplates] = useState<any[]>([]);

  // Trạng thái loading riêng cho từng nút Link Template
  const [linkingVariantId, setLinkingVariantId] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // 1. Chạy song song 2 API: Lấy chi tiết sản phẩm và danh sách tất cả template
        const [productRes, templatesRes] = await Promise.all([
          axiosClient.get(`/products/${id}`),
          axiosClient.get("/designs"),
        ]);

        const prod = productRes.data;
        setProductOriginal(prod);

        setFormData({
          productName: prod.productName || "",
          description: prod.description || "",
          status: prod.status || "active",
        });

        // 2. Lặp qua từng variant và gọi API để lấy template tương ứng
        const variantsWithUIState = await Promise.all(
          (prod.variants || []).map(async (v: any) => {
            let linkedTemplateId = null;

            try {
              // Gọi API lấy design theo variant ID
              const designRes = await axiosClient.get(
                `/designs/variant/${v.id}`,
              );

              // Dựa theo cấu trúc cũ của bạn, data trả về nằm trong response.data.data
              if (designRes.data && designRes.data.data) {
                linkedTemplateId = String(designRes.data.data.id);
              } else if (designRes.data && designRes.data.id) {
                linkedTemplateId = String(designRes.data.id);
              }
            } catch (error) {}

            return {
              ...v,
              originalTemplateId: linkedTemplateId,
              selectedTemplateId: linkedTemplateId || "",
            };
          }),
        );

        setVariants(variantsWithUIState);
        setTemplates(templatesRes.data || []);
      } catch (err) {
        console.error("Error fetching data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Chỉ thay đổi giá trị Dropdown trên UI (Chưa lưu)
  const handleTemplateSelection = (variantId: number, templateId: string) => {
    setVariants((prev) =>
      prev.map((v) =>
        v.id === variantId ? { ...v, selectedTemplateId: templateId } : v,
      ),
    );
  };

  // === HÀM GỌI API ĐỘC LẬP ĐỂ LINK TEMPLATE ===
  const handleLinkTemplate = async (variantId: number, templateId: string) => {
    if (!templateId) return alert("Please select a template first.");

    try {
      setLinkingVariantId(variantId);

      await axiosClient.post("/designs/link", {
        designId: Number(templateId),
        ownerType: "variant",
        ownerId: variantId,
      });

      setVariants((prev) =>
        prev.map((v) =>
          v.id === variantId ? { ...v, originalTemplateId: templateId } : v,
        ),
      );
    } catch (err: any) {
      console.error("Error linking template", err);
      alert(err.response?.data?.message || "Failed to link template.");
    } finally {
      setLinkingVariantId(null);
    }
  };

  // API LƯU THÔNG TIN CHUNG SẢN PHẨM (Bỏ variants ra khỏi payload)
  const handleSaveProductInfo = async () => {
    try {
      setSaving(true);
      const payload = {
        productName: formData.productName,
        description: formData.description,
        status: formData.status,
      };

      await axiosClient.put(`/products/${id}`, payload);
      alert("Product details updated successfully!");
    } catch (err: any) {
      console.error("Error updating product", err);
      alert(err.response?.data?.message || "Failed to update product details.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50 text-gray-500 text-sm">
        <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full mr-2"></div>
        Loading product data...
      </div>
    );
  }

  if (!productOriginal) {
    return (
      <div className="p-10 text-center text-red-500 font-medium">
        Product not found!
      </div>
    );
  }

  return (
    <div className="w-full pb-20">
      {/* HEADER CONTROL */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-gray-400 hover:text-gray-800 bg-white border border-gray-200 rounded-md shadow-sm transition-colors"
            title="Go back"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
            <p className="text-sm text-gray-500">#{productOriginal.id}</p>
          </div>
        </div>

        <button
          onClick={handleSaveProductInfo}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-70"
        >
          {saving ? (
            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
          ) : (
            <Save size={18} />
          )}
          {saving ? "Saving Details..." : "Save Details"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. BASIC INFORMATION */}
          <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Package size={18} className="text-gray-500" /> General
              Information
            </h2>
            <div className="space-y-4">
              {/* ... (Các ô Input Title, Mota, Status giữ nguyên) ... */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name
                </label>
                <input
                  type="text"
                  name="productName"
                  value={formData.productName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full md:w-1/3 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm bg-white"
                >
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
          </section>

          {/* 2. VARIANTS & TEMPLATES LẬP TRÌNH API MỚI */}
          <section className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                <Layers size={18} className="text-gray-500" /> Variants & Design
                Templates
              </h2>
            </div>

            <div className="divide-y divide-gray-200">
              {variants.map((variant) => {
                // Kiểm tra xem template hiện tại trên Dropdown có bị đổi khác với DB không
                const isChanged =
                  String(variant.selectedTemplateId) !==
                  String(variant.originalTemplateId);
                const isLinking = linkingVariantId === variant.id;

                return (
                  <div
                    key={variant.id}
                    className="p-6 hover:bg-gray-50 transition-colors flex flex-col md:flex-row gap-6"
                  >
                    {/* Variant Image */}
                    <div className="w-full md:w-24 shrink-0">
                      <div className="aspect-square rounded-md overflow-hidden border border-gray-200 bg-white">
                        {variant.images && variant.images.length > 0 ? (
                          <img
                            src={`${BASE_URL}${variant.images[0].url}`}
                            alt="variant"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-50">
                            <ImageIcon size={24} />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Variant Details */}
                    <div className="flex-1 space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex flex-wrap gap-1.5 mb-1">
                            {variant.attributeValues?.map((val: any) => (
                              <span
                                key={val.id}
                                className="px-2 py-0.5 bg-gray-100 rounded text-xs font-medium text-gray-700 border border-gray-200"
                              >
                                {val.valueName}
                              </span>
                            ))}
                          </div>
                          <p className="text-xs text-gray-500 font-mono">
                            SKU / ID: #{variant.id}
                          </p>
                        </div>
                      </div>

                      {/* TEMPLATE SELECTION ROW */}
                      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end bg-blue-50/40 p-3 rounded-md border border-blue-100">
                        <div className="flex-1 w-full">
                          <label className="block text-[11px] font-semibold text-blue-800 mb-1.5 uppercase tracking-wide">
                            Assigned Template
                          </label>
                          <select
                            value={variant.selectedTemplateId}
                            onChange={(e) =>
                              handleTemplateSelection(
                                variant.id,
                                e.target.value,
                              )
                            }
                            className="w-full px-3 py-2 border border-blue-200 rounded text-sm focus:outline-none focus:border-blue-500 bg-white"
                          >
                            <option value="">-- No Template Attached --</option>
                            {templates.map((tpl) => (
                              <option key={tpl.id} value={tpl.id}>
                                {tpl.designName} (ID: {tpl.id})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* NÚT LƯU RIÊNG CHO TỪNG VARIANT */}
                        <div className="w-full sm:w-auto shrink-0 h-9">
                          {isChanged ? (
                            <button
                              onClick={() =>
                                handleLinkTemplate(
                                  variant.id,
                                  variant.selectedTemplateId,
                                )
                              }
                              disabled={
                                isLinking || !variant.selectedTemplateId
                              }
                              className="w-full h-full flex items-center justify-center gap-1.5 px-4 bg-indigo-600 text-white text-xs font-medium rounded hover:bg-indigo-700 transition-colors disabled:opacity-50"
                            >
                              {isLinking ? (
                                <div className="animate-spin w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full"></div>
                              ) : (
                                <LinkIcon size={14} />
                              )}
                              Save Link
                            </button>
                          ) : (
                            // Trạng thái đã lưu đồng bộ
                            variant.originalTemplateId && (
                              <div className="h-full flex items-center justify-center gap-1.5 px-4 bg-green-50 text-green-700 border border-green-200 text-xs font-medium rounded cursor-default">
                                <CheckCircle2 size={14} /> Linked
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          {/* Category */}
          <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Tag className="text-gray-500" size={18} /> Organization
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700">
                  {productOriginal.category?.categoryName || "Uncategorized"}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total System Stock
                </label>
                <div className="text-lg font-semibold text-gray-900">
                  {productOriginal.stock}{" "}
                  <span className="text-sm font-normal text-gray-500">
                    items
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Gallery */}
          <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <ImageIcon className="text-gray-500" size={18} /> Image Gallery
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {productOriginal.images && productOriginal.images.length > 0 ? (
                productOriginal.images.map((img) => (
                  <div
                    key={img.id}
                    className="aspect-square rounded-md overflow-hidden border border-gray-200 shadow-sm"
                  >
                    <img
                      src={`${BASE_URL}${img.url}`}
                      alt="gallery"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))
              ) : (
                <div className="col-span-2 py-8 bg-gray-50 rounded-md text-center text-gray-400 text-sm border-2 border-dashed border-gray-200">
                  No gallery images
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ProductEditorAdminPage;
