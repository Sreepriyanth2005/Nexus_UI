import { create } from "zustand";

export interface AssetPersona {
  assetId: string;

  personaId: string;

  assignedAt?: string;

  assignedBy?: string | null;

  [key: string]: any;
}

interface AssetPersonaState {
  personas: AssetPersona[];

  setPersonas: (
    personas: AssetPersona[]
  ) => void;

  addPersona: (
    persona: AssetPersona
  ) => void;

  updatePersona: (
    persona: Partial<AssetPersona> & {
      assetId: string;
      personaId: string;
    }
  ) => void;

  deletePersona: (
    assetId: string,
    personaId: string
  ) => void;

  clearPersonas: () => void;
}

export const useAssetPersonaStore =
  create<AssetPersonaState>(
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
                !(
                  p.assetId ===
                    persona.assetId &&
                  p.personaId ===
                    persona.personaId
                )
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
                p.assetId ===
                  persona.assetId &&
                p.personaId ===
                  persona.personaId
                  ? {
                      ...p,
                      ...persona,
                    }
                  : p
            ),
        })),

      deletePersona: (
        assetId,
        personaId
      ) =>
        set((state) => ({
          personas:
            state.personas.filter(
              (p) =>
                !(
                  p.assetId ===
                    assetId &&
                  p.personaId ===
                    personaId
                )
            ),
        })),

      clearPersonas:
        () =>
          set({
            personas: [],
          }),
    })
  );