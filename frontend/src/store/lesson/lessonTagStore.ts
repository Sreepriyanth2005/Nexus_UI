// src/store/lesson/lessonTagStore.ts

import { create } from "zustand";

export interface LessonTag {
  id?: string;
  [key: string]: any;
}

interface LessonTagState {
  tags: LessonTag[];

  setTags: (
    tags: LessonTag[]
  ) => void;

  addTag: (
    tag: LessonTag
  ) => void;

  updateTag: (
    tag: Partial<LessonTag>
  ) => void;

  deleteTag: (
    id: string
  ) => void;

  clearTags: () => void;
}

export const useLessonTagStore =
  create<LessonTagState>(
    (set) => ({
      tags: [],

      setTags: (
        tags
      ) =>
        set({
          tags,
        }),

      addTag: (
        tag
      ) =>
        set((state) => ({
          tags: [
            ...state.tags.filter(
              (t) =>
                t.id !== tag.id
            ),
            tag,
          ],
        })),

      updateTag: (
        tag
      ) =>
        set((state) => ({
          tags:
            state.tags.map(
              (t) =>
                t.id === tag.id
                  ? {
                      ...t,
                      ...tag,
                    }
                  : t
            ),
        })),

      deleteTag: (
        id
      ) =>
        set((state) => ({
          tags:
            state.tags.filter(
              (t) => t.id !== id
            ),
        })),

      clearTags: () =>
        set({
          tags: [],
        }),
    })
  );