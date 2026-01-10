/**
 * Assessment API - Risk Assessment Service
 *
 * Handles all assessment-related operations with the Flask backend.
 * ⚠️ PRODUCTION MODE - All data comes from Backend only
 */

import axiosInstance, { extractData } from "./axiosInstance";
import { adaptBackendAssessment } from "./adapters";
import type { Assessment } from "@/types";
import type {
  ApiResponse,
  BackendAssessment,
  BackendAssessmentCreateRequest,
  BackendRiskMatrixData,
} from "@/types/backend";

// ===========================================
// Types
// ===========================================

export interface AssessmentInput {
  riskId: string;
  likelihood: number;
  impact: number;
  notes?: string;
  type?: "inherent" | "residual";
}

// ===========================================
// Assessment API
// ===========================================

export const assessmentApi = {
  /**
   * Get all assessments
   */
  async getAll(): Promise<Assessment[]> {
    try {
      const response = await axiosInstance.get<
        ApiResponse<BackendAssessment[]>
      >("/assessments");
      const data = extractData(response);
      return data.map(adaptBackendAssessment);
    } catch (error) {
      console.error("Failed to fetch assessments:", error);
      throw new Error("Request failed");
    }
  },

  /**
   * Get assessments by risk ID
   */
  async getByRiskId(riskId: string): Promise<Assessment[]> {
    try {
      const numericId = parseInt(riskId.replace(/\D/g, ""), 10);
      const response = await axiosInstance.get<
        ApiResponse<BackendAssessment[]>
      >(`/risks/${numericId}/assessments`);
      const data = extractData(response);
      return data.map(adaptBackendAssessment);
    } catch (error) {
      console.error("Failed to fetch risk assessments:", error);
      throw new Error("Request failed");
    }
  },

  /**
   * Get assessment by ID
   */
  async getById(id: string): Promise<Assessment | null> {
    try {
      const numericId = parseInt(id.replace(/\D/g, ""), 10);
      const response = await axiosInstance.get<ApiResponse<BackendAssessment>>(
        `/assessments/${numericId}`
      );
      const data = extractData(response);
      return adaptBackendAssessment(data);
    } catch {
      return null;
    }
  },

  /**
   * Create new assessment
   */
  async create(data: AssessmentInput): Promise<Assessment> {
    try {
      const numericRiskId = parseInt(data.riskId.replace(/\D/g, ""), 10);

      const requestData: BackendAssessmentCreateRequest = {
        risk_id: numericRiskId,
        assessment_type: data.type || "inherent",
        likelihood: data.likelihood,
        impact: data.impact,
        notes: data.notes,
      };

      const response = await axiosInstance.post<ApiResponse<BackendAssessment>>(
        "/assessments",
        requestData
      );
      const result = extractData(response);
      return adaptBackendAssessment(result);
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
   * Update assessment
   */
  async update(
    id: string,
    data: Partial<AssessmentInput>
  ): Promise<Assessment> {
    try {
      const numericId = parseInt(id.replace(/\D/g, ""), 10);

      const requestData: Record<string, unknown> = {};
      if (data.likelihood !== undefined)
        requestData.likelihood = data.likelihood;
      if (data.impact !== undefined) requestData.impact = data.impact;
      if (data.notes !== undefined) requestData.notes = data.notes;

      const response = await axiosInstance.put<ApiResponse<BackendAssessment>>(
        `/assessments/${numericId}`,
        requestData
      );
      const result = extractData(response);
      return adaptBackendAssessment(result);
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
   * Delete assessment
   */
  async delete(id: string): Promise<void> {
    try {
      const numericId = parseInt(id.replace(/\D/g, ""), 10);
      await axiosInstance.delete(`/assessments/${numericId}`);
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
   * Get risk matrix data
   */
  async getRiskMatrix(): Promise<BackendRiskMatrixData> {
    try {
      const response = await axiosInstance.get<
        ApiResponse<BackendRiskMatrixData>
      >("/assessments/matrix");
      return extractData(response);
    } catch (error) {
      console.error("Failed to fetch risk matrix:", error);
      throw new Error("Request failed");
    }
  },

  /**
   * Approve assessment
   */
  async approve(id: string): Promise<Assessment> {
    try {
      const numericId = parseInt(id.replace(/\D/g, ""), 10);
      const response = await axiosInstance.patch<
        ApiResponse<BackendAssessment>
      >(`/assessments/${numericId}/approve`);
      const result = extractData(response);
      return adaptBackendAssessment(result);
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
   * Reject assessment
   */
  async reject(id: string, reason: string): Promise<Assessment> {
    try {
      const numericId = parseInt(id.replace(/\D/g, ""), 10);
      const response = await axiosInstance.patch<
        ApiResponse<BackendAssessment>
      >(`/assessments/${numericId}/reject`, { rejection_reason: reason });
      const result = extractData(response);
      return adaptBackendAssessment(result);
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

export default assessmentApi;