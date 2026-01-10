import axiosInstance, { extractData, buildQueryParams } from "./axiosInstance";
import {
  BackendIncident,
  ApiResponse,
  PaginatedResponse,
  Incident,
} from "../types";
import { adaptBackendIncident } from "./adapters";

const incidentApi = {
    async getAll(filters?: Record<string, any>): Promise<Incident[]> {
    try {
      const queryParams = buildQueryParams(filters || {});
      const response = await axiosInstance.get<
        PaginatedResponse<BackendIncident>
      >(`/incidents${queryParams}`);

      const data = extractData(response);
      return (data || []).map(adaptBackendIncident);
    } catch (error) {
      console.error("Error fetching incidents:", error);
      return [];
    }
  },

    async getByRiskId(riskId: number | string): Promise<Incident[]> {
    try {
      const response = await axiosInstance.get<ApiResponse<BackendIncident[]>>(
        `/risks/${riskId}/incidents`
      );

      const data = extractData(response);
      return (data || []).map(adaptBackendIncident);
    } catch (error) {
      console.error(`Error fetching incidents for risk ${riskId}:`, error);
      return [];
    }
  },

    async getById(id: number | string): Promise<Incident | null> {
    try {
      const response = await axiosInstance.get<ApiResponse<BackendIncident>>(
        `/incidents/${id}`
      );

      const data = extractData(response);
      return data ? adaptBackendIncident(data) : null;
    } catch (error) {
      console.error(`Error fetching incident ${id}:`, error);
      return null;
    }
  },
};

export default incidentApi;