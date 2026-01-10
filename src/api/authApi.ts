/**
 * Auth API - Authentication Service
 *
 * Handles user authentication with the Flask backend.
 * ⚠️ PRODUCTION MODE - All data comes from Backend only
 */

import axiosInstance, {
  clearAuthData,
  saveAuthTokens,
  extractData,
} from "./axiosInstance";
import { adaptBackendUser } from "./adapters";
import type { User } from "@/types";
import type {
  ApiResponse,
  BackendLoginResponse,
  BackendUser,
} from "@/types/backend";

// ===========================================
// Types
// ===========================================

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  department?: string;
  jobTitle?: string;
}

export interface LoginResponse {
  token: string;
  refreshToken?: string;
  user: User;
}

export type QuickRole = "Admin" | "Data Entry" | "Viewer";

// ===========================================
// Auth API
// ===========================================

export const authApi = {
  /**
   * Login user
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const response = await axiosInstance.post<
        ApiResponse<BackendLoginResponse>
      >("/auth/login", {
        email: credentials.email,
        password: credentials.password,
      });

      const data = extractData(response);
      const user = adaptBackendUser(data.user);

      // Save tokens
      saveAuthTokens(data.access_token, data.refresh_token);

      return {
        token: data.access_token,
        refreshToken: data.refresh_token,
        user,
      };
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { error?: { message?: string } } };
      };
      throw new Error(err.response?.data?.error?.message || "Request failed");
    }
  },

  /**
   * Quick role login (dev convenience)
   *
   * The UI has a "Quick" tab that calls this method.
   * In production deployments you should prefer email/password.
   */
  async loginWithRole(role: QuickRole): Promise<LoginResponse> {
    // Map roles to known dev accounts.
    // Backend seed creates: admin@rms.local / Admin@123
    if (role === "Admin") {
      return authApi.login({ email: "admin@rms.local", password: "Admin@123" });
    }

    // Other roles may not exist by default in the backend database.
    // Use the Email tab to login with an existing account.
    throw new Error("Request failed");
  },

  /**
   * Register new user
   */
  async register(data: RegisterData): Promise<LoginResponse> {
    try {
      const response = await axiosInstance.post<
        ApiResponse<BackendLoginResponse>
      >("/auth/register", {
        email: data.email,
        password: data.password,
        full_name: data.fullName,
        phone: data.phone,
        department: data.department,
        job_title: data.jobTitle,
      });

      const result = extractData(response);
      const user = adaptBackendUser(result.user);

      saveAuthTokens(result.access_token, result.refresh_token);

      return {
        token: result.access_token,
        refreshToken: result.refresh_token,
        user,
      };
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { error?: { message?: string } } };
      };
      throw new Error(err.response?.data?.error?.message || "Request failed");
    }
  },

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await axiosInstance.post("/auth/logout");
    } catch {
      // Ignore logout errors
    } finally {
      clearAuthData();
    }
  },

  /**
   * Validate current token / Get current user
   */
  async validateToken(): Promise<User | null> {
    try {
      const response = await axiosInstance.get<ApiResponse<BackendUser>>(
        "/auth/me"
      );
      const data = extractData(response);
      return adaptBackendUser(data);
    } catch {
      clearAuthData();
      return null;
    }
  },

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<string> {
    try {
      const response = await axiosInstance.post<
        ApiResponse<{ access_token: string }>
      >(
        "/auth/refresh",
        null,
        {
          headers: {
            Authorization: `Bearer ${refreshToken}`,
          },
        }
      );

      const data = extractData(response);
      saveAuthTokens(data.access_token);
      return data.access_token;
    } catch (error: unknown) {
      clearAuthData();
      throw new Error("Request failed");
    }
  },

  /**
   * Request password reset
   */
  async forgotPassword(email: string): Promise<{ token?: string } | undefined> {
    try {
      const response = await axiosInstance.post<
        ApiResponse<{ token?: string }>
      >("/auth/forgot-password", { email });
      return extractData(response);
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { error?: { message?: string } } };
      };
      throw new Error(
        err.response?.data?.error?.message || "Request failed"
      );
    }
  },

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      await axiosInstance.post("/auth/reset-password", {
        token,
        password: newPassword,
      });
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { error?: { message?: string } } };
      };
      throw new Error(
        err.response?.data?.error?.message || "Request failed"
      );
    }
  },

  /**
   * Change current user password
   */
  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    try {
      await axiosInstance.post("/auth/change-password", {
        old_password: currentPassword,
        new_password: newPassword,
      });
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { error?: { message?: string } } };
      };
      throw new Error(
        err.response?.data?.error?.message || "Request failed"
      );
    }
  },
};

/**
 * Get auth statistics (e.g., check if admin exists)
 */
export const getAuthStats = async (): Promise<{ hasAdmin: boolean }> => {
  try {
    const response = await axiosInstance.get<
      ApiResponse<{ has_admin: boolean }>
    >("/auth/stats");
    const data = extractData(response);
    return { hasAdmin: data.has_admin !== false };
  } catch {
    // If error, assume admin exists
    return { hasAdmin: true };
  }
};

export default authApi;
