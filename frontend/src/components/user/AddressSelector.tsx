import React, { useState, useEffect } from "react";
import axios from "axios";
import { MapPin, Home } from "lucide-react";

interface AddressSelectorProps {
  onAddressChange: (data: {
    province: string;
    district: string;
    ward: string;
    addressDetail: string;
  }) => void;
}

const AddressSelector = ({ onAddressChange }: AddressSelectorProps) => {
  const [provinces, setProvinces] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);

  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedWard, setSelectedWard] = useState("");
  const [detail, setDetail] = useState("");

  // 1. Lấy danh sách Tỉnh/Thành
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const res = await axios.get("https://provinces.open-api.vn/api/p/");
        setProvinces(res.data);
      } catch (error) {
        console.error("Lỗi lấy danh sách tỉnh:", error);
      }
    };
    fetchProvinces();
  }, []);

  // 2. Khi chọn Tỉnh -> Lấy Huyện
  const handleProvinceChange = async (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const provinceCode = e.target.value;
    const provinceName =
      provinces.find((p) => String(p.code) === provinceCode)?.name || "";

    setSelectedProvince(provinceName);
    setSelectedDistrict(""); // Reset cấp dưới
    setSelectedWard("");
    setDistricts([]);
    setWards([]);

    if (provinceCode) {
      try {
        const res = await axios.get(
          `https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`,
        );
        setDistricts(res.data.districts);
      } catch (error) {
        console.error("Lỗi lấy danh sách huyện:", error);
      }
    }
  };

  // 3. Khi chọn Huyện -> Lấy Xã
  const handleDistrictChange = async (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const districtCode = e.target.value;
    const districtName =
      districts.find((d) => String(d.code) === districtCode)?.name || "";

    setSelectedDistrict(districtName);
    setSelectedWard("");
    setWards([]);

    if (districtCode) {
      try {
        const res = await axios.get(
          `https://provinces.open-api.vn/api/d/${districtCode}?depth=2`,
        );
        setWards(res.data.wards);
      } catch (error) {
        console.error("Lỗi lấy danh sách xã:", error);
      }
    }
  };

  // Cập nhật dữ liệu ra component cha mỗi khi có thay đổi
  useEffect(() => {
    onAddressChange({
      province: selectedProvince,
      district: selectedDistrict,
      ward: selectedWard,
      addressDetail: detail,
    });
  }, [selectedProvince, selectedDistrict, selectedWard, detail]);

  const selectClass =
    "w-full bg-gray-50 border border-gray-200 text-gray-600 text-sm rounded-md p-2.5 outline-none focus:border-gray-400 transition-all cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed";

  return (
    <div className="space-y-4 font-sans">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
        Địa chỉ
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Tỉnh/Thành phố */}
        <select onChange={handleProvinceChange} className={selectClass}>
          <option value="">Tỉnh / Thành phố</option>
          {provinces.map((p) => (
            <option key={p.code} value={p.code}>
              {p.name}
            </option>
          ))}
        </select>

        {/* Quận/Huyện */}
        <select
          onChange={handleDistrictChange}
          disabled={!selectedProvince}
          className={selectClass}
          value={districts.find((d) => d.name === selectedDistrict)?.code || ""}
        >
          <option value="">Quận / Huyện</option>
          {districts.map((d) => (
            <option key={d.code} value={d.code}>
              {d.name}
            </option>
          ))}
        </select>

        {/* Phường/Xã */}
        <select
          onChange={(e) =>
            setSelectedWard(
              wards.find((w) => String(w.code) === e.target.value)?.name || "",
            )
          }
          disabled={!selectedDistrict}
          className={selectClass}
          value={wards.find((w) => w.name === selectedWard)?.code || ""}
        >
          <option value="">Phường / Xã</option>
          {wards.map((w) => (
            <option key={w.code} value={w.code}>
              {w.name}
            </option>
          ))}
        </select>
      </div>

      {/* Địa chỉ chi tiết */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-300">
          <Home size={16} />
        </div>
        <input
          type="text"
          placeholder="Số nhà, tên đường..."
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-md pl-10 pr-4 py-2.5 outline-none focus:border-gray-400 transition-all"
        />
      </div>
    </div>
  );
};

export default AddressSelector;
