// src/store/careerPathSkillStore.ts

import { create } from "zustand";

export interface CareerPathSkill {
  id?: string;
  skillId?: string;
  name?: string;
  [key: string]: any;
}

interface CareerPathSkillState {
  skills: CareerPathSkill[];

  setSkills: (
    skills: CareerPathSkill[]
  ) => void;

  addSkill: (
    skill: CareerPathSkill
  ) => void;

  updateSkill: (
    skill: CareerPathSkill
  ) => void;

  deleteSkill: (
    id: string
  ) => void;

  clearSkills: () => void;
}

export const useCareerPathSkillStore =
  create<CareerPathSkillState>(
    (set) => ({
      skills: [],

      setSkills: (
        skills
      ) =>
        set({
          skills,
        }),

      addSkill: (
        skill
      ) =>
        set((state) => ({
          skills: [
            ...state.skills.filter(
              (item) =>
                item.id !==
                skill.id
            ),
            skill,
          ],
        })),

      updateSkill: (
        updatedSkill
      ) =>
        set((state) => ({
          skills:
            state.skills.map(
              (item) =>
                item.id ===
                updatedSkill.id
                  ? {
                      ...item,
                      ...updatedSkill,
                    }
                  : item
            ),
        })),

      deleteSkill: (
        id
      ) =>
        set((state) => ({
          skills:
            state.skills.filter(
              (item) =>
                item.id !== id
            ),
        })),

      clearSkills: () =>
        set({
          skills: [],
        }),
    })
  );