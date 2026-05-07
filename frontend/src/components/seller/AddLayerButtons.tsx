import React from "react";
import {
  Type,
  Upload,
  List,
  FolderTree,
  ImageIcon,
  TextCursorInput,
} from "lucide-react";
import type { DesignLayer } from "../../types/designer";

interface AddLayerButtonsProps {
  onAddLayer: (layer: DesignLayer) => void;
  currentLayerCount: number;
}

const AddLayerButtons: React.FC<AddLayerButtonsProps> = ({
  onAddLayer,
  currentLayerCount,
}) => {
  const generateLayerId = () => `layer_${Date.now()}`;

  const handleAddText = () => {
    onAddLayer({
      id: generateLayerId(),
      type: "text",
      label: "Text",
      text: "Text",
      x: 50,
      y: 50,
      fontSize: 24,
      fontFamily: "Roboto",
      color: "#000000",
      zIndex: currentLayerCount,
    });
  };

  const handleAddUpload = () => {
    onAddLayer({
      id: generateLayerId(),
      type: "upload",
      label: "User Upload",
      image_url: "http://localhost:3000/public/uploads/assets/upload.png",
      x: 100,
      y: 100,
      width: 60,
      height: 60,
      zIndex: currentLayerCount,
    });
  };

  const handleAddDynamicImage = () => {
    onAddLayer({
      id: generateLayerId(),
      type: "dynamic_image",
      label: "Option Image",
      image_url: "http://localhost:3000/public/uploads/assets/upload.png",
      options: [],
      x: 150,
      y: 150,
      width: 60,
      height: 60,
      zIndex: currentLayerCount,
    });
  };

  const handleAddGroup = () => {
    onAddLayer({
      id: generateLayerId(),
      type: "group",
      label: "Group Selector",
      options: [],
      zIndex: currentLayerCount,
    });
  };

  const handleAddStaticImage = () => {
    onAddLayer({
      id: generateLayerId(),
      type: "static_image",
      label: "Static Image",
      image_url: "http://localhost:3000/public/uploads/assets/upload.png",
      x: 150,
      y: 150,
      width: 60,
      height: 60,
      zIndex: currentLayerCount,
      show_condition: "",
    });
  };

  return (
    <section className="space-y-3">
      <label className="text-xs font-semibold text-gray-600 block">
        Add Element
      </label>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={handleAddText}
          className="flex items-center justify-start gap-2 px-3 h-10 border border-gray-300 rounded-md hover:bg-gray-50 text-[13px] font-medium bg-white transition-colors"
        >
          <Type size={16} className="text-gray-500 shrink-0" />
          <span className="whitespace-nowrap truncate">Text</span>
        </button>

        <button
          onClick={handleAddUpload}
          className="flex items-center justify-start gap-2 px-3 h-10 border border-gray-300 rounded-md hover:bg-gray-50 text-[13px] font-medium bg-white transition-colors"
        >
          <Upload size={16} className="text-gray-500 shrink-0" />
          <span className="whitespace-nowrap truncate">Upload</span>
        </button>

        <button
          onClick={handleAddStaticImage}
          className="flex items-center justify-start gap-2 px-3 h-10 border border-gray-300 rounded-md hover:bg-gray-50 text-[13px] font-medium bg-white transition-colors"
        >
          <ImageIcon size={16} className="text-gray-500 shrink-0" />
          <span className="whitespace-nowrap truncate">Static Image</span>
        </button>

        <button
          onClick={handleAddDynamicImage}
          className="flex items-center justify-start gap-2 px-3 h-10 border border-gray-300 rounded-md hover:bg-gray-50 text-[13px] font-medium bg-white transition-colors"
        >
          <List size={16} className="text-gray-500 shrink-0" />
          <span className="whitespace-nowrap truncate">Option Image</span>
        </button>

        <button
          onClick={handleAddGroup}
          className="flex items-center justify-start gap-2 px-3 h-10 border border-gray-300 rounded-md hover:bg-gray-50 text-[13px] font-medium bg-white transition-colors"
        >
          <FolderTree size={16} className="text-gray-500 shrink-0" />
          <span className="whitespace-nowrap truncate">Group</span>
        </button>
      </div>
    </section>
  );
};

export default AddLayerButtons;
