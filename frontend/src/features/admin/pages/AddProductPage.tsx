import React, { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import {
  Plus,
  Trash2,
  Upload,
  Save,
  Package,
  Image as ImageIcon,
} from "lucide-react";
import axiosClient from "../../../api/axiosClient";
import type { Category } from "../../../types/product";

const AddProductPage = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [attributes, setAttributes] = useState<any[]>([]); // Chứa Attribute kèm values

  const BASE_URL = "http://localhost:3000";

  const { register, control, handleSubmit, setValue, watch, reset } = useForm({
    defaultValues: {
      productName: "",
      categoryId: "",
      description: "",
      productImages: [] as string[], // Mảng URL ảnh sản phẩm
      variants: [
        {
          price: 0,
          stock: 0,
          attributeValues: [] as { name: string; value: string }[],
          images: [] as string[],
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "variants",
  });

  // Load Categories & Attributes khi khởi tạo
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resCat, resAttr] = await Promise.all([
          axiosClient.get("/categories"),
          axiosClient.get("/attributes"),
        ]);
        setCategories(resCat.data);
        setAttributes(resAttr.data);
      } catch (err) {
        console.error("Lỗi tải cấu hình", err);
      }
    };
    fetchData();
  }, []);

  // Hàm xử lý upload ảnh riêng lẻ hoặc hàng loạt
  const handleUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    path: string,
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const formData = new FormData();
    // QUAN TRỌNG: Tên field phải là 'files' khớp với FilesInterceptor ở Backend
    Array.from(files).forEach((file) => formData.append("files", file));

    try {
      const res = await axiosClient.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const urls = res.data.urls; // Mảng URL nhận từ Backend
      const currentImages = watch(path as any) || [];
      setValue(path as any, [...currentImages, ...urls]);
    } catch (err) {
      alert("Không thể upload ảnh, hãy kiểm tra Backend!");
    }
  };

  const onSubmit = async (data: any) => {
    try {
      // Kiểm tra ràng buộc: Variant phải có giá và ít nhất 1 ảnh
      const isValid = data.variants.every(
        (v: any) => v.price > 0 && v.images.length > 0,
      );
      if (!isValid)
        return alert(
          "Vui lòng nhập giá và thêm ít nhất 1 ảnh cho mỗi mẫu biến thể!",
        );

      await axiosClient.post("/products", data);
      alert("Tạo sản phẩm thành công!");
      reset();
    } catch (error: any) {
      alert("Lỗi: " + error.response?.data?.message);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen font-sans">
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* TIÊU ĐỀ & NÚT LƯU */}
        <div className="flex justify-between items-end mb-10">
          <div>
            <p className="text-indigo-600 font-bold text-xs uppercase tracking-widest mb-1">
              Quản lý kho hàng
            </p>
            <h1 className="text-4xl font-black text-gray-900 tracking-tighter">
              THÊM SẢN PHẨM MỚI
            </h1>
          </div>
          <button
            type="submit"
            className="bg-black text-white px-10 py-4 rounded-2xl font-black hover:bg-indigo-600 transition-all shadow-xl flex items-center gap-3"
          >
            <Save size={20} /> XÁC NHẬN LƯU
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-10">
            {/* 1. THÔNG TIN CƠ BẢN */}
            <section className="bg-white p-10 rounded-[40px] shadow-sm border border-gray-100">
              <div className="grid gap-8">
                <div>
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3 block">
                    Tên sản phẩm
                  </label>
                  <input
                    {...register("productName", { required: true })}
                    className="w-full p-5 bg-gray-50 rounded-2xl border-none text-xl font-bold focus:ring-2 focus:ring-indigo-500 transition-all"
                    placeholder=""
                  />
                </div>
                <div>
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3 block">
                    Mô tả sản phẩm
                  </label>
                  <textarea
                    {...register("description")}
                    rows={5}
                    className="w-full p-5 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500"
                    placeholder=""
                  />
                </div>
              </div>
            </section>

            {/* 2. BIẾN THỂ & GIÁ CẢ */}
            <div className="space-y-6">
              <div className="flex justify-between items-center px-4">
                <h2 className="text-xl font-black text-gray-800 uppercase italic">
                  Cấu hình biến thể
                </h2>
                <button
                  type="button"
                  onClick={() =>
                    append({
                      price: 0,
                      stock: 0,
                      attributeValues: [],
                      images: [],
                    })
                  }
                  className="bg-white border-2 border-indigo-600 text-indigo-600 px-5 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-600 hover:text-white transition-all"
                >
                  <Plus size={18} /> THÊM MẪU MỚI
                </button>
              </div>

              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="bg-white p-10 rounded-[40px] shadow-lg border border-gray-50 relative group"
                >
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="absolute -top-3 -right-3 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                  >
                    <Trash2 size={18} />
                  </button>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
                    {/* Upload ảnh cho Variant */}
                    <div className="md:col-span-4 space-y-4">
                      <p className="text-[10px] font-black text-gray-400 uppercase">
                        Ảnh mẫu ({index + 1})
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        {watch(`variants.${index}.images`)?.map(
                          (url: string, i: number) => (
                            <div
                              key={i}
                              className="aspect-square rounded-2xl overflow-hidden border border-gray-100 shadow-sm"
                            >
                              <img
                                src={`${BASE_URL}${url}`}
                                className="w-full h-full object-cover"
                                alt="variant"
                              />
                            </div>
                          ),
                        )}
                        <label className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-300 hover:border-indigo-400 hover:bg-indigo-50 cursor-pointer transition-all">
                          <Upload size={20} />
                          <input
                            type="file"
                            hidden
                            multiple
                            onChange={(e) =>
                              handleUpload(e, `variants.${index}.images`)
                            }
                          />
                        </label>
                      </div>
                    </div>

                    {/* Giá, Kho & Thuộc tính */}
                    <div className="md:col-span-8 space-y-8">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="p-5 bg-indigo-50 rounded-3xl">
                          <label className="text-[10px] font-black text-indigo-400 uppercase block mb-1">
                            Giá bán lẻ (VND)
                          </label>
                          <input
                            type="number"
                            {...register(`variants.${index}.price`)}
                            className="w-full bg-transparent border-none p-0 text-2xl font-black text-indigo-700 focus:ring-0"
                            placeholder="0"
                          />
                        </div>
                        <div className="p-5 bg-gray-50 rounded-3xl">
                          <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">
                            Số lượng kho
                          </label>
                          <input
                            type="number"
                            {...register(`variants.${index}.stock`)}
                            className="w-full bg-transparent border-none p-0 text-2xl font-black text-gray-700 focus:ring-0"
                            placeholder="0"
                          />
                        </div>
                      </div>

                      {/* Chọn Attribute Values */}
                      <div className="grid grid-cols-2 gap-4">
                        {attributes.map((attr: any) => (
                          <div key={attr.id} className="space-y-2">
                            <span className="text-[11px] font-bold text-gray-400 uppercase italic">
                              Chọn {attr.attributeName}
                            </span>
                            <select
                              className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm font-bold"
                              onChange={(e) => {
                                const current =
                                  watch(`variants.${index}.attributeValues`) ||
                                  [];
                                const filtered = current.filter(
                                  (a: any) => a.name !== attr.attributeName,
                                );
                                if (e.target.value) {
                                  setValue(
                                    `variants.${index}.attributeValues`,
                                    [
                                      ...filtered,
                                      {
                                        name: attr.attributeName,
                                        value: e.target.value,
                                      },
                                    ],
                                  );
                                }
                              }}
                            >
                              <option value="">-- Trống --</option>
                              {attr.attributeValues?.map((v: any) => (
                                <option key={v.id} value={v.valueName}>
                                  {v.valueName}
                                </option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CỘT PHẢI: CẤU HÌNH BỔ SUNG */}
          <div className="space-y-10">
            {/* Phân loại */}
            <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
              <h3 className="font-black text-gray-800 mb-6 flex items-center gap-2">
                <Package className="text-indigo-600" size={20} /> PHÂN LOẠI
              </h3>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
                  Danh mục chính
                </label>
                <select
                  {...register("categoryId")}
                  className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold"
                >
                  <option value="">Chọn danh mục...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.categoryName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Ảnh Gallery chung */}
            <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
              <h3 className="font-black text-gray-800 mb-6 flex items-center gap-2">
                <ImageIcon className="text-indigo-600" size={20} /> BỘ SƯU TẬP
                ẢNH
              </h3>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {watch("productImages")?.map((url, i) => (
                  <div
                    key={i}
                    className="aspect-square rounded-2xl overflow-hidden shadow-inner"
                  >
                    <img
                      src={`${BASE_URL}${url}`}
                      className="w-full h-full object-cover"
                      alt="product"
                    />
                  </div>
                ))}
                <label className="aspect-square rounded-2xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-gray-300 hover:bg-gray-50 cursor-pointer transition-all">
                  <Upload size={24} />
                  <span className="text-[10px] font-black mt-2">THÊM ẢNH</span>
                  <input
                    type="file"
                    hidden
                    multiple
                    onChange={(e) => handleUpload(e, "productImages")}
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AddProductPage;
