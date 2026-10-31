export type TicketStatus = "OPEN" | "ASSIGNED" | "IN_PROGRESS" | "WAITING_FOR_USER" | "RESOLVED" | "CLOSED" | "CANCELLED";
export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT" | "CRITICAL";
export type SupportMessageType = "USER_REPLY" | "AGENT_REPLY" | "INTERNAL_NOTE" | "SYSTEM_EVENT";

export interface SupportDashboardMetrics {
  totalTickets: number;
  openTickets: number;
  pendingTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  closedTickets: number;
  unassignedTickets: number;
  slaBreached: number;
  resolvedTicketsThisWeek?: number;
  activeImpersonations?: number;
  otpPasswordIssues?: number;
  recentActions: SupportActionRecord[];
}

export interface PlatformHealthServiceStatus {
  name: string;
  status: "Operational" | "Degraded" | "Down";
  detail?: string;
}

export interface PlatformHealthResult {
  performanceScore: number;
  overallStatus: "All systems operational" | "Degraded" | "Outage";
  lastIncidentDaysAgo: number;
  services: PlatformHealthServiceStatus[];
}

export interface SupportActionRecord {
  id: string;
  timestamp: Date | string;
  action: string;
  entityType: string;
  entityId: string;
  actorId?: string | null;
  actorEmail?: string;
  outcome?: string;
}

export interface SupportAuditLogQuery {
  startDate?: string;
  endDate?: string;
  actionType?: string;
  searchEmail?: string;
  page?: number;
  limit?: number;
}

export interface SupportAuditMetrics {
  actionsThisPeriod: number;
  ticketsResolved?: number;
  ticketsAssigned?: number;
  messagesSent?: number;
  otpResent?: number;
  accountsUnlocked?: number;
  proofsReissued?: number;
}

export interface SupportAuditLogListResult {
  metrics: SupportAuditMetrics;
  data: SupportActionRecord[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface TicketListQuery {
  status?: string;
  priority?: string;
  categoryId?: string;
  assignedTo?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface TicketMessageItem {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  messageType: SupportMessageType;
  body: string;
  isInternal: boolean;
  createdAt: Date | string;
  attachments?: any[];
}

export interface TicketDetailResult {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  categoryName?: string;
  userEmail: string;
  userName: string;
  userRole: string;
  userTenantName?: string;
  openedAt: Date | string;
  assignedToName?: string;
  assignedToId?: string;
  messages: TicketMessageItem[];
}

export interface UserLookupQuery {
  search?: string;
  status?: string;
  role?: string;
  page?: number;
  limit?: number;
}

export interface SupportUserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  accountStatus: "Active" | "Inactive" | "Locked" | "OTP issue";
  lastLoginAt?: Date | string;
  openTicketCount: number;
  totalTicketCount: number;
  hasOpenTicket?: boolean;
}

export interface UserLookupListResult {
  data: SupportUserItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  metrics: {
    openTickets: number;
    resolvedThisWeek: number;
    otpLockoutToday: number;
  };
}

export interface CreateTicketDTO {
  subject: string;
  description: string;
  priority?: TicketPriority;
  categoryId?: string;
}

export interface ReplyTicketDTO {
  message: string;
  isInternal?: boolean;
}

export interface AssignTicketDTO {
  assignToUserId: string;
  reason?: string;
}

export interface UpdateUserStatusDTO {
  status: "ACTIVE" | "INACTIVE";
  reason?: string;
}

export interface UnlockAccountDTO {
  reason?: string;
}

export interface UploadTicketAttachmentDTO {
  file: File;
  messageId?: string;
}
