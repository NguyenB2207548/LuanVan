export interface Attribute {
  id: number;
  name: string; // VD: "Màu sắc", "Kích thước"
}

export interface Variant {
  id: number;
  price: number;
  stock: number;
}

export interface Product {
  id: number;
  productName: string;
  description: string;
  status: string;
  attributes: Attribute[];
  variants: Variant[];
}
