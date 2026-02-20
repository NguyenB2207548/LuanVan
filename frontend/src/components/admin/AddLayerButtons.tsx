import React from "react";
import { Type, Upload, List, FolderTree } from "lucide-react";
import type { DesignLayer } from "../../types/designer";

interface AddLayerButtonsProps {
  onAddLayer: (layer: DesignLayer) => void;
}

const AddLayerButtons: React.FC<AddLayerButtonsProps> = ({ onAddLayer }) => {
  const generateLayerId = () => `layer_${Date.now()}`;

  const handleAddText = () => {
    onAddLayer({
      id: generateLayerId(),
      type: "text",
      label: "Text Field",
      text: "Enter text...",
      x: 50,
      y: 50,
      fontSize: 24,
      fontFamily: "Roboto",
      color: "#000000",
      zIndex: 0,
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
      zIndex: 0,
    });
  };

  const handleAddDynamicImage = () => {
    onAddLayer({
      id: generateLayerId(),
      type: "dynamic_image",
      label: "Dynamic Image",
      image_url: "http://localhost:3000/public/uploads/assets/upload.png",
      options: [],
      x: 150,
      y: 150,
      width: 60,
      height: 60,
      zIndex: 0,
    });
  };

  const handleAddGroup = () => {
    onAddLayer({
      id: generateLayerId(),
      type: "group",
      label: "Group Selector",
      options: [],
      zIndex: 0,
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
          className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm bg-white"
        >
          <Type size={16} className="text-gray-500" /> Text
        </button>
        <button
          onClick={handleAddUpload}
          className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm bg-white"
        >
          <Upload size={16} className="text-gray-500" /> Upload Area
        </button>
        <button
          onClick={handleAddDynamicImage}
          className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm bg-white"
        >
          <List size={16} className="text-gray-500" /> Dynamic Image
        </button>
        <button
          onClick={handleAddGroup}
          className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm bg-white"
        >
          <FolderTree size={16} /> Group (Layout)
        </button>
      </div>
    </section>
  );
};

export default AddLayerButtons;
