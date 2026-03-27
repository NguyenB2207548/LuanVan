import axios from "axios";
import { useAuthStore } from "../store/useAuthStore";

const axiosClient = axios.create({
  baseURL: "http://localhost:3000",
  headers: {
    "Content-Type": "application/json",
  },
});

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || "";
      const shouldLogout = url.includes("/users/me");

      if (shouldLogout) {
        localStorage.removeItem("access_token");
        const { logout } = useAuthStore.getState();
        logout();
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;