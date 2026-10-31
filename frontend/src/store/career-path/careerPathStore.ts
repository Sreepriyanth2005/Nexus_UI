import { create } from "zustand";
import { CareerPath } from "../../core/api/career-path/career-path.api";

interface CareerPathStore {
  selected?: CareerPath;
  setSelected: (careerPath?: CareerPath) => void;
}

export const useCareerPathStore = create<CareerPathStore>((set) => ({
  selected: undefined,

  setSelected: (careerPath) =>
    set({
      selected: careerPath,
    }),
}));