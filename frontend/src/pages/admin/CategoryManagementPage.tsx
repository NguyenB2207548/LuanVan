import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Tags, Search, Edit, Trash2, Plus, FolderTree } from "lucide-react";
import axiosClient from "../../api/axiosClient";

interface Category {
  id: number;
  categoryName?: string;
  category_name?: string;
  description?: string;
  created_at?: string;
  createdAt?: string;
}

const CategoryManagementPage = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get("/categories");
      setCategories(res.data.data || res.data || []);
    } catch (err) {
      console.error("Error fetching categories", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Xử lý xóa Category
  const handleDeleteCategory = async (id: number, name: string) => {
    const isConfirm = window.confirm(
      `Are you sure you want to delete the category "${name}"?\nProducts in this category might lose their categorization.`,
    );

    if (!isConfirm) return;

    try {
      await axiosClient.delete(`/categories/${id}`);
      setCategories((prev) => prev.filter((cat) => cat.id !== id));
    } catch (err: any) {
      console.error("Error deleting category:", err);
      alert(err.response?.data?.message || "Failed to delete category.");
    }
  };

  // Lọc Category theo tên
  const filteredCategories = categories.filter((cat) => {
    const name = cat.categoryName || cat.category_name || "";
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="w-full pb-20">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FolderTree className="text-blue-600" size={26} />
            Category Management
          </h1>
        </div>

        <button
          onClick={() => navigate("/admin/categories/add")}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium text-sm rounded-md hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={16} />
          Add Category
        </button>
      </div>

      {/* FILTER & TOOLBAR */}
      <div className="bg-white p-4 border border-gray-200 rounded-lg mb-6 flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="text-gray-400" size={16} />
          </div>
          <input
            type="text"
            placeholder="Search categories by name..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-16"
                >
                  ID
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  Category Name
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  Description
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  Created At
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider w-24"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-sm text-gray-500"
                  >
                    <div className="flex justify-center items-center gap-2">
                      <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                      Loading categories...
                    </div>
                  </td>
                </tr>
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-sm text-gray-500"
                  >
                    No categories found matching your search.
                  </td>
                </tr>
              ) : (
                filteredCategories.map((cat) => {
                  const displayName =
                    cat.categoryName || cat.category_name || "Unnamed Category";
                  const displayDate = cat.createdAt || cat.created_at;

                  return (
                    <tr
                      key={cat.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                        #{cat.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-blue-50 text-blue-600 flex items-center justify-center">
                            <Tags size={14} />
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {displayName}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500 line-clamp-1 max-w-xs">
                          {cat.description || (
                            <span className="italic text-gray-400">
                              No description
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {displayDate
                          ? new Date(displayDate).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() =>
                              navigate(`/admin/categories/edit/${cat.id}`)
                            }
                            className="text-blue-600 hover:text-blue-900 transition-colors"
                            title="Edit Category"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteCategory(cat.id, displayName)
                            }
                            className="text-red-500 hover:text-red-700 transition-colors"
                            title="Delete Category"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FOOTER COUNTER */}
      {!loading && filteredCategories.length > 0 && (
        <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
          <div>
            Showing{" "}
            <span className="font-medium">{filteredCategories.length}</span>{" "}
            categories
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManagementPage;
