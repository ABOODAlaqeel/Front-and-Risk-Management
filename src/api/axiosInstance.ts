/**
 * Axios Instance - HTTP Client Configuration
 *
 * Central configuration for all API calls.
 * Handles authentication, error handling, and response transformation.
 *
 * ⚠️ PRODUCTION MODE - All data comes from Backend only
 */

import axios, {
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from "axios";
import type { ApiResponse } from "@/types/backend";

// ===========================================
// Configuration
// ===========================================

const baseURL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";
const DEBUG = import.meta.env.VITE_DEBUG === "true";

// Token storage keys
const TOKEN_KEY = "auth_token";
const REFRESH_TOKEN_KEY = "auth_refresh_token";
const USER_KEY = "auth_user";

// ===========================================
// Axios Instance
// ===========================================

export const axiosInstance = axios.create({
  baseURL,
  timeout: 30000, // 30 seconds
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// ===========================================
// Request Interceptor
// ===========================================

axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add JWT token if available
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Debug logging
    if (DEBUG) {
      console.log(
        `[API Request] ${config.method?.toUpperCase()} ${config.url}`,
        {
          data: config.data,
          params: config.params,
        }
      );
    }

    return config;
  },
  (error: AxiosError) => {
    console.error("[API Request Error]", error);
    return Promise.reject(error);
  }
);

// ===========================================
// Response Interceptor
// ===========================================

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    if (DEBUG) {
      console.log(`[API Response] ${response.config.url}`, {
        status: response.status,
        data: response.data,
      });
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Handle 401 Unauthorized - Try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
        if (refreshToken) {
          const response = await axios.post(
            `${baseURL}/auth/refresh`,
            null,
            {
              headers: {
                Authorization: `Bearer ${refreshToken}`,
              },
            }
          );

          if (response.data.success) {
            const newToken = response.data.data.access_token;
            localStorage.setItem(TOKEN_KEY, newToken);
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return axiosInstance(originalRequest);
          }
        }
      } catch (refreshError) {
        // Refresh failed, clear auth and redirect to login
        clearAuthData();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    // Log error details
    if (DEBUG) {
      console.error(`[API Error] ${error.config?.url}`, {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
    }

    return Promise.reject(error);
  }
);

// ===========================================
// Auth Token Management
// ===========================================

export const saveAuthTokens = (
  accessToken: string,
  refreshToken?: string
): void => {
  localStorage.setItem(TOKEN_KEY, accessToken);
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
};

export const getAccessToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const getRefreshToken = (): string | null => {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

export const clearAuthData = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const isAuthenticated = (): boolean => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return false;

  // Check if token is expired (basic check)
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const exp = payload.exp * 1000; // Convert to milliseconds
    return Date.now() < exp;
  } catch {
    return false;
  }
};

// ===========================================
// Response Helpers
// ===========================================

/**
 * Extract data from API response
 */
export const extractData = <T>(response: AxiosResponse<ApiResponse<T>>): T => {
  // Log for debugging
  if (DEBUG) {
    console.log("[extractData] response.data:", response.data);
  }

  // Check if response has success flag
  if (response.data.success) {
    // Return data even if it's null/undefined/empty array
    return response.data.data as T;
  }

  // If no success flag but has data directly (backward compatibility)
  if (response.data.data !== undefined) {
    return response.data.data;
  }

  throw new Error(response.data.error?.message || "Unknown API error");
};

/**
 * Build query parameters string
 */
export const buildQueryParams = (params: Record<string, unknown>): string => {
  const filtered = Object.entries(params).filter(
    ([, value]) => value !== undefined && value !== null && value !== ""
  );

  if (filtered.length === 0) return "";

  const queryString = filtered
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`
    )
    .join("&");

  return `?${queryString}`;
};

export default axiosInstance;
