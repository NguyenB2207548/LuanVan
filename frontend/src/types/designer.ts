export type LayerType = "text" | "upload" | "dynamic_image" | "group";

export interface LayerOption {
  id: string;
  name: string;
  image_url?: string;
}

export interface DesignLayer {
  id: string;
  type: LayerType;
  label: string;
  zIndex: number;
  show_condition?: string;

  // Thuộc tính tọa độ / kích thước
  x?: number;
  y?: number;
  width?: number;
  height?: number;

  // Thuộc tính Text
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  color?: string;

  // Thuộc tính Image / Group
  image_url?: string;
  options?: LayerOption[];
}

export interface ModalTarget {
  type: "background" | "dynamic_image" | "group_option";
  index?: number;
}
