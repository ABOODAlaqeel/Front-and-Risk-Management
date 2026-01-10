/**
 * Risk API - Risk Management Service
 *
 * Handles all risk-related operations with the Flask backend.
 * ⚠️ PRODUCTION MODE - All data comes from Backend only
 */

import axiosInstance, { extractData, buildQueryParams } from "./axiosInstance";
import {
  adaptBackendRisk,
  mapFrontendStatusToBackend,
  mapBackendCategoryToFrontend,
} from "./adapters";
import type { Risk } from "@/types";
import type { RiskCategory, RiskStatus } from "@/utils/constants";
import type {
  ApiResponse,
  PaginatedResponse,
  BackendRisk,
  BackendRiskCategory,
  BackendRiskCreateRequest,
  BackendRiskStats,
} from "@/types/backend";

// ===========================================
// Types
// ===========================================

export interface RiskFilters {
  status?: RiskStatus;
  category?: RiskCategory;
  owner?: string;
  search?: string;
  page?: number;
  perPage?: number;
}

export interface RiskInput {
  title: string;
  description: string;
  category: RiskCategory;
  owner: string;
  ownerId?: number;
  status?: RiskStatus;
  likelihood?: number;
  impact?: number;
}

// Category ID mapping (from backend)
const CATEGORY_CODE_TO_ID: Record<string, number> = {
  Operational: 1,
  Financial: 2,
  Strategic: 3,
  Compliance: 4,
  Technology: 5,
  Reputational: 6,
  Environmental: 7,
  Security: 8,
};

let categoryCache: BackendRiskCategory[] | null = null;

const getCachedCategories = async (): Promise<BackendRiskCategory[]> => {
  if (categoryCache) return categoryCache;
  const response = await axiosInstance.get<ApiResponse<BackendRiskCategory[]>>(
    "/risks/categories"
  );
  const data = extractData(response) || [];
  categoryCache = data;
  return data;
};

const resolveCategoryId = async (category: string): Promise<number> => {
  try {
    const categories = await getCachedCategories();
    const match = categories.find((c) => {
      const frontend = mapBackendCategoryToFrontend(c.code || c.name || "");
      return (
        frontend === category ||
        c.name === category ||
        c.code?.toLowerCase() === category.toLowerCase()
      );
    });
    if (match?.id) return match.id;
  } catch {
    // ignore and fallback
  }
  return CATEGORY_CODE_TO_ID[category] || 1;
};

// ===========================================
// Risk API
// ===========================================

