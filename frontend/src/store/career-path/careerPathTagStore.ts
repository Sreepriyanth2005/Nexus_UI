// src/store/careerPathTagStore.ts

import { create } from "zustand";

export interface CareerPathTag {
  id?: string;
  name?: string;
  [key: string]: any;
}

interface CareerPathTagState {
  tags: CareerPathTag[];

  setTags: (
    tags: CareerPathTag[]
  ) => void;

  addTag: (
    tag: CareerPathTag
  ) => void;

  updateTag: (
    tag: CareerPathTag
  ) => void;

  deleteTag: (
    id: string
  ) => void;

  clearTags: () => void;
}

export const useCareerPathTagStore =
  create<CareerPathTagState>(
    (set) => ({
      tags: [],

      setTags: (tags) =>
        set({ tags }),

      addTag: (tag) =>
        set((state) => ({
          tags: [
            ...state.tags.filter(
              (item) =>
                item.id !== tag.id
            ),
            tag,
          ],
        })),

      updateTag: (
        updatedTag
      ) =>
        set((state) => ({
          tags:
            state.tags.map(
              (item) =>
                item.id ===
                updatedTag.id
                  ? {
                      ...item,
                      ...updatedTag,
                    }
                  : item
            ),
        })),

      deleteTag: (
        id
      ) =>
        set((state) => ({
          tags:
            state.tags.filter(
              (item) =>
                item.id !== id
            ),
        })),

      clearTags: () =>
        set({
          tags: [],
        }),
    })
  );