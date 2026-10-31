// src/store/courseTagStore.ts

import { create } from "zustand";

interface CourseTag {
  id?: string;
  [key: string]: any;
}

interface CourseTagState {
  tags: CourseTag[];

  setTags: (
    tags: CourseTag[]
  ) => void;

  addTag: (
    tag: CourseTag
  ) => void;

  updateTag: (
    tag: CourseTag
  ) => void;

  deleteTag: (
    id: string
  ) => void;

  clearTags: () => void;
}

export const useCourseTagStore =
  create<CourseTagState>(
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