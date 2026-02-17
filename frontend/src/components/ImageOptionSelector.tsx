import React from "react";
import { CheckCircle2 } from "lucide-react";

interface OptionItem {
  id: string | number;
  image: string;
  title?: string;
}

interface ImageOptionSelectorProps {
  label: string;
  options: OptionItem[];
  selectedId?: string | number;
  onSelect: (id: string | number) => void;
  itemClassName?: string;
}

const ImageOptionSelector: React.FC<ImageOptionSelectorProps> = ({
  label,
  options,
  selectedId,
  onSelect,
  itemClassName = "md:w-1/6 w-1/5",
}) => {
  return (
    <div className="mt-8">
      {/* 1. TIÊU ĐỀ */}
      <div className="font-semibold mb-4 text-lg text-gray-800">{label}</div>

      {/* 2. DANH SÁCH ẢNH */}
      <div className="flex flex-wrap -mx-1">
        {options.map((option) => {
          const isActive = selectedId === option.id;

          return (
            <div
              key={option.id}
              className={`px-1 mb-2 ${itemClassName}`}
              onClick={() => onSelect(option.id)}
            >
              <div
                className={`at-item bg-white rounded relative cursor-pointer border transition-all duration-200 ${
                  isActive
                    ? "border-[#27ae60] ring-1 ring-[#27ae60] shadow-sm"
                    : "border-gray-200 hover:border-gray-400"
                }`}
                title={option.title}
              >
                <div className="aspect-square p-1">
                  <div
                    className="w-full h-full bg-no-repeat bg-center bg-contain rounded"
                    style={{ backgroundImage: `url("${option.image}")` }}
                  ></div>
                </div>

                {isActive && (
                  <div className="absolute -top-1 -right-1 bg-[#27ae60] text-white rounded-full p-0.5 shadow-md">
                    <CheckCircle2
                      size={12}
                      fill="currentColor"
                      stroke="white"
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ImageOptionSelector;
