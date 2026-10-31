import { create } from "zustand";

import {
  Skill,
  Tag,
} from "../types/master.types";

interface MasterStore {
  skills: Skill[];
  tags: Tag[];

  setSkills: (
    skills: Skill[]
  ) => void;

  setTags: (
    tags: Tag[]
  ) => void;
}

export const useMasterStore =
  create<MasterStore>((set) => ({
    skills: [],
    tags: [],

    setSkills: (skills) =>
      set({ skills }),

    setTags: (tags) =>
      set({ tags }),
  }));