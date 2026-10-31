import { create } from "zustand";

interface EnumStore {
  lessonTypes: string[];
  lessonStatuses: string[];
  courseStatuses: string[];
  difficultyLevels: string[];
  careerPathStatuses: string[];
  visibilities: string[];
  previewAccessType: string[];

  setLessonTypes: (data: string[]) => void;
  setLessonStatuses: (data: string[]) => void;
  setCourseStatuses: (data: string[]) => void;
  setDifficultyLevels: (data: string[]) => void;
  setCareerPathStatuses: (data: string[]) => void;
  setVisibilities: (data: string[]) => void;
  setPreviewAccessType: (data: string[]) => void;
}

export const useEnumStore = create<EnumStore>((set) => ({
  lessonTypes: [],
  lessonStatuses: [],
  courseStatuses: [],
  difficultyLevels: [],
  careerPathStatuses: [],
  visibilities: [],
  previewAccessType: [],

  setLessonTypes: (lessonTypes) => set({ lessonTypes }),
  setLessonStatuses: (lessonStatuses) => set({ lessonStatuses }),
  setCourseStatuses: (courseStatuses) => set({ courseStatuses }),
  setDifficultyLevels: (difficultyLevels) => set({ difficultyLevels }),
  setCareerPathStatuses: (careerPathStatuses) =>
    set({ careerPathStatuses }),
  setVisibilities: (visibilities) => set({ visibilities }),

  setPreviewAccessType: (previewAccessType) =>
    set({ previewAccessType }),
}));