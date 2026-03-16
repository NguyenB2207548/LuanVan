export type LayerType =
  | "text"
  | "upload"
  | "dynamic_image"
  | "group"
  | "static_image"
  | "dynamic_text";

export interface LayerOption {
  id: string;
  name: string;
  image_url?: string;
}

// export interface DesignLayer {
//   id: string;
//   type: LayerType;
//   label: string;
//   zIndex: number;
//   x: number;
//   y: number;
//   width?: number;
//   height?: number;
//   url?: string; // <--- Đảm bảo có dòng này
//   text?: string;
//   fontSize?: number;
//   fill?: string;
//   show_condition?: string;
//   options?: any[];
// }

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
  type: "background" | "dynamic_image" | "group_option" | "static_image";
  index?: number;
}

export interface CreateDesignPayload {
  name: string;
  productId: number;
  artworks: {
    templateId: number; // ID của Artwork mẫu mà bạn đã tạo ở các bước trước
    templateJson: any; // Chứa details (layers), printArea, internalMockup
    thumbnailUrl: string;
  }[];
}
