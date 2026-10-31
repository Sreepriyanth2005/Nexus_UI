// src/store/courseSubjectStore.ts

import { create } from "zustand";

interface CourseSubject {
  id?: string;
  [key: string]: any;
}

interface CourseSubjectState {
  subjects: CourseSubject[];

  setSubjects: (
    subjects: CourseSubject[]
  ) => void;

  addSubject: (
    subject: CourseSubject
  ) => void;

  removeSubject: (
    id: string
  ) => void;

  clearSubjects: () => void;
}

export const useCourseSubjectStore =
  create<CourseSubjectState>(
    (set) => ({
      subjects: [],

      setSubjects: (
        subjects
      ) =>
        set({
          subjects,
        }),

      addSubject: (
        subject
      ) =>
        set((state) => ({
          subjects: [
            ...state.subjects.filter(
              (s) =>
                s.id !== subject.id
            ),
            subject,
          ],
        })),

      removeSubject: (
        id
      ) =>
        set((state) => ({
          subjects:
            state.subjects.filter(
              (s) => s.id !== id
            ),
        })),

      clearSubjects: () =>
        set({
          subjects: [],
        }),
    })
  );