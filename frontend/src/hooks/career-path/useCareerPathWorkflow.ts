// src/hooks/career-path/useCareerPathWorkflow.ts

import {
  useMutation,
} from "@tanstack/react-query";

import {
  submitCareerPathApi,
  reviewCareerPathApi,
  approveCareerPathApi,
  rejectCareerPathApi,
  publishCareerPathApi,
  unpublishCareerPathApi,
  archiveCareerPathApi,
} from "../../core/api/career-path/careerpath-workflow.api";

export const useCareerPathWorkflow =
  (
    careerPathId: string
  ) => {
    return {
      submitMutation:
        useMutation({
          mutationFn: (payload?: { reviewerId?: string }) =>
            submitCareerPathApi(
              careerPathId,
              payload
            ),
        }),

      reviewMutation:
        useMutation({
          mutationFn: (
            payload
          ) =>
            reviewCareerPathApi(
              careerPathId,
              payload
            ),
        }),

      approveMutation:
        useMutation({
          mutationFn: () =>
            approveCareerPathApi(
              careerPathId
            ),
        }),

      rejectMutation:
        useMutation({
          mutationFn: (
            payload
          ) =>
            rejectCareerPathApi(
              careerPathId,
              payload
            ),
        }),

      publishMutation:
        useMutation({
          mutationFn: (publishedById: string) =>
            publishCareerPathApi(
              careerPathId,
              publishedById
            ),
        }),

      unpublishMutation:
        useMutation({
          mutationFn: (unpublishedById: string) =>
            unpublishCareerPathApi(
              careerPathId,
              unpublishedById
            ),
        }),

      archiveMutation:
        useMutation({
          mutationFn: () =>
            archiveCareerPathApi(
              careerPathId
            ),
        }),
    };
  };