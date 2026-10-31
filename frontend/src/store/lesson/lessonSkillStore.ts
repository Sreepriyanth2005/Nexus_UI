// src/store/lesson/lessonSkillStore.ts

import { create } from "zustand";

export interface LessonSkill {
  id?: string;
  [key: string]: any;
}

interface LessonSkillState {
  skills: LessonSkill[];

  setSkills: (
    skills: LessonSkill[]
  ) => void;

  addSkill: (
    skill: LessonSkill
  ) => void;

  updateSkill: (
    skill: Partial<LessonSkill>
  ) => void;

  deleteSkill: (
    id: string
  ) => void;

  clearSkills: () => void;
}

export const useLessonSkillStore =
  create<LessonSkillState>(
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