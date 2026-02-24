import React, { useState, useEffect } from "react";
import { Tags, Plus, Edit, Trash2, X, AlertCircle, Hash } from "lucide-react";
import axiosClient from "../../api/axiosClient";

// Định nghĩa Type
interface AttributeValue {
  id: number;
  valueName: string;
  value_name?: string;
}

interface Attribute {
  id: number;
  attributeName: string;
  description: string;
  values?: AttributeValue[];
  attributeValues?: AttributeValue[]; // Đề phòng backend map tên khác
}

const AttributeManagementPage = () => {
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [loading, setLoading] = useState(true);

  // State cho Modal Thêm/Sửa Attribute
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAttr, setEditingAttr] = useState<Attribute | null>(null);
  const [attrForm, setAttrForm] = useState({ name: "", description: "" });
  const [isSavingAttr, setIsSavingAttr] = useState(false);

  // State quản lý text đang nhập cho từng Attribute (để thêm Value mới)
  const [valueInputs, setValueInputs] = useState<Record<number, string>>({});
  const [isAddingValue, setIsAddingValue] = useState<number | null>(null);

  // 1. FETCH DATA
  const fetchAttributes = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get("/attributes");
      setAttributes(res.data.data || res.data || []);
    } catch (err) {
      console.error("Error fetching attributes", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttributes();
  }, []);

  // 2. THÊM / SỬA ATTRIBUTE (THUỘC TÍNH CHA)
  const handleOpenModal = (attr?: Attribute) => {
    if (attr) {
      setEditingAttr(attr);
      setAttrForm({
        name: attr.attributeName,
        description: attr.description || "",
      });
    } else {
      setEditingAttr(null);
      setAttrForm({ name: "", description: "" });
    }
    setIsModalOpen(true);
  };

  const handleSaveAttribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!attrForm.name.trim()) return alert("Name is required");

    try {
      setIsSavingAttr(true);
      if (editingAttr) {
        // Update (Cần API PUT /attributes/:id)
        await axiosClient.put(`/attributes/${editingAttr.id}`, attrForm);
      } else {
        // Create
        await axiosClient.post("/attributes", attrForm);
      }
      setIsModalOpen(false);
      fetchAttributes(); // Refresh list
    } catch (err: any) {
      console.error("Error saving attribute", err);
      alert(err.response?.data?.message || "Failed to save attribute.");
    } finally {
      setIsSavingAttr(false);
    }
  };

  const handleDeleteAttribute = async (id: number, name: string) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${name}"? All its values will be lost!`,
      )
    )
      return;
    try {
      // Cần API DELETE /attributes/:id
      await axiosClient.delete(`/attributes/${id}`);
      setAttributes((prev) => prev.filter((a) => a.id !== id));
    } catch (err: any) {
      console.error("Error deleting attribute", err);
      alert(err.response?.data?.message || "Failed to delete attribute.");
    }
  };

  // 3. THÊM VALUE VÀO ATTRIBUTE
  const handleAddValue = async (attributeId: number) => {
    const valueName = valueInputs[attributeId]?.trim();
    if (!valueName) return;

    try {
      setIsAddingValue(attributeId);
      const res = await axiosClient.post("/attributes/values", {
        attributeId,
        valueName,
      });

      const newValue = res.data.data;

      // Cập nhật state UI ngay lập tức
      setAttributes((prev) =>
        prev.map((attr) => {
          if (attr.id === attributeId) {
            const currentValues = attr.values || attr.attributeValues || [];
            return { ...attr, values: [...currentValues, newValue] };
          }
          return attr;
        }),
      );

      // Xóa text ô input
      setValueInputs((prev) => ({ ...prev, [attributeId]: "" }));
    } catch (err: any) {
      console.error("Error adding value", err);
      alert(err.response?.data?.message || "Failed to add value.");
    } finally {
      setIsAddingValue(null);
    }
  };

  // 4. XÓA VALUE
  const handleDeleteValue = async (attributeId: number, valueId: number) => {
    if (!window.confirm("Delete this value?")) return;
    try {
      // Cần API DELETE /attributes/values/:id
      await axiosClient.delete(`/attributes/values/${valueId}`);

      // Cập nhật UI
      setAttributes((prev) =>
        prev.map((attr) => {
          if (attr.id === attributeId) {
            const currentValues = attr.values || attr.attributeValues || [];
            return {
              ...attr,
              values: currentValues.filter((v) => v.id !== valueId),
            };
          }
          return attr;
        }),
      );
    } catch (err: any) {
      console.error("Error deleting value", err);
      alert(err.response?.data?.message || "Failed to delete value.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-500 text-sm">
        <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full mr-2"></div>
        Loading attributes...
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-20">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            Attributes Management
          </h1>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium text-sm rounded-md hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={16} />
          New Attribute
        </button>
      </div>

      {/* LIST OF ATTRIBUTES (CARDS) */}
      {attributes.length === 0 ? (
        <div className="bg-white p-10 text-center border border-gray-200 rounded-lg shadow-sm">
          <Tags size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No attributes found.</p>
          <p className="text-sm text-gray-400 mt-1">
            Click "New Attribute" to create one.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {attributes.map((attr) => {
            const vals = attr.values || attr.attributeValues || [];

            return (
              <div
                key={attr.id}
                className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden"
              >
                {/* CARD HEADER */}
                <div className="bg-gray-50 px-5 py-3 border-b border-gray-200 flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-bold text-gray-800">
                      {attr.attributeName}
                    </h3>
                    {attr.description && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {attr.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenModal(attr)}
                      className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                      title="Edit Attribute"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() =>
                        handleDeleteAttribute(attr.id, attr.attributeName)
                      }
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                      title="Delete Attribute"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* CARD BODY (VALUES) */}
                <div className="p-5">
                  <div className="flex flex-wrap gap-2 items-center">
                    {/* Danh sách các giá trị */}
                    {vals.map((v) => (
                      <div
                        key={v.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-medium group"
                      >
                        <span>{v.valueName || v.value_name}</span>
                        <button
                          onClick={() => handleDeleteValue(attr.id, v.id)}
                          className="text-blue-400 hover:text-red-500 transition-colors p-0.5 rounded-full hover:bg-white"
                          title="Remove value"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}

                    {/* Ô nhập thêm giá trị mới ngay trên Card */}
                    <div className="flex items-center ml-2 border border-gray-300 rounded-md overflow-hidden bg-white focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all shadow-sm">
                      <input
                        type="text"
                        placeholder="Add new value..."
                        className="w-32 px-2 py-1.5 text-xs outline-none text-gray-700"
                        value={valueInputs[attr.id] || ""}
                        onChange={(e) =>
                          setValueInputs((prev) => ({
                            ...prev,
                            [attr.id]: e.target.value,
                          }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleAddValue(attr.id);
                        }}
                      />
                      <button
                        onClick={() => handleAddValue(attr.id)}
                        disabled={
                          !valueInputs[attr.id]?.trim() ||
                          isAddingValue === attr.id
                        }
                        className="px-2 py-1.5 bg-gray-100 border-l border-gray-300 text-gray-600 hover:bg-gray-200 disabled:opacity-50 transition-colors"
                      >
                        {isAddingValue === attr.id ? (
                          <div className="animate-spin w-3 h-3 border-2 border-gray-500 border-t-transparent rounded-full"></div>
                        ) : (
                          <Plus size={14} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL THÊM / SỬA ATTRIBUTE CHA */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-bold text-gray-800">
                {editingAttr ? "Edit Attribute" : "Create New Attribute"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveAttribute}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Attribute Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={attrForm.name}
                    onChange={(e) =>
                      setAttrForm({ ...attrForm, name: e.target.value })
                    }
                    placeholder="e.g., Color, Size, Material..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={attrForm.description}
                    onChange={(e) =>
                      setAttrForm({ ...attrForm, description: e.target.value })
                    }
                    placeholder="Optional description"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
              </div>
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingAttr}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-70 flex items-center gap-2"
                >
                  {isSavingAttr ? "Saving..." : "Save Attribute"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttributeManagementPage;
