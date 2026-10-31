import { api } from "../../config/axios";
import {
  CreateSubmitIdeaPayload,
  SubmitIdeaItem,
  CreateIssueReportPayload,
  IssueReportItem,
} from "./helpCenter.types";

export const helpCenterApi = {
  // --- SUBMIT IDEA ENDPOINTS ---
  submitIdea: async (payload: CreateSubmitIdeaPayload): Promise<SubmitIdeaItem> => {
    const { data } = await api.post<{ success: boolean; data: SubmitIdeaItem }>(
      "/help-center/submit-idea",
      payload
    );
    return data.data;
  },

  getMyIdeas: async (): Promise<SubmitIdeaItem[]> => {
    const { data } = await api.get<{ success: boolean; data: SubmitIdeaItem[] }>(
      "/help-center/submit-idea/my-ideas"
    );
    return data.data || [];
  },

  getAllIdeas: async (): Promise<SubmitIdeaItem[]> => {
    const { data } = await api.get<{ success: boolean; data: SubmitIdeaItem[] }>(
      "/help-center/submit-idea/all"
    );
    return data.data || [];
  },

  // --- ISSUE REPORTING ENDPOINTS ---
  submitIssueReport: async (payload: CreateIssueReportPayload): Promise<IssueReportItem> => {
    const { data } = await api.post<{ success: boolean; data: IssueReportItem }>(
      "/help-center/issue-reporting",
      payload
    );
    return data.data;
  },

  getMyIssueReports: async (): Promise<IssueReportItem[]> => {
    const { data } = await api.get<{ success: boolean; data: IssueReportItem[] }>(
      "/help-center/issue-reporting/my-reports"
    );
    return data.data || [];
  },

  getAllIssueReports: async (): Promise<IssueReportItem[]> => {
    const { data } = await api.get<{ success: boolean; data: IssueReportItem[] }>(
      "/help-center/issue-reporting/all"
    );
    return data.data || [];
  },
};
