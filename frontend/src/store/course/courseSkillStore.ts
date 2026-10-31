// src/store/courseSkillStore.ts

import { create } from "zustand";

interface CourseSkill {
  id?: string;
  [key: string]: any;
}

interface CourseSkillState {
  skills: CourseSkill[];

  setSkills: (
    skills: CourseSkill[]
  ) => void;

  addSkill: (
    skill: CourseSkill
  ) => void;

  updateSkill: (
    skill: CourseSkill
  ) => void;

  deleteSkill: (
    id: string
  ) => void;

  clearSkills: () => void;
}

export const useCourseSkillStore =
  create<CourseSkillState>(
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
              (s) =>
                s.id !== skill.id
            ),
            skill,
          ],
        })),

      updateSkill: (
        skill
      ) =>
        set((state) => ({
          skills:
            state.skills.map(
              (s) =>
                s.id === skill.id
                  ? {
                      ...s,
                      ...skill,
                    }
                  : s
            ),
        })),

      deleteSkill: (
        id
      ) =>
        set((state) => ({
          skills:
            state.skills.filter(
              (s) => s.id !== id
            ),
        })),

      clearSkills: () =>
        set({
          skills: [],
        }),
    })
  );