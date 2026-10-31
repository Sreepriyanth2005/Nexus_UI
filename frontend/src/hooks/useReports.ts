import { useQuery, useMutation } from "@tanstack/react-query";
import {
  getDashboardMetrics,
  getLearnerProgressReport,
  getCourseAnalyticsReport,
  getAssessmentReport,
  getAdminActivityReport,
  getCertificateReport,
  getActivityAuditReport,
  exportReport,
  getCourseEnrollmentAnalytics,
  getCourseCompletionAnalytics,
  getCoursePerformanceAnalytics,
  getFeedbackReport,
  getCorporateTenantReport,
  getSystemReport,
  getReportingCountries,
  getSuperAdminSummary
} from "../core/api/reports.api";
import { ReportFilter } from "../types/reports.types";

export const useReportingCountries = (filters?: { tenantId?: string }) =>
  useQuery({
    queryKey: ["reporting-countries", filters],
    queryFn: () => getReportingCountries(filters),
  });

export const useDashboardMetrics = (filters?: ReportFilter) =>
  useQuery({
    queryKey: ["dashboard-metrics", filters],
    queryFn: () => getDashboardMetrics(filters),
  });

export const useLearnerProgressReport = (filters?: ReportFilter) =>
  useQuery({
    queryKey: ["reports", "learner-progress", filters],
    queryFn: () => getLearnerProgressReport(filters),
  });

export const useCourseAnalyticsReport = (filters?: ReportFilter) =>
  useQuery({
    queryKey: ["reports", "course-analytics", filters],
    queryFn: () => getCourseAnalyticsReport(filters),
  });

export const useAssessmentReport = (filters?: ReportFilter) =>
  useQuery({
    queryKey: ["reports", "assessments", filters],
    queryFn: () => getAssessmentReport(filters),
  });

export const useAdminActivityReport = (filters?: ReportFilter) =>
  useQuery({
    queryKey: ["reports", "admin-activity", filters],
    queryFn: () => getAdminActivityReport(filters),
  });

export const useCertificateReport = (filters?: ReportFilter) =>
  useQuery({
    queryKey: ["reports", "certificates", filters],
    queryFn: () => getCertificateReport(filters),
  });

export const useActivityAuditReport = (filters?: ReportFilter) =>
  useQuery({
    queryKey: ["reports", "audit-logs", filters],
    queryFn: () => getActivityAuditReport(filters),
  });

export const useExportReport = () => {
  return useMutation({
    mutationFn: ({ reportType, format, filters }: { reportType: string, format: 'csv' | 'excel' | 'pdf', filters?: ReportFilter }) => 
      exportReport(reportType, format, filters),
    onSuccess: (blob, variables) => {
      // Create a blob URL and trigger download
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      
      const date = new Date().toISOString().split('T')[0];
      const extension = variables.format === 'excel' ? 'xlsx' : variables.format;
      link.setAttribute('download', `${variables.reportType}-report-${date}.${extension}`);
      
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    }
  });
};

export const useCourseEnrollmentAnalytics = (courseId: string, filters?: ReportFilter) =>
  useQuery({
    queryKey: ["reports", "course-enrollment-analytics", courseId, filters],
    queryFn: () => getCourseEnrollmentAnalytics(courseId, filters),
    enabled: !!courseId,
  });

export const useCourseCompletionAnalytics = (courseId: string, filters?: ReportFilter) =>
  useQuery({
    queryKey: ["reports", "course-completion-analytics", courseId, filters],
    queryFn: () => getCourseCompletionAnalytics(courseId, filters),
    enabled: !!courseId,
  });

export const useCoursePerformanceAnalytics = (courseId: string, filters?: ReportFilter) =>
  useQuery({
    queryKey: ["reports", "course-performance-analytics", courseId, filters],
    queryFn: () => getCoursePerformanceAnalytics(courseId, filters),
    enabled: !!courseId,
  });

export const useFeedbackReport = (filters?: ReportFilter & { type?: "IDEA" | "ISSUE" | "ALL" }) =>
  useQuery({
    queryKey: ["reports", "feedback", filters],
    queryFn: () => getFeedbackReport(filters),
  });

export const useCorporateTenantReport = (filters?: ReportFilter) =>
  useQuery({
    queryKey: ["reports", "corporate-tenant", filters],
    queryFn: () => getCorporateTenantReport(filters),
  });

export const useSystemReport = (filters?: ReportFilter) =>
  useQuery({
    queryKey: ["reports", "system", filters],
    queryFn: () => getSystemReport(filters),
  });

export const useSuperAdminDashboard = () =>
  useQuery({
    queryKey: ["reports", "super-admin-summary"],
    queryFn: () => getSuperAdminSummary(),
  });
