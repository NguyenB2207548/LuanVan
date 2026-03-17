export interface Image {
  id: number;
  url: string;
  ownerType: "product" | "variant" | "category" | "review";
  ownerId: number;
  isPrimary: boolean;
  createdAt: string;
}

export interface Price {
  id: number;
  amount: string | number;
  currency: string;
  priceType: "sale" | "original" | "discount";
  effectiveDate: string;
}

export interface AttributeValue {
  id: number;
  valueName: string;
}

export interface Attribute {
  id: number;
  attributeName: string;
  createdAt: string;
  updatedAt: string;
}

export interface Variant {
  id: number;
  stock: number;
  attributeValues: AttributeValue[];
  price: number;
  images: Image[]; // Ảnh riêng của từng biến thể
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  some(arg0: (cat: any) => boolean): boolean;
  id: number;
  categoryName: string;
  status: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: number;
  productName: string;
  stock: number;
  status: string;
  description: string | null;
  categories: Category[];
  variants: Variant[];
  attributes: Attribute[];
  images: Image[]; // Ảnh chung của sản phẩm
  createdAt: string;
  updatedAt: string;
}
