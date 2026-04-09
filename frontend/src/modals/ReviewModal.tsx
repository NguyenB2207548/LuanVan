import React, { useState } from "react";
import { X, Star, Loader2 } from "lucide-react";
import axiosClient from "@/api/axiosClient";
import toast from "react-hot-toast";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  productInfo: {
    id: number;
    name: string;
    image: string;
    variantName: string;
  } | null;
  onSuccess: () => void;
}

const ReviewModal = ({
  isOpen,
  onClose,
  productInfo,
  onSuccess,
}: ReviewModalProps) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [hover, setHover] = useState(0);

  if (!isOpen || !productInfo) return null;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await axiosClient.post("/reviews", {
        productId: productInfo.id,
        rating,
        comment,
      });
      toast.success("Cảm ơn bạn đã đánh giá sản phẩm!");
      onSuccess();
      onClose();
      // Reset form
      setRating(5);
      setComment("");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Không thể gửi đánh giá");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-lg shadow-xl overflow-hidden font-sans text-gray-800">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-lg">Đánh giá sản phẩm</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-black">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Thông tin sản phẩm đang đánh giá */}
          <div className="flex gap-4 items-center bg-gray-50 p-3 rounded-md">
            <img
              src={productInfo.image}
              className="w-12 h-12 object-cover rounded border"
              alt=""
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">
                {productInfo.name}
              </p>
              <p className="text-xs text-gray-500">{productInfo.variantName}</p>
            </div>
          </div>

          {/* Chọn số sao */}
          <div className="text-center space-y-3">
            <p className="text-sm font-medium text-gray-600">
              Vui lòng chọn mức độ hài lòng
            </p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHover(star)}
                  onMouseLeave={() => setHover(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    size={32}
                    fill={(hover || rating) >= star ? "#EAB308" : "none"}
                    className={
                      (hover || rating) >= star
                        ? "text-yellow-500"
                        : "text-gray-300"
                    }
                  />
                </button>
              ))}
            </div>
            <p className="text-xs font-bold text-yellow-600 uppercase">
              {rating === 1 && "Rất tệ"}
              {rating === 2 && "Không hài lòng"}
              {rating === 3 && "Bình thường"}
              {rating === 4 && "Hài lòng"}
              {rating === 5 && "Tuyệt vời"}
            </p>
          </div>

          {/* Nội dung bình luận */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Chia sẻ trải nghiệm của bạn
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Sản phẩm rất đẹp, đóng gói cẩn thận..."
              className="w-full min-h-[100px] p-3 text-sm border border-gray-200 rounded-md outline-none focus:border-gray-400 transition-colors resize-none"
            />
          </div>
        </div>

        <div className="p-6 pt-0 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-medium border border-gray-200 rounded-md hover:bg-gray-50"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 py-2.5 text-sm font-bold bg-black text-white rounded-md hover:bg-gray-800 disabled:bg-gray-400 flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 size={16} className="animate-spin" />}
            Gửi đánh giá
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;
