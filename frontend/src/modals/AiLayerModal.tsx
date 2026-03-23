import React, { useState } from "react";
import { X, Sparkles, Loader2, Check, Wand2, ImageIcon } from "lucide-react";
import axiosClient from "../api/axiosClient";

interface AiLayerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (aiLayers: any[]) => void;
}

const AiLayerModal: React.FC<AiLayerModalProps> = ({ isOpen, onClose, onApply }) => {
    const [file, setFile] = useState<File | null>(null);
    const [numLayers, setNumLayers] = useState(4);
    const [prompt, setPrompt] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    if (!isOpen) return null;

    const handleProcess = async () => {
        if (!file) return alert("Vui lòng chọn ảnh");

        setLoading(true);
        const formData = new FormData();

        // QUAN TRỌNG: Key phải khớp 100% với Backend Controller
        formData.append("image", file);        // Đổi từ "file" thành "image"
        formData.append("num_layers", String(numLayers)); // Đổi từ "numLayers" thành "num_layers"
        formData.append("prompt", prompt);

        try {
            const res = await axiosClient.post("/ai-design/separate", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setResult(res.data);
        } catch (error: any) {
            // Log chi tiết lỗi từ server trả về để dễ debug
            console.error("AI Error Details:", error.response?.data);
            alert(error.response?.data?.message || "Lỗi xử lý AI");
        } finally {
            setLoading(false);
        }
    };
    const handleApply = () => {
        if (!result || !result.layers) return;

        // Giả sử chúng ta muốn toàn bộ cụm layer AI này chỉ chiếm 60% Canvas
        const scaleDown = 0.6;
        const targetSize = 650 * scaleDown; // = 390px

        const formattedLayers = result.layers.map((l: any, index: number) => ({
            id: `ai_${Date.now()}_${index}`,
            type: "static_image",
            label: l.label,
            image_url: l.publicUrl,
            url: l.publicUrl,
            // Đặt vào giữa Canvas
            x: (650 - targetSize) / 2,
            y: (650 - targetSize) / 2,
            width: targetSize,
            height: targetSize,
            zIndex: index,
            visible: true,
            opacity: 1,
        }));

        onApply(formattedLayers);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white w-full max-w-4xl rounded-lg shadow-2xl flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-4 border-b flex justify-between items-center bg-gradient-to-r from-purple-50 to-blue-50">
                    <h2 className="font-bold flex items-center gap-2 text-purple-700 uppercase text-sm">
                        <Sparkles size={18} /> AI Layer Separator
                    </h2>
                    <button onClick={onClose} className="hover:bg-gray-200 p-1 rounded-full"><X size={20} /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 flex gap-6">
                    {/* Left Side: Config */}
                    <div className="w-1/3 space-y-4 border-r pr-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-600">CHỌN ẢNH GỐC</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                                className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-600">SỐ LỚP AI TÁCH (2-8)</label>
                            <input
                                type="range" min="2" max="8" value={numLayers}
                                onChange={(e) => setNumLayers(Number(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                            />
                            <div className="text-center font-bold text-purple-600">{numLayers} Layers</div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-600">AI PROMPT (TÙY CHỌN)</label>
                            <textarea
                                className="w-full p-2 border text-sm rounded h-24 outline-none focus:border-purple-500"
                                placeholder=""
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                            />
                        </div>

                        <button
                            onClick={handleProcess}
                            disabled={loading || !file}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded flex items-center justify-center gap-2 disabled:bg-gray-300 transition-all shadow-lg"
                        >
                            {loading ? <Loader2 className="animate-spin" size={18} /> : <Wand2 size={18} />}
                            BẮT ĐẦU TÁCH LỚP
                        </button>
                    </div>

                    {/* Right Side: Result Preview */}
                    <div className="flex-1 bg-gray-50 rounded-lg p-4 border border-dashed flex flex-col items-center justify-center min-h-[400px]">
                        {loading ? (
                            <div className="flex flex-col items-center gap-4">
                                <Loader2 size={48} className="animate-spin text-purple-500" />
                                <p className="text-sm font-medium animate-pulse text-gray-500">AI đang phân tích và tách lớp...</p>
                            </div>
                        ) : result ? (
                            <div className="grid grid-cols-3 gap-3 w-full">
                                {result.layers.map((l: any, idx: number) => (
                                    <div key={idx} className="bg-white p-2 border rounded shadow-sm relative group">
                                        <img src={`http://localhost:3000${l.publicUrl}`} className="w-full aspect-square object-contain bg-gray-200 rounded" alt="layer" />
                                        <span className="text-[10px] block mt-1 text-center font-medium truncate">{l.label}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-gray-400 text-center">
                                <ImageIcon size={48} className="mx-auto mb-2 opacity-20" />
                                <p className="text-sm">Kết quả bóc tách sẽ hiển thị tại đây</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium">Hủy</button>
                    <button
                        disabled={!result}
                        onClick={handleApply}
                        className="px-6 py-2 bg-blue-600 text-white rounded text-sm font-bold flex items-center gap-2 disabled:bg-gray-300"
                    >
                        <Check size={18} /> ÁP DỤNG VÀO THIẾT KẾ
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AiLayerModal;