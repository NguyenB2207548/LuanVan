import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import { Loader2, Star, MessageSquare, Check } from "lucide-react"; // Thêm Star, MessageSquare
import ImageOptionSelector from "../../components/user/ImageOptionSelector";
import DesignControls from "../../components/user/DesignControls";
import DesignerCanvas from "../../components/common/DesignerCanvas";
import { useCartStore } from "../../store/useCartStore";
import { useAuthStore } from "../../store/useAuthStore";

const BASE_URL = "http://localhost:3000";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [product, setProduct] = useState<any>(null);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [designData, setDesignData] = useState<any>(null);
  const [designChoices, setDesignChoices] = useState<Record<string, any>>({});
  const [showPreview, setShowPreview] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const [activeTab, setActiveTab] = useState<"description" | "reviews">(
    "reviews",
  );

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const allAttributes = useMemo(() => {
    if (!product?.variants) return [];
    const attrs: Record<string, { name: string; values: Set<string> }> = {};

    product.variants.forEach((v: any) => {
      v.attributeValues?.forEach((av: any) => {
        if (!attrs[av.attribute.id]) {
          attrs[av.attribute.id] = {
            name: av.attribute.attributeName,
            values: new Set(),
          };
        }
        attrs[av.attribute.id].values.add(av.valueName);
      });
    });

    return Object.entries(attrs).map(([id, data]) => ({
      id,
      name: data.name,
      values: Array.from(data.values),
    }));
  }, [product]);

  const isValueActive = (attrName: string, valueName: string) => {
    return selectedVariant?.attributeValues?.some(
      (av: any) =>
        av.attribute.attributeName === attrName && av.valueName === valueName,
    );
  };

  const handleAttributeClick = (attrName: string, valueName: string) => {
    const targetSpecs = selectedVariant?.attributeValues?.map((av: any) => ({
      name: av.attribute.attributeName,
      value: av.attribute.attributeName === attrName ? valueName : av.valueName,
    }));

    const foundVariant = product.variants.find((v: any) => {
      return v.attributeValues.every((av: any) =>
        targetSpecs.some(
          (ts: any) =>
            ts.name === av.attribute.attributeName && ts.value === av.valueName,
        ),
      );
    });

    if (foundVariant) {
      handleVariantSelect(foundVariant.id);
    }
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: location.pathname } });
      return;
    }

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
      useCartStore.getState().fetchCartCount();
      alert("Thêm vào giỏ hàng thành công!");
    } catch (error: any) {
      alert(error.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setIsAddingToCart(false);
    }
  };

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
              initialChoices[layer.id] = layer.text;

              if (layer.availableFonts?.length > 0) {
                initialChoices[`${layer.id}_fontFamily`] =
                  layer.fontFamily || layer.availableFonts[0];
              }

              if (layer.availableColors?.length > 0) {
                initialChoices[`${layer.id}_color`] =
                  layer.color || layer.availableColors[0];
              }
            }
            if (
              (layer.type === "dynamic_image" || layer.type === "group") &&
              layer.options?.length > 0
            ) {
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

  const handleThumbnailClick = (imgUrl: string) => {
    setActiveImage(imgUrl);
    setShowPreview(false);
  };

  const handleDesignChoicesChange = (newChoices: any) => {
    setDesignChoices(newChoices);
    if (!showPreview) setShowPreview(true);
  };

  const getPrice = () =>
    selectedVariant?.price || product?.variants?.[0]?.price || 0;

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
          <div className="flex gap-4">
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
              {product.images?.map((img: any, idx: number) => (
                <div
                  key={`product-${idx}`}
                  onClick={() => handleThumbnailClick(img.url)}
                  className={`border rounded p-1 cursor-pointer transition-all ${!showPreview && activeImage === img.url ? "border-red-400 ring-1 ring-red-400" : "border-gray-200"}`}
                >
                  <img
                    src={`${BASE_URL}${img.url}`}
                    className="w-full object-cover aspect-square rounded-sm"
                    alt="thumb"
                  />
                </div>
              ))}
              {selectedVariant?.images?.length > 0 &&
                selectedVariant.images.map((img: any, idx: number) => (
                  <div
                    key={`variant-${idx}`}
                    onClick={() => handleThumbnailClick(img.url)}
                    className={`border-2 rounded p-1 cursor-pointer transition-all ${!showPreview && activeImage === img.url ? "border-red-400 ring-1 ring-red-400" : "border-blue-200"}`}
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
              {!showPreview && activeImage && (
                <img
                  src={`${BASE_URL}${activeImage}`}
                  className="w-full h-auto object-contain transition-all duration-300"
                  alt="Product"
                />
              )}
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
                        if (layer.type === "text")
                          return {
                            ...layer,
                            // Ghi đè text
                            text:
                              designChoices[layer.id] !== undefined
                                ? designChoices[layer.id]
                                : layer.text || "",
                            // Ghi đè font và color từ designChoices (nếu khách đã chọn), nếu không thì lấy mặc định
                            fontFamily:
                              designChoices[`${layer.id}_fontFamily`] ||
                              layer.fontFamily,
                            color:
                              designChoices[`${layer.id}_color`] || layer.color,
                          };
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
                    setSelectedId={() => {}}
                    mode="client"
                    scale={0.7}
                    maxWidth={650}
                  />
                </div>
              )}
            </div>
          </div>

          {/* ---  RATING & TABS --- */}
          <div className="mt-8">
            <div className="flex items-center gap-2 mb-6">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={20}
                    fill={
                      star <= Math.round(product.averageRating || 0)
                        ? "#EAB308"
                        : "none"
                    }
                    className={
                      star <= Math.round(product.averageRating || 0)
                        ? "text-yellow-500"
                        : "text-gray-300"
                    }
                  />
                ))}
              </div>
              <span className="text-lg font-bold text-black">
                {product.averageRating || 0}
              </span>
              <span className="text-gray-500 text-sm">
                ({product.totalReviews || 0} đánh giá)
              </span>
            </div>

            <div className="border-b border-gray-200 flex gap-8">
              <button
                onClick={() => setActiveTab("reviews")}
                className={`pb-3 text-sm font-bold uppercase tracking-wider transition-all ${activeTab === "reviews" ? "border-b-2 border-black text-black" : "text-gray-400 hover:text-black"}`}
              >
                Đánh giá khách hàng
              </button>

              <button
                onClick={() => setActiveTab("description")}
                className={`pb-3 text-sm font-bold uppercase tracking-wider transition-all ${activeTab === "description" ? "border-b-2 border-black text-black" : "text-gray-400 hover:text-black"}`}
              >
                Mô tả sản phẩm
              </button>
            </div>

            <div className="mt-6">
              {activeTab === "description" ? (
                <div className="text-sm text-black leading-relaxed whitespace-pre-line">
                  {product.description || "Chưa có mô tả cho sản phẩm này."}
                </div>
              ) : (
                <div className="space-y-6">
                  {product.reviews && product.reviews.length > 0 ? (
                    product.reviews.map((rev: any) => (
                      <div
                        key={rev.id}
                        className="border-b border-gray-100 pb-4 last:border-0"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-bold text-sm text-black">
                            {rev.user?.fullName || "Khách hàng"}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {new Date(rev.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex gap-1 mb-2">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              size={12}
                              fill={s <= rev.rating ? "#000" : "none"}
                              className={
                                s <= rev.rating ? "text-black" : "text-gray-200"
                              }
                            />
                          ))}
                        </div>
                        <p className="text-sm text-gray-700 italic">
                          {rev.comment || "Không có bình luận."}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 text-gray-400 italic text-sm">
                      Chưa có đánh giá nào cho sản phẩm này.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="w-full lg:w-1/2 lg:pl-8">
          <div className="mb-8">
            <h1 className="text-xl lg:text-[32px] font-normal text-gray-800 leading-tight mb-4">
              {product.productName}
            </h1>
            <span className="text-[#ff4d6d] text-2xl lg:text-3xl font-bold">
              {getPrice().toLocaleString()} VND
            </span>
          </div>

          <div className="mt-10 space-y-8">
            <ImageOptionSelector
              label="Chọn loại sản phẩm"
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

            {/* Attributes */}
            {allAttributes.map((attr) => (
              <div key={attr.id} className="mt-8">
                {/* Tiêu đề */}
                <div className="font-semibold mb-3 text-sm text-gray-800">
                  {attr.name}
                </div>

                {/* Danh sách nút bấm */}
                <div className="flex flex-wrap gap-2.5">
                  {attr.values.map((val) => {
                    const active = isValueActive(attr.name, val);
                    return (
                      <button
                        key={val}
                        onClick={() => handleAttributeClick(attr.name, val)}
                        // THÊM 'relative' VÀO ĐÂY ĐỂ ICON BÁM ĐÚNG GÓC NÚT
                        className={`relative px-5 py-2 text-sm rounded-md border transition-all duration-200 ${
                          active
                            ? "border-[#27ae60] font-bold shadow-sm ring-1 ring-[#27ae60] text-gray-900"
                            : "border-gray-200 bg-white text-gray-600 hover:border-gray-400 hover:bg-gray-50"
                        }`}
                      >
                        {val}

                        {/* Đoạn code hiển thị dấu tick tròn giống y hệt yêu cầu của bạn */}
                        {active && (
                          <div className="absolute -top-1 -right-1 bg-[#27ae60] text-white rounded-full shadow-md">
                            <Check size={16} stroke="white" strokeWidth={3} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

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
                "Thêm vào giỏ hàng"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
