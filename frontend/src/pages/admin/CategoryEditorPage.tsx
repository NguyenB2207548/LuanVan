import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  FolderPlus,
  FolderEdit,
  AlertCircle,
} from "lucide-react";
import axiosClient from "../../api/axiosClient";

const CategoryEditorPage = () => {
  const { id } = useParams(); // Nếu có id -> Chế độ Edit, nếu không -> Chế độ Add
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  // Quản lý trạng thái
  const [loading, setLoading] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dữ liệu Form
  const [formData, setFormData] = useState({
    categoryName: "",
    description: "",
  });

  // GỌI API LẤY DỮ LIỆU CŨ (Nếu đang ở chế độ Edit)
  useEffect(() => {
    const fetchCategory = async () => {
      try {
        setLoading(true);
        const res = await axiosClient.get(`/categories/${id}`);
        const category = res.data.data || res.data;

        setFormData({
          // Bắt cả 2 case camelCase và snake_case từ Backend
          categoryName: category.categoryName || category.category_name || "",
          description: category.description || "",
        });
      } catch (err: any) {
        console.error("Error fetching category", err);
        setError("Category not found or failed to load data.");
      } finally {
        setLoading(false);
      }
    };

    if (isEditMode) {
      fetchCategory();
    }
  }, [id, isEditMode]);

  // Xử lý khi người dùng nhập liệu
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError(null); // Tắt thông báo lỗi khi bắt đầu gõ lại
  };

  // XỬ LÝ LƯU (THÊM MỚI HOẶC CẬP NHẬT)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate cơ bản
    if (!formData.categoryName.trim()) {
      setError("Category Name is required.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // Định dạng payload gửi lên Backend
      const payload = {
        categoryName: formData.categoryName,
        description: formData.description,
      };

      if (isEditMode) {
        // CẬP NHẬT (PUT)
        await axiosClient.put(`/categories/${id}`, payload);
        alert("Category updated successfully!");
      } else {
        // THÊM MỚI (POST)
        await axiosClient.post("/categories", payload);
        alert("Category created successfully!");
      }

      navigate("/admin/categories"); // Quay lại trang danh sách
    } catch (err: any) {
      console.error("Error saving category", err);
      setError(
        err.response?.data?.message ||
          "Failed to save category. The name might already exist.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-500 text-sm">
        <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full mr-2"></div>
        Loading category data...
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-20">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-gray-400 hover:text-gray-800 bg-white border border-gray-200 rounded-md shadow-sm transition-colors"
            title="Go back"
            type="button"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              {isEditMode ? (
                <FolderEdit className="text-blue-600" size={24} />
              ) : (
                <FolderPlus className="text-blue-600" size={24} />
              )}
              {isEditMode ? "Edit Category" : "Add New Category"}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {isEditMode
                ? "Update the details of this category."
                : "Create a new category to group your products."}
            </p>
          </div>
        </div>
      </div>

      {/* FORM SECTION */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6">
            {/* Hiển thị lỗi nếu có */}
            {error && (
              <div className="flex items-center gap-2 p-4 mb-4 text-sm text-red-800 border border-red-200 rounded-lg bg-red-50">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 gap-6">
              {/* Category Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="categoryName"
                  value={formData.categoryName}
                  onChange={handleInputChange}
                  placeholder="e.g. Mugs, T-Shirts, Posters..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm transition-colors"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description{" "}
                  <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Brief description about what kind of products go into this category..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm transition-colors"
                />
              </div>
            </div>
          </div>

          {/* FOOTER ACTIONS */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors shadow-sm"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
              ) : (
                <Save size={16} />
              )}
              {isSubmitting
                ? "Saving..."
                : isEditMode
                  ? "Save Changes"
                  : "Create Category"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryEditorPage;
