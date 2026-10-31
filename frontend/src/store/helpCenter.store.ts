import { create } from "zustand";

interface HelpCenterUIState {
  // Help Center Search & Accordion UI State
  searchTerm: string;
  activeAccordionIndex: number | null;
  
  // Submit Idea UI Form State
  selectedCategory: string;
  ideaTitleDraft: string;
  ideaDescDraft: string;
  allowContactDraft: boolean;

  // Issue Reporting UI Form State
  issueTypeDraft: string;
  affectedPageDraft: string;
  issueDescribeDraft: string;
  includeDiagnosticsDraft: boolean;

  // Actions
  setSearchTerm: (term: string) => void;
  setActiveAccordionIndex: (index: number | null) => void;
  setSelectedCategory: (cat: string) => void;
  setIdeaTitleDraft: (title: string) => void;
  setIdeaDescDraft: (desc: string) => void;
  setAllowContactDraft: (allow: boolean) => void;
  resetIdeaFormDraft: () => void;

  setIssueTypeDraft: (type: string) => void;
  setAffectedPageDraft: (page: string) => void;
  setIssueDescribeDraft: (desc: string) => void;
  setIncludeDiagnosticsDraft: (inc: boolean) => void;
  resetIssueFormDraft: () => void;
}

export const useHelpCenterStore = create<HelpCenterUIState>((set) => ({
  searchTerm: "",
  activeAccordionIndex: null,

  selectedCategory: "Course / content idea",
  ideaTitleDraft: "",
  ideaDescDraft: "",
  allowContactDraft: false,

  issueTypeDraft: "",
  affectedPageDraft: "",
  issueDescribeDraft: "",
  includeDiagnosticsDraft: false,

  setSearchTerm: (term) => set({ searchTerm: term }),
  setActiveAccordionIndex: (index) => set({ activeAccordionIndex: index }),
  setSelectedCategory: (cat) => set({ selectedCategory: cat }),
  setIdeaTitleDraft: (title) => set({ ideaTitleDraft: title }),
  setIdeaDescDraft: (desc) => set({ ideaDescDraft: desc }),
  setAllowContactDraft: (allow) => set({ allowContactDraft: allow }),

  resetIdeaFormDraft: () =>
    set({
      ideaTitleDraft: "",
      ideaDescDraft: "",
      allowContactDraft: false,
    }),

  setIssueTypeDraft: (type) => set({ issueTypeDraft: type }),
  setAffectedPageDraft: (page) => set({ affectedPageDraft: page }),
  setIssueDescribeDraft: (desc) => set({ issueDescribeDraft: desc }),
  setIncludeDiagnosticsDraft: (inc) => set({ includeDiagnosticsDraft: inc }),

  resetIssueFormDraft: () =>
    set({
      issueTypeDraft: "",
      affectedPageDraft: "",
      issueDescribeDraft: "",
      includeDiagnosticsDraft: false,
    }),
}));
