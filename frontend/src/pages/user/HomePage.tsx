import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Sparkles,
  Zap,
  ShieldCheck,
} from "lucide-react";
import axiosClient from "../../api/axiosClient";
import type { Product } from "../../types/product";

import ProductRow from "../../components/user/ProductRow";
import { Button } from "@/components/ui/button";

import mugImg from "../../assets/ly-su.jpg";
import fashionImg from "../../assets/photo-1521572267360-ee0c2909d518.avif";
import crochetImg from "../../assets/crochet.jpg";
import ornamentImg from "../../assets/qua-tang.jpg";

import giftBanner from "../../assets/photo-1513201099705-a9746e1e201f.avif";
import cubes from "../../assets/cubes.png";

import { useAuthStore } from "@/store/useAuthStore";

const HomePage = () => {
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
  const [latestProducts, setLatestProducts] = useState<Product[]>([]);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [loadingLatest, setLoadingLatest] = useState(true);
  const navigate = useNavigate();

  // 1. Lấy trạng thái từ store (đặt ở đầu component HomePage)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // 2. Hàm xử lý điều hướng chung
  const handlePartnerRegister = (targetPath: string) => {
    if (!isAuthenticated) {
      // Nếu chưa đăng nhập, lưu lại trang hiện tại (/) để sau khi login nó quay lại đây
      navigate("/login", { state: { from: "/" } });
    } else {
      navigate(targetPath);
    }
  };

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const response = await axiosClient.get("/products/trending");
        setTrendingProducts(response.data.data || response.data);
      } catch (error) {
        console.error("Lỗi khi lấy sản phẩm thịnh hành:", error);
      } finally {
        setLoadingTrending(false);
      }
    };

    // Lấy sản phẩm mới nhất
    const fetchLatest = async () => {
      try {
        const response = await axiosClient.get("/products/latest");
        setLatestProducts(response.data.data || response.data);
      } catch (error) {
        console.error("Lỗi khi lấy sản phẩm mới nhất:", error);
      } finally {
        setLoadingLatest(false);
      }
    };

    fetchTrending();
    fetchLatest();
  }, []);

  return (
    <div className="min-h-screen bg-[#fcfcfd]">
      {/* SECTION 1: HERO */}
      <section className="relative overflow-hidden bg-slate-900 pt-12 pb-16 lg:pt-24 lg:pb-24">
        <div
          className="absolute inset-0 opacity-20"
          style={{ backgroundImage: `url(${cubes})` }}
        ></div>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col lg:flex-row items-center gap-10 relative z-10">
          <div className="flex-1 text-center lg:text-left space-y-6">
            <h1 className="text-5xl lg:text-7xl font-black text-white leading-[1.1] tracking-tight">
              <span className="whitespace-nowrap">Gửi tâm tình qua</span>
              <br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-emerald-400">
                từng món quà
              </span>
            </h1>
            <p className="text-slate-400 text-lg lg:text-xl max-w-2xl font-medium">
              Tự tay thiết kế những món quà độc bản cho người thân yêu, giao hàng thần tốc trong 24h.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              <Button
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-10 h-14 text-lg font-bold shadow-xl shadow-blue-500/20"
                asChild
              >
                <Link to="/products">Xem bộ sưu tập</Link>
              </Button>
            </div>
          </div>

          <div className="flex-1 relative">
            <div className="relative z-10 rounded-[2rem] overflow-hidden shadow-2xl border-8 border-slate-800/50 bg-slate-800">
              <img
                src={giftBanner}
                alt="Personalized Gifts"
                className="w-full h-full object-cover aspect-4/3 block"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: TRUST BAR */}
      <section className="py-8 border-b border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex items-center gap-3 group">
            <Zap className="text-amber-500 group-hover:scale-110 transition-transform" size={20} />
            <span className="font-bold text-slate-700 text-sm">Giao hàng 24h</span>
          </div>
          <div className="flex items-center gap-3 group">
            <ShieldCheck className="text-blue-500 group-hover:scale-110 transition-transform" size={20} />
            <span className="font-bold text-slate-700 text-sm">Bảo mật thanh toán</span>
          </div>
          <div className="flex items-center gap-3 group">
            <Sparkles className="text-emerald-500 group-hover:scale-110 transition-transform" size={20} />
            <span className="font-bold text-slate-700 text-sm">Chăm chút từng chi tiết</span>
          </div>
          <div className="flex items-center gap-3 group">
            <ShieldCheck className="text-emerald-500 group-hover:scale-110 transition-transform" size={20} />
            <span className="font-bold text-slate-700 text-sm">Chất lượng chuẩn mẫu</span>
          </div>
        </div>
      </section>

      {/* SECTION 3: BENTO */}
      <section className="py-16 max-w-7xl mx-auto px-6">
        <div className="text-center mb-10 space-y-2">
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900">Khám phá danh mục</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-130">
          <div className="md:col-span-2 md:row-span-2 relative group overflow-hidden rounded-[1.5rem] bg-slate-100">
            <img src={mugImg} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Cốc sứ" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-6 text-white">
              <h3 className="text-xl font-bold">Cốc sứ thiết kế</h3>
              <p className="text-xs opacity-80">Khởi đầu ngày mới đầy năng lượng</p>
            </div>
          </div>
          <div className="md:col-span-2 relative group overflow-hidden rounded-[1.5rem] bg-slate-100">
            <img src={fashionImg} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Thời trang" />
            <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent flex flex-col justify-end p-6 text-white">
              <h3 className="text-xl font-bold">Thời trang</h3>
              <p className="text-xs opacity-80">Phong cách cá nhân hóa</p>
            </div>
          </div>
          <div className="relative group overflow-hidden rounded-[1.5rem] bg-slate-100">
            <img src={crochetImg} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Crochet" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent p-4 flex flex-col justify-end text-white">
              <h3 className="text-lg font-bold">Đồ len thủ công</h3>
              <p className="text-[10px] opacity-80">Tỉ mỉ từng mũi đan</p>
            </div>
          </div>
          <div className="relative group overflow-hidden rounded-[1.5rem] bg-slate-100">
            <img src={ornamentImg} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Quà tặng" />
            <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent p-4 flex flex-col justify-end text-white">
              <h3 className="text-lg font-bold">Đồ trang trí</h3>
              <p className="text-[10px] opacity-80">Làm đẹp không gian</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: PRODUCT ROWS */}
      <div className="space-y-8 pb-16">
        <ProductRow
          title="Đang thịnh hành"
          linkTo="/products"
          products={trendingProducts}
          loading={loadingTrending}
        />

        {/* CTA PARTNER */}
        <div className="bg-linear-to-r from-slate-900 via-blue-950 to-slate-900 py-16 my-12 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-30 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
            <div className="text-center md:text-left space-y-3">
              <h2 className="text-3xl lg:text-5xl font-black text-white leading-tight tracking-tighter">
                Đồng hành cùng <span className="text-blue-400">GiftShop</span>
              </h2>
              <p className="text-slate-400 text-base font-medium max-w-xl">
                Trở thành người bán hoặc đối tác vận chuyển để tăng thu nhập ngay.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              <Button
                size="lg"
                onClick={() => handlePartnerRegister("/register-seller")}
                className="bg-white text-blue-900 hover:bg-slate-100 rounded-full h-14 px-8 text-base font-bold transition-all hover:scale-105"
              >
                Trở thành Seller
              </Button>

              <Button
                size="lg"
                variant="outline"
                onClick={() => handlePartnerRegister("/register-shipper")}
                className="bg-white text-blue-900 hover:bg-slate-100 rounded-full h-14 px-8 text-base font-bold transition-all hover:scale-105"
              >
                Trở thành Shipper
              </Button>
            </div>
          </div>
        </div>

        <ProductRow
          title="Sản phẩm mới nhất"
          linkTo="/products"
          products={latestProducts}
          loading={loadingLatest}
        />
      </div>
    </div>
  );
};

export default HomePage;