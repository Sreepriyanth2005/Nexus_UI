// src/store/coursePersonaStore.ts

import { create } from "zustand";

interface CoursePersona {
  id?: string;
  [key: string]: any;
}

interface CoursePersonaState {
  personas: CoursePersona[];

  setPersonas: (
    personas: CoursePersona[]
  ) => void;

  addPersona: (
    persona: CoursePersona
  ) => void;

  updatePersona: (
    persona: CoursePersona
  ) => void;

  deletePersona: (
    id: string
  ) => void;

  clearPersonas: () => void;
}

export const useCoursePersonaStore =
  create<CoursePersonaState>(
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
                p.id !== persona.id
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
                p.id === persona.id
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
              (p) => p.id !== id
            ),
        })),

      clearPersonas: () =>
        set({
          personas: [],
        }),
    })
  );