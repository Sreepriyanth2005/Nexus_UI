import { api } from "../../../config/axios";
import {
  CreateSubmitIdeaPayload,
  SubmitIdeaResponseItem,
  CreateIssueReportPayload,
  IssueReportResponseItem,
} from "./helpCenter.types";

export const helpCenterApi = {
  // --- SUBMIT IDEA ---
  submitIdea: async (payload: CreateSubmitIdeaPayload): Promise<SubmitIdeaResponseItem> => {
    const { data } = await api.post<{ success: boolean; data: SubmitIdeaResponseItem }>(
      "/help-center/submit-idea",
      payload
    );
    return data.data;
  },

  getMyIdeas: async (): Promise<SubmitIdeaResponseItem[]> => {
    const { data } = await api.get<{ success: boolean; data: SubmitIdeaResponseItem[] }>(
      "/help-center/submit-idea/my-ideas"
    );
    return data.data || [];
  },

  // --- ISSUE REPORTING ---
  submitIssueReport: async (payload: CreateIssueReportPayload): Promise<IssueReportResponseItem> => {
    const { data } = await api.post<{ success: boolean; data: IssueReportResponseItem }>(
      "/help-center/issue-reporting",
      payload
    );
    return data.data;
  },

  getMyIssueReports: async (): Promise<IssueReportResponseItem[]> => {
    const { data } = await api.get<{ success: boolean; data: IssueReportResponseItem[] }>(
      "/help-center/issue-reporting/my-reports"
    );
    return data.data || [];
  },
};
