import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, UserPlus, AlertCircle } from "lucide-react";
import axiosClient from "../../api/axiosClient";

const AddUserPage = () => {
  const navigate = useNavigate();

  // Quản lý dữ liệu form
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    passwordHash: "",
    role: "user", // Mặc định là user bình thường
  });

  // Quản lý trạng thái
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Xử lý khi nhập liệu
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Xóa lỗi khi người dùng bắt đầu gõ lại
    if (error) setError(null);
  };

  // Xử lý khi submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate cơ bản ở Frontend
    if (!formData.fullName || !formData.email || !formData.passwordHash) {
      setError("Please fill in all required fields.");
      return;
    }

    if (formData.passwordHash.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // Gọi API thêm mới user (Thay đổi endpoint '/users' nếu backend của bạn dùng endpoint khác, vd: '/auth/register')
      await axiosClient.post("/users", formData);

      alert("User created successfully!");
      navigate("/admin/users"); // Quay lại danh sách user
    } catch (err: any) {
      console.error("Error creating user", err);
      setError(
        err.response?.data?.message ||
          "Failed to create user. Email might already exist.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

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
              <UserPlus className="text-blue-600" size={24} />
              Add New User
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Create a new account and assign system permissions.
            </p>
          </div>
        </div>
      </div>

      {/* FORM SECTION */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6">
            {/* Thông báo lỗi */}
            {error && (
              <div className="flex items-center gap-2 p-4 mb-4 text-sm text-red-800 border border-red-200 rounded-lg bg-red-50">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Name */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder=""
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm transition-colors"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder=""
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm transition-colors"
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="passwordHash"
                  value={formData.passwordHash}
                  onChange={handleInputChange}
                  placeholder=""
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm transition-colors"
                  required
                  autoComplete="new-password"
                />
              </div>

              {/* Role Selection */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Role <span className="text-red-500">*</span>
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm bg-white cursor-pointer transition-colors"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
                <p className="mt-1.5 text-xs text-gray-500">
                  Admins have full access to all dashboard features. Users can
                  only access the client-facing store.
                </p>
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
              {isSubmitting ? "Creating User..." : "Save User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUserPage;
