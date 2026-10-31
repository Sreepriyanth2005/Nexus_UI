import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as supportApi from "../../core/api/support/support.api";
import {
  TicketListQuery,
  UserLookupQuery,
  SupportAuditLogQuery,
  CreateTicketDTO,
  ReplyTicketDTO,
  AssignTicketDTO,
  UpdateUserStatusDTO,
  UnlockAccountDTO,
  UploadTicketAttachmentDTO,
} from "../../core/api/support/support.types";

export const supportKeys = {
  all: ["support"] as const,
  dashboardMetrics: () => [...supportKeys.all, "dashboardMetrics"] as const,
  platformHealth: () => [...supportKeys.all, "platformHealth"] as const,
  tickets: () => [...supportKeys.all, "tickets"] as const,
  myTickets: () => [...supportKeys.all, "myTickets"] as const,
  ticketList: (filters: TicketListQuery) => [...supportKeys.tickets(), filters] as const,
  myTicketList: (filters: TicketListQuery) => [...supportKeys.myTickets(), filters] as const,
  ticketDetail: (id: string) => [...supportKeys.tickets(), "detail", id] as const,
  users: () => [...supportKeys.all, "users"] as const,
  userList: (filters: UserLookupQuery) => [...supportKeys.users(), filters] as const,
  userDetail: (id: string) => [...supportKeys.users(), "detail", id] as const,
  auditLogs: () => [...supportKeys.all, "auditLogs"] as const,
  auditLogList: (filters: SupportAuditLogQuery) => [...supportKeys.auditLogs(), filters] as const,
};

// ---------------------- Queries ----------------------

export const useSupportDashboardMetrics = () => {
  return useQuery({
    queryKey: supportKeys.dashboardMetrics(),
    queryFn: supportApi.getSupportDashboardMetrics,
  });
};

export const usePlatformHealth = () => {
  return useQuery({
    queryKey: supportKeys.platformHealth(),
    queryFn: supportApi.getPlatformHealth,
    refetchInterval: 30000, // Auto-refresh every 30s
  });
};

export const usePlatformMetrics = (metric: string, range: string) => {
  return useQuery({
    queryKey: [...supportKeys.platformHealth(), "metrics", metric, range],
    queryFn: () => supportApi.getPlatformMetrics(metric, range),
    refetchInterval: 30000,
  });
};

export const useTickets = (filters: TicketListQuery) => {
  return useQuery({
    queryKey: supportKeys.ticketList(filters),
    queryFn: () => supportApi.listTickets(filters),
  });
};

export const useMyTickets = (filters: TicketListQuery) => {
  return useQuery({
    queryKey: supportKeys.myTicketList(filters),
    queryFn: () => supportApi.listMyTickets(filters),
  });
};

export const useTicketDetail = (id: string) => {
  return useQuery({
    queryKey: supportKeys.ticketDetail(id),
    queryFn: () => supportApi.getTicketDetail(id),
    enabled: !!id,
  });
};

export const useSupportUsers = (filters: UserLookupQuery) => {
  return useQuery({
    queryKey: supportKeys.userList(filters),
    queryFn: () => supportApi.listUsersForLookup(filters),
  });
};

export const useSupportUserDetail = (id: string) => {
  return useQuery({
    queryKey: supportKeys.userDetail(id),
    queryFn: () => supportApi.getUserDetail(id),
    enabled: !!id,
  });
};

export const useSupportAuditLogs = (filters: SupportAuditLogQuery) => {
  return useQuery({
    queryKey: supportKeys.auditLogList(filters),
    queryFn: () => supportApi.getSupportAuditLogs(filters),
  });
};

// ---------------------- Mutations ----------------------

export const useCreateTicket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTicketDTO) => supportApi.createTicket(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supportKeys.tickets() });
      queryClient.invalidateQueries({ queryKey: supportKeys.myTickets() });
      queryClient.invalidateQueries({ queryKey: supportKeys.dashboardMetrics() });
    },
  });
};

export const useReplyTicket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ReplyTicketDTO }) =>
      supportApi.replyTicket(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: supportKeys.ticketDetail(id) });
      queryClient.invalidateQueries({ queryKey: supportKeys.tickets() });
      queryClient.invalidateQueries({ queryKey: supportKeys.myTickets() });
    },
  });
};

export const useResolveTicket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => supportApi.resolveTicket(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: supportKeys.ticketDetail(id) });
      queryClient.invalidateQueries({ queryKey: supportKeys.tickets() });
      queryClient.invalidateQueries({ queryKey: supportKeys.myTickets() });
      queryClient.invalidateQueries({ queryKey: supportKeys.dashboardMetrics() });
    },
  });
};

export const useAssignTicket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AssignTicketDTO }) =>
      supportApi.assignTicket(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: supportKeys.ticketDetail(id) });
      queryClient.invalidateQueries({ queryKey: supportKeys.tickets() });
      queryClient.invalidateQueries({ queryKey: supportKeys.myTickets() });
    },
  });
};

export const useUnlockAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: UnlockAccountDTO }) =>
      supportApi.unlockUserAccount(userId, data),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: supportKeys.userDetail(userId) });
      queryClient.invalidateQueries({ queryKey: supportKeys.users() });
      queryClient.invalidateQueries({ queryKey: supportKeys.auditLogs() });
    },
  });
};

export const useResendOtp = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => supportApi.resendUserOtp(userId),
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: supportKeys.userDetail(userId) });
      queryClient.invalidateQueries({ queryKey: supportKeys.auditLogs() });
    },
  });
};

export const useForceReverify = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => supportApi.forceProfileReverify(userId),
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: supportKeys.userDetail(userId) });
      queryClient.invalidateQueries({ queryKey: supportKeys.auditLogs() });
    },
  });
};

export const useReissueCertificate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => supportApi.reissueUserCertificate(userId),
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: supportKeys.userDetail(userId) });
      queryClient.invalidateQueries({ queryKey: supportKeys.auditLogs() });
    },
  });
};

export const useUpdateSupportUserStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: UpdateUserStatusDTO }) =>
      supportApi.updateUserStatus(userId, data),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: supportKeys.userDetail(userId) });
      queryClient.invalidateQueries({ queryKey: supportKeys.users() });
      queryClient.invalidateQueries({ queryKey: supportKeys.auditLogs() });
    },
  });
};

export const useExportSupportAuditLogs = () => {
  return useMutation({
    mutationFn: (filters: SupportAuditLogQuery) => supportApi.exportSupportAuditLogs(filters),
    onSuccess: (data) => {
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `support-audit-logs-${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    },
  });
};

export const useUploadTicketAttachment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UploadTicketAttachmentDTO }) =>
      supportApi.uploadTicketAttachment(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: supportKeys.ticketDetail(id) });
      queryClient.invalidateQueries({ queryKey: supportKeys.tickets() });
      queryClient.invalidateQueries({ queryKey: supportKeys.myTickets() });
    },
  });
};
