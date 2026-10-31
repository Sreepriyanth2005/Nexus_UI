// src/store/category/categoryStore.ts

import { create } from "zustand";
import { Category } from "../../core/api/category/category.api";

interface CategoryStore {
  selectedCategory: Category | null;

  setSelectedCategory: (
    category: Category | null
  ) => void;

  clearSelectedCategory: () => void;
}

export const useCategoryStore =
  create<CategoryStore>((set) => ({
    selectedCategory: null,

    setSelectedCategory: (
      category
    ) =>
      set({
        selectedCategory: category,
      }),

    clearSelectedCategory: () =>
      set({
        selectedCategory: null,
      }),
  }));