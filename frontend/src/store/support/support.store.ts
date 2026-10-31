import { create } from "zustand";

interface SupportUiState {
  // Ticket List Filters
  ticketFilters: {
    status?: string;
    priority?: string;
    categoryId?: string;
    assignedTo?: string;
    search?: string;
    page: number;
    limit: number;
  };
  
  // User Lookup Filters
  userFilters: {
    search?: string;
    status?: string;
    role?: string;
    page: number;
    limit: number;
  };
  
  // Audit Log Filters
  auditFilters: {
    startDate?: string;
    endDate?: string;
    actionType?: string;
    searchEmail?: string;
    page: number;
    limit: number;
  };
  
  // Actions
  setTicketFilters: (filters: Partial<SupportUiState["ticketFilters"]>) => void;
  setUserFilters: (filters: Partial<SupportUiState["userFilters"]>) => void;
  setAuditFilters: (filters: Partial<SupportUiState["auditFilters"]>) => void;
  resetTicketFilters: () => void;
  resetUserFilters: () => void;
  resetAuditFilters: () => void;
}

const initialTicketFilters = {
  page: 1,
  limit: 10,
};

const initialUserFilters = {
  page: 1,
  limit: 10,
};

const initialAuditFilters = {
  page: 1,
  limit: 10,
};

export const useSupportUiStore = create<SupportUiState>((set) => ({
  ticketFilters: initialTicketFilters,
  userFilters: initialUserFilters,
  auditFilters: initialAuditFilters,

  setTicketFilters: (filters) =>
    set((state) => ({
      ticketFilters: { ...state.ticketFilters, ...filters },
    })),

  setUserFilters: (filters) =>
    set((state) => ({
      userFilters: { ...state.userFilters, ...filters },
    })),

  setAuditFilters: (filters) =>
    set((state) => ({
      auditFilters: { ...state.auditFilters, ...filters },
    })),

  resetTicketFilters: () => set({ ticketFilters: initialTicketFilters }),
  resetUserFilters: () => set({ userFilters: initialUserFilters }),
  resetAuditFilters: () => set({ auditFilters: initialAuditFilters }),
}));
