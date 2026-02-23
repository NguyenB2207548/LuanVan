import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, UserCog, AlertCircle } from "lucide-react";
import axiosClient from "../../api/axiosClient";

const EditUserPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Quản lý trạng thái
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dữ liệu Form
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    passwordHash: "", // Bỏ trống nghĩa là không đổi mật khẩu
    role: "user",
  });

  // 1. GỌI API LẤY THÔNG TIN USER CŨ
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const res = await axiosClient.get(`/users/${id}`);
        const user = res.data.data || res.data;

        // Map dữ liệu vào form (Xử lý cả case backend trả snake_case hoặc camelCase)
        setFormData({
          fullName: user.full_name || user.fullName || "",
          email: user.email || "",
          passwordHash: "", // Luôn để trống mật khẩu vì lý do bảo mật
          role: user.role || "user",
        });
      } catch (err: any) {
        console.error("Error fetching user details", err);
        setError("User not found or failed to load data.");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchUser();
  }, [id]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  // 2. XỬ LÝ LƯU (CẬP NHẬT)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName || !formData.email) {
      setError("Name and Email are required fields.");
      return;
    }

    // Nếu có nhập mật khẩu mới thì phải dài >= 6 ký tự
    if (formData.passwordHash && formData.passwordHash.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // Lọc bỏ passwordHash nếu Admin không nhập gì (để backend không update đè chuỗi rỗng)
      const payload: any = {
        fullName: formData.fullName,
        email: formData.email,
        role: formData.role,
      };

      if (formData.passwordHash) {
        payload.passwordHash = formData.passwordHash;
      }

      // Gọi API cập nhật (PUT hoặc PATCH)
      await axiosClient.patch(`/users/${id}`, payload);

      alert("User updated successfully!");
      navigate("/admin/users");
    } catch (err: any) {
      console.error("Error updating user", err);
      setError(err.response?.data?.message || "Failed to update user details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-500 text-sm">
        <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full mr-2"></div>
        Loading user data...
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
              <UserCog className="text-blue-600" size={24} />
              Edit User Info
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Update user details and access permissions.
            </p>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm transition-colors"
                  required
                />
              </div>

              {/* Password (Optional in Edit mode) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password{" "}
                  <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="password"
                  name="passwordHash"
                  value={formData.passwordHash}
                  onChange={handleInputChange}
                  placeholder="Leave blank to keep current password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm transition-colors"
                  autoComplete="new-password"
                />
              </div>

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
              </div>
            </div>
          </div>

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
              {isSubmitting ? "Saving Changes..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUserPage;
