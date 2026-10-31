// src/store/lesson/lessonPersonaStore.ts

import { create } from "zustand";

export interface LessonPersona {
  id?: string;
  [key: string]: any;
}

interface LessonPersonaState {
  personas: LessonPersona[];

  setPersonas: (
    personas: LessonPersona[]
  ) => void;

  addPersona: (
    persona: LessonPersona
  ) => void;

  updatePersona: (
    persona: Partial<LessonPersona>
  ) => void;

  deletePersona: (
    id: string
  ) => void;

  clearPersonas: () => void;
}

export const useLessonPersonaStore =
  create<LessonPersonaState>(
    (set) => ({
      personas: [],

      setPersonas: (
        personas
      ) =>
        set({
          personas,
        }),

      addPersona: (
        persona
      ) =>
        set((state) => ({
          personas: [
            ...state.personas.filter(
              (p) =>
                p.id !==
                persona.id
            ),
            persona,
          ],
        })),

      updatePersona: (
        persona
      ) =>
        set((state) => ({
          personas:
            state.personas.map(
              (p) =>
                p.id ===
                persona.id
                  ? {
                      ...p,
                      ...persona,
                    }
                  : p
            ),
        })),

      deletePersona: (
        id
      ) =>
        set((state) => ({
          personas:
            state.personas.filter(
              (p) =>
                p.id !== id
            ),
        })),

      clearPersonas:
        () =>
          set({
            personas: [],
          }),
    })
  );