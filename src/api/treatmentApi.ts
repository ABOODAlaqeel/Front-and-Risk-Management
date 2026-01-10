/**
 * Treatment API - Treatment Plan Service
 *
 * Handles all treatment-related operations with the Flask backend.
 * ⚠️ PRODUCTION MODE - All data comes from Backend only
 */

import axiosInstance, { extractData } from "./axiosInstance";
import {
  adaptBackendTreatment,
  adaptBackendTreatmentAction,
  mapFrontendApproachToBackend,
  mapFrontendActionStatusToBackend,
} from "./adapters";
import type { Treatment, TreatmentAction } from "@/types";
import type { TreatmentApproach, ActionStatus } from "@/utils/constants";
import type {
  ApiResponse,
  BackendTreatmentPlan,
  BackendTreatmentAction,
  BackendTreatmentPlanCreateRequest,
  BackendTreatmentActionCreateRequest,
} from "@/types/backend";

// ===========================================
// Types
// ===========================================

export interface TreatmentInput {
  riskId: string;
  approach: TreatmentApproach;
  title?: string;
  description?: string;
  targetDate?: string;
  estimatedBudget?: number;
}

export interface ActionInput {
  title: string;
  description?: string;
  owner: string;
  dueDate: string;
  priority?: "low" | "medium" | "high" | "urgent";
  /** Backend assignee user id */
  assigneeId?: number;
  /** Evidence URL for completion */
  evidenceLink?: string;
  /** Notes stored on completion */
  notes?: string;
  /** Optional status */
  status?: ActionStatus;
}

// ===========================================
// Treatment API
// ===========================================

