import { create } from "zustand";

export interface LessonState {
  id: string;
  title?: string;
  sequenceOrder?: number;
  [key: string]: any;
}

interface ReorderLessonStore {
  lessons: LessonState[];
  selectedCourseId: string;
  
  setLessons: (lessons: LessonState[]) => void;
  setCourseId: (id: string) => void;
  reorderLessonsLocally: (startIndex: number, endIndex: number) => void;
  updateLessonLocally: (lessonId: string, data: Partial<LessonState>) => void;
  removeLessonLocally: (lessonId: string) => void;
}

export const useReorderLessonStore = create<ReorderLessonStore>((set) => ({
  lessons: [],
  selectedCourseId: "",

  setLessons: (lessons) => set({ lessons }),
  setCourseId: (id) => set({ selectedCourseId: id }),
  
  reorderLessonsLocally: (startIndex, endIndex) =>
    set((state) => {
      const result = Array.from(state.lessons);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return { lessons: result };
    }),

  updateLessonLocally: (lessonId, data) =>
    set((state) => ({
      lessons: state.lessons.map((lesson) =>
        lesson.id === lessonId ? { ...lesson, ...data } : lesson
      ),
    })),

  removeLessonLocally: (lessonId) =>
    set((state) => ({
      lessons: state.lessons.filter((lesson) => lesson.id !== lessonId),
    })),
}));
