import React from "react";
import ImageOptionSelector from "./ImageOptionSelector";

interface DesignControlsProps {
  designData: any;
  designChoices: Record<string, any>; // Chuyển sang string vì ID layer thường là string
  setDesignChoices: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  setShowPreview: (show: boolean) => void;
  baseUrl: string;
}

// Hàm kiểm tra điều kiện hiển thị layer (Giữ nguyên logic nhưng dùng layersJson)
const checkLayerCondition = (
  layer: any,
  currentChoices: Record<string, any>,
  allLayers: any[],
): boolean => {
  if (!layer.show_condition) return true;

  const parentGroup = allLayers.find(
    (l) =>
      (l.type === "group" || l.type === "dynamic_image") &&
      l.options?.some((opt: any) => opt.id === layer.show_condition),
  );

  if (!parentGroup) return false;

  const activeOptionIdForGroup = currentChoices[parentGroup.id];
  return activeOptionIdForGroup === layer.show_condition;
};

const DesignControls: React.FC<DesignControlsProps> = ({
  designData,
  designChoices,
  setDesignChoices,
  setShowPreview,
  baseUrl,
}) => {
  // SỬA TẠI ĐÂY: Trỏ đúng vào layersJson.details dựa trên log console
  const allLayers = designData?.layersJson?.details;

  if (!allLayers || !Array.isArray(allLayers)) {
    return null;
  }

  return (
    <div className="mt-8">
      <div className="font-semibold mb-4 text-lg border-b pb-2 text-gray-800">
        Personalize Your Design
      </div>
      <div className="space-y-6">
        {allLayers.map((layer: any) => {
          // Kiểm tra logic ẩn/hiện dựa trên lựa chọn
          if (!checkLayerCondition(layer, designChoices, allLayers)) {
            return null;
          }

          // --- 1. XỬ LÝ GROUP HOẶC DYNAMIC IMAGE (Chọn hình ảnh) ---
          if (layer.type === "group" || layer.type === "dynamic_image") {
            const options =
              layer.options?.map((opt: any) => ({
                id: opt.id,
                image: opt.image_url?.startsWith("http")
                  ? opt.image_url
                  : `${baseUrl}${opt.image_url}`,
                title: opt.name,
              })) || [];

            const currentSelectedId = designChoices[layer.id];

            return (
              <div key={layer.id}>
                <ImageOptionSelector
                  label={layer.label}
                  options={options}
                  selectedId={currentSelectedId}
                  onSelect={(selectedOptionId) => {
                    if (!selectedOptionId) return;
                    setDesignChoices((prev) => ({
                      ...prev,
                      [layer.id]: selectedOptionId,
                    }));
                    setShowPreview(true);
                  }}
                />
              </div>
            );
          }

          // --- 2. XỬ LÝ TEXT INPUT (Nhập chữ) ---
          if (layer.type === "text") {
            const currentValue = designChoices[layer.id] || "";
            return (
              <div key={layer.id} className="w-full">
                <label className="block text-[11px] font-extrabold mb-2 uppercase italic text-gray-600">
                  {layer.label} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder={`Enter ${layer.label.toLowerCase()}...`}
                  className="w-full bg-white border border-gray-300 p-3 rounded focus:ring-2 focus:ring-[#ff4d6d] outline-none text-sm shadow-sm transition-all"
                  value={currentValue}
                  onChange={(e) => {
                    setDesignChoices((prev) => ({
                      ...prev,
                      [layer.id]: e.target.value,
                    }));
                    setShowPreview(true);
                  }}
                />
              </div>
            );
          }

          // --- 3. XỬ LÝ DYNAMIC TEXT (Chọn chữ từ danh sách) ---
          if (layer.type === "dynamic_text") {
            const currentValue =
              designChoices[layer.id] || layer.options?.[0]?.name || "";

            return (
              <div key={layer.id} className="w-full">
                <label className="block text-[11px] font-extrabold mb-2 uppercase italic text-gray-600">
                  {layer.label} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    className="w-full bg-white border border-gray-300 p-3 rounded appearance-none focus:ring-2 focus:ring-[#ff4d6d] outline-none text-sm shadow-sm transition-all cursor-pointer"
                    value={currentValue}
                    onChange={(e) => {
                      setDesignChoices((prev) => ({
                        ...prev,
                        [layer.id]: e.target.value,
                      }));
                      setShowPreview(true);
                    }}
                  >
                    {layer.options?.map((opt: any) => (
                      <option key={opt.id} value={opt.name}>
                        {opt.name}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                    <svg className="fill-current h-4 w-4" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
              </div>
            );
          }

          return null;
        })}
      </div>
    </div>
  );
};

export default DesignControls;
