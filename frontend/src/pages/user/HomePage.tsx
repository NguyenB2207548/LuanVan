// src/pages/HomePage.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import type { Product } from "../../types/product";

import ProductRow from "../../components/ProductRow";

import HeroBannerImg from "../../assets/hero_banner.png";

const HomePage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axiosClient.get("/products");
        setProducts(response.data);
      } catch (error) {
        console.error("Lỗi khi lấy sản phẩm:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const featuredProducts = products.slice(0, 5);
  const newProducts = [...products].reverse().slice(0, 5);
  const bestSellerProducts =
    products.length > 5 ? products.slice(2, 7) : products.slice(0, 5);

  return (
    <div className="min-h-screen bg-white font-sans pb-12">
      <section className="bg-white border-b border-gray-100 pb-12 w-full">
        <div className="w-full mb-10">
          <img
            src={HeroBannerImg}
            alt="Gift Shop Banner"
            className="w-full h-auto object-contain block"
          />
        </div>

        <div className="flex justify-center px-4 w-full">
          <Link
            to="/products"
            className="inline-flex items-center gap-2.5 bg-gray-950 text-white px-10 py-4 rounded-full font-bold text-base hover:bg-gray-800 transition-colors shadow-md"
          >
            Khám phá ngay
          </Link>
        </div>
      </section>
      {/* DANH SÁCH 1: NỔI BẬT */}
      <ProductRow
        title="Sản phẩm nổi bật"
        linkTo="/products"
        products={featuredProducts}
        loading={loading}
      />

      {/* DANH SÁCH 2: HÀNG MỚI VỀ */}
      <div className="bg-gray-50/50">
        <ProductRow
          title="Sản phẩm mới ra mắt"
          linkTo="/products?sort=new"
          products={newProducts}
          loading={loading}
        />
      </div>

      {/* DANH SÁCH 3: BÁN CHẠY */}
      <ProductRow
        title="Quà tặng bán chạy"
        linkTo="/products?sort=bestseller"
        products={bestSellerProducts}
        loading={loading}
      />
    </div>
  );
};

export default HomePage;
