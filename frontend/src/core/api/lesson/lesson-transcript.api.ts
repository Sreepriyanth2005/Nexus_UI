import { api } from "../../../config/axios";

export const createLessonTranscript = async (
  lessonId: string,
  transcriptAssetId: string
) => {
  const { data } = await api.post(
    `/lessons/${lessonId}/transcript`,
    {
      transcriptAssetId,
    }
  );

  return data.data;
};

export const getLessonTranscript = async (
  lessonId: string
) => {
  const { data } = await api.get(
    `/lessons/${lessonId}/transcript`
  );

  return data.data;
};

export const updateLessonTranscript = async (
  lessonId: string,
  transcriptAssetId: string
) => {
  const { data } = await api.put(
    `/lessons/${lessonId}/transcript`,
    {
      transcriptAssetId,
    }
  );

  return data.data;
};

export const deleteLessonTranscript = async (
  lessonId: string
) => {
  const { data } = await api.delete(
    `/lessons/${lessonId}/transcript`
  );

  return data;
};