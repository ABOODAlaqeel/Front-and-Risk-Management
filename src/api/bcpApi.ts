/**
 * BCP API - Business Continuity Planning Service
 *
 * Handles BCP services, plans, and tests with the Flask backend.
 * ⚠️ PRODUCTION MODE - All data comes from Backend only
 */

import axiosInstance, { extractData } from "./axiosInstance";
import {
  adaptBackendBusinessService,
  adaptBackendBCPTest,
  adaptBackendDRSite,
} from "./adapters";
import type { BCPService, BCPTest, DRSite } from "@/types";
import type {
  ApiResponse,
  BackendBusinessService,
  BackendBCPTest,
  BackendDRSite,
  BackendBCPPlan,
  BackendDRPlan,
  BackendBCPStats,
} from "@/types/backend";

// ===========================================
// Types
// ===========================================

export type BCPlan = {
  lastUpdated: string;
  status: string;
  sections: string[];
};

export type DRPlan = {
  lastUpdated: string;
  rto: string;
  rpo: string;
  sites: DRSite[];
};

// ===========================================
// BCP API
// ===========================================

export const bcpApi = {
  // ===========================================
  // Services
  // ===========================================

  /**
   * Get all BCP services
   */
  async getServices(): Promise<BCPService[]> {
    try {
      const response = await axiosInstance.get<
        ApiResponse<BackendBusinessService[]>
      >("/bcp/services");
      const data = extractData(response);
      return data.map(adaptBackendBusinessService);
    } catch (error) {
      console.error("Failed to fetch BCP services:", error);
      throw new Error("Request failed");
    }
  },

  /**
   * Get service by ID
   */
  async getServiceById(id: string): Promise<BCPService | null> {
    try {
      const numericId = parseInt(id.replace(/\D/g, ""), 10);
      const response = await axiosInstance.get<
        ApiResponse<BackendBusinessService>
      >(`/bcp/services/${numericId}`);
      const data = extractData(response);
      return adaptBackendBusinessService(data);
    } catch {
      return null;
    }
  },

  /**
   * Create new service
   */
  async createService(data: Omit<BCPService, "id">): Promise<BCPService> {
    try {
      const requestData = {
        name: data.name,
        criticality: data.criticality.toLowerCase(),
        rto: data.rto,
        rpo: data.rpo,
        dependencies: data.dependencies,
        department: data.owner,
      };

      const response = await axiosInstance.post<
        ApiResponse<BackendBusinessService>
      >("/bcp/services", requestData);
      const result = extractData(response);
      return adaptBackendBusinessService(result);
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
   * Update service
   */
  async updateService(
    id: string,
    data: Partial<BCPService>
  ): Promise<BCPService> {
    try {
      const numericId = parseInt(id.replace(/\D/g, ""), 10);

      const requestData: Record<string, unknown> = {};
      if (data.name) requestData.name = data.name;
      if (data.criticality)
        requestData.criticality = data.criticality.toLowerCase();
      if (data.rto) requestData.rto = data.rto;
      if (data.rpo) requestData.rpo = data.rpo;
      if (data.dependencies) requestData.dependencies = data.dependencies;
      if (data.owner) requestData.department = data.owner;

      const response = await axiosInstance.put<
        ApiResponse<BackendBusinessService>
      >(`/bcp/services/${numericId}`, requestData);
      const result = extractData(response);
      return adaptBackendBusinessService(result);
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
   * Delete service
   */
  async deleteService(id: string): Promise<void> {
    try {
      const numericId = parseInt(id.replace(/\D/g, ""), 10);
      await axiosInstance.delete(`/bcp/services/${numericId}`);
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { error?: { message?: string } } };
      };
      throw new Error(
        err.response?.data?.error?.message || "Request failed"
      );
    }
  },

  // ===========================================
  // BCP Plan
  // ===========================================

    async getBCPlan(): Promise<BCPlan & Record<string, unknown>> {
    try {
      const response = await axiosInstance.get<ApiResponse<BackendBCPPlan>>(
        "/bcp/plan"
      );
      const data = extractData(response);
      return {
        // Basic fields
        lastUpdated:
          data.updated_at?.split("T")[0] ||
          new Date().toISOString().split("T")[0],
        status: data.status || "Draft",
        sections: data.sections || [],
        // Extended fields
        id: (data as any).id,
        title: (data as any).title || "Business continuity plan",
        version: (data as any).version || "1.0",
        description: (data as any).description || "",
        effective_date: (data as any).effective_date || null,
        review_date: (data as any).review_date || null,
        last_reviewed_at: (data as any).last_reviewed_at || null,
        owner_id: (data as any).owner_id || null,
        owner_name: (data as any).owner_name || "",
        objectives: (data as any).objectives || "",
        scope: (data as any).scope || "",
        assumptions: (data as any).assumptions || "",
        emergency_contacts: (data as any).emergency_contacts || [],
        communication_plan: (data as any).communication_plan || "",
        activation_triggers: (data as any).activation_triggers || [],
      };
    } catch (error) {
      console.error("Failed to fetch BCP plan:", error);
      throw new Error("Request failed");
    }
  },

    async updateBCPlan(
    data: Partial<BCPlan> & Record<string, unknown>
  ): Promise<BCPlan> {
    try {
      const requestData: Record<string, unknown> = {};

      // Basic fields
      if (data.status)
        requestData.status = String(data.status)
          .toLowerCase()
          .replace(" ", "_");
      if (data.sections) requestData.sections = data.sections;

      // Extended fields
      if (data.title) requestData.title = data.title;
      if (data.version) requestData.version = data.version;
      if (data.description !== undefined)
        requestData.description = data.description;
      if (data.objectives !== undefined)
        requestData.objectives = data.objectives;
      if (data.scope !== undefined) requestData.scope = data.scope;
      if (data.assumptions !== undefined)
        requestData.assumptions = data.assumptions;
      if (data.emergency_contacts)
        requestData.emergency_contacts = data.emergency_contacts;
      if (data.communication_plan !== undefined)
        requestData.communication_plan = data.communication_plan;
      if (data.activation_triggers)
        requestData.activation_triggers = data.activation_triggers;
      if (data.owner_id) requestData.owner_id = data.owner_id;
      if (data.effective_date) requestData.effective_date = data.effective_date;
      if (data.review_date) requestData.review_date = data.review_date;

      const response = await axiosInstance.patch<ApiResponse<BackendBCPPlan>>(
        "/bcp/plan",
        requestData
      );
      const result = extractData(response);
      return {
        lastUpdated:
          result.updated_at?.split("T")[0] ||
          new Date().toISOString().split("T")[0],
        status: result.status || "Draft",
        sections: result.sections || [],
      };
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { error?: { message?: string } } };
      };
      throw new Error(
        err.response?.data?.error?.message || "Request failed"
      );
    }
  },

  // ===========================================
  // DR Plan
  // ===========================================

  /**
   * Get DR plan
   */
  async getDRPlan(): Promise<DRPlan> {
    try {
      const response = await axiosInstance.get<ApiResponse<BackendDRPlan>>(
        "/bcp/dr-plan"
      );
      const data = extractData(response);
      return {
        lastUpdated:
          data.last_updated?.split("T")[0] ||
          new Date().toISOString().split("T")[0],
        rto: data.rto || "4 hours",
        rpo: data.rpo || "1 hour",
        sites: (data.sites || []).map(adaptBackendDRSite),
      };
    } catch (error) {
      console.error("Failed to fetch DR plan:", error);
      throw new Error("Request failed");
    }
  },

  /**
   * Update DR plan
   */
  async updateDRPlan(data: Partial<DRPlan>): Promise<DRPlan> {
    try {
      const requestData: Record<string, unknown> = {};
      if (data.rto) requestData.rto = data.rto;
      if (data.rpo) requestData.rpo = data.rpo;

      const response = await axiosInstance.patch<ApiResponse<BackendDRPlan>>(
        "/bcp/dr-plan",
        requestData
      );
      const result = extractData(response);
      return {
        lastUpdated:
          result.last_updated?.split("T")[0] ||
          new Date().toISOString().split("T")[0],
        rto: result.rto || "4 hours",
        rpo: result.rpo || "1 hour",
        sites: (result.sites || []).map(adaptBackendDRSite),
      };
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { error?: { message?: string } } };
      };
      throw new Error(
        err.response?.data?.error?.message || "Request failed"
      );
    }
  },

  // ===========================================
  // DR Sites
  // ===========================================

  /**
   * Get all DR sites
   */
  /**
   * Get all DR sites
   */
  async getDRSites(): Promise<DRSite[]> {
    try {
      const response = await axiosInstance.get<ApiResponse<BackendDRSite[]>>(
        "/bcp/dr-sites"
      );
      const data = extractData(response);
      return data.map(adaptBackendDRSite);
    } catch (error) {
      console.error("Failed to fetch DR sites:", error);
      return [];
    }
  },

  /**
   * Get DR site by ID
   */
  async getDRSiteById(id: number): Promise<DRSite | null> {
    try {
      const response = await axiosInstance.get<ApiResponse<BackendDRSite>>(
        `/bcp/dr-sites/${id}`
      );
      const data = extractData(response);
      return adaptBackendDRSite(data);
    } catch {
      return null;
    }
  },

  /**
   * Create DR site
   */
  async createDRSite(
    data: Partial<DRSite> & Record<string, unknown>
  ): Promise<DRSite> {
    try {
      const requestData = {
        name: data.name,
        description: data.description,
        site_type: data.siteType || data.site_type || "warm_site",
        location: data.location,
        capacity: data.capacity,
        rto: data.rto,
        rpo: data.rpo,
        is_primary: data.isPrimary || data.is_primary,
        is_active: data.isActive ?? data.is_active ?? true,
        notes: data.notes,
      };

      const response = await axiosInstance.post<ApiResponse<BackendDRSite>>(
        "/bcp/dr-sites",
        requestData
      );
      const result = extractData(response);
      return adaptBackendDRSite(result);
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
   * Update DR site
   */
  async updateDRSite(
    id: number,
    data: Partial<DRSite> & Record<string, unknown>
  ): Promise<DRSite> {
    try {
      const requestData: Record<string, unknown> = {};
      if (data.name) requestData.name = data.name;
      if (data.description !== undefined)
        requestData.description = data.description;
      if (data.siteType || data.site_type)
        requestData.site_type = data.siteType || data.site_type;
      if (data.location !== undefined) requestData.location = data.location;
      if (data.capacity !== undefined) requestData.capacity = data.capacity;
      if (data.rto !== undefined) requestData.rto = data.rto;
      if (data.rpo !== undefined) requestData.rpo = data.rpo;
      if (data.isPrimary !== undefined || data.is_primary !== undefined)
        requestData.is_primary = data.isPrimary ?? data.is_primary;
      if (data.isActive !== undefined || data.is_active !== undefined)
        requestData.is_active = data.isActive ?? data.is_active;
      if (data.notes !== undefined) requestData.notes = data.notes;

      const response = await axiosInstance.put<ApiResponse<BackendDRSite>>(
        `/bcp/dr-sites/${id}`,
        requestData
      );
      const result = extractData(response);
      return adaptBackendDRSite(result);
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
   * Delete DR site
   */
  async deleteDRSite(id: number): Promise<void> {
    try {
      await axiosInstance.delete(`/bcp/dr-sites/${id}`);
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { error?: { message?: string } } };
      };
      throw new Error(
        err.response?.data?.error?.message || "Request failed"
      );
    }
  },

  // ===========================================
  // Tests
  // ===========================================

  /**
   * Get all BCP/DR tests
   */
  async getTests(): Promise<BCPTest[]> {
    try {
      const response = await axiosInstance.get<ApiResponse<BackendBCPTest[]>>(
        "/bcp/tests"
      );
      const data = extractData(response);
      return data.map(adaptBackendBCPTest);
    } catch (error) {
      console.error("Failed to fetch BCP tests:", error);
      throw new Error("Request failed");
    }
  },

  /**
   * Get test by ID
   */
  async getTestById(id: string): Promise<BCPTest | null> {
    try {
      const numericId = parseInt(id.replace(/\D/g, ""), 10);
      const response = await axiosInstance.get<ApiResponse<BackendBCPTest>>(
        `/bcp/tests/${numericId}`
      );
      const data = extractData(response);
      return adaptBackendBCPTest(data);
    } catch {
      return null;
    }
  },

  /**
   * Create new test
   */
  async createTest(data: Omit<BCPTest, "id">): Promise<BCPTest> {
    try {
      const serviceIds = (data.serviceIds || [])
        .map((id) => parseInt(id.replace(/\D/g, ""), 10))
        .filter((id) => Number.isFinite(id) && id > 0);

      const drSiteId = data.drTargetId
        ? parseInt(data.drTargetId.replace(/\D/g, ""), 10)
        : undefined;

      const requestData = {
        name: data.name,
        test_type: data.type.toLowerCase(),
        scheduled_date: data.date,
        status: data.status.toLowerCase(),
        duration_minutes: data.durationMinutes,
        notes: data.notes,
        service_ids: serviceIds.length > 0 ? serviceIds : undefined,
        dr_site_id:
          data.type === "DR" && drSiteId && Number.isFinite(drSiteId)
            ? drSiteId
            : undefined,
      };

      const response = await axiosInstance.post<ApiResponse<BackendBCPTest>>(
        "/bcp/tests",
        requestData
      );
      const result = extractData(response);
      return adaptBackendBCPTest(result);
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
   * Update test
   */
  async updateTest(id: string, data: Partial<BCPTest>): Promise<BCPTest> {
    try {
      const numericId = parseInt(id.replace(/\D/g, ""), 10);

      const requestData: Record<string, unknown> = {};
      if (data.name) requestData.name = data.name;
      if (data.type) requestData.test_type = data.type.toLowerCase();
      if (data.date) requestData.scheduled_date = data.date;
      if (data.status) requestData.status = data.status.toLowerCase();
      if (data.durationMinutes)
        requestData.duration_minutes = data.durationMinutes;
      if (data.notes) requestData.notes = data.notes;
      if (data.serviceIds) {
        const ids = data.serviceIds
          .map((v) => parseInt(String(v).replace(/\D/g, ""), 10))
          .filter((n) => Number.isFinite(n) && n > 0);
        requestData.service_ids = ids;
      }
      if (data.drTargetId !== undefined) {
        const siteId = data.drTargetId
          ? parseInt(String(data.drTargetId).replace(/\D/g, ""), 10)
          : null;
        requestData.dr_site_id =
          siteId && Number.isFinite(siteId) ? siteId : null;
      }

      const response = await axiosInstance.put<ApiResponse<BackendBCPTest>>(
        `/bcp/tests/${numericId}`,
        requestData
      );
      const result = extractData(response);
      return adaptBackendBCPTest(result);
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
   * Delete test
   */
  async deleteTest(id: string): Promise<void> {
    try {
      const numericId = parseInt(id.replace(/\D/g, ""), 10);
      await axiosInstance.delete(`/bcp/tests/${numericId}`);
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { error?: { message?: string } } };
      };
      throw new Error(
        err.response?.data?.error?.message || "Request failed"
      );
    }
  },

  // ===========================================
  // Statistics
  // ===========================================

  /**
   * Get BCP dashboard statistics
   */
  async getStats(): Promise<BackendBCPStats> {
    try {
      const response = await axiosInstance.get<ApiResponse<BackendBCPStats>>(
        "/bcp/statistics"
      );
      return extractData(response);
    } catch (error) {
      console.error("Failed to fetch BCP stats:", error);
      throw new Error("Request failed");
    }
  },
};

export default bcpApi;
