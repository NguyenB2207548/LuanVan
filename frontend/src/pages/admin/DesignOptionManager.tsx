import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  ListPlus,
  Type,
  Upload,
  Grid,
  Save,
  Trash2,
  Settings,
  Hash,
  Type as TypeIcon,
} from "lucide-react";
import axiosClient from "../../api/axiosClient";

const DesignOptionManager = () => {
  const { id } = useParams();
  const [design, setDesign] = useState<any>(null);
  const [options, setOptions] = useState<any[]>([]);

  useEffect(() => {
    const fetchDesign = async () => {
      try {
        const res = await axiosClient.get(`/designs/${id}`);
        setDesign(res.data);
        setOptions(res.data.options || []);
      } catch (err) {
        console.error("Lỗi tải thông tin design", err);
      }
    };
    fetchDesign();
  }, [id]);

  const addEmptyOption = () => {
    setOptions([
      ...options,
      {
        label: "Nhãn hiển thị",
        optionType: "text",
        targetLayerId: "",
        config: {
          placeholder: "",
          maxLength: 20,
          required: true,
        },
      },
    ]);
  };

  const updateOption = (idx: number, field: string, value: any) => {
    const newOpts = [...options];

    // Nếu đổi optionType, reset lại config tương ứng
    if (field === "optionType") {
      if (value === "text") {
        newOpts[idx].config = {
          placeholder: "",
          maxLength: 20,
          required: true,
        };
      } else if (value === "image_group") {
        // Tự động tìm bộ sưu tập ảnh từ templateJson dựa trên layer được chọn (nếu có)
        const currentLayer = design.templateJson.detail.find(
          (l: any) => l.layer === newOpts[idx].targetLayerId,
        );
        newOpts[idx].config = {
          options: currentLayer?.options || [],
          displayStyle: "grid",
        };
      } else {
        newOpts[idx].config = { aspectRatio: "1:1" };
      }
    }

    newOpts[idx][field] = value;
    setOptions(newOpts);
  };

  const updateConfig = (idx: number, configField: string, value: any) => {
    const newOpts = [...options];
    newOpts[idx].config = { ...newOpts[idx].config, [configField]: value };
    setOptions(newOpts);
  };

  const handleSave = async () => {
    try {
      // Trước khi lưu, đảm bảo image_group lấy đúng bộ options từ templateJson
      const finalOptions = options.map((opt) => {
        if (opt.optionType === "image_group") {
          const matchedLayer = design.templateJson.detail.find(
            (l: any) => l.layer === opt.targetLayerId,
          );
          return {
            ...opt,
            config: { ...opt.config, options: matchedLayer?.options || [] },
          };
        }
        return opt;
      });

      await axiosClient.post(`/designs/${id}/options`, {
        options: finalOptions,
      });
      alert("Cập nhật bộ tùy chọn thành công!");
    } catch (err) {
      alert("Lỗi khi lưu cấu hình");
    }
  };

  if (!design)
    return (
      <div className="p-10 font-bold text-center">ĐANG TẢI DỮ LIỆU...</div>
    );

  return (
    <div className="max-w-6xl mx-auto p-8 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-black tracking-tight italic text-gray-900">
            CẤU HÌNH INPUT CHO KHÁCH
          </h1>
          <p className="text-indigo-600 font-bold uppercase text-[11px] tracking-[0.2em] mt-2">
            MẪU GỐC: {design.designName}
          </p>
        </div>
        <button
          onClick={addEmptyOption}
          className="bg-black text-white px-8 py-4 rounded-3xl font-black flex items-center gap-3 hover:bg-indigo-600 transition-all shadow-xl shadow-indigo-100"
        >
          <ListPlus size={20} /> THÊM Ô NHẬP LIỆU
        </button>
      </div>

      <div className="space-y-8">
        {options.map((opt, idx) => (
          <div
            key={idx}
            className="bg-white p-10 rounded-[45px] shadow-sm border border-gray-100 relative group transition-all hover:shadow-md"
          >
            <button
              onClick={() => setOptions(options.filter((_, i) => i !== idx))}
              className="absolute top-6 right-6 bg-red-50 text-red-400 p-3 rounded-2xl opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white shadow-sm"
            >
              <Trash2 size={18} />
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
              {/* PHẦN 1: THÔNG TIN CƠ BẢN */}
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase mb-3 block tracking-widest">
                    1. Nhãn hiển thị (Label)
                  </label>
                  <input
                    className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold text-gray-700 focus:ring-2 focus:ring-indigo-500"
                    placeholder="VD: Nhập tên của bạn..."
                    value={opt.label}
                    onChange={(e) => updateOption(idx, "label", e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase mb-3 block tracking-widest">
                    2. Loại hình nhập liệu
                  </label>
                  <select
                    className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold text-gray-700 focus:ring-2 focus:ring-indigo-500"
                    value={opt.optionType}
                    onChange={(e) =>
                      updateOption(idx, "optionType", e.target.value)
                    }
                  >
                    <option value="text">Text</option>
                    <option value="upload">Upload</option>
                    <option value="image_group">Image Group</option>
                  </select>
                </div>
              </div>

              {/* PHẦN 2: LIÊN KẾT LAYER */}
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-indigo-400 uppercase mb-3 block tracking-widest">
                    3. Liên kết tới Layer Canvas
                  </label>
                  <select
                    className="w-full p-4 bg-indigo-50/50 rounded-2xl border-2 border-indigo-100 font-bold text-indigo-700 focus:ring-2 focus:ring-indigo-500"
                    value={opt.targetLayerId}
                    onChange={(e) =>
                      updateOption(idx, "targetLayerId", e.target.value)
                    }
                  >
                    <option value="">-- Chọn Layer đích --</option>
                    {design.templateJson.detail.map((layer: any) => (
                      <option key={layer.layer} value={layer.layer}>
                        {layer.label} (ID: {layer.layer.slice(-5)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <div className="p-3 bg-white rounded-xl shadow-sm text-indigo-500">
                    {opt.optionType === "text" && <TypeIcon size={20} />}
                    {opt.optionType === "upload" && <Upload size={20} />}
                    {opt.optionType === "image_group" && <Grid size={20} />}
                  </div>
                  <span className="text-[11px] font-black text-gray-400 uppercase tracking-tighter">
                    Preview Component
                  </span>
                </div>
              </div>

              {/* PHẦN 3: CẤU HÌNH CHI TIẾT (CONFIG JSON) */}
              <div className="bg-gray-50 p-6 rounded-[30px] space-y-4 border border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Settings size={14} /> Cấu hình nâng cao (Config)
                </p>

                {opt.optionType === "text" && (
                  <div className="grid gap-4">
                    <div className="bg-white p-3 rounded-xl shadow-sm">
                      <label className="text-[9px] font-bold text-gray-400 block mb-1">
                        GỢI Ý (PLACEHOLDER)
                      </label>
                      <input
                        type="text"
                        className="w-full border-none p-0 text-xs font-bold focus:ring-0"
                        value={opt.config.placeholder || ""}
                        onChange={(e) =>
                          updateConfig(idx, "placeholder", e.target.value)
                        }
                      />
                    </div>
                    <div className="bg-white p-3 rounded-xl shadow-sm">
                      <label className="text-[9px] font-bold text-gray-400 block mb-1">
                        GIỚI HẠN KÝ TỰ
                      </label>
                      <input
                        type="number"
                        className="w-full border-none p-0 text-xs font-bold focus:ring-0"
                        value={opt.config.maxLength || 0}
                        onChange={(e) =>
                          updateConfig(
                            idx,
                            "maxLength",
                            parseInt(e.target.value),
                          )
                        }
                      />
                    </div>
                  </div>
                )}

                {opt.optionType === "image_group" && (
                  <div className="space-y-2">
                    <div className="p-3 bg-white rounded-xl shadow-sm flex items-center justify-between">
                      <span className="text-[10px] font-bold text-gray-500">
                        ẢNH TRONG BỘ:
                      </span>
                      <span className="text-xs font-black text-indigo-600">
                        {design.templateJson.detail.find(
                          (l: any) => l.layer === opt.targetLayerId,
                        )?.options?.length || 0}{" "}
                        mẫu
                      </span>
                    </div>
                    <p className="text-[9px] text-gray-400 italic font-medium">
                      * Bộ ảnh sẽ tự động lấy từ dữ liệu bạn đã upload trên
                      Canvas cho Layer này.
                    </p>
                  </div>
                )}

                {opt.optionType === "upload" && (
                  <div className="bg-white p-3 rounded-xl shadow-sm">
                    <label className="text-[9px] font-bold text-gray-400 block mb-1">
                      TỈ LỆ ẢNH (ASPECT RATIO)
                    </label>
                    <input
                      type="text"
                      className="w-full border-none p-0 text-xs font-bold focus:ring-0 text-indigo-600"
                      value={opt.config.aspectRatio || "1:1"}
                      onChange={(e) =>
                        updateConfig(idx, "aspectRatio", e.target.value)
                      }
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {options.length > 0 && (
        <button
          onClick={handleSave}
          className="w-full mt-12 bg-indigo-600 text-white py-6 rounded-[2.5rem] font-black flex items-center justify-center gap-3 hover:bg-black transition-all shadow-2xl shadow-indigo-200 uppercase tracking-widest"
        >
          <Save size={24} /> LƯU CẤU HÌNH OPTION
        </button>
      )}

      {options.length === 0 && (
        <div className="p-20 text-center border-2 border-dashed border-gray-200 rounded-[50px] bg-white">
          <Settings size={48} className="mx-auto text-gray-200 mb-4" />
          <p className="text-gray-400 font-bold">
            Chưa có ô nhập liệu nào. Hãy nhấn nút "Thêm Input Mới" ở phía trên.
          </p>
        </div>
      )}
    </div>
  );
};

export default DesignOptionManager;
