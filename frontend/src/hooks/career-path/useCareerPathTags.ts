// src/hooks/career-path/useCareerPathTags.ts

import {
  useMutation,
} from "@tanstack/react-query";

import {
  createCareerPathTagApi,
  updateCareerPathTagApi,
  deleteCareerPathTagApi,
  getCareerPathTagApi,
} from "../../core/api/career-path/careerpath-tag.api";

import {
  useCareerPathTagStore,
} from "../../store/career-path/careerPathTagStore";

export const useCareerPathTags =
  (
    careerPathId: string
  ) => {
    const store =
      useCareerPathTagStore();

    return {
      getById:
        getCareerPathTagApi,

      createMutation:
        useMutation({
          mutationFn: (
            payload
          ) =>
            createCareerPathTagApi(
              careerPathId,
              payload
            ),

          onSuccess: (
            data
          ) =>
            store.addTag(
              data
            ),
        }),

      updateMutation:
        useMutation({
          mutationFn: ({
            tagId,
            payload,
          }: any) =>
            updateCareerPathTagApi(
              careerPathId,
              tagId,
              payload
            ),

          onSuccess: (
            data
          ) =>
            store.updateTag(
              data
            ),
        }),

      deleteMutation:
        useMutation({
          mutationFn: (
            tagId: string
          ) =>
            deleteCareerPathTagApi(
              careerPathId,
              tagId
            ),

          onSuccess: (
            _,
            tagId
          ) =>
            store.deleteTag(
              tagId
            ),
        }),
    };
  };