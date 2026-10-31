import { create } from "zustand";
import { DashboardMetrics, ReportFilter } from "../types/reports.types";

type ReportsState = {
  dashboardMetrics: DashboardMetrics | null;
  setDashboardMetrics: (data: DashboardMetrics) => void;
  globalReportFilters: ReportFilter;
  setGlobalReportFilters: (filters: ReportFilter) => void;
};

export const useReportsStore = create<ReportsState>((set) => ({
  dashboardMetrics: null,
  setDashboardMetrics: (data) => set({ dashboardMetrics: data }),
  
  globalReportFilters: {},
  setGlobalReportFilters: (filters) => set((state) => ({ 
    globalReportFilters: { ...state.globalReportFilters, ...filters } 
  })),
}));
