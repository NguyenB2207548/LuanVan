import React from "react";
import ImageOptionSelector from "./ImageOptionSelector";

interface DesignControlsProps {
  designData: any;
  designChoices: Record<number, any>;
  setDesignChoices: React.Dispatch<React.SetStateAction<Record<number, any>>>;
  setShowPreview: (show: boolean) => void;
  baseUrl: string;
}

const checkLayerCondition = (
  layer: any,
  currentChoices: Record<string, any>,
) => {
  if (!layer.show_condition) {
    return true;
  }
  const currentSelectedValues = Object.values(currentChoices);
  return currentSelectedValues.includes(layer.show_condition);
};

const DesignControls: React.FC<DesignControlsProps> = ({
  designData,
  designChoices,
  setDesignChoices,
  setShowPreview,
  baseUrl,
}) => {
  if (!designData?.templateJson?.details) return null;

  return (
    <div className="mt-8">
      <div className="font-semibold mb-4 text-lg">Personalized</div>
      <div className="space-y-6">
        {designData.templateJson.details.map((layer: any) => {
          if (!checkLayerCondition(layer, designChoices)) {
            return null;
          }

          if (layer.type === "group") {
            const options =
              layer.options?.map((opt: any) => ({
                id: opt.id,
                image: opt.image_url?.startsWith("http")
                  ? opt.image_url
                  : `${baseUrl}${opt.image_url}`,
                title: opt.name,
              })) || [];

            const currentSelectedId =
              designChoices[layer.id] !== undefined
                ? designChoices[layer.id]
                : layer.options[0]?.id;

            return (
              <div
                key={layer.id}
                className="w-full bg-blue-50/50 p-3 rounded border border-blue-100 mb-2"
              >
                <ImageOptionSelector
                  label={layer.label}
                  options={options}
                  selectedId={currentSelectedId}
                  onSelect={(selectedOptionId) => {
                    if (!selectedOptionId) return;
                    setDesignChoices((prev) => {
                      const newChoices = { ...prev };
                      newChoices[layer.id] = selectedOptionId;
                      return newChoices;
                    });
                    setShowPreview(true);
                  }}
                  itemClassName="md:w-1/3 w-1/2" // Ô chọn layout to hơn một chút
                />
              </div>
            );
          }

          // --- TEXT INPUT
          if (layer.type === "text") {
            const currentValue =
              designChoices[layer.id] !== undefined
                ? designChoices[layer.id]
                : layer.defaultValue || "";
            return (
              <div key={layer.id} className="w-full">
                <label className="block text-[11px] font-extrabold mb-2 uppercase italic text-gray-600">
                  {layer.label} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder={`Nhập ${layer.label.toLowerCase()}...`}
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
          // --- DYNAMIC TEXT
          if (layer.type === "dynamic_text") {
            const currentValue =
              designChoices[layer.id] !== undefined
                ? designChoices[layer.id]
                : layer.options?.[0]?.name || ""; // Lấy option đầu tiên làm mặc định

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
                  {/* Icon mũi tên cho đẹp */}
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                    <svg
                      className="fill-current h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
              </div>
            );
          }

          // --- DYNAMIC IMAGE SELECTOR
          if (layer.type === "dynamic_image") {
            const options =
              layer.options?.map((opt: any) => ({
                id: opt.id,
                image: `${baseUrl}${opt.image_url}`,
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
                  itemClassName="md:w-1/4 w-1/3"
                />
              </div>
            );
          }

          // --- UPLOAD BUTTON ---
          if (layer.type === "upload") {
            const uploadedFile = designChoices[layer.id] as File | undefined;
            return (
              <div key={layer.id} className="w-full">
                <label className="block text-[11px] font-extrabold mb-2 uppercase italic text-gray-600">
                  {layer.label || "Upload Image"}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer bg-white">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id={`upload-${layer.id}`}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setDesignChoices((prev) => ({
                          ...prev,
                          [layer.id]: file,
                        }));
                        setShowPreview(true);
                      }
                    }}
                  />
                  <label
                    htmlFor={`upload-${layer.id}`}
                    className="cursor-pointer flex flex-col items-center justify-center gap-2"
                  >
                    <svg
                      className="w-8 h-8 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                      ></path>
                    </svg>
                    <span className="text-sm text-gray-500 font-medium">
                      Click to upload image
                    </span>
                    <span className="text-xs text-gray-400">
                      PNG, JPG up to 10MB
                    </span>
                  </label>
                  {uploadedFile && (
                    <p className="mt-3 text-xs text-green-600 font-bold bg-green-50 py-1 px-2 rounded inline-block">
                      ✓ {uploadedFile.name}
                    </p>
                  )}
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
