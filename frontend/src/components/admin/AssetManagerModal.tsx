import React, { useState, useEffect, useRef } from "react";
import { X, UploadCloud, CheckCircle2, Loader2, ImageIcon } from "lucide-react";
import axiosClient from "../../api/axiosClient";

const BASE_URL = "http://localhost:3000";

interface AssetManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (urls: string[]) => void;
  multiple?: boolean;
}

const AssetManagerModal: React.FC<AssetManagerModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  multiple = false,
}) => {
  const [images, setImages] = useState<string[]>([]);
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lấy danh sách ảnh từ Server khi mở Modal
  useEffect(() => {
    if (isOpen) {
      fetchAssets();
      setSelectedUrls([]); // Reset lựa chọn cũ
    }
  }, [isOpen]);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get("upload/assets");
      setImages(res.data.data || []);
    } catch (error) {
      console.error("Lỗi khi tải thư viện ảnh:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
    }

    try {
      // THÊM ?folder=assets VÀO URL
      const res = await axiosClient.post("/upload?folder=assets", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const newUrls = res.data.urls;
      setImages((prev) => [...newUrls, ...prev]);

      if (multiple) {
        setSelectedUrls((prev) => [...prev, ...newUrls]);
      } else {
        setSelectedUrls([newUrls[0]]);
      }
    } catch (error) {
      alert("Lỗi khi tải ảnh lên!");
    } finally {
      setUploading(false);
    }
  };

  const toggleSelect = (url: string) => {
    if (multiple) {
      if (selectedUrls.includes(url)) {
        setSelectedUrls(selectedUrls.filter((u) => u !== url));
      } else {
        setSelectedUrls([...selectedUrls, url]);
      }
    } else {
      setSelectedUrls([url]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-[800px] max-w-[90vw] h-[600px] max-h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h2 className="text-lg font-bold text-gray-800">
            Media Library (Assets)
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-200 rounded-full text-gray-500"
          >
            <X size={20} />
          </button>
        </div>

        {/* TOOLBAR */}
        <div className="px-6 py-3 border-b border-gray-100 flex items-center gap-4">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded font-medium text-sm hover:bg-blue-700 transition disabled:bg-blue-400"
          >
            {uploading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <UploadCloud size={16} />
            )}
            Upload
          </button>
          <input
            type="file"
            hidden
            multiple
            ref={fileInputRef}
            onChange={handleUpload}
            accept="image/*"
          />
        </div>

        {/* IMAGE GRID */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="animate-spin text-blue-500" size={32} />
            </div>
          ) : images.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <ImageIcon size={48} className="mb-2 opacity-50" />
              <p>No assets found. Upload some images!</p>
            </div>
          ) : (
            <div className="grid grid-cols-5 md:grid-cols-6 gap-4">
              {images.map((url, idx) => {
                const isSelected = selectedUrls.includes(url);
                return (
                  <div
                    key={idx}
                    onClick={() => toggleSelect(url)}
                    className={`relative aspect-square rounded-lg border-2 cursor-pointer bg-white overflow-hidden transition-all hover:shadow-md ${
                      isSelected
                        ? "border-blue-500 ring-2 ring-blue-200"
                        : "border-gray-200"
                    }`}
                  >
                    <img
                      src={url.startsWith("http") ? url : `${BASE_URL}${url}`}
                      alt="asset"
                      className="w-full h-full object-contain p-1"
                    />
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-0.5">
                        <CheckCircle2 size={16} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center bg-white">
          <span className="text-sm text-gray-500 font-medium">
            {selectedUrls.length} image(s) selected
          </span>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onSelect(selectedUrls);
                onClose();
              }}
              disabled={selectedUrls.length === 0}
              className="px-6 py-2 bg-green-600 text-white rounded font-medium text-sm hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Insert Image(s)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssetManagerModal;
