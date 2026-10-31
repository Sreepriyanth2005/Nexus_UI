// src/store/careerPathPersonaStore.ts

import { create } from "zustand";

export interface CareerPathPersona {
  id?: string;
  name?: string;
  [key: string]: any;
}

interface CareerPathPersonaState {
  personas: CareerPathPersona[];

  setPersonas: (
    personas: CareerPathPersona[]
  ) => void;

  addPersona: (
    persona: CareerPathPersona
  ) => void;

  updatePersona: (
    persona: CareerPathPersona
  ) => void;

  deletePersona: (
    id: string
  ) => void;

  clearPersonas: () => void;
}

export const useCareerPathPersonaStore =
  create<CareerPathPersonaState>(
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
              (item) =>
                item.id !==
                persona.id
            ),
            persona,
          ],
        })),

      updatePersona: (
        updatedPersona
      ) =>
        set((state) => ({
          personas:
            state.personas.map(
              (item) =>
                item.id ===
                updatedPersona.id
                  ? {
                      ...item,
                      ...updatedPersona,
                    }
                  : item
            ),
        })),

      deletePersona: (
        id
      ) =>
        set((state) => ({
          personas:
            state.personas.filter(
              (item) =>
                item.id !== id
            ),
        })),

      clearPersonas: () =>
        set({
          personas: [],
        }),
    })
  );