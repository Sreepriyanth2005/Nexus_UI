// src/store/courseLessonStore.ts

import { create } from "zustand";

export interface CourseLesson {
  id?: string;
  title?: string;
  [key: string]: any;
}

interface CourseLessonState {
  lessons: CourseLesson[];

  setLessons: (
    lessons: CourseLesson[]
  ) => void;

  addLesson: (
    lesson: CourseLesson
  ) => void;

  updateLesson: (
    lesson: CourseLesson
  ) => void;

  deleteLesson: (
    id: string
  ) => void;

  clearLessons: () => void;
}

export const useCourseLessonStore =
  create<CourseLessonState>(
    (set) => ({
      lessons: [],

      setLessons: (
        lessons
      ) =>
        set({
          lessons,
        }),

      addLesson: (
        lesson
      ) =>
        set((state) => ({
          lessons: [
            ...state.lessons.filter(
              (l) =>
                l.id !== lesson.id
            ),
            lesson,
          ],
        })),

      updateLesson: (
        lesson
      ) =>
        set((state) => ({
          lessons:
            state.lessons.map(
              (l) =>
                l.id === lesson.id
                  ? {
                      ...l,
                      ...lesson,
                    }
                  : l
            ),
        })),

      deleteLesson: (
        id
      ) =>
        set((state) => ({
          lessons:
            state.lessons.filter(
              (l: any) => (l.lesson?.id || l.lessonId || l.id) !== id
            ),
        })),

      clearLessons: () =>
        set({
          lessons: [],
        }),
    })
  );