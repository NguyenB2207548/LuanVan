import React, { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { Stage, Layer, Image as KonvaImage, Text } from "react-konva";
import {
  Loader2,
  ChevronLeft,
  ShoppingCart,
  Upload,
  Check,
} from "lucide-react";
import useImage from "use-image";
import axiosClient from "../api/axiosClient";

const BASE_URL = "http://localhost:3000";

const CanvasImage = ({ layerData, userSelection }: any) => {
  const imageUrl = userSelection || layerData.image_url;
  const fullUrl = imageUrl?.startsWith("http")
    ? imageUrl
    : `${BASE_URL}${imageUrl}`;
  const [img] = useImage(fullUrl, "anonymous");

  if (!img) return null;

  return (
    <KonvaImage
      image={img}
      x={layerData.x}
      y={layerData.y}
      width={layerData.width}
      height={layerData.height}
      // Đảm bảo thứ tự hiển thị
      zIndex={layerData.zIndex}
    />
  );
};
const DesignerPage = () => {
  const { productId } = useParams();
  const [searchParams] = useSearchParams();
  const variantId = searchParams.get("variantId");
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [design, setDesign] = useState<any>(null);
  const [userInput, setUserInput] = useState<Record<string, any>>({});
  const stageRef = useRef<any>(null);

  const [mockupImg] = useImage(
    design?.templateJson?.mockup
      ? `${BASE_URL}${design.templateJson.mockup}`
      : "",
    "anonymous",
  );
  useEffect(() => {
    const fetchDesignData = async () => {
      try {
        setLoading(true);

        const cleanVariantId =
          variantId && variantId !== "undefined" && variantId !== "null"
            ? Number(variantId)
            : undefined;

        const res = await axiosClient.get(`/designs/active`, {
          params: {
            productId: Number(productId),
            variantId: cleanVariantId,
          },
        });

        if (res.data) {
          setDesign(res.data);
          const initialInput: Record<string, any> = {};
          res.data.templateJson.detail.forEach((l: any) => {
            initialInput[l.layer] = l.defaultValue || "";
          });
          setUserInput(initialInput);
        }
      } catch (err) {
        console.error("Không tìm thấy mẫu thiết kế", err);
        setDesign(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDesignData();
  }, [productId, variantId]);

  const handleAddToCart = async () => {
    const previewImage = stageRef.current.toDataURL();

    const cartData = {
      productId: Number(productId),
      variantId: Number(variantId),
      customizedDesignJson: userInput,
      previewImage: previewImage,
      quantity: 1,
    };

    try {
      await axiosClient.post("/cart", cartData);
      alert("Đã thêm vào giỏ hàng!");
      navigate("/cart");
    } catch (err) {
      alert("Lỗi khi thêm vào giỏ hàng");
    }
  };

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  if (!design)
    return <div className="p-20 text-center">Mẫu thiết kế không tồn tại.</div>;

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col">
      {/* Top Bar */}
      <header className="h-16 bg-white border-b px-6 flex items-center justify-between sticky top-0 z-10">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 font-bold text-gray-600 hover:text-black"
        >
          <ChevronLeft size={20} /> QUAY LẠI
        </button>
        <div className="text-center font-black text-sm tracking-tighter italic">
          CÁ NHÂN HÓA SẢN PHẨM
        </div>
        <button
          onClick={handleAddToCart}
          className="bg-indigo-600 text-white px-6 py-2 rounded-full font-bold flex items-center gap-2 hover:bg-black transition-all"
        >
          XONG <ShoppingCart size={18} />
        </button>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* LEFT: CANVAS VIEW */}
        <div className="flex-1 flex items-center justify-center p-4 lg:p-10">
          <div className="bg-white shadow-2xl rounded-[2.5rem] overflow-hidden border-[12px] border-white sticky top-24">
            <Stage width={500} height={600} ref={stageRef}>
              <Layer>
                {mockupImg && (
                  <KonvaImage image={mockupImg} width={500} height={600} />
                )}

                {design.templateJson.detail.map((l: any) => {
                  if (l.type === "text") {
                    return (
                      <Text
                        key={l.layer}
                        {...l}
                        text={userInput[l.layer] || ""}
                        fill={l.color}
                      />
                    );
                  }
                  return (
                    <CanvasImage
                      key={l.layer}
                      layerData={l}
                      userSelection={userInput[l.layer]}
                    />
                  );
                })}
              </Layer>
            </Stage>
          </div>
        </div>

        {/* CONTROL PANEL */}
        <div className="w-full lg:w-[450px] bg-white border-l p-8 overflow-y-auto h-full lg:h-[calc(100vh-64px)]">
          <div className="mb-10">
            <h1 className="text-2xl font-black text-gray-900 uppercase leading-none mb-2">
              {design.designName}
            </h1>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest italic">
              Tùy chỉnh theo phong cách của bạn
            </p>
          </div>

          <div className="space-y-10">
            {design.options.map((opt: any) => (
              <div key={opt.id} className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-4 bg-indigo-600 rounded-full"></div>
                  <label className="text-xs font-black text-gray-800 uppercase tracking-tight">
                    {opt.label}
                  </label>
                </div>

                {opt.optionType === "text" && (
                  <input
                    type="text"
                    placeholder={opt.config.placeholder}
                    maxLength={opt.config.maxLength}
                    className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold focus:ring-2 focus:ring-indigo-500"
                    value={userInput[opt.targetLayerId]}
                    onChange={(e) =>
                      setUserInput({
                        ...userInput,
                        [opt.targetLayerId]: e.target.value,
                      })
                    }
                  />
                )}

                {opt.optionType === "image_group" && (
                  <div className="grid grid-cols-4 gap-3">
                    {opt.config.options.map((item: any) => (
                      <button
                        key={item.id}
                        onClick={() =>
                          setUserInput({
                            ...userInput,
                            [opt.targetLayerId]: item.image_url,
                          })
                        }
                        className={`aspect-square rounded-2xl overflow-hidden border-4 transition-all relative ${
                          userInput[opt.targetLayerId] === item.image_url
                            ? "border-indigo-600 shadow-lg scale-105"
                            : "border-gray-50"
                        }`}
                      >
                        <img
                          src={`${BASE_URL}${item.image_url}`}
                          className="w-full h-full object-cover"
                          alt={item.name}
                        />
                        {userInput[opt.targetLayerId] === item.image_url && (
                          <div className="absolute top-1 right-1 bg-indigo-600 text-white rounded-full p-0.5">
                            <Check size={10} />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {opt.optionType === "upload" && (
                  <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-100 rounded-[2rem] cursor-pointer hover:bg-indigo-50 transition-all group">
                    <Upload className="text-gray-300 group-hover:text-indigo-600 mb-2" />
                    <span className="text-[10px] font-black text-gray-400 group-hover:text-indigo-600 uppercase">
                      Tải ảnh của bạn
                    </span>
                    <input
                      type="file"
                      hidden
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const formData = new FormData();
                          formData.append("files", file);
                          const res = await axiosClient.post(
                            "/upload",
                            formData,
                          );
                          setUserInput({
                            ...userInput,
                            [opt.targetLayerId]: res.data.urls[0],
                          });
                        }
                      }}
                    />
                  </label>
                )}
              </div>
            ))}
          </div>

          <div className="mt-16 p-6 bg-indigo-50 rounded-[2rem] border border-indigo-100">
            <p className="text-[10px] text-indigo-400 font-black uppercase mb-2">
              Thông tin in ấn
            </p>
            <p className="text-xs text-indigo-900 font-medium leading-relaxed italic">
              * Hình ảnh hiển thị trên canvas là bản xem trước. Sản phẩm thực tế
              sẽ được tinh chỉnh để có chất lượng in tốt nhất.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesignerPage;
