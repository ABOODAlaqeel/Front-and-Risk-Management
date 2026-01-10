import axiosInstance, { extractData, buildQueryParams } from "./axiosInstance";
import { BackendKRI, ApiResponse, PaginatedResponse, KRI } from "../types";
import { adaptBackendKRI } from "./adapters";

const kriApi = {
    async getAll(filters?: Record<string, any>): Promise<KRI[]> {
    try {
      const queryParams = buildQueryParams(filters || {});
      const response = await axiosInstance.get<PaginatedResponse<BackendKRI>>(
        `/kris${queryParams}`
      );

      const data = extractData(response);
      return (data || []).map(adaptBackendKRI);
    } catch (error) {
      console.error("Error fetching KRIs:", error);
      return [];
    }
  },

    async getByRiskId(riskId: number | string): Promise<KRI[]> {
    try {
      const response = await axiosInstance.get<ApiResponse<BackendKRI[]>>(
        `/risks/${riskId}/kris`
      );

      const data = extractData(response);
      return (data || []).map(adaptBackendKRI);
    } catch (error) {
      console.error(`Error fetching KRIs for risk ${riskId}:`, error);
      return [];
    }
  },

    async getById(id: number | string): Promise<KRI | null> {
    try {
      const response = await axiosInstance.get<ApiResponse<BackendKRI>>(
        `/kris/${id}`
      );

      const data = extractData(response);
      return data ? adaptBackendKRI(data) : null;
    } catch (error) {
      console.error(`Error fetching KRI ${id}:`, error);
      return null;
    }
  },

    async updateValue(
    id: number | string,
    value: number,
    notes?: string
  ): Promise<KRI | null> {
    try {
      const response = await axiosInstance.post<ApiResponse<BackendKRI>>(
        `/kris/${id}/values`,
        { value, notes }
      );

      const data = extractData(response);
      return data ? adaptBackendKRI(data) : null;
    } catch (error) {
      console.error(`Error updating KRI ${id} value:`, error);
      return null;
    }
  },
};

export default kriApi;