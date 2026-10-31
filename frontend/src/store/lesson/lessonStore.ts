// src/store/lesson/lesson.store.ts

import { create } from "zustand";

interface LessonStore {
  selectedLessonId: string | null;
  setSelectedLessonId: (lessonId: string | null) => void;
  reset: () => void;
}

export const useLessonStore = create<LessonStore>((set) =>
({
  selectedLessonId: null,
  setSelectedLessonId: (lessonId) =>
    set({
      selectedLessonId: lessonId,
    }),
  reset: () =>
    set({
      selectedLessonId: null,
    }),
}));