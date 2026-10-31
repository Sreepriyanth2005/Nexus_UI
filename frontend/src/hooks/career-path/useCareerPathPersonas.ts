// src/hooks/career-path/useCareerPathPersonas.ts

import {
  useMutation,
} from "@tanstack/react-query";

import {
  createCareerPathPersonaApi,
  updateCareerPathPersonaApi,
  deleteCareerPathPersonaApi,
  getCareerPathPersonaApi,
} from "../../core/api/career-path/careerpath-persona.api";

import {
  useCareerPathPersonaStore,
} from "../../store/career-path/careerPathPersonaStore";

export const useCareerPathPersonas =
  (
    careerPathId: string
  ) => {
    const store =
      useCareerPathPersonaStore();

    return {
      getById:
        getCareerPathPersonaApi,

      createMutation:
        useMutation({
          mutationFn: (
            payload
          ) =>
            createCareerPathPersonaApi(
              careerPathId,
              payload
            ),

          onSuccess: (
            data
          ) =>
            store.addPersona(
              data
            ),
        }),

      updateMutation:
        useMutation({
          mutationFn: ({
            personaId,
            payload,
          }: any) =>
            updateCareerPathPersonaApi(
              careerPathId,
              personaId,
              payload
            ),

          onSuccess: (
            data
          ) =>
            store.updatePersona(
              data
            ),
        }),

      deleteMutation:
        useMutation({
          mutationFn: (
            personaId: string
          ) =>
            deleteCareerPathPersonaApi(
              careerPathId,
              personaId
            ),

          onSuccess: (
            _,
            personaId
          ) =>
            store.deletePersona(
              personaId
            ),
        }),
    };
  };