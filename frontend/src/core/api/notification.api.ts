import { api } from "../../config/axios";

export interface NotificationPreferences {
  courseEnrollmentInApp: boolean;
  courseEnrollmentEmail: boolean;
  courseCompletedInApp: boolean;
  courseCompletedEmail: boolean;
  certificateReadyInApp: boolean;
  certificateReadyEmail: boolean;
  quizResultInApp: boolean;
  quizResultEmail: boolean;
  deadlineReminderInApp: boolean;
  deadlineReminderEmail: boolean;
  inactivityReminderInApp: boolean;
  inactivityReminderEmail: boolean;
  marketingInApp: boolean;
  marketingEmail: boolean;
  emailAccountTimeZoneChanges: boolean;
  notificationFrequency: string;
}

export interface NotificationItem {
  id: string;
  userId?: string;
  title: string;
  message: string;
  type: string;
  priority?: string;
  isRead: boolean;
  actionUrl?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  createdAt: string | any;
}

export const NotificationAPI = {
  getNotifications: async (params?: { page?: number; limit?: number; isRead?: boolean; type?: string; userId?: string }) => {
    const res = await api.get<{ success: boolean; data: NotificationItem[]; total?: number; unreadCount?: number }>("/notifications", { params });
    return res.data;
  },

  getPreferences: async () => {
    const res = await api.get<{ success: boolean; data: NotificationPreferences }>("/notifications/preferences");
    return res.data.data;
  },

  updatePreferences: async (data: Partial<NotificationPreferences>) => {
    const res = await api.patch<{ success: boolean; data: NotificationPreferences }>("/notifications/preferences", data);
    return res.data.data;
  },

  getUserPreferences: async (userId: string) => {
    const res = await api.get<{ success: boolean; data: NotificationPreferences }>(`/notifications/${userId}/preferences`);
    return res.data.data;
  },

  updateUserPreferences: async (userId: string, data: Partial<NotificationPreferences>) => {
    const res = await api.patch<{ success: boolean; data: NotificationPreferences }>(`/notifications/${userId}/preferences`, data);
    return res.data.data;
  },

  deleteNotification: async (id: string) => {
    const res = await api.delete<{ success: boolean; message: string }>(`/notifications/${id}`);
    return res.data;
  },

  deleteAllNotifications: async () => {
    const res = await api.delete<{ success: boolean; message: string }>(`/notifications`);
    return res.data;
  },

  markAsRead: async (id: string) => {
    const res = await api.patch<{ success: boolean; message: string }>(`/notifications/${id}/read`);
    return res.data;
  },

  markAllAsRead: async () => {
    const res = await api.patch<{ success: boolean; message: string }>(`/notifications/read-all`);
    return res.data;
  },

  sendBroadcastNotification: async (payload: { title: string; message: string; targetAudience: string; priority: string; targetTenantId?: string; targetRole?: string; }) => {
    const res = await api.post<{ success: boolean; message: string }>("/notifications/broadcast", payload);
    return res.data;
  },
};
