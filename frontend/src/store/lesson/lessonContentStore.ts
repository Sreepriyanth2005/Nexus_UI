// src/store/lesson/lessonContentStore.ts

import { create } from "zustand";

export interface LessonContent {
  id?: string;
  lessonId?: string;
  content?: string;
  [key: string]: any;
}

interface LessonContentState {
  content:
    | LessonContent
    | null;

  setContent: (
    content: LessonContent
  ) => void;

  clearContent: () => void;
}

export const useLessonContentStore =
  create<LessonContentState>(
    (set) => ({
      content: null,

      setContent: (
        content
      ) =>
        set({
          content,
        }),

      clearContent:
        () =>
          set({
            content: null,
          }),
    })
  );