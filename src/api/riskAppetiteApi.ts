/**
 *
 */
import axiosInstance, { extractData } from "./axiosInstance";

// ===========================================
// Types
// ===========================================

export type AppetiteLevel =
  | "within_appetite"
  | "approaching_limit"
  | "exceeded"
  | "critical";

export interface AppetiteThresholds {
  low: number;
  medium: number;
  high: number;
  critical: number;
  approaching_percentage: number;
}

export interface RiskEvaluation {
  risk_id: number;
  risk_code: string;
  level: AppetiteLevel;
  score: number;
  threshold: number;
  exceeded_by: number;
  requires_action: boolean;
  action_type: string | null;
  thresholds: AppetiteThresholds;
  actions_taken?: Array<{ action: string; [key: string]: unknown }>;
}

export interface ExceededRisk {
  id: number;
  risk_code: string;
  title: string;
  score: number;
  threshold: number;
  exceeded_by: number;
  level: AppetiteLevel;
  action_type: string | null;
  owner_id: number | null;
  status: string;
}

export interface AppetiteSummary {
  total_active_risks: number;
  within_appetite: number;
  exceeded_appetite: number;
  compliance_rate: number;
  thresholds: AppetiteThresholds;
  last_checked: string;
}

export interface CheckAllResult {
  total_checked: number;
  within_appetite: number;
  approaching_limit: number;
  exceeded: number;
  critical: number;
  notifications_sent: number;
  escalations_created: number;
  details: Array<{
    risk_id: number;
    risk_code: string;
    level: AppetiteLevel;
    score: number;
  }>;
}

// ===========================================
// API Functions
// ===========================================

export const riskAppetiteApi = {
    async getThresholds(): Promise<AppetiteThresholds> {
    const res = await axiosInstance.get("/risk-appetite/thresholds");
    return extractData(res);
  },

    async updateThresholds(
    thresholds: Partial<AppetiteThresholds>
  ): Promise<AppetiteThresholds> {
    const res = await axiosInstance.put(
      "/risk-appetite/thresholds",
      thresholds
    );
    return extractData(res);
  },

    async evaluateRisk(riskId: number): Promise<RiskEvaluation> {
    const res = await axiosInstance.get(`/risk-appetite/evaluate/${riskId}`);
    return extractData(res);
  },

    async checkRisk(
    riskId: number,
    options?: { notify?: boolean; auto_escalate?: boolean }
  ): Promise<RiskEvaluation> {
    const res = await axiosInstance.post(
      `/risk-appetite/check/${riskId}`,
      options || {}
    );
    return extractData(res);
  },

    async checkAllRisks(): Promise<CheckAllResult> {
    const res = await axiosInstance.post("/risk-appetite/check-all");
    return extractData(res);
  },

    async getExceededRisks(): Promise<{ risks: ExceededRisk[]; count: number }> {
    const res = await axiosInstance.get("/risk-appetite/exceeded");
    return extractData(res);
  },

    async getSummary(): Promise<AppetiteSummary> {
    const res = await axiosInstance.get("/risk-appetite/summary");
    return extractData(res);
  },
};

export default riskAppetiteApi;