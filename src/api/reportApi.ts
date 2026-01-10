/**
 * Report API - Report Generation Service
 *
 * Handles report generation and export with the Flask backend.
 * ⚠️ PRODUCTION MODE - All data comes from Backend only
 */

import axiosInstance, { extractData, buildQueryParams } from "./axiosInstance";
import type { ApiResponse } from "@/types/backend";

// ===========================================
// Types
// ===========================================

export interface ReportFilters {
  type:
    | "risk"
    | "assessment"
    | "treatment"
    | "audit"
    | "bcp"
    | "kri"
    | "incident";
  startDate?: string;
  endDate?: string;
  category?: string;
  status?: string;
  format?: "json" | "csv" | "pdf" | "excel";
}

export interface ReportData {
  title: string;
  generatedAt: string;
  filters: ReportFilters;
  summary: Record<string, unknown>;
  data: unknown[];
  charts?: Array<{
    type: string;
    title: string;
    data: unknown;
  }>;
}

// ===========================================
// Report API
// ===========================================

export const reportApi = {
  /**
   * Generate report
   */
  async generate(filters: ReportFilters): Promise<ReportData> {
    try {
      const params: Record<string, unknown> = {
        type: filters.type,
      };
      if (filters.startDate) params.start_date = filters.startDate;
      if (filters.endDate) params.end_date = filters.endDate;
      if (filters.category) params.category = filters.category;
      if (filters.status) params.status = filters.status;

      const response = await axiosInstance.post<ApiResponse<ReportData>>(
        "/reports/generate",
        params
      );
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
   * Export report to file
   */
  async export(
    filters: ReportFilters,
    format: "csv" | "pdf" | "excel" = "pdf"
  ): Promise<Blob> {
    try {
      const params: Record<string, unknown> = {
        type: filters.type,
        format,
      };
      if (filters.startDate) params.start_date = filters.startDate;
      if (filters.endDate) params.end_date = filters.endDate;
      if (filters.category) params.category = filters.category;
      if (filters.status) params.status = filters.status;

      const response = await axiosInstance.post("/reports/export", params, {
        responseType: "blob",
      });

      return response.data;
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
   * Get available report types
   */
  async getReportTypes(): Promise<
    Array<{ code: string; name: string; description: string }>
  > {
    try {
      const response = await axiosInstance.get<
        ApiResponse<Array<{ code: string; name: string; description: string }>>
      >("/reports/types");
      return extractData(response);
    } catch (error) {
      console.error("Failed to fetch report types:", error);
      throw new Error("Request failed");
    }
  },

  /**
   * Get scheduled reports
   */
  async getScheduledReports(): Promise<
    Array<{
      id: number;
      name: string;
      type: string;
      schedule: string;
      nextRun: string;
      recipients: string[];
    }>
  > {
    try {
      const response = await axiosInstance.get<
        ApiResponse<
          Array<{
            id: number;
            name: string;
            type: string;
            schedule: string;
            nextRun: string;
            recipients: string[];
          }>
        >
      >("/reports/scheduled");
      return extractData(response);
    } catch (error) {
      console.error("Failed to fetch scheduled reports:", error);
      throw new Error("Request failed");
    }
  },

  /**
   * Create scheduled report
   */
  async createScheduledReport(data: {
    name: string;
    type: string;
    schedule: string;
    filters?: ReportFilters;
    recipients: string[];
  }): Promise<{ id: number; name: string }> {
    try {
      const response = await axiosInstance.post<
        ApiResponse<{ id: number; name: string }>
      >("/reports/scheduled", data);
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
   * Delete scheduled report
   */
  async deleteScheduledReport(id: number): Promise<void> {
    try {
      await axiosInstance.delete(`/reports/scheduled/${id}`);
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
   * Get report history
   */
  async getHistory(filters?: {
    type?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    perPage?: number;
  }): Promise<
    Array<{
      id: number;
      type: string;
      generatedAt: string;
      generatedBy: string;
      format: string;
      downloadUrl: string;
    }>
  > {
    try {
      const params: Record<string, unknown> = {};
      if (filters?.type) params.type = filters.type;
      if (filters?.startDate) params.start_date = filters.startDate;
      if (filters?.endDate) params.end_date = filters.endDate;
      if (filters?.page) params.page = filters.page;
      if (filters?.perPage) params.per_page = filters.perPage;

      const response = await axiosInstance.get<
        ApiResponse<
          Array<{
            id: number;
            type: string;
            generatedAt: string;
            generatedBy: string;
            format: string;
            downloadUrl: string;
          }>
        >
      >(`/reports/history${buildQueryParams(params)}`);
      return extractData(response);
    } catch (error) {
      console.error("Failed to fetch report history:", error);
      throw new Error("Request failed");
    }
  },

  /**
   * Download report by ID
   */
  async download(reportId: number): Promise<Blob> {
    try {
      const response = await axiosInstance.get(
        `/reports/${reportId}/download`,
        {
          responseType: "blob",
        }
      );
      return response.data;
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
   * Get dashboard summary
   */
  async getDashboardSummary(): Promise<{
    totalRisks: number;
    openRisks: number;
    criticalRisks: number;
    treatmentsInProgress: number;
    upcomingDeadlines: number;
    recentIncidents: number;
    kriAlerts: number;
  }> {
    try {
      const response = await axiosInstance.get<
        ApiResponse<{
          totalRisks: number;
          openRisks: number;
          criticalRisks: number;
          treatmentsInProgress: number;
          upcomingDeadlines: number;
          recentIncidents: number;
          kriAlerts: number;
        }>
      >("/reports/dashboard");
      return extractData(response);
    } catch (error) {
      console.error("Failed to fetch dashboard summary:", error);
      throw new Error("Request failed");
    }
  },
};

export default reportApi;