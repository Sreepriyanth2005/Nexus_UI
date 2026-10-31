// src/hooks/career-path/useCareerPathSkills.ts

import {
  useMutation,
  useQuery,
} from "@tanstack/react-query";

import {
  getCareerPathSkillsApi,
  createCareerPathSkillApi,
  updateCareerPathSkillApi,
  deleteCareerPathSkillApi,
} from "../../core/api/career-path/careerpath-skill.api";

import {
  useCareerPathSkillStore,
} from "../../store/career-path/careerPathSkillStore";

export const useCareerPathSkills =
  (
    careerPathId: string
  ) => {
    const store =
      useCareerPathSkillStore();

    const query =
      useQuery({
        queryKey: [
          "career-path-skills",
          careerPathId,
        ],

        enabled:
          !!careerPathId,

        queryFn:
          async () => {
            const data =
              await getCareerPathSkillsApi(
                careerPathId
              );

            store.setSkills(
              data
            );

            return data;
          },
      });

    return {
      query,

      createMutation:
        useMutation({
          mutationFn: (
            payload
          ) =>
            createCareerPathSkillApi(
              careerPathId,
              payload
            ),

          onSuccess: (
            data
          ) =>
            store.addSkill(
              data
            ),
        }),

      updateMutation:
        useMutation({
          mutationFn: ({
            skillId,
            payload,
          }: any) =>
            updateCareerPathSkillApi(
              careerPathId,
              skillId,
              payload
            ),

          onSuccess: (
            data
          ) =>
            store.updateSkill(
              data
            ),
        }),

      deleteMutation:
        useMutation({
          mutationFn: (
            skillId: string
          ) =>
            deleteCareerPathSkillApi(
              careerPathId,
              skillId
            ),

          onSuccess: (
            _,
            skillId
          ) =>
            store.deleteSkill(
              skillId
            ),
        }),
    };
  };