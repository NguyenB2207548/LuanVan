import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  FolderPlus,
  FolderEdit,
  AlertCircle,
  Image as ImageIcon,
  Plus,
  Trash2,
} from "lucide-react";
import axiosClient from "../../api/axiosClient";
import AssetManagerModal from "../../components/admin/AssetManagerModal"; // Import Modal quản lý ảnh

const CategoryEditorPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  const BaseURL = "http://localhost:3000"; // Đảm bảo khớp với server của bạn

  const [loading, setLoading] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Thêm state cho modal ảnh
  const [assetModalOpen, setAssetModalOpen] = useState(false);

  // Dữ liệu Form
  const [formData, setFormData] = useState({
    categoryName: "",
    description: "",
    imageUrl: "",
  });

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        setLoading(true);
        const res = await axiosClient.get(`/categories/${id}`);
        const category = res.data.data || res.data;

        setFormData({
          categoryName: category.categoryName || category.category_name || "",
          description: category.description || "",
          imageUrl: category.imageUrl || "", // Lấy ảnh cũ từ backend
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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  // Xử lý khi chọn ảnh từ Modal
  const handleAssetSelect = (urls: string[]) => {
    if (urls.length > 0) {
      setFormData((prev) => ({ ...prev, imageUrl: urls[0] }));
    }
    setAssetModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.categoryName.trim()) {
      setError("Category Name is required.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const payload = {
        categoryName: formData.categoryName,
        description: formData.description,
        imageUrl: formData.imageUrl, // Gửi URL ảnh lên backend
      };

      if (isEditMode) {
        await axiosClient.put(`/categories/${id}`, payload);
      } else {
        await axiosClient.post("/categories", payload);
      }

      navigate("/admin/categories");
    } catch (err: any) {
      console.error("Error saving category", err);
      setError(err.response?.data?.message || "Failed to save category.");
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
          </div>
        </div>
      </div>

      {/* FORM SECTION */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6">
            {error && (
              <div className="flex items-center gap-2 p-4 mb-4 text-sm text-red-800 border border-red-200 rounded-lg bg-red-50">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Cột trái: Chọn ảnh */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 uppercase tracking-wider text-[11px]">
                  Category Image
                </label>
                <div
                  className="relative aspect-square rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center overflow-hidden group hover:border-blue-400 transition-colors cursor-pointer"
                  onClick={() => setAssetModalOpen(true)}
                >
                  {formData.imageUrl ? (
                    <>
                      <img
                        src={`${BaseURL}${formData.imageUrl}`}
                        className="w-full h-full object-cover"
                        alt="Preview"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Plus className="text-white" size={24} />
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFormData({ ...formData, imageUrl: "" });
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-white rounded-full text-red-500 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center text-gray-400">
                      <ImageIcon size={32} strokeWidth={1.5} />
                      <span className="text-[10px] font-bold uppercase mt-2">
                        Upload Image
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Cột phải: Thông tin chữ */}
              <div className="md:col-span-2 space-y-6">
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    rows={5}
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Brief description about this category..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* FOOTER ACTIONS */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
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

      {/* ASSET MANAGER MODAL */}
      <AssetManagerModal
        isOpen={assetModalOpen}
        onClose={() => setAssetModalOpen(false)}
        onSelect={handleAssetSelect}
        multiple={false} // Chỉ chọn 1 ảnh duy nhất cho Category
      />
    </div>
  );
};

export default CategoryEditorPage;
