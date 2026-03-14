import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom"; // Gộp import
import {
  Sparkles,
  ShoppingBag,
  Zap,
  ShieldCheck,
  RotateCcw,
} from "lucide-react";
import axiosClient from "../../api/axiosClient";
import type { Product } from "../../types/product";

import ProductRow from "../../components/ProductRow";
import { Button } from "@/components/ui/button";

const HomePage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axiosClient.get("/products");
        setProducts(response.data.data || response.data);
      } catch (error) {
        console.error("Lỗi khi lấy sản phẩm:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  return (
    <div className="min-h-screen bg-[#fcfcfd]">
      {/* SECTION 1: HERO - Giảm padding dưới */}
      <section className="relative overflow-hidden bg-slate-900 pt-12 pb-16 lg:pt-24 lg:pb-24">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col lg:flex-row items-center gap-10 relative z-10">
          <div className="flex-1 text-center lg:text-left space-y-6">
            <h1 className="text-5xl lg:text-7xl font-black text-white leading-[1.1] tracking-tight">
              Biến ý tưởng thành <br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-emerald-400">
                Quà tặng cá nhân
              </span>
            </h1>
            <p className="text-slate-400 text-lg lg:text-xl max-w-2xl font-medium">
              Tự tay thiết kế những món quà độc bản cho người thân yêu. Công
              nghệ in ấn đỉnh cao, giao hàng thần tốc trong 24h.
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
            <div className="relative z-10 rounded-[2rem] overflow-hidden shadow-2xl border-8 border-slate-800/50 transform lg:rotate-3 transition-transform hover:rotate-0 duration-500 bg-slate-800">
              <img
                src="https://images.unsplash.com/photo-1513201099705-a9746e1e201f?q=80&w=1974&auto=format&fit=crop"
                alt="Personalized Gifts"
                className="w-full h-full object-cover aspect-4/3 block"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://images.unsplash.com/photo-1549465220-1d8c9d9c6703?q=80&w=2070&auto=format&fit=crop";
                }}
              />
            </div>
            {/* Badge đơn hàng */}
            <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-xl z-20 hidden lg:block border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                  <ShoppingBag size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    +10k Đơn hàng
                  </p>
                  <p className="text-[10px] text-slate-500 italic">Tháng này</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: TRUST BAR - Giảm padding */}
      <section className="py-8 border-b border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex items-center gap-3 group">
            <Zap
              className="text-amber-500 group-hover:scale-110 transition-transform"
              size={20}
            />
            <span className="font-bold text-slate-700 text-sm">
              Giao hàng 24h
            </span>
          </div>
          <div className="flex items-center gap-3 group">
            <ShieldCheck
              className="text-blue-500 group-hover:scale-110 transition-transform"
              size={20}
            />
            <span className="font-bold text-slate-700 text-sm">
              Bảo mật thanh toán
            </span>
          </div>
          <div className="flex items-center gap-3 group">
            <RotateCcw
              className="text-emerald-500 group-hover:scale-110 transition-transform"
              size={20}
            />
            <span className="font-bold text-slate-700 text-sm">
              Đổi trả 7 ngày
            </span>
          </div>
          <div className="flex items-center gap-3 group">
            <Sparkles
              className="text-purple-500 group-hover:scale-110 transition-transform"
              size={20}
            />
            <span className="font-bold text-slate-700 text-sm">
              Thiết kế độc quyền
            </span>
          </div>
        </div>
      </section>

      {/* SECTION 3: BENTO - Giảm py-24 xuống py-16 */}
      <section className="py-16 max-w-7xl mx-auto px-6">
        <div className="text-center mb-10 space-y-2">
          <h2 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
            Khám phá danh mục
          </h2>
          <p className="text-slate-500 font-medium text-sm">
            Tìm kiếm cảm hứng cho món quà hoàn hảo của bạn
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-130">
          <Link
            to="/products?cat=mug"
            className="md:col-span-2 md:row-span-2 relative group overflow-hidden rounded-[1.5rem] bg-slate-100"
          >
            <img
              src="https://images.unsplash.com/photo-1514228742587-6b1558fbed20?q=80&w=2070&auto=format&fit=crop"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              alt="Cốc sứ"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent flex flex-col justify-end p-6 text-white">
              <h3 className="text-xl font-bold">Cốc sứ thiết kế</h3>
              <p className="text-xs opacity-80">
                Khởi đầu ngày mới đầy năng lượng
              </p>
            </div>
          </Link>
          <Link
            to="/products?cat=shirt"
            className="md:col-span-2 relative group overflow-hidden rounded-[1.5rem] bg-slate-100"
          >
            <img
              src="https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=2070&auto=format&fit=crop"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              alt="Áo thun"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent flex flex-col justify-end p-6 text-white">
              <h3 className="text-xl font-bold">Thời trang POD</h3>
            </div>
          </Link>
          <Link
            to="/products?cat=decor"
            className="relative group overflow-hidden rounded-[1.5rem] bg-slate-100"
          >
            <img
              src="https://images.unsplash.com/photo-1513519245088-0e12902e35ca?q=80&w=2070&auto=format&fit=crop"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              alt="Tranh"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent p-4 flex items-end">
              <h3 className="text-lg font-bold text-white">Tranh treo tường</h3>
            </div>
          </Link>
          <Link
            to="/products?cat=keychain"
            className="relative group overflow-hidden rounded-[1.5rem] bg-slate-100"
          >
            <img
              src="https://images.unsplash.com/photo-1629131726692-1accd0c53ce0?q=80&w=2070&auto=format&fit=crop"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              alt="Móc khóa"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent p-4 flex items-end">
              <h3 className="text-lg font-bold text-white">Phụ kiện nhỏ</h3>
            </div>
          </Link>
        </div>
      </section>

      {/* SECTION 4 */}
      <div className="space-y-8 pb-16">
        <ProductRow
          title="🔥 Đang thịnh hành"
          linkTo="/products"
          products={products.slice(0, 5)}
          loading={loading}
        />

        {/* CTA PARTNER - Giảm py-24 my-20 xuống py-16 my-12 */}
        <div className="bg-linear-to-r from-slate-900 via-blue-950 to-slate-900 py-16 my-12 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-30 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
            <div className="text-center md:text-left space-y-3">
              <h2 className="text-3xl lg:text-5xl font-black text-white leading-tight tracking-tighter italic">
                Đồng hành cùng <span className="text-blue-400">GiftShop</span>
              </h2>
              <p className="text-slate-400 text-base font-medium max-w-xl">
                Trở thành người bán hoặc đối tác vận chuyển để gia tăng thu nhập
                ngay hôm nay.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              <Button
                size="lg"
                onClick={() => navigate("/register-seller")}
                className="bg-white text-blue-900 hover:bg-slate-100 rounded-full h-14 px-8 text-base font-black shadow-xl transition-all hover:scale-105"
              >
                Trở thành Seller
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/register-shipper")}
                className="bg-white text-blue-900 hover:bg-slate-100 rounded-full h-14 px-8 text-base font-black shadow-xl transition-all hover:scale-105"
              >
                Trở thành Shipper
              </Button>
            </div>
          </div>
        </div>

        <ProductRow
          title="🆕 Sản phẩm mới nhất"
          linkTo="/products?sort=new"
          products={[...products].reverse().slice(0, 5)}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default HomePage;
