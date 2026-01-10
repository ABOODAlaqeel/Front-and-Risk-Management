/**
 *
 */
import axiosInstance, { extractData } from "./axiosInstance";

// ===========================================
// Types
// ===========================================

export type NotificationType =
  | "review_reminder"
  | "risk_escalation"
  | "appetite_exceeded"
  | "treatment_due"
  | "assessment_required"
  | "system_alert"
  | "committee_decision"
  | "general";

export type NotificationPriority = "low" | "medium" | "high" | "critical";

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  user_id: number;
  risk_id?: number;
  is_read: boolean;
  read_at?: string;
  action_url?: string;
  expires_at?: string;
  source: string;
  is_expired: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  unread_count: number;
  total: number;
}

export interface ScheduledJob {
  id: string;
  name: string;
  next_run: string | null;
  trigger: string;
}

// ===========================================
// API Functions
// ===========================================

export const notificationApi = {
    async getNotifications(params?: {
    unread_only?: boolean;
    type?: NotificationType;
    limit?: number;
    offset?: number;
  }): Promise<NotificationsResponse> {
    const queryParams = new URLSearchParams();
    if (params?.unread_only) queryParams.append("unread_only", "true");
    if (params?.type) queryParams.append("type", params.type);
    if (params?.limit) queryParams.append("limit", String(params.limit));
    if (params?.offset) queryParams.append("offset", String(params.offset));

    const queryString = queryParams.toString();
    const url = `/notifications${queryString ? `?${queryString}` : ""}`;
    const res = await axiosInstance.get(url);
    return extractData(res);
  },

    async getUnreadCount(): Promise<number> {
    const res = await axiosInstance.get("/notifications/unread-count");
    const data = extractData(res);
    return data?.count ?? 0;
  },

    async getNotification(id: number): Promise<Notification> {
    const res = await axiosInstance.get(`/notifications/${id}`);
    return extractData(res);
  },

    async markAsRead(id: number): Promise<void> {
    await axiosInstance.post(`/notifications/${id}/read`);
  },

    async markAllAsRead(): Promise<number> {
    const res = await axiosInstance.post("/notifications/read-all");
    const data = extractData(res);
    return data?.count ?? 0;
  },

    async deleteNotification(id: number): Promise<void> {
    await axiosInstance.delete(`/notifications/${id}`);
  },

    async deleteAllRead(): Promise<number> {
    const res = await axiosInstance.delete("/notifications/delete-read");
    const data = extractData(res);
    return data?.count ?? 0;
  },

    async getScheduledJobs(): Promise<ScheduledJob[]> {
    const res = await axiosInstance.get("/notifications/scheduler/jobs");
    const data = extractData(res);
    return data?.jobs ?? [];
  },

    async runJobNow(jobId: string): Promise<void> {
    await axiosInstance.post(`/notifications/scheduler/jobs/${jobId}/run`);
  },

    async createTestNotification(): Promise<Notification> {
    const res = await axiosInstance.post("/notifications/test");
    return extractData(res);
  },
};

export default notificationApi;