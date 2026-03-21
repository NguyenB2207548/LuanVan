import { useEffect, useState, useMemo } from "react"; // Thêm useMemo
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
// import type { Product, Variant } from "../../types/product";
import { Loader2 } from "lucide-react";
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

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // --- PHẦN LOGIC ATTRIBUTE MỚI ---
  const allAttributes = useMemo(() => {
    if (!product?.variants) return [];
    const attrs: Record<string, { name: string; values: Set<string> }> = {};

    product.variants.forEach((v: any) => {
      v.attributeValues?.forEach((av: any) => {
        if (!attrs[av.attribute.id]) {
          attrs[av.attribute.id] = { name: av.attribute.attributeName, values: new Set() };
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
      (av: any) => av.attribute.attributeName === attrName && av.valueName === valueName
    );
  };

  const handleAttributeClick = (attrName: string, valueName: string) => {
    const targetSpecs = selectedVariant?.attributeValues?.map((av: any) => ({
      name: av.attribute.attributeName,
      value: av.attribute.attributeName === attrName ? valueName : av.valueName,
    }));

    const foundVariant = product.variants.find((v: any) => {
      return v.attributeValues.every((av: any) =>
        targetSpecs.some((ts: any) => ts.name === av.attribute.attributeName && ts.value === av.valueName)
      );
    });

    if (foundVariant) {
      handleVariantSelect(foundVariant.id);
    }
  };
  // --------------------------------

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
          <div className="sticky top-8 flex gap-4">
            <div className="flex flex-col gap-2 w-20 overflow-y-auto hide-scrollbar">
              {product.design && (
                <div
                  onClick={() => setShowPreview(true)}
                  className={`border-2 rounded p-1 cursor-pointer h-24 bg-white flex flex-col items-center justify-center text-center transition-all ${showPreview ? "border-[#ff4d6d]" : "border-gray-300 hover:border-gray-500"}`}
                >
                  <span className="text-[10px] font-black text-[#ff4d6d] uppercase">
                    Live<br />Preview
                  </span>
                </div>
              )}

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

              {selectedVariant?.images?.length > 0 &&
                selectedVariant.images.map((img: any, idx: number) => (
                  <div
                    key={`variant-${idx}`}
                    onClick={() => handleThumbnailClick(img.url)}
                    className={`border-2 rounded p-1 cursor-pointer transition-all ${!showPreview && activeImage === img.url
                      ? "border-red-400 ring-1 ring-red-400"
                      : "border-blue-200"
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

            {/* PHẦN HIỂN THỊ ATTRIBUTES MỚI */}
            {allAttributes.map((attr) => (
              <div key={attr.id} className="space-y-3">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  {attr.name}
                </label>
                <div className="flex flex-wrap gap-2">
                  {attr.values.map((val) => {
                    const active = isValueActive(attr.name, val);
                    return (
                      <button
                        key={val}
                        onClick={() => handleAttributeClick(attr.name, val)}
                        className={`px-4 py-2 text-sm rounded-md border transition-all duration-200 ${active
                            ? "border-[#ff4d6d] bg-[#fff0f3] text-[#ff4d6d] font-bold shadow-sm"
                            : "border-gray-200 text-gray-600 hover:border-gray-400"
                          }`}
                      >
                        {val}
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