import React, { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import {
  Plus,
  Trash2,
  Upload,
  Save,
  X,
  Image as ImageIcon,
  Layers,
  Settings,
  ChevronDown,
} from "lucide-react";
import axiosClient from "../../api/axiosClient";
import type { Category } from "../../types/product";

const ImageUploader = ({
  images = [],
  onUpload,
  onRemove,
  multiple = true,
}: {
  images: string[];
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: (index: number) => void;
  multiple?: boolean;
}) => {
  const BASE_URL = "http://localhost:3000";

  return (
    <div className="flex flex-wrap gap-3">
      {images.map((url, idx) => (
        <div
          key={idx}
          className="relative w-20 h-20 group border border-gray-200 rounded-md overflow-hidden bg-gray-50"
        >
          <img
            src={`${BASE_URL}${url}`}
            alt="img"
            className="w-full h-full object-cover"
          />
          <button
            type="button"
            onClick={() => onRemove(idx)}
            className="absolute top-1 right-1 bg-white/90 text-red-500 p-0.5 rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X size={14} />
          </button>
        </div>
      ))}
      <label className="w-20 h-20 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-md hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-colors text-gray-400 hover:text-blue-500">
        <Upload size={20} />
        <input
          type="file"
          hidden
          multiple={multiple}
          onChange={onUpload}
          accept="image/*"
        />
      </label>
    </div>
  );
};

const AddProductPage = () => {
  // 1. STATE & HOOKS
  const [categories, setCategories] = useState<Category[]>([]);
  const [availableAttributes, setAvailableAttributes] = useState<any[]>([]);

  const [tempAttributes, setTempAttributes] = useState<
    { id: string; name: string; selectedValues: string[] }[]
  >([]);

  const { register, control, handleSubmit, setValue, watch, reset } = useForm({
    defaultValues: {
      productName: "",
      categoryId: "",
      description: "",
      basePrice: 0,
      productImages: [] as string[],
      variants: [] as any[],
    },
  });

  const { fields, replace, remove } = useFieldArray({
    control,
    name: "variants",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resCat, resAttr] = await Promise.all([
          axiosClient.get("/categories"),
          axiosClient.get("/attributes"),
        ]);
        setCategories(resCat.data);
        setAvailableAttributes(resAttr.data);
      } catch (err) {
        console.error("Lỗi tải cấu hình", err);
      }
    };
    fetchData();
  }, []);

  const handleUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    path: any,
    isAppend = true,
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append("files", file));

    try {
      const res = await axiosClient.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const urls = res.data.urls;
      const currentImages = watch(path) || [];
      setValue(path, isAppend ? [...currentImages, ...urls] : urls);
    } catch (err) {
      alert("Lỗi upload ảnh: " + err);
    }
  };

  const removeImage = (path: any, indexToRemove: number) => {
    const currentImages = watch(path) || [];
    setValue(
      path,
      currentImages.filter((_: any, i: number) => i !== indexToRemove),
    );
  };

  const handleAddAttributeLine = () => {
    const unselected = availableAttributes.find(
      (attr) => !tempAttributes.some((t) => t.name === attr.attributeName),
    );
    if (unselected) {
      setTempAttributes([
        ...tempAttributes,
        {
          id: unselected.id,
          name: unselected.attributeName,
          selectedValues: [],
        },
      ]);
    } else {
      alert("Đã thêm hết các thuộc tính có sẵn!");
    }
  };

  const handleSelectAttributeType = (index: number, attrId: string) => {
    const attrData = availableAttributes.find((a) => a.id == attrId); // == vì đôi khi id là string/number
    if (!attrData) return;

    const newAttrs = [...tempAttributes];
    newAttrs[index] = {
      ...newAttrs[index],
      id: attrData.id,
      name: attrData.attributeName,
      selectedValues: [],
    };
    setTempAttributes(newAttrs);
  };

  const toggleAttributeValue = (index: number, valueName: string) => {
    const newAttrs = [...tempAttributes];
    const currentValues = newAttrs[index].selectedValues;
    if (currentValues.includes(valueName)) {
      newAttrs[index].selectedValues = currentValues.filter(
        (v) => v !== valueName,
      );
    } else {
      newAttrs[index].selectedValues = [...currentValues, valueName];
    }
    setTempAttributes(newAttrs);
  };

  // 5. CORE: LOGIC SINH VARIANT TỰ ĐỘNG (Cartesian Product)
  const generateVariants = () => {
    if (tempAttributes.length === 0) return;

    const validAttrs = tempAttributes.filter(
      (t) => t.selectedValues.length > 0,
    );
    if (validAttrs.length === 0)
      return alert("Vui lòng chọn giá trị cho thuộc tính!");

    const cartesian = (a: any) =>
      a.reduce(
        (a: any, b: any) =>
          a.flatMap((d: any) => b.map((e: any) => [d, e].flat())),
        [[]],
      );

    const valuesArrays = validAttrs.map((attr) =>
      attr.selectedValues.map((val) => ({ name: attr.name, value: val })),
    );

    const combinations = cartesian(valuesArrays);
    const basePrice = watch("basePrice") || 0;

    // Map thành structure của form variants
    const newVariants = combinations.map((combo: any) => ({
      price: basePrice,
      stock: 10, // Default stock
      attributeValues: Array.isArray(combo) ? combo : [combo], // Handle trường hợp chỉ có 1 thuộc tính
      images: [],
    }));

    // Reset lại field array variants
    replace(newVariants);
  };

  // 6. SUBMIT
  const onSubmit = async (data: any) => {
    try {
      // 1. Validate số lượng variant
      if (data.variants.length === 0) {
        const isConfirmed = window.confirm(
          "Sản phẩm này không có biến thể nào? Bạn có chắc không?",
        );
        if (!isConfirmed) return;
      }

      // 2. LỌC DỮ LIỆU (QUAN TRỌNG)
      // Tách basePrice ra khỏi object data, chỉ lấy phần còn lại (payload) để gửi đi
      const { basePrice, ...payload } = data;

      console.log("Submit Data (Cleaned):", payload);

      // 3. Gửi payload (đã loại bỏ basePrice) xuống Backend
      await axiosClient.post("/products", payload);

      alert("Tạo sản phẩm thành công!");
      reset(); // Reset form
      setTempAttributes([]); // Reset bộ chọn thuộc tính
    } catch (error: any) {
      // Log lỗi chi tiết hơn để dễ debug
      console.error("Lỗi API:", error);
      const message =
        error.response?.data?.message ||
        error.response?.data?.error || // Một số framework trả về key error
        "Có lỗi xảy ra";

      // Nếu message là array (NestJS thường trả về array class-validator), join lại
      const alertMsg = Array.isArray(message) ? message.join("\n") : message;

      alert("Lỗi: " + alertMsg);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 font-sans text-gray-800">
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Thêm sản phẩm mới
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Quản lý thông tin sản phẩm và các biến thể kho hàng.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm flex items-center gap-2 transition-colors"
            >
              <Save size={18} /> Lưu sản phẩm
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* === LEFT COLUMN (MAIN INFO) === */}
          <div className="lg:col-span-2 space-y-6">
            {/* 1. GENERAL INFO */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Layers size={20} className="text-gray-400" /> Thông tin chung
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên sản phẩm
                    {/* <span className="text-red-500">*</span> */}
                  </label>
                  <input
                    {...register("productName", { required: true })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="Nhập tên sản phẩm..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mô tả chi tiết
                  </label>
                  <textarea
                    {...register("description")}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="Mô tả đặc điểm sản phẩm..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Giá cơ bản (VND)
                    </label>
                    <input
                      type="number"
                      {...register("basePrice")}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Dùng làm giá mặc định cho variants"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. VARIANT GENERATOR (Bộ tạo biến thể) */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Settings size={20} className="text-gray-400" /> Cấu hình
                  thuộc tính
                </h2>
                <button
                  type="button"
                  onClick={handleAddAttributeLine}
                  className="text-sm text-blue-600 font-medium hover:underline flex items-center gap-1"
                >
                  <Plus size={16} /> Thêm thuộc tính
                </button>
              </div>

              {/* Vùng chọn Attributes */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-4 border border-gray-100">
                {tempAttributes.length === 0 && (
                  <p className="text-sm text-gray-400 text-center italic py-2">
                    Chưa có thuộc tính nào được chọn. Nhấn "Thêm thuộc tính" để
                    bắt đầu.
                  </p>
                )}
                {tempAttributes.map((attr, idx) => {
                  const attrData =
                    availableAttributes.find((a) => a.id === attr.id) ||
                    availableAttributes.find(
                      (a) => a.attributeName === attr.name,
                    );

                  return (
                    <div
                      key={idx}
                      className="flex flex-col md:flex-row gap-4 border-b border-gray-200 last:border-0 pb-4 last:pb-0"
                    >
                      <div className="w-full md:w-1/4">
                        <select
                          value={attr.id}
                          onChange={(e) =>
                            handleSelectAttributeType(idx, e.target.value)
                          }
                          className="w-full p-2 border border-gray-300 rounded-md text-sm font-medium bg-white"
                        >
                          <option value="">Chọn loại...</option>
                          {availableAttributes.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.attributeName}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-wrap gap-2">
                          {attrData?.attributeValues?.map((val: any) => {
                            const isSelected = attr.selectedValues.includes(
                              val.valueName,
                            );
                            return (
                              <button
                                key={val.id}
                                type="button"
                                onClick={() =>
                                  toggleAttributeValue(idx, val.valueName)
                                }
                                className={`px-3 py-1 text-sm rounded-full border transition-all ${
                                  isSelected
                                    ? "bg-blue-600 text-white border-blue-600"
                                    : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
                                }`}
                              >
                                {val.valueName}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const newAttrs = tempAttributes.filter(
                            (_, i) => i !== idx,
                          );
                          setTempAttributes(newAttrs);
                        }}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={generateVariants}
                className="w-full py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg font-medium hover:bg-indigo-100 transition-colors"
              >
                Tạo danh sách biến thể
              </button>
            </div>

            {/* 3. VARIANT LIST (Danh sách kết quả) */}
            {fields.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                  <h3 className="font-semibold text-gray-700">
                    Danh sách biến thể ({fields.length})
                  </h3>
                  <button
                    type="button"
                    onClick={() => replace([])}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Xóa tất cả
                  </button>
                </div>

                <div className="divide-y divide-gray-100">
                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="p-4 hover:bg-gray-50 transition-colors group"
                    >
                      <div className="flex flex-col md:flex-row gap-4 items-start">
                        {/* Cột 1: Tên variant & Ảnh */}
                        <div className="w-full md:w-1/3">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="bg-gray-800 text-white text-xs font-bold px-2 py-1 rounded">
                              #{index + 1}
                            </span>
                            <div className="font-medium text-sm text-gray-900">
                              {watch(`variants.${index}.attributeValues`)
                                .map((v: any) => v.value)
                                .join(" / ")}
                            </div>
                          </div>
                          {/* Upload Component tái sử dụng */}
                          <ImageUploader
                            images={watch(`variants.${index}.images`)}
                            onUpload={(e) =>
                              handleUpload(e, `variants.${index}.images`)
                            }
                            onRemove={(i) =>
                              removeImage(`variants.${index}.images`, i)
                            }
                          />
                        </div>

                        {/* Cột 2: Giá & Kho */}
                        <div className="flex-1 grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs text-gray-500 mb-1 block">
                              Giá bán
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                {...register(`variants.${index}.price`, {
                                  required: true,
                                })}
                                className="w-full pl-2 pr-2 py-1.5 text-sm border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 mb-1 block">
                              Kho
                            </label>
                            <input
                              type="number"
                              {...register(`variants.${index}.stock`)}
                              className="w-full pl-2 pr-2 py-1.5 text-sm border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                        </div>

                        {/* Cột 3: Xóa */}
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="text-gray-400 hover:text-red-500 p-2"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* === RIGHT COLUMN (SIDEBAR) === */}
          <div className="space-y-6">
            {/* Phân loại */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">
                Phân loại
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Danh mục
                  </label>
                  <div className="relative">
                    <select
                      {...register("categoryId", { required: true })}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg appearance-none focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    >
                      <option value="">-- Chọn danh mục --</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.categoryName}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      className="absolute right-3 top-2.5 text-gray-400 pointer-events-none"
                      size={16}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trạng thái
                  </label>
                  <select className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm">
                    <option value="active">Đang bán</option>
                    <option value="draft">Bản nháp</option>
                    <option value="hidden">Ẩn</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Ảnh đại diện chung */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4 flex justify-between">
                <span>Thư viện ảnh</span>
                <ImageIcon size={16} className="text-gray-400" />
              </h3>
              <p className="text-xs text-gray-500 mb-3">
                Ảnh này sẽ hiển thị ở trang danh sách sản phẩm.
              </p>

              <ImageUploader
                images={watch("productImages")}
                onUpload={(e) => handleUpload(e, "productImages")}
                onRemove={(i) => removeImage("productImages", i)}
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AddProductPage;
