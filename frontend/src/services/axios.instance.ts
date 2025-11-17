import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from "axios";
import { API_CONFIG } from "../config/api.config";

// Development mode check - using API_CONFIG instead of process.env
const isDevelopment = API_CONFIG.BASE_URL.includes("localhost") || 
  API_CONFIG.BASE_URL.includes("127.0.0.1");

// Extended request config with retry
interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
  _retryCount?: number;
}

// Create axios instance
const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  },
  withCredentials: false,
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add authorization token if exists
    const token = localStorage.getItem("access_token");
    if (token && config.headers) {
      config.headers.Authorization = `JWT ${token}`;
    }

    // Log request in development
    if (isDevelopment && typeof window !== "undefined") {
      console.log("[API Request]", {
        method: config.method?.toUpperCase(),
        url: config.url,
        baseURL: config.baseURL,
      });
    }

    return config;
  },
  (error: AxiosError) => {
    console.error("[API Request Error]", error);
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log response in development
    if (isDevelopment && typeof window !== "undefined") {
      console.log("[API Response]", {
        status: response.status,
        url: response.config.url,
        data: response.data,
      });
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as ExtendedAxiosRequestConfig;

    // Log error in development
    if (isDevelopment && typeof window !== "undefined") {
      console.error("[API Error]", {
        status: error.response?.status,
        url: originalRequest?.url,
        message: error.message,
        data: error.response?.data,
      });
    }

    // Handle 401 Unauthorized - Token expired or invalid
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refresh_token");
        
        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        // Refresh the token
        const response = await axios.post(
          `${API_CONFIG.BASE_URL}/auth/login/jwt/refresh/`,
          { refresh: refreshToken },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        const { access } = response.data;
        
        // Update stored token
        localStorage.setItem("access_token", access);

        // Update authorization header and retry
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `JWT ${access}`;
        }

        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Token refresh failed - clear auth data and redirect
        console.error("Token refresh failed:", refreshError);
        
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");
        
        // Only redirect if not already on login page
        if (!window.location.pathname.includes("/login")) {
          window.location.href = "/login";
        }
        
        return Promise.reject(refreshError);
      }
    }

    // Handle network errors
    if (!error.response) {
      console.error("Network error - please check your connection");
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
