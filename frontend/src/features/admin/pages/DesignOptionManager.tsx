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
} from "lucide-react";
import axiosClient from "../../../api/axiosClient";

const DesignOptionManager = () => {
  const { id } = useParams(); // ID của Design Template
  const [design, setDesign] = useState<any>(null);
  const [options, setOptions] = useState<any[]>([]);

  useEffect(() => {
    const fetchDesign = async () => {
      const res = await axiosClient.get(`/designs/${id}`);
      setDesign(res.data);
      setOptions(res.data.options || []);
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
        config: {},
      },
    ]);
  };

  const handleSave = async () => {
    try {
      await axiosClient.post(`/designs/${id}/options`, { options });
      alert("Cập nhật bộ tùy chọn thành công!");
    } catch (err) {
      alert("Lỗi khi lưu");
    }
  };

  if (!design) return <div className="p-10 font-bold">Đang tải...</div>;

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-black tracking-tight italic">
            CẤU HÌNH OPTION
          </h1>
          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">
            Template: {design.designName}
          </p>
        </div>
        <button
          onClick={addEmptyOption}
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 hover:bg-black transition-all"
        >
          <ListPlus size={20} /> THÊM INPUT MỚI
        </button>
      </div>

      <div className="grid gap-6">
        {options.map((opt, idx) => (
          <div
            key={idx}
            className="bg-white p-8 rounded-[35px] shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-4 gap-6 items-end relative group"
          >
            <button
              onClick={() => setOptions(options.filter((_, i) => i !== idx))}
              className="absolute -top-2 -right-2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg"
            >
              <Trash2 size={16} />
            </button>

            {/* 1. Nhãn (Label) */}
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase mb-2 block tracking-widest">
                Nhãn cho khách
              </label>
              <input
                className="w-full p-3 bg-gray-50 rounded-xl border-none font-bold"
                value={opt.label}
                onChange={(e) => {
                  const newOpts = [...options];
                  newOpts[idx].label = e.target.value;
                  setOptions(newOpts);
                }}
              />
            </div>

            {/* 2. Loại Input */}
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase mb-2 block tracking-widest">
                Loại Input
              </label>
              <select
                className="w-full p-3 bg-gray-50 rounded-xl border-none font-bold"
                value={opt.optionType}
                onChange={(e) => {
                  const newOpts = [...options];
                  newOpts[idx].optionType = e.target.value;
                  setOptions(newOpts);
                }}
              >
                <option value="text">Nhập văn bản</option>
                <option value="upload">Khách tự tải ảnh</option>
                <option value="image_group">Chọn từ bộ sưu tập</option>
              </select>
            </div>

            {/* 3. Target Layer ID (ID layer trong Konva JSON) */}
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase mb-2 block tracking-widest text-indigo-500">
                Target Layer ID
              </label>
              <select
                className="w-full p-3 bg-gray-50 rounded-xl border-none font-bold text-indigo-600"
                value={opt.targetLayerId}
                onChange={(e) => {
                  const newOpts = [...options];
                  newOpts[idx].targetLayerId = e.target.value;
                  setOptions(newOpts);
                }}
              >
                <option value="">-- Chọn Layer --</option>
                {/* Lấy danh sách layer từ templateJson mà bạn đã thiết kế trước đó */}
                {design.templateJson.detail.map((layer: any) => (
                  <option key={layer.layer} value={layer.layer}>
                    {layer.label} ({layer.layer})
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Icon xem trước loại */}
            <div className="flex justify-center p-3 bg-indigo-50 rounded-xl text-indigo-600">
              {opt.optionType === "text" && <Type />}
              {opt.optionType === "upload" && <Upload />}
              {opt.optionType === "image_group" && <Grid />}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        className="w-full mt-10 bg-black text-white py-5 rounded-[2rem] font-black flex items-center justify-center gap-3 hover:bg-indigo-600 transition-all shadow-xl"
      >
        <Save size={20} /> LƯU CẤU HÌNH OPTION
      </button>
    </div>
  );
};

export default DesignOptionManager;
