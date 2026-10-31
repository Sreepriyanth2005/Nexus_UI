import { api } from "../../../config/axios";
import {
  SupportDashboardMetrics,
  PlatformHealthResult,
  TicketListQuery,
  TicketDetailResult,
  UserLookupQuery,
  UserLookupListResult,
  SupportAuditLogQuery,
  SupportAuditLogListResult,
  CreateTicketDTO,
  ReplyTicketDTO,
  AssignTicketDTO,
  UpdateUserStatusDTO,
  UnlockAccountDTO,
  UploadTicketAttachmentDTO,
} from "./support.types";

export const getSupportDashboardMetrics = async (): Promise<SupportDashboardMetrics> => {
  const response = await api.get("/support/dashboard-metrics");
  return response.data?.data || response.data;
};

export const getPlatformHealth = async (): Promise<any> => {
  const response = await api.get("/platform/health/detailed");
  return response.data?.data || response.data;
};

export const getPlatformMetrics = async (metric: string, range: string): Promise<any> => {
  const response = await api.get("/platform/metrics", { params: { metric, range } });
  return response.data?.data || response.data;
};

export const createTicket = async (data: CreateTicketDTO): Promise<any> => {
  const response = await api.post("/support/tickets", data);
  return response.data?.data || response.data;
};

export const listTickets = async (params?: TicketListQuery): Promise<any> => { 
  const response = await api.get("/support/tickets", { params });
  return response.data;
};

export const listMyTickets = async (params?: TicketListQuery): Promise<any> => { 
  const response = await api.get("/support/my-tickets", { params });
  return response.data;
};

export const getTicketDetail = async (id: string): Promise<TicketDetailResult> => {
  const response = await api.get(`/support/tickets/${id}`);
  return response.data?.data || response.data;
};

export const replyTicket = async (id: string, data: ReplyTicketDTO): Promise<any> => {
  const response = await api.post(`/support/tickets/${id}/reply`, data);
  return response.data?.data || response.data;
};

export const resolveTicket = async (id: string): Promise<any> => {
  const response = await api.patch(`/support/tickets/${id}/resolve`);
  return response.data?.data || response.data;
};

export const assignTicket = async (id: string, data: AssignTicketDTO): Promise<any> => {
  const response = await api.patch(`/support/tickets/${id}/assign`, data);
  return response.data?.data || response.data;
};

export const listUsersForLookup = async (params?: UserLookupQuery): Promise<UserLookupListResult> => {
  const response = await api.get("/support/users", { params });
  return response.data;
};

export const getUserDetail = async (userId: string): Promise<any> => {
  const response = await api.get(`/support/users/${userId}`);
  return response.data?.data || response.data;
};

export const unlockUserAccount = async (userId: string, data: UnlockAccountDTO): Promise<any> => {
  const response = await api.post(`/support/users/${userId}/unlock`, data);
  return response.data?.data || response.data;
};

export const resendUserOtp = async (userId: string): Promise<any> => {
  const response = await api.post(`/support/users/${userId}/resend-otp`);
  return response.data?.data || response.data;
};

export const forceProfileReverify = async (userId: string): Promise<any> => {
  const response = await api.post(`/support/users/${userId}/force-reverify`);
  return response.data?.data || response.data;
};

export const reissueUserCertificate = async (userId: string): Promise<any> => {
  const response = await api.post(`/support/users/${userId}/reissue-certificate`);
  return response.data?.data || response.data;
};

export const updateUserStatus = async (userId: string, data: UpdateUserStatusDTO): Promise<any> => {
  const response = await api.patch(`/support/users/${userId}/status`, data);
  return response.data?.data || response.data;
};

export const getSupportAuditLogs = async (params?: SupportAuditLogQuery): Promise<SupportAuditLogListResult> => {
  const response = await api.get("/support/audit-logs", { params });
  return response.data;
};

export const exportSupportAuditLogs = async (params?: SupportAuditLogQuery): Promise<Blob> => {
  const response = await api.get("/support/audit-logs/export", {
    params,
    responseType: "blob",
  });
  return response.data;
};

export const uploadTicketAttachment = async (id: string, data: UploadTicketAttachmentDTO): Promise<any> => {
  const formData = new FormData();
  formData.append("file", data.file);
  if (data.messageId) {
    formData.append("messageId", data.messageId);
  }

  const response = await api.post(`/support/tickets/${id}/attachments`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data?.data || response.data;
};
