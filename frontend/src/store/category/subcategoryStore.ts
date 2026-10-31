// src/store/category/subcategoryStore.ts

import { create } from "zustand";

import { Subcategory } from "../../core/api/category/subcategory.api";

interface SubcategoryStore {
  selectedSubcategory:
    Subcategory | null;

  setSelectedSubcategory: (
    subcategory: Subcategory | null
  ) => void;

  clearSelectedSubcategory:
    () => void;
}

export const useSubcategoryStore =
  create<SubcategoryStore>((set) => ({
    selectedSubcategory: null,

    setSelectedSubcategory: (
      subcategory
    ) =>
      set({
        selectedSubcategory:
          subcategory,
      }),

    clearSelectedSubcategory:
      () =>
        set({
          selectedSubcategory:
            null,
        }),
  }));