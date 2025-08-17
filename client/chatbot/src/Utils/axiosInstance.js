import axios from "axios";
import { BACKEND_URL } from "../config/config";

export const axiosInstance = axios.create({
  baseURL: BACKEND_URL,
});

// 🔑 Add request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
