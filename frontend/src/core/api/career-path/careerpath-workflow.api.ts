import { api } from "../../../config/axios";

export const submitCareerPathApi =
  async (careerPathId: string, payload?: { reviewerId?: string }) =>
    api.post(
      `/career-paths/${careerPathId}/submit`,
      payload
    );

export const reviewCareerPathApi =
  async (
    careerPathId: string,
    data?: any
  ) =>
    api.post(
      `/career-paths/${careerPathId}/review`,
      data
    );

export const approveCareerPathApi =
  async (
    careerPathId: string
  ) =>
    api.post(
      `/career-paths/${careerPathId}/approve`
    );

export const rejectCareerPathApi =
  async (
    careerPathId: string,
    data?: any
  ) =>
    api.post(
      `/career-paths/${careerPathId}/reject`,
      data
    );

export const publishCareerPathApi =
  async (
    careerPathId: string,
    publishedById: string
  ) =>
    api.post(
      `/career-paths/${careerPathId}/publish`,
      { publishedById }
    );

export const unpublishCareerPathApi =
  async (
    careerPathId: string,
    unpublishedById: string
  ) =>
    api.post(
      `/career-paths/${careerPathId}/unpublish`,
      { unpublishedById }
    );

export const archiveCareerPathApi =
  async (
    careerPathId: string
  ) =>
    api.post(
      `/career-paths/${careerPathId}/archive`
    );