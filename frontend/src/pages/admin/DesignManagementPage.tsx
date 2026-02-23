import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  LayoutTemplate,
  Layers,
} from "lucide-react";
import axiosClient from "../../api/axiosClient";

const DesignManagementPage = () => {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get("/designs");
      setTemplates(res.data);
    } catch (err) {
      console.error("Error fetching templates", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  // Hàm lọc template theo từ khóa tìm kiếm
  const filteredTemplates = templates.filter((template) =>
    template.designName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="w-full">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <LayoutTemplate className="text-blue-600" size={26} />
            Design Templates
          </h1>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* <Link
            to="/admin/designs/link"
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 font-medium text-sm rounded-md hover:bg-gray-50 transition-colors"
          >
            <ExternalLink size={16} />
            Link to Products
          </Link> */}

          <Link
            to="/admin/designs/editor"
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium text-sm rounded-md hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus size={16} />
            Create Template
          </Link>
        </div>
      </div>

      {/* FILTER & TOOLBAR */}
      <div className="bg-white p-4 border border-gray-200 rounded-lg mb-6 flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="text-gray-400" size={16} />
          </div>
          <input
            type="text"
            placeholder="Search template by name..."
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
                  Template Name
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  Structure
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
                      <div className="w-4 h-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin"></div>
                      Loading templates...
                    </div>
                  </td>
                </tr>
              ) : filteredTemplates.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-sm text-gray-500"
                  >
                    No templates found matching your search.
                  </td>
                </tr>
              ) : (
                filteredTemplates.map((template) => (
                  <tr
                    key={template.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                      #{template.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {template.designName}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        Type: {template.templateJson?.type || "Standard"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-sm text-gray-600 bg-gray-100 px-2.5 py-1 rounded inline-flex">
                        <Layers size={14} className="text-gray-400" />
                        <span>
                          {template.templateJson?.details?.length || 0} Layers
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {template.createdAt
                        ? new Date(template.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            },
                          )
                        : "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          to={`/admin/designs/editor/${template.id}`}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit Template"
                        >
                          <Edit size={16} />
                        </Link>
                        <button
                          className="text-red-500 hover:text-red-700"
                          title="Delete Template"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PAGINATION (Optional - Placeholder for future use) */}
      {!loading && filteredTemplates.length > 0 && (
        <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
          <div>
            Showing{" "}
            <span className="font-medium">{filteredTemplates.length}</span>{" "}
            results
          </div>
        </div>
      )}
    </div>
  );
};

export default DesignManagementPage;
