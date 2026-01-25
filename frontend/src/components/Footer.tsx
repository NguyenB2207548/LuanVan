import React from "react";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="col-span-1 md:col-span-1">
          <h3 className="text-white font-bold text-lg mb-4">GiftShop POD</h3>
          <p className="text-sm leading-relaxed">
            Nền tảng quà tặng tùy chỉnh hàng đầu. Biến những kỷ niệm của bạn
            thành những món quà độc bản.
          </p>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-4">Liên kết</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <a href="#" className="hover:text-white transition">
                Về chúng tôi
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-white transition">
                Chính sách bảo mật
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-white transition">
                Điều khoản dịch vụ
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-4">Hỗ trợ</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <a href="#" className="hover:text-white transition">
                Trung tâm trợ giúp
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-white transition">
                Vận chuyển & Trả hàng
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-white transition">
                Liên hệ: 0123 456 789
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-4">Đăng ký nhận tin</h4>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="Email của bạn"
              className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm w-full outline-none focus:border-indigo-500"
            />
            <button className="bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700">
              Gửi
            </button>
          </div>
        </div>
      </div>
      <div className="border-t border-gray-800 mt-10 pt-6 text-center text-xs">
        © 2026 GiftShop. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