export const treatmentApi = {
  /**
   * Get all treatments with their actions
   */
  async getAll(): Promise<Treatment[]> {
    try {
      const response = await axiosInstance.get<
        ApiResponse<BackendTreatmentPlan[]>
      >("/treatments");
      const plans = extractData(response);
      const treatmentsWithActions = await Promise.all(
        plans.map(async (plan) => {
          try {
            const actionsResponse = await axiosInstance.get<
              ApiResponse<BackendTreatmentAction[]>
            >(`/treatments/${plan.id}/actions`);
            const actions = extractData(actionsResponse);
            return { ...plan, actions };
          } catch {
            return { ...plan, actions: [] };
          }
        })
      );

      return treatmentsWithActions.map(adaptBackendTreatment);
    } catch (error) {
      console.error("Failed to fetch treatments:", error);
      throw new Error("Request failed");
    }
  },

  /**
   * Get treatments by risk ID
   */
  async getByRiskId(riskId: string): Promise<Treatment[]> {
    try {
      const numericId = parseInt(riskId.replace(/\D/g, ""), 10);
      const response = await axiosInstance.get<
        ApiResponse<BackendTreatmentPlan[]>
      >(`/treatments/risk/${numericId}/plans`);
      const plans = extractData(response);
      const treatmentsWithActions = await Promise.all(
        plans.map(async (plan) => {
          try {
            const actionsResponse = await axiosInstance.get<
              ApiResponse<BackendTreatmentAction[]>
            >(`/treatments/${plan.id}/actions`);
            const actions = extractData(actionsResponse);
            return { ...plan, actions };
          } catch {
            return { ...plan, actions: [] };
          }
        })
      );

      return treatmentsWithActions.map(adaptBackendTreatment);
    } catch (error) {
      console.error("Failed to fetch risk treatments:", error);
      throw new Error("Request failed");
    }
  },

  /**
   * Get treatment by ID
   */
  async getById(id: string): Promise<Treatment | null> {
    try {
      const numericId = parseInt(id.replace(/\D/g, ""), 10);
      const response = await axiosInstance.get<
        ApiResponse<BackendTreatmentPlan>
      >(`/treatments/${numericId}`);
      const data = extractData(response);
      return adaptBackendTreatment(data);
    } catch {
      return null;
    }
  },

  /**
   * Create treatment plan
   */
  async create(data: TreatmentInput): Promise<Treatment> {
    try {
      const numericRiskId = parseInt(data.riskId.replace(/\D/g, ""), 10);

      const requestData: BackendTreatmentPlanCreateRequest = {
        risk_id: numericRiskId,
        title: data.title || `Treatment plan - ${data.approach}`,
        strategy: mapFrontendApproachToBackend(data.approach),
        description: data.description,
        target_date: data.targetDate,
        estimated_budget: data.estimatedBudget,
      };

      const response = await axiosInstance.post<
        ApiResponse<BackendTreatmentPlan>
      >("/treatments", requestData);
      const result = extractData(response);
      return adaptBackendTreatment(result);
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
   * Update treatment plan
   */
  async update(id: string, data: Partial<TreatmentInput>): Promise<Treatment> {
    try {
      const numericId = parseInt(id.replace(/\D/g, ""), 10);

      const requestData: Record<string, unknown> = {};
      if (data.approach)
        requestData.strategy = mapFrontendApproachToBackend(data.approach);
      if (data.title) requestData.title = data.title;
      if (data.description) requestData.description = data.description;
      if (data.targetDate) requestData.target_date = data.targetDate;

      const response = await axiosInstance.put<
        ApiResponse<BackendTreatmentPlan>
      >(`/treatments/${numericId}`, requestData);
      const result = extractData(response);
      return adaptBackendTreatment(result);
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
   * Delete treatment plan
   */
  async delete(id: string): Promise<void> {
    try {
      const numericId = parseInt(id.replace(/\D/g, ""), 10);
      await axiosInstance.delete(`/treatments/${numericId}`);
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
   * Add action to treatment plan
   */
  async addAction(
    treatmentId: string,
    data: ActionInput
  ): Promise<TreatmentAction> {
    try {
      const numericId = parseInt(treatmentId.replace(/\D/g, ""), 10);

      const requestData: BackendTreatmentActionCreateRequest = {
        title: data.title,
        description: data.description,
        priority: data.priority || "medium",
        due_date: data.dueDate,
        assignee_id: data.assigneeId,
        notes: data.notes,
      };

      if (data.status && data.status !== "Done") {
        (requestData as Record<string, unknown>).is_completed =
          mapFrontendActionStatusToBackend(data.status);
      }

      const response = await axiosInstance.post<
        ApiResponse<BackendTreatmentAction>
      >(`/treatments/${numericId}/actions`, requestData);
      const created = extractData(response);

      if (data.status === "Done") {
        const completeResponse = await axiosInstance.post<
          ApiResponse<BackendTreatmentAction>
        >(`/treatments/actions/${created.id}/complete`, {
          notes: data.notes,
          evidence_url: data.evidenceLink,
        });
        const completed = extractData(completeResponse);
        return adaptBackendTreatmentAction(completed);
      }

      return adaptBackendTreatmentAction(created);
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
   * Update action
   */
  async updateAction(
    _treatmentId: string,
    actionId: string,
    data: Partial<ActionInput & { status: ActionStatus }>
  ): Promise<TreatmentAction> {
    try {
      const numericActionId = parseInt(actionId.replace(/\D/g, ""), 10);

      const requestData: Record<string, unknown> = {};
      if (data.title) requestData.title = data.title;
      if (data.description) requestData.description = data.description;
      if (data.dueDate) requestData.due_date = data.dueDate;
      if (data.assigneeId !== undefined)
        requestData.assignee_id = data.assigneeId;
      if (data.notes !== undefined) requestData.notes = data.notes;
      if (data.status && data.status !== "Done") {
        requestData.is_completed = mapFrontendActionStatusToBackend(
          data.status
        );
      }

      // Apply field updates first.
      let updated: BackendTreatmentAction | null = null;
      if (Object.keys(requestData).length > 0) {
        const updateResponse = await axiosInstance.put<
          ApiResponse<BackendTreatmentAction>
        >(`/treatments/actions/${numericActionId}`, requestData);
        updated = extractData(updateResponse);
      }

      // If completing, use the dedicated completion endpoint to persist evidence.
      if (data.status === "Done") {
        const completeResponse = await axiosInstance.post<
          ApiResponse<BackendTreatmentAction>
        >(`/treatments/actions/${numericActionId}/complete`, {
          notes: data.notes,
          evidence_url: data.evidenceLink,
        });
        const result = extractData(completeResponse);
        return adaptBackendTreatmentAction(result);
      }

      if (updated) return adaptBackendTreatmentAction(updated);

      // No-op fallback.
      const response = await axiosInstance.get<
        ApiResponse<BackendTreatmentAction>
      >(`/treatments/actions/${numericActionId}`);
      const result = extractData(response);
      return adaptBackendTreatmentAction(result);
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
   * Delete action
   */
  async deleteAction(_treatmentId: string, actionId: string): Promise<void> {
    try {
      const numericActionId = parseInt(actionId.replace(/\D/g, ""), 10);
      await axiosInstance.delete(`/treatments/actions/${numericActionId}`);
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
   * Approve treatment plan
   */
  async approve(id: string): Promise<Treatment> {
    try {
      const numericId = parseInt(id.replace(/\D/g, ""), 10);
      const response = await axiosInstance.patch<
        ApiResponse<BackendTreatmentPlan>
      >(`/treatments/${numericId}/approve`);
      const result = extractData(response);
      return adaptBackendTreatment(result);
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
   * Get treatment progress
   */
  async getProgress(id: string): Promise<number> {
    try {
      const numericId = parseInt(id.replace(/\D/g, ""), 10);
      const response = await axiosInstance.get<
        ApiResponse<{ progress: number }>
      >(`/treatments/${numericId}/progress`);
      const data = extractData(response);
      return data.progress;
    } catch {
      return 0;
    }
  },
};

export default treatmentApi;
