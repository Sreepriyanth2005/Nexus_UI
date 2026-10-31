import { api } from "../../config/axios";
import {
  ReportFilter,
  DashboardMetrics,
  PaginatedReportResponse,
  LearnerProgressReport,
  CourseAnalyticsReport,
  AssessmentReport,
  AdminActivityReport,
  CertificateReport,
  ActivityAuditReport,
  CourseEnrollmentAnalytics,
  CourseCompletionAnalytics,
  CoursePerformanceAnalytics,
  FeedbackReport,
  CorporateTenantReport,
  SystemHealthReport
} from "../../types/reports.types";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const getDashboardMetrics = async (params?: ReportFilter) => {
  const res = await api.get<ApiResponse<DashboardMetrics>>("/reporting/dashboard", { params });
  return res.data.data;
};

export const getLearnerProgressReport = async (params?: ReportFilter) => {
  const res = await api.get<ApiResponse<PaginatedReportResponse<LearnerProgressReport>>>("/reporting/users/report", { params });
  return res.data.data;
};

export const getCourseAnalyticsReport = async (params?: ReportFilter) => {
  const res = await api.get<ApiResponse<PaginatedReportResponse<CourseAnalyticsReport>>>("/reporting/courses/report", { params });
  return res.data.data;
};

export const getAssessmentReport = async (params?: ReportFilter) => {
  const res = await api.get<ApiResponse<PaginatedReportResponse<AssessmentReport>>>("/reporting/quizzes/report", { params });
  return res.data.data;
};

export const getAdminActivityReport = async (params?: ReportFilter) => {
  const res = await api.get<ApiResponse<PaginatedReportResponse<AdminActivityReport>>>("/reporting/admin-activity", { params });
  return res.data.data;
};

export const getCertificateReport = async (params?: ReportFilter) => {
  const res = await api.get<ApiResponse<PaginatedReportResponse<CertificateReport>>>("/reporting/certificates/report", { params });
  return res.data.data;
};

export const getFeedbackReport = async (params?: ReportFilter & { type?: "IDEA" | "ISSUE" | "ALL" }) => {
  const res = await api.get<ApiResponse<PaginatedReportResponse<FeedbackReport>>>("/reporting/feedback/report", { params });
  return res.data.data;
};

export const getReportingCountries = async (params?: { tenantId?: string }) => {
  const res = await api.get<ApiResponse<string[]>>("/reporting/countries", { params });
  return res.data.data;
};

export const getActivityAuditReport = async (params?: ReportFilter) => {
  const res = await api.get<ApiResponse<PaginatedReportResponse<ActivityAuditReport>>>("/reporting/recent-activity", { params });
  return res.data.data;
};

export const exportReport = async (reportType: string, format: 'csv' | 'excel' | 'pdf', params?: ReportFilter) => {
  const res = await api.get(`/reporting/exports/download`, {
    params: { ...params, format },
    responseType: 'blob'
  });
  return res.data;
};

export const getCourseEnrollmentAnalytics = async (courseId: string, params?: ReportFilter) => {
  const res = await api.get<ApiResponse<CourseEnrollmentAnalytics>>(`/reporting/courses/${courseId}/enrollment-analytics`, { params });
  return res.data.data;
};

export const getCourseCompletionAnalytics = async (courseId: string, params?: ReportFilter) => {
  const res = await api.get<ApiResponse<CourseCompletionAnalytics>>(`/reporting/courses/${courseId}/completion-analytics`, { params });
  return res.data.data;
};

export const getCoursePerformanceAnalytics = async (courseId: string, params?: ReportFilter) => {
  const res = await api.get<ApiResponse<CoursePerformanceAnalytics>>(`/reporting/courses/${courseId}/performance-analytics`, { params });
  return res.data.data;
};

export const getCorporateTenantReport = async (params?: ReportFilter) => {
  const res = await api.get<ApiResponse<PaginatedReportResponse<CorporateTenantReport>>>("/reporting/tenants/report", { params });
  return res.data.data;
};

export const getSystemReport = async (params?: ReportFilter) => {
  const res = await api.get<ApiResponse<SystemHealthReport>>("/reporting/system/report", { params });
  return res.data.data;
};

export const getSuperAdminSummary = async () => {
  const res = await api.get<ApiResponse<any>>("/reporting/admin/summary");
  return res.data.data;
};

