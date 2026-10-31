import { create } from "zustand";
import { CorporateContentType, CorporateAssignmentRequirement } from "../../core/api/corporate-learning.api";

export interface SelectedContentItem {
    id: string;
    type: CorporateContentType;
    title: string;
}

interface CourseAssignmentState {
    tenantId: string;
    
    // Step 1: Content
    contentType: CorporateContentType;
    selectedContents: SelectedContentItem[];
    contentSearch: string;
    difficulty: string;
    subject: string;
    category: string;
    tag: string;
    skillSearch: string;
    
    // Step 2: Assignees
    assigneeMode: "USER" | "GROUP" | "ALL";
    selectedAssignees: string[]; // Use array for easier Zustand serialization
    assigneeSearch: string;
    
    // Step 3: Assignment Options
    requirement: CorporateAssignmentRequirement;
    dueDate: string;
    notifyUsers: boolean;

    // Actions
    setTenantId: (tenantId: string) => void;
    
    setContentType: (contentType: CorporateContentType) => void;
    toggleSelectedContent: (item: SelectedContentItem) => void;
    setContentSearch: (search: string) => void;
    setDifficulty: (diff: string) => void;
    setSubject: (subject: string) => void;
    setCategory: (category: string) => void;
    setTag: (tag: string) => void;
    setSkillSearch: (skillSearch: string) => void;
    clearFilters: () => void;
    
    setAssigneeMode: (mode: "USER" | "GROUP" | "ALL") => void;
    setSelectedAssignees: (assignees: string[]) => void;
    toggleAssignee: (id: string) => void;
    setAssigneeSearch: (search: string) => void;
    
    setRequirement: (req: CorporateAssignmentRequirement) => void;
    setDueDate: (date: string) => void;
    setNotifyUsers: (notify: boolean) => void;
    
    reset: () => void;
}

const initialState = {
    tenantId: "",
    
    contentType: "CAREER_PATH" as CorporateContentType,
    selectedContents: [] as SelectedContentItem[],
    contentSearch: "",
    difficulty: "",
    subject: "",
    category: "",
    tag: "",
    skillSearch: "",
    
    assigneeMode: "USER" as "USER" | "GROUP",
    selectedAssignees: [],
    assigneeSearch: "",
    
    requirement: "MANDATORY" as CorporateAssignmentRequirement,
    dueDate: new Date().toISOString().split("T")[0],
    notifyUsers: true,
};

export const useCourseAssignmentStore = create<CourseAssignmentState>((set) => ({
    ...initialState,

    setTenantId: (tenantId) => set({ tenantId }),

    setContentType: (contentType) => set({ contentType }),
    toggleSelectedContent: (item) => set((state) => {
        const exists = state.selectedContents.find(c => c.id === item.id);
        if (exists) {
            return { selectedContents: state.selectedContents.filter(c => c.id !== item.id) };
        } else {
            return { selectedContents: [...state.selectedContents, item] };
        }
    }),
    setContentSearch: (search) => set({ contentSearch: search }),
    setDifficulty: (diff) => set({ difficulty: diff }),
    setSubject: (subject) => set({ subject }),
    setCategory: (category) => set({ category }),
    setTag: (tag) => set({ tag }),
    setSkillSearch: (skillSearch) => set({ skillSearch }),
    clearFilters: () => set({
        difficulty: "",
        subject: "",
        category: "",
        tag: "",
        skillSearch: "",
        contentSearch: ""
    }),
    setAssigneeMode: (assigneeMode) => set({ assigneeMode, selectedAssignees: [] }),
    setSelectedAssignees: (selectedAssignees) => set({ selectedAssignees }),
    toggleAssignee: (id) => set((state) => {
        const setCopy = new Set(state.selectedAssignees);
        if (setCopy.has(id)) {
            setCopy.delete(id);
        } else {
            setCopy.add(id);
        }
        return { selectedAssignees: Array.from(setCopy) };
    }),
    setAssigneeSearch: (assigneeSearch) => set({ assigneeSearch }),

    setRequirement: (requirement) => set({ requirement }),
    setDueDate: (dueDate) => set({ dueDate }),
    setNotifyUsers: (notifyUsers) => set({ notifyUsers }),

    reset: () => set({
        ...initialState,
        // keep tenantId if we want, or clear it
        // but resetting on success should reset form state
        dueDate: new Date().toISOString().split("T")[0], 
    })
}));
