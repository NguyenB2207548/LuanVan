import React from "react";
import { Check, CheckCircle2 } from "lucide-react";

interface OptionItem {
  id: string | number;
  image: string;
  title?: string;
}

interface ImageOptionSelectorProps {
  label: string;
  options: OptionItem[];
  selectedId?: string | number; // NHẬN TỪ CHA
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
      <div className="font-semibold mb-2 text-sm">{label}</div>
      <div className="flex flex-wrap -mx-1">
        {options.map((option) => {
          const isActive = selectedId === option.id;

          return (
            <div
              key={option.id}
              className={`px-1 mb-2 ${itemClassName}`}
              // CHỈ GỌI onSelect CỦA CHA, KHÔNG SET STATE GÌ Ở ĐÂY
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
                  <div className="absolute -top-1 -right-1 bg-[#27ae60] text-white rounded-full  shadow-md">
                    <Check size={18} stroke="white" />
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
