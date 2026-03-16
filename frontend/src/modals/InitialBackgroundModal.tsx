import React from "react";
import { Image as ImageIcon, Monitor, X } from "lucide-react";

interface InitialBackgroundModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectNenTrang: () => void;
  onSelectMockup: () => void;
}

const InitialBackgroundModal: React.FC<InitialBackgroundModalProps> = ({
  isOpen,
  onClose,
  onSelectNenTrang,
  onSelectMockup,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 relative">
        {/* Nút đóng góc trên */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1"
        >
          <X size={20} />
        </button>

        <div className="p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-2 text-center">
            Bắt đầu thiết kế mới
          </h2>
          <p className="text-gray-500 text-sm text-center mb-8">
            Chọn không gian làm việc để bắt đầu tạo artwork
          </p>

          <div className="grid grid-cols-1 gap-4">
            {/* Lựa chọn 1: Nền trắng */}
            <button
              onClick={onSelectNenTrang}
              className="flex items-center gap-4 p-5 border-2 border-gray-100 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group text-left"
            >
              <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                <Monitor
                  className="text-gray-500 group-hover:text-blue-600"
                  size={28}
                />
              </div>
              <div>
                <div className="font-bold text-gray-800 text-base">
                  Nền trắng (1:1)
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Thiết kế tự do trên khung hình chuẩn
                </div>
              </div>
            </button>

            {/* Lựa chọn 2: Dùng Mockup */}
            <button
              onClick={onSelectMockup}
              className="flex items-center gap-4 p-5 border-2 border-gray-100 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group text-left"
            >
              <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                <ImageIcon
                  className="text-gray-500 group-hover:text-blue-600"
                  size={28}
                />
              </div>
              <div>
                <div className="font-bold text-gray-800 text-base">
                  Dùng Mockup căn chỉnh
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Chọn phôi sản phẩm để làm nền tạm
                </div>
              </div>
            </button>
          </div>

          <button
            onClick={onClose}
            className="mt-6 w-full text-gray-400 text-sm font-medium hover:text-gray-600 transition-colors"
          >
            Hủy bỏ
          </button>
        </div>
      </div>
    </div>
  );
};

export default InitialBackgroundModal;
