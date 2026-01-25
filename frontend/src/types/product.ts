export interface Product {
  id: number;
  productName: string;
  description: string;
  price?: number; // Giá từ variant thấp nhất
  imageUrl?: string;
}
