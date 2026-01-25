import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    role: "user", // Mặc định role cho khách hàng
  });
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axiosClient.post("/auth/register", formData);
      alert("Đăng ký thành công! Hãy đăng nhập.");
      navigate("/login");
    } catch (err: any) {
      alert(err.response?.data?.message || "Đăng ký thất bại");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded-xl shadow-lg border border-gray-100">
      <h2 className="text-2xl font-bold text-center mb-6">Đăng ký tài khoản</h2>
      <form onSubmit={handleRegister} className="space-y-4">
        <input
          type="text"
          placeholder="Họ và tên"
          className="w-full p-2 border rounded-lg"
          onChange={(e) =>
            setFormData({ ...formData, fullName: e.target.value })
          }
          required
        />
        <input
          type="email"
          placeholder="Email"
          className="w-full p-2 border rounded-lg"
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
        <input
          type="password"
          placeholder="Mật khẩu (ít nhất 6 ký tự)"
          className="w-full p-2 border rounded-lg"
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
          }
          required
        />
        <button
          type="submit"
          className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
        >
          Đăng ký ngay
        </button>
      </form>
    </div>
  );
};

export default RegisterPage;
