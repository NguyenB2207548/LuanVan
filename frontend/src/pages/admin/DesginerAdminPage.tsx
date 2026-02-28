import React, { useState, useRef } from "react";
import axiosClient from "../../api/axiosClient";
import DesignerCanvas from "../../components/admin/DesignerCanvas";
import DesignerControlPanel from "../../components/admin/DesignerControlPanel";

const uploadSingleFile = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("files", file);
  const res = await axiosClient.post("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.urls[0];
};

const DesignerAdminPage = () => {
  const [backgroundUrl, setBackgroundUrl] = useState<string>("");
  const [layers, setLayers] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [designName, setDesignName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>("ALL");

  const [isExtractingPsd, setIsExtractingPsd] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // === XỬ LÝ UPLOAD VÀO CANVAS BẰNG INPUT ẨN ===
  const handleStageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !selectedId) return;

    setIsUploading(true);
    const uploadedOptions: any[] = [];
    for (let i = 0; i < files.length; i++) {
      try {
        const url = await uploadSingleFile(files[i]);
        uploadedOptions.push({
          id: `opt_${Date.now()}_${i}`,
          name: files[i].name,
          image_url: url,
        });
      } catch (err) {
        console.error("Upload error", files[i].name);
      }
    }

    if (uploadedOptions.length > 0) {
      setLayers(
        layers.map((l) =>
          l.id === selectedId
            ? {
                ...l,
                options: [...l.options, ...uploadedOptions],
                image_url: uploadedOptions[0].image_url,
              }
            : l,
        ),
      );
    }
    setIsUploading(false);
  };

  const updateSelectedLayer = (field: string, value: string | number) => {
    setLayers(
      layers.map((l) => (l.id === selectedId ? { ...l, [field]: value } : l)),
    );
  };

  const handleCreateDesign = async (data: any) => {
    try {
      await axiosClient.post("/designs", data);
      alert("Design created successfully!");
    } catch (err: any) {
      alert("Error creating design: " + err.message);
    }
  };

  const handlePsdUpload = async (file: File) => {
    if (!file) return;

    // Cảnh báo nếu đang vẽ dở
    if (layers.length > 0 || backgroundUrl) {
      const confirm = window.confirm(
        "Importing a PSD will clear your current canvas. Do you want to proceed?",
      );
      if (!confirm) return;
    }

    setIsExtractingPsd(true);
    try {
      // Bước 1: Upload file PSD lên thư mục public/uploads/psd
      const formData = new FormData();
      formData.append("file", file); // Chú ý: Backend cần 1 API upload riêng cho PSD lưu vào thư mục psd, hoặc dùng API upload chung nhưng xử lý để nó trả về tên file. Giả sử ta dùng 1 API upload psd riêng:

      const uploadRes = await axiosClient.post("/upload/psd", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const psdFileName = uploadRes.data.fileName; // Backend phải trả về tên file

      // Bước 2: Gọi công cụ trích xuất
      const extractRes = await axiosClient.post("/psd/extract-psd", {
        fileName: psdFileName,
      });

      const extractedData = extractRes.data.data;

      // Bước 3: Đổ dữ liệu lên giao diện
      setBackgroundUrl(extractedData.background || "");
      setLayers(extractedData.details || []);

      // Lấy tên file làm tên design mặc định
      if (!designName) {
        setDesignName(file.name.replace(".psd", ""));
      }

      alert("PSD Extracted Successfully! You can now edit the layers.");
    } catch (err: any) {
      console.error("PSD Extract Error:", err);
      alert(err.response?.data?.message || "Failed to extract PSD.");
    } finally {
      setIsExtractingPsd(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans text-gray-800 flex-row">
      {/* Input ẩn dùng chung để upload ảnh vào các layer */}
      <input
        type="file"
        hidden
        multiple
        ref={fileInputRef}
        onChange={handleStageUpload}
      />
      <input
        type="file"
        hidden
        accept=".psd"
        id="hidden-psd-input"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handlePsdUpload(e.target.files[0]);
            e.target.value = ""; // Reset input
          }
        }}
      />
      {/* CANVAS*/}
      <DesignerCanvas
        backgroundUrl={backgroundUrl}
        layers={layers}
        setLayers={setLayers}
        selectedId={selectedId}
        setSelectedId={setSelectedId}
        // fileInputRef={fileInputRef}
        isUploading={isUploading}
        updateSelectedLayer={updateSelectedLayer}
        activeFilter={activeFilter}
      />

      {/*  BẢNG ĐIỀU KHIỂN */}
      <DesignerControlPanel
        designName={designName}
        setDesignName={setDesignName}
        backgroundUrl={backgroundUrl}
        setBackgroundUrl={setBackgroundUrl}
        layers={layers}
        setLayers={setLayers}
        selectedId={selectedId}
        setSelectedId={setSelectedId}
        updateSelectedLayer={updateSelectedLayer}
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
        onSave={handleCreateDesign}
        isExtractingPsd={isExtractingPsd}
        // fileInputRef={fileInputRef}
      />
    </div>
  );
};

export default DesignerAdminPage;
