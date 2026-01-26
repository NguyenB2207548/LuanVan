import React, { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { Plus, Trash2, Upload, Save, Package, ImageIcon } from "lucide-react";
import axiosClient from "../../../api/axiosClient";
import { useNavigate } from "react-router-dom";

// Định nghĩa kiểu dữ liệu cho Form dựa trên Backend của bạn
interface VariantForm {
  price: number;
  stock: number;
  attributeValueIds: number[];
  imageFiles?: FileList;
}

interface ProductForm {
  productName: string;
  categoryId: number;
  description: string;
  variants: VariantForm[];
}

const AddProductPage = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<any[]>([]);
  const [attributes, setAttributes] = useState<any[]>([]);

  // 1. Khởi tạo Form
  const { register, control, handleSubmit, watch, setValue } =
    useForm<ProductForm>({
      defaultValues: {
        variants: [{ price: 0, stock: 0, attributeValueIds: [] }],
      },
    });

  // Quản lý mảng variants động
  const { fields, append, remove } = useFieldArray({
    control,
    name: "variants",
  });

  // 2. Load dữ liệu Category và Attribute từ Backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resCat, resAttr] = await Promise.all([
          axiosClient.get("/categories"),
          axiosClient.get("/attributes"), // Giả định backend trả về attribute kèm values
        ]);
        setCategories(resCat.data);
        setAttributes(resAttr.data);
      } catch (err) {
        console.error("Không thể tải dữ liệu cấu hình", err);
      }
    };
    fetchData();
  }, []);

  // 3. Hàm xử lý gửi dữ liệu
  const onSubmit = async (data: ProductForm) => {
    try {
      // Vì dữ liệu có File ảnh, bạn nên dùng FormData hoặc upload ảnh lấy link trước
      // Ở đây tôi hướng dẫn gửi JSON (giả định bạn đã xử lý upload ảnh riêng)
      const response = await axiosClient.post("/products", data);
      alert("Thêm sản phẩm thành công!");
      navigate("/admin/products");
    } catch (error) {
      console.error("Lỗi khi tạo sản phẩm:", error);
      alert("Lỗi: " + (error as any).response?.data?.message);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-black text-gray-800 flex items-center gap-2">
            <Package className="text-indigo-600" /> THÊM SẢN PHẨM MỚI
          </h1>
          <button
            type="submit"
            className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all"
          >
            <Save size={20} /> LƯU SẢN PHẨM
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* CỘT TRÁI: THÔNG TIN CHÍNH */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <div className="mb-6">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                  Tên sản phẩm
                </label>
                <input
                  {...register("productName", { required: true })}
                  className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-medium"
                  placeholder="Nhập tên sản phẩm..."
                />
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                  Mô tả
                </label>
                <textarea
                  {...register("description")}
                  rows={4}
                  className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500"
                  placeholder="Thông tin chi tiết về sản phẩm..."
                />
              </div>
            </div>

            {/* QUẢN LÝ BIẾN THỂ (VARIANTS) */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-gray-800">
                  DANH SÁCH BIẾN THỂ (MÀU, SIZE...)
                </h3>
                <button
                  type="button"
                  onClick={() =>
                    append({ price: 0, stock: 0, attributeValueIds: [] })
                  }
                  className="text-indigo-600 font-bold text-sm flex items-center gap-1 hover:bg-indigo-50 px-3 py-1 rounded-xl transition-all"
                >
                  <Plus size={16} /> THÊM MẪU
                </button>
              </div>

              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div className="md:col-span-1">
                    <label className="block text-[10px] font-black text-gray-400 mb-3 uppercase tracking-widest">
                      Cấu hình thuộc tính
                    </label>
                    <div className="space-y-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                      {attributes.map((attr) => (
                        <div
                          key={attr.id}
                          className="border-b border-gray-100 pb-3 last:border-0"
                        >
                          <p className="text-[11px] font-bold text-indigo-600 mb-2 uppercase italic">
                            {attr.attributeName}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {attr.attributeValues?.map((val: any) => {
                              // Kiểm tra xem value này đã được chọn trong variant hiện tại chưa
                              const isSelected = watch(
                                `variants.${index}.attributeValueIds`,
                              )?.includes(val.id);

                              return (
                                <label
                                  key={val.id}
                                  className={`cursor-pointer px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                                    isSelected
                                      ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100"
                                      : "bg-white border-gray-200 text-gray-500 hover:border-indigo-300"
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    className="hidden"
                                    value={val.id}
                                    checked={isSelected}
                                    onChange={(e) => {
                                      const currentValues =
                                        watch(
                                          `variants.${index}.attributeValueIds`,
                                        ) || [];
                                      if (e.target.checked) {
                                        setValue(
                                          `variants.${index}.attributeValueIds`,
                                          [...currentValues, val.id],
                                        );
                                      } else {
                                        setValue(
                                          `variants.${index}.attributeValueIds`,
                                          currentValues.filter(
                                            (id) => id !== val.id,
                                          ),
                                        );
                                      }
                                    }}
                                  />
                                  {val.valueName}
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CỘT PHẢI: CẤU HÌNH PHỤ */}
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-4">
                Danh mục
              </label>
              <select
                {...register("categoryId", { required: true })}
                className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Chọn danh mục...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.categoryName}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-4">
                Ảnh sản phẩm
              </label>
              <div className="border-2 border-dashed border-gray-100 rounded-3xl p-8 flex flex-col items-center justify-center text-gray-400 hover:bg-gray-50 transition-all cursor-pointer">
                <Upload size={32} strokeWidth={1} />
                <p className="text-[10px] font-black mt-2 uppercase">
                  Tải ảnh lên
                </p>
                <input type="file" multiple className="hidden" />
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AddProductPage;