export const riskApi = {
  async getCategories(): Promise<BackendRiskCategory[]> {
    try {
      return await getCachedCategories();
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      return [];
    }
  },

  async createCategory(input: {
    name: string;
    code: string;
    description?: string;
    color?: string;
    icon?: string;
    sort_order?: number;
  }): Promise<BackendRiskCategory> {
    const response = await axiosInstance.post<ApiResponse<BackendRiskCategory>>(
      "/risks/categories",
      input
    );
    const data = extractData(response);
    categoryCache = null;
    return data;
  },

  async updateCategory(
    id: number,
    input: Partial<{
      name: string;
      code: string;
      description: string;
      color: string;
      icon: string;
      sort_order: number;
    }>
  ): Promise<BackendRiskCategory> {
    const response = await axiosInstance.put<ApiResponse<BackendRiskCategory>>(
      `/risks/categories/${id}`,
      input
    );
    const data = extractData(response);
    categoryCache = null;
    return data;
  },

  async deleteCategory(id: number): Promise<void> {
    await axiosInstance.delete(`/risks/categories/${id}`);
    categoryCache = null;
  },
  /**
   * Get all risks with optional filters
   */
  async getAll(filters?: RiskFilters): Promise<Risk[]> {
    try {
      const params: Record<string, unknown> = {};

      if (filters?.status) {
        params.status = mapFrontendStatusToBackend(filters.status);
      }
      if (filters?.category) {
        params.category_id = await resolveCategoryId(filters.category);
      }
      if (filters?.search) {
        params.search = filters.search;
      }
      if (filters?.page) {
        params.page = filters.page;
      }
      if (filters?.perPage) {
        params.per_page = filters.perPage;
      }

      const response = await axiosInstance.get<PaginatedResponse<BackendRisk>>(
        `/risks${buildQueryParams(params)}`
      );

      if (response.data.success && response.data.data) {
        return response.data.data.map(adaptBackendRisk);
      }
      return [];
    } catch (error) {
      console.error("Failed to fetch risks:", error);
      throw new Error("Request failed");
    }
  },

  /**
   * Get risk by ID
   */
  async getById(id: string): Promise<Risk | null> {
    try {
      // Extract numeric ID from string (e.g., "RISK-001" -> 1)
      const numericId = parseInt(id.replace(/\D/g, ""), 10);

      const response = await axiosInstance.get<ApiResponse<BackendRisk>>(
        `/risks/${numericId}`
      );
      const data = extractData(response);
      return adaptBackendRisk(data);
    } catch {
      return null;
    }
  },

  /**
   * Create new risk
   */
  async create(data: RiskInput): Promise<Risk> {
    try {
      const requestData: BackendRiskCreateRequest = {
        title: data.title,
        description: data.description,
        category_id: await resolveCategoryId(data.category),
        owner_id: data.ownerId,
        status: data.status
          ? mapFrontendStatusToBackend(data.status)
          : undefined,
      };

      const response = await axiosInstance.post<ApiResponse<BackendRisk>>(
        "/risks",
        requestData
      );
      const result = extractData(response);
      return adaptBackendRisk(result);
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
   * Update existing risk
   */
  async update(id: string, data: Partial<RiskInput>): Promise<Risk> {
    try {
      const numericId = parseInt(id.replace(/\D/g, ""), 10);

      const requestData: Record<string, unknown> = {};
      if (data.title) requestData.title = data.title;
      if (data.description) requestData.description = data.description;
      if (data.category)
        requestData.category_id = CATEGORY_CODE_TO_ID[data.category];
      if (data.status)
        requestData.status = mapFrontendStatusToBackend(data.status);

      const response = await axiosInstance.put<ApiResponse<BackendRisk>>(
        `/risks/${numericId}`,
        requestData
      );
      const result = extractData(response);
      return adaptBackendRisk(result);
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
   * Delete risk
   */
  async delete(id: string): Promise<void> {
    try {
      const numericId = parseInt(id.replace(/\D/g, ""), 10);
      await axiosInstance.delete(`/risks/${numericId}`);
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { error?: { message?: string } } };
      };
      throw new Error(err.response?.data?.error?.message || "Request failed");
    }
  },

  /**
   * Get risk statistics
   */
  async getStats(): Promise<BackendRiskStats> {
    try {
      const response = await axiosInstance.get<ApiResponse<BackendRiskStats>>(
        "/risks/statistics"
      );
      return extractData(response);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
      throw new Error("Request failed");
    }
  },

  /**
   * Change risk status
   */
  async changeStatus(id: string, status: RiskStatus): Promise<Risk> {
    try {
      const numericId = parseInt(id.replace(/\D/g, ""), 10);
      const response = await axiosInstance.patch<ApiResponse<BackendRisk>>(
        `/risks/${numericId}/status`,
        { status: mapFrontendStatusToBackend(status) }
      );
      const result = extractData(response);
      return adaptBackendRisk(result);
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
   * Get risks overdue for review
   */
  async getOverdueReview(): Promise<Risk[]> {
    try {
      const response = await axiosInstance.get<PaginatedResponse<BackendRisk>>(
        "/risks/overdue-review"
      );
      if (response.data.success && response.data.data) {
        return response.data.data.map(adaptBackendRisk);
      }
      return [];
    } catch (error) {
      console.error("Failed to fetch overdue review risks:", error);
      throw new Error("Request failed");
    }
  },
};

export default riskApi;
