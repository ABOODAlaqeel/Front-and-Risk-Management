/**
 * User API - User Management Service
 *
 * Handles all user-related operations with the Flask backend.
 * ⚠️ PRODUCTION MODE - All data comes from Backend only
 */

import axiosInstance, { extractData, buildQueryParams } from "./axiosInstance";
import { adaptBackendUser, adaptBackendAuditLog } from "./adapters";
import type { User, AuditLog } from "@/types";
import type { UserRole } from "@/utils/constants";
import type {
  ApiResponse,
  PaginatedResponse,
  BackendUser,
  BackendRole,
  BackendPermission,
  BackendAuditLog,
} from "@/types/backend";

// ===========================================
// Types
// ===========================================

export interface UserInput {
  email: string;
  fullName: string;
  password?: string;
  phone?: string;
  department?: string;
  jobTitle?: string;
  roleId?: number;
  isActive?: boolean;
}

export interface UserFilters {
  search?: string;
  role?: string;
  isActive?: boolean;
  page?: number;
  perPage?: number;
}

// ===========================================
// User API
// ===========================================

export const userApi = {
  /**
   * Get all users
   */
  async getUsers(filters?: UserFilters): Promise<User[]> {
    try {
      const params: Record<string, unknown> = {};
      if (filters?.search) params.search = filters.search;
      if (filters?.role) {
        const numericRoleId = parseInt(filters.role.replace(/\D/g, ""), 10);
        if (!Number.isNaN(numericRoleId) && numericRoleId > 0) {
          params.role_id = numericRoleId;
        }
      }
      if (filters?.isActive !== undefined) params.is_active = filters.isActive;
      if (filters?.page) params.page = filters.page;
      if (filters?.perPage) params.per_page = filters.perPage;

      const response = await axiosInstance.get<PaginatedResponse<BackendUser>>(
        `/users${buildQueryParams(params)}`
      );

      if (response.data.success && response.data.data) {
        return response.data.data.map(adaptBackendUser);
      }
      return [];
    } catch (error) {
      console.error("Failed to fetch users:", error);
      throw new Error("Request failed");
    }
  },

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<User | null> {
    try {
      const numericId = parseInt(id.replace(/\D/g, ""), 10);
      const response = await axiosInstance.get<ApiResponse<BackendUser>>(
        `/users/${numericId}`
      );
      const data = extractData(response);
      return adaptBackendUser(data);
    } catch {
      return null;
    }
  },

  /**
   * Create new user
   */
  async createUser(data: UserInput): Promise<User> {
    try {
      const requestData = {
        email: data.email,
        full_name: data.fullName,
        password: data.password,
        phone: data.phone,
        department: data.department,
        job_title: data.jobTitle,
        role_id: data.roleId,
        is_active: data.isActive ?? true,
      };

      const response = await axiosInstance.post<ApiResponse<BackendUser>>(
        "/users",
        requestData
      );
      const result = extractData(response);
      return adaptBackendUser(result);
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
   * Update user
   */
  async updateUser(id: string, data: Partial<UserInput>): Promise<User> {
    try {
      const numericId = parseInt(id.replace(/\D/g, ""), 10);

      const requestData: Record<string, unknown> = {};
      if (data.email) requestData.email = data.email;
      if (data.fullName) requestData.full_name = data.fullName;
      if (data.phone) requestData.phone = data.phone;
      if (data.department) requestData.department = data.department;
      if (data.jobTitle) requestData.job_title = data.jobTitle;
      if (data.roleId) requestData.role_id = data.roleId;
      if (data.isActive !== undefined) requestData.is_active = data.isActive;

      const response = await axiosInstance.put<ApiResponse<BackendUser>>(
        `/users/${numericId}`,
        requestData
      );
      const result = extractData(response);
      return adaptBackendUser(result);
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
   * Delete user
   */
  async deleteUser(id: string): Promise<void> {
    try {
      const numericId = parseInt(id.replace(/\D/g, ""), 10);
      await axiosInstance.delete(`/users/${numericId}`);
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
   * Get all roles
   */
  async getRoles(): Promise<BackendRole[]> {
    try {
      const response = await axiosInstance.get<ApiResponse<BackendRole[]>>(
        "/users/roles"
      );
      return extractData(response);
    } catch (error) {
      console.error("Failed to fetch roles:", error);
      throw new Error("Request failed");
    }
  },

  /**
   * Get all permissions
   */
  async getPermissions(): Promise<BackendPermission[]> {
    try {
      const response = await axiosInstance.get<
        ApiResponse<BackendPermission[]>
      >("/users/permissions");
      return extractData(response);
    } catch (error) {
      console.error("Failed to fetch permissions:", error);
      throw new Error("Request failed");
    }
  },

  /**
   * Update role permissions
   */
  async updateRolePermissions(
    roleId: number,
    permissionIds: number[]
  ): Promise<BackendRole> {
    try {
      const response = await axiosInstance.put<ApiResponse<BackendRole>>(
        `/users/roles/${roleId}/permissions`,
        { permission_ids: permissionIds }
      );
      return extractData(response);
    } catch (error) {
      console.error("Failed to update role permissions:", error);
      throw new Error("Request failed");
    }
  },

  /**
   * Get audit logs
   */
  async getAuditLogs(filters?: {
    entityType?: string;
    entityId?: string;
    userId?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    perPage?: number;
  }): Promise<AuditLog[]> {
    try {
      const params: Record<string, unknown> = {};
      if (filters?.entityType) params.entity_type = filters.entityType;
      if (filters?.entityId) params.entity_id = filters.entityId;
      if (filters?.userId) params.user_id = filters.userId;
      if (filters?.action) params.action = filters.action;
      if (filters?.startDate) params.start_date = filters.startDate;
      if (filters?.endDate) params.end_date = filters.endDate;
      if (filters?.page) params.page = filters.page;
      if (filters?.perPage) params.per_page = filters.perPage;

      const response = await axiosInstance.get<
        PaginatedResponse<BackendAuditLog>
      >(`/audit-logs${buildQueryParams(params)}`);

      if (response.data.success && response.data.data) {
        return response.data.data.map(adaptBackendAuditLog);
      }
      return [];
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
      throw new Error("Request failed");
    }
  },

  /**
   * Get system settings
   */
  async getSettings(): Promise<Record<string, unknown>> {
    try {
      const response = await axiosInstance.get<
        ApiResponse<Record<string, unknown>>
      >("/settings");
      return extractData(response);
    } catch (error) {
      console.error("Failed to fetch settings:", error);
      throw new Error("Request failed");
    }
  },

  /**
   * Update system settings
   */
  async updateSettings(settings: Record<string, unknown>): Promise<void> {
    try {
      await axiosInstance.put("/settings", settings);
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
   * Update current user profile
   */
  async updateProfile(data: Partial<UserInput>): Promise<User> {
    try {
      const requestData: Record<string, unknown> = {};
      if (data.fullName) requestData.full_name = data.fullName;
      if (data.phone) requestData.phone = data.phone;
      if (data.department) requestData.department = data.department;
      if (data.jobTitle) requestData.job_title = data.jobTitle;

      const response = await axiosInstance.put<ApiResponse<BackendUser>>(
        "/auth/me",
        requestData
      );
      const result = extractData(response);
      return adaptBackendUser(result);
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
   * Get audit logs by entity
   */
  async getAuditLogsByEntity(
    entityType: string,
    entityId: string
  ): Promise<AuditLog[]> {
    try {
      const numericId = parseInt(entityId.replace(/\D/g, ""), 10);
      const response = await axiosInstance.get<
        PaginatedResponse<BackendAuditLog>
      >(`/users/audit-logs?entity_type=${entityType}&entity_id=${numericId}`);

      if (response.data.success && response.data.data) {
        return response.data.data.map(adaptBackendAuditLog);
      }
      return [];
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
      return [];
    }
  },

  /**
   * Get system settings
   */
  async getSystemSettings(): Promise<Record<string, unknown>> {
    try {
      const response = await axiosInstance.get<
        ApiResponse<Record<string, unknown>>
      >("/settings");
      const data = extractData(response) || {};

      // Transform backend format to frontend expected format
      return {
        riskMatrixThresholds: {
          low: (data.risk_threshold_low as number) || 5,
          medium: (data.risk_threshold_medium as number) || 12,
          high: (data.risk_threshold_high as number) || 20,
        },
        notifications:
          (data.notifications as boolean) ??
          (data.notificationsEnabled as boolean) ??
          true,
        autoAssessmentReminder:
          (data.autoAssessmentReminderDays as number) ??
          (data.autoAssessmentReminder as number) ??
          (data.reviewCycleDays as number) ??
          30,
      };
    } catch (error) {
      console.error("Failed to fetch system settings:", error);
      // Return default settings if API fails
      return {
        riskMatrixThresholds: { low: 5, medium: 12, high: 20 },
        notifications: true,
        autoAssessmentReminder: 30,
      };
    }
  },

  /**
   * Update system settings
   */
  async updateSystemSettings(settings: Record<string, unknown>): Promise<void> {
    try {
      // Backend accepts the nested shape directly
      await axiosInstance.put("/settings", settings);
    } catch (error) {
      console.error("Failed to update system settings:", error);
      throw new Error("Request failed");
    }
  },
};

export default userApi;
