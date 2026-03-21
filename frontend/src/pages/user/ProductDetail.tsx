import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
// import type { Product, Variant } from "../../types/product";
import { Loader2 } from "lucide-react";
import ImageOptionSelector from "../../components/user/ImageOptionSelector";
import DesignControls from "../../components/user/DesignControls";
import DesignerCanvas from "../../components/common/DesignerCanvas";
import { useCartStore } from "../../store/useCartStore";

const BASE_URL = "http://localhost:3000";

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState<any>(null);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);

  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  const [designData, setDesignData] = useState<any>(null);
  const [designChoices, setDesignChoices] = useState<Record<string, any>>({});

  const [showPreview, setShowPreview] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const handleAddToCart = async () => {
    if (!selectedVariant) {
      alert("Vui lòng chọn phân loại sản phẩm trước khi thêm vào giỏ hàng.");
      return;
    }
    setIsAddingToCart(true);
    try {
      const payload = {
        variantId: selectedVariant.id,
        quantity: quantity,
        customizedDesignJson:
          Object.keys(designChoices).length > 0 ? designChoices : null,
      };
      await axiosClient.post("/carts", payload);

      // --- DÒNG CODE DUY NHẤT CẦN THÊM ---
      useCartStore.getState().fetchCartCount();
      // ----------------------------------

      alert("Thêm vào giỏ hàng thành công!");
    } catch (error: any) {
      alert(error.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setIsAddingToCart(false);
    }
  };

  // const handleAddToCart = async () => {
  //   if (!selectedVariant) {
  //     alert("Vui lòng chọn phân loại sản phẩm trước khi thêm vào giỏ hàng.");
  //     return;
  //   }
  //   setIsAddingToCart(true);
  //   try {
  //     const payload = {
  //       variantId: selectedVariant.id,
  //       quantity: quantity,
  //       customizedDesignJson:
  //         Object.keys(designChoices).length > 0 ? designChoices : null,
  //     };
  //     await axiosClient.post("/carts", payload);
  //     alert("Thêm vào giỏ hàng thành công!");
  //   } catch (error: any) {
  //     alert(error.response?.data?.message || "Có lỗi xảy ra");
  //   } finally {
  //     setIsAddingToCart(false);
  //   }
  // };

  // 1. Khởi tạo dữ liệu (Chỉ chạy 1 lần duy nhất khi load trang)
  useEffect(() => {
    const fetchProductAndDesign = async () => {
      try {
        setLoading(true);
        const response = await axiosClient.get(`/products/${id}`);
        const data = response.data;
        setProduct(data);

        if (data?.variants?.length > 0) {
          const firstVariant = data.variants[0];
          setSelectedVariant(firstVariant);

          const primaryImg =
            data.images?.find((img: any) => img.isPrimary)?.url ||
            data.images?.[0]?.url ||
            firstVariant.mockup?.url;

          setActiveImage(primaryImg);
        }

        if (data.design && data.design.artwork) {
          const artwork = data.design.artwork;
          setDesignData(artwork);

          const initialChoices: Record<string, any> = {};
          const layers = artwork.layersJson?.details || [];

          layers.forEach((layer: any) => {
            if (layer.type === "text") {
              // Ưu tiên text đã gán sẵn trong layersJson
              initialChoices[layer.id] = layer.text;
            }
            if (
              (layer.type === "dynamic_image" || layer.type === "group") &&
              layer.options?.length > 0
            ) {
              // Tìm option nào đang có image_url trùng với image_url mặc định của layer
              const defaultOpt =
                layer.options.find(
                  (o: any) => o.image_url === layer.image_url,
                ) || layer.options[0];
              initialChoices[layer.id] = defaultOpt.id;
            }
          });
          setDesignChoices(initialChoices);
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProductAndDesign();
  }, [id]);

  // 2. Logic khi click chọn Variant (Giữ nguyên layer khi đổi variant)
  const handleVariantSelect = (variantId: any) => {
    const variant = product.variants.find((v: any) => v.id === variantId);
    if (variant) {
      setSelectedVariant(variant);
      if (!showPreview) {
        const variantImg =
          variant.mockup?.url ||
          (variant.images?.length > 0 ? variant.images[0].url : activeImage);
        setActiveImage(variantImg);
      }
    }
  };

  // Logic khi click vào ảnh nhỏ bên trái
  const handleThumbnailClick = (imgUrl: string) => {
    setActiveImage(imgUrl);
    setShowPreview(false);
  };

  // 3. Tự động bật Canvas khi người dùng tương tác với thiết kế
  const handleDesignChoicesChange = (newChoices: any) => {
    setDesignChoices(newChoices);
    if (!showPreview) setShowPreview(true);
  };

  const getPrice = () =>
    selectedVariant?.price || product?.variants?.[0]?.price || 0;

  // const displayImages = product?.images || [];
  const displayImages = showPreview
    ? []
    : selectedVariant?.images?.length > 0
      ? selectedVariant.images // ảnh của variant nếu có
      : product?.images || [];

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="animate-spin text-pink-500" size={48} />
      </div>
    );
  if (!product)
    return (
      <div className="text-center py-20 font-medium">Product not found.</div>
    );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 font-sans text-gray-800">
      <div className="flex flex-col md:flex-row gap-10">
        <div className="w-full lg:w-1/2">
          <div className="sticky top-8 flex gap-4">
            {/* THUMBNAILS LIST */}
            <div className="flex flex-col gap-2 w-20 overflow-y-auto hide-scrollbar">
              {product.design && (
                <div
                  onClick={() => setShowPreview(true)}
                  className={`border-2 rounded p-1 cursor-pointer h-24 bg-white flex flex-col items-center justify-center text-center transition-all ${showPreview ? "border-[#ff4d6d]" : "border-gray-300 hover:border-gray-500"}`}
                >
                  <span className="text-[10px] font-black text-[#ff4d6d] uppercase">
                    Live
                    <br />
                    Preview
                  </span>
                </div>
              )}

              {/* Ảnh product (luôn hiện) */}
              {product.images?.map((img: any, idx: number) => (
                <div
                  key={`product-${idx}`}
                  onClick={() => handleThumbnailClick(img.url)}
                  className={`border rounded p-1 cursor-pointer transition-all ${!showPreview && activeImage === img.url
                    ? "border-red-400 ring-1 ring-red-400"
                    : "border-gray-200"
                    }`}
                >
                  <img
                    src={`${BASE_URL}${img.url}`}
                    className="w-full object-cover aspect-square rounded-sm"
                    alt="thumb"
                  />
                </div>
              ))}

              {/* Ảnh variant (chỉ hiện khi variant có ảnh riêng) */}
              {selectedVariant?.images?.length > 0 &&
                selectedVariant.images.map((img: any, idx: number) => (
                  <div
                    key={`variant-${idx}`}
                    onClick={() => handleThumbnailClick(img.url)}
                    className={`border-2 rounded p-1 cursor-pointer transition-all ${!showPreview && activeImage === img.url
                      ? "border-red-400 ring-1 ring-red-400"
                      : "border-blue-200" // viền xanh để phân biệt ảnh variant
                      }`}
                  >
                    <img
                      src={`${BASE_URL}${img.url}`}
                      className="w-full object-cover aspect-square rounded-sm"
                      alt="variant thumb"
                    />
                  </div>
                ))}
            </div>

            <div className="flex-1 bg-white border border-gray-100 relative rounded-lg overflow-hidden flex items-center justify-center min-h-[500px]">
              {/* Ảnh sản phẩm thông thường */}
              {!showPreview && activeImage && (
                <img
                  src={`${BASE_URL}${activeImage}`}
                  className="w-full h-auto object-contain transition-all duration-300"
                  alt="Product"
                />
              )}

              {/* Designer Canvas (Live Preview) */}
              {showPreview && product.design?.artwork?.layersJson && (
                <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
                  <div className="absolute top-3 left-3 bg-white/90 border border-red-200 px-2 py-1 text-[10px] text-red-500 font-bold uppercase z-20 rounded shadow-sm">
                    Personalized Preview
                  </div>
                  <DesignerCanvas
                    backgroundUrl={
                      selectedVariant?.mockup?.url ||
                      product.design.artwork.layersJson.mockup
                    }
                    layers={product.design.artwork.layersJson.details.map(
                      (layer: any) => {
                        if (layer.type === "text") {
                          return {
                            ...layer,
                            text: designChoices[layer.id] || layer.text || "",
                          };
                        }
                        if (
                          layer.type === "dynamic_image" ||
                          layer.type === "group"
                        ) {
                          const selectedOptionId = designChoices[layer.id];
                          const selectedOpt = layer.options?.find(
                            (o: any) =>
                              String(o.id) === String(selectedOptionId),
                          );

                          return {
                            ...layer,
                            image_url: selectedOpt
                              ? selectedOpt.image_url
                              : layer.image_url,
                            url: selectedOpt
                              ? selectedOpt.image_url
                              : layer.image_url,
                          };
                        }
                        return layer;
                      },
                    )}
                    virtualPrintArea={{
                      ...(selectedVariant?.mockup?.printArea ||
                        product.design.artwork.layersJson.printArea),
                      visible: true,
                    }}
                    selectedId={null}
                    setSelectedId={() => { }}
                    mode="client"
                    scale={0.7}
                    maxWidth={650}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* INFO & CONTROLS */}
        <div className="w-full lg:w-1/2 lg:pl-8">
          <div className="mb-8">
            <h1 className="text-xl lg:text-[32px] font-normal text-gray-800 leading-tight mb-4">
              {product.productName}
            </h1>
            <span className="text-[#ff4d6d] text-2xl lg:text-3xl font-bold">
              {getPrice().toLocaleString()} VND
            </span>
          </div>

          <div className="mt-10">
            <ImageOptionSelector
              label="Choose a product type"
              selectedId={selectedVariant?.id}
              onSelect={handleVariantSelect}
              options={product.variants.map((v: any) => ({
                id: v.id,
                image: v.mockup?.url
                  ? `${BASE_URL}${v.mockup.url}`
                  : product.images?.[0]?.url
                    ? `${BASE_URL}${product.images[0].url}`
                    : null,
                title: v.attributeValues
                  ?.map((av: any) => av.valueName)
                  .join(" / "),
              }))}
            />

            <DesignControls
              designData={designData}
              designChoices={designChoices}
              setDesignChoices={handleDesignChoicesChange}
              setShowPreview={setShowPreview}
              baseUrl={BASE_URL}
            />
          </div>

          <div className="mt-8">
            <div className="flex items-center gap-4">
              <span className="font-semibold text-gray-700">Quantity:</span>
              <div className="flex items-center border border-gray-300 rounded-md">
                <button
                  className="px-4 py-2 hover:bg-gray-100"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  −
                </button>
                <input
                  type="number"
                  className="w-12 text-center outline-none"
                  value={quantity}
                  readOnly
                />
                <button
                  className="px-4 py-2 hover:bg-gray-100"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  +
                </button>
              </div>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={isAddingToCart}
              className="w-full mt-6 bg-[#ff4d6d] text-white font-bold py-4 rounded-full hover:shadow-xl transition-all uppercase tracking-widest text-sm flex items-center justify-center gap-2"
            >
              {isAddingToCart ? (
                <Loader2 className="animate-spin w-5 h-5" />
              ) : (
                "Add to cart"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
