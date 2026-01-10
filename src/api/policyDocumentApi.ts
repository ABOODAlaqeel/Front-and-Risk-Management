import axiosInstance from "./axiosInstance";

// ===========================================
// Types
// ===========================================

export interface PolicyDocument {
  id: number;
  document_code: string | null;
  title: string;
  title_en?: string;
  description?: string;
  type: PolicyDocumentType;
  category?: string;
  status: PolicyDocumentStatus;
  version: string;
  issue_date?: string;
  effective_date?: string;
  expiry_date?: string;
  review_date?: string;
  last_reviewed_date?: string;
  owner_id?: number;
  owner_name?: string;
  approver_id?: number;
  approver_name?: string;
  department?: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  file_type?: string;
  keywords?: string;
  scope?: string;
  references?: string;
  notes?: string;
  is_expired: boolean;
  needs_review: boolean;
  created_at?: string;
  updated_at?: string;
}

export type PolicyDocumentType =
  | "policy"
  | "framework"
  | "guideline"
  | "procedure"
  | "standard"
  | "manual"
  | "template"
  | "defense_line";

export type PolicyDocumentStatus =
  | "draft"
  | "under_review"
  | "approved"
  | "active"
  | "expired"
  | "archived";

export interface PolicyDocumentInput {
  title: string;
  title_en?: string;
  description?: string;
  type?: PolicyDocumentType;
  category?: string;
  status?: PolicyDocumentStatus;
  version?: string;
  issue_date?: string;
  effective_date?: string;
  expiry_date?: string;
  review_date?: string;
  owner_id?: number;
  approver_id?: number;
  department?: string;
  file_url?: string;
  file_name?: string;
  keywords?: string;
  scope?: string;
  references?: string;
  notes?: string;
}

export interface PolicyDocumentFilters {
  type?: PolicyDocumentType;
  status?: PolicyDocumentStatus;
  category?: string;
  department?: string;
  search?: string;
  needs_review?: boolean;
  expired?: boolean;
  page?: number;
  per_page?: number;
}

export interface PolicyDocumentStats {
  total: number;
  by_status: Record<string, number>;
  by_type: Record<string, number>;
  needs_review: number;
  expired: number;
  active: number;
  draft: number;
}

export interface PolicyDocumentTypeOption {
  value: PolicyDocumentType;
  label: string;
  label_en: string;
}

export interface PolicyDocumentStatusOption {
  value: PolicyDocumentStatus;
  label: string;
  label_en: string;
}

// ===========================================
// API Functions
// ===========================================

const BASE_URL = "/policies";

export const policyDocumentApi = {
    getAll: async (
    filters?: PolicyDocumentFilters
  ): Promise<{
    items: PolicyDocument[];
    total: number;
    pages: number;
    current_page: number;
  }> => {
    const params = new URLSearchParams();
    if (filters) {
      if (filters.type) params.append("type", filters.type);
      if (filters.status) params.append("status", filters.status);
      if (filters.category) params.append("category", filters.category);
      if (filters.department) params.append("department", filters.department);
      if (filters.search) params.append("search", filters.search);
      if (filters.needs_review) params.append("needs_review", "true");
      if (filters.expired) params.append("expired", "true");
      if (filters.page) params.append("page", filters.page.toString());
      if (filters.per_page)
        params.append("per_page", filters.per_page.toString());
    }
    const response = await axiosInstance.get(
      `${BASE_URL}?${params.toString()}`
    );
    return response.data.data;
  },

    getById: async (id: number): Promise<PolicyDocument> => {
    const response = await axiosInstance.get(`${BASE_URL}/${id}`);
    return response.data.data;
  },

    create: async (data: PolicyDocumentInput): Promise<PolicyDocument> => {
    const response = await axiosInstance.post(BASE_URL, data);
    return response.data.data;
  },

    update: async (
    id: number,
    data: Partial<PolicyDocumentInput>
  ): Promise<PolicyDocument> => {
    const response = await axiosInstance.put(`${BASE_URL}/${id}`, data);
    return response.data.data;
  },

    delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`${BASE_URL}/${id}`);
  },

    approve: async (id: number): Promise<PolicyDocument> => {
    const response = await axiosInstance.post(`${BASE_URL}/${id}/approve`);
    return response.data.data;
  },

    activate: async (id: number): Promise<PolicyDocument> => {
    const response = await axiosInstance.post(`${BASE_URL}/${id}/activate`);
    return response.data.data;
  },

    archive: async (id: number): Promise<PolicyDocument> => {
    const response = await axiosInstance.post(`${BASE_URL}/${id}/archive`);
    return response.data.data;
  },

    markReviewed: async (
    id: number,
    nextReviewDays?: number
  ): Promise<PolicyDocument> => {
    const response = await axiosInstance.post(`${BASE_URL}/${id}/review`, {
      next_review_days: nextReviewDays || 365,
    });
    return response.data.data;
  },

    getStatistics: async (): Promise<PolicyDocumentStats> => {
    const response = await axiosInstance.get(`${BASE_URL}/statistics`);
    return response.data.data;
  },

    getTypes: async (): Promise<PolicyDocumentTypeOption[]> => {
    const response = await axiosInstance.get(`${BASE_URL}/types`);
    return response.data.data;
  },

    getStatuses: async (): Promise<PolicyDocumentStatusOption[]> => {
    const response = await axiosInstance.get(`${BASE_URL}/statuses`);
    return response.data.data;
  },
};

export default policyDocumentApi;