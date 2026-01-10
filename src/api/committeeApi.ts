import axiosInstance, { extractData } from "./axiosInstance";
import type { CommitteeMeeting, CommitteeEscalation } from "@/types";

export const committeeApi = {
  async getMeetings(): Promise<CommitteeMeeting[]> {
    const res = await axiosInstance.get("/committee/meetings");
    return extractData(res);
  },
  async createMeeting(data: Partial<CommitteeMeeting>): Promise<CommitteeMeeting> {
    const res = await axiosInstance.post("/committee/meetings", data);
    return extractData(res);
  },
  async updateMeeting(id: number, data: Partial<CommitteeMeeting>): Promise<CommitteeMeeting> {
    const res = await axiosInstance.put(`/committee/meetings/${id}`, data);
    return extractData(res);
  },
  async deleteMeeting(id: number): Promise<void> {
    await axiosInstance.delete(`/committee/meetings/${id}`);
  },
  async getEscalations(): Promise<CommitteeEscalation[]> {
    const res = await axiosInstance.get("/committee/escalations");
    return extractData(res);
  },
  async createEscalation(data: Partial<CommitteeEscalation>): Promise<CommitteeEscalation> {
    const res = await axiosInstance.post("/committee/escalations", data);
    return extractData(res);
  },
  async deleteEscalation(id: number): Promise<void> {
    await axiosInstance.delete(`/committee/escalations/${id}`);
  },
};

export default committeeApi;