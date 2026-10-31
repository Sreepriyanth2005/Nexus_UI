import { api } from "../../../config/axios";

export interface LessonPlayerDetails {
  lessonId: string;
  title: string;
  description: string | null;
  videoUrl: string | null;
  transcriptUrl: string | null;
  captionsUrl: string | null;
  duration: number | null;
  isCompleted: boolean;
  lastPositionSecs: number;
}

export interface LessonPlayerAttachment {
  id: string;
  name: string;
  type: string;
  url: string;
  sizeBytes: number;
}

export const LessonPlayerAPI = {
  /**
   * Fetch lesson player details (video, subtitle/transcript, completion status)
   * GET /api/v1/learning/player/lesson/:lessonId
   */
  getLessonPlayerDetails: async (lessonId: string): Promise<LessonPlayerDetails> => {
    const { data } = await api.get(`/learning/player/lesson/${lessonId}`);
    return data.data;
  },

  /**
   * Fetch lesson player attachments
   * GET /api/v1/learning/player/lesson/:lessonId/attachments
   */
  getLessonAttachments: async (lessonId: string): Promise<LessonPlayerAttachment[]> => {
    const { data } = await api.get(`/learning/player/lesson/${lessonId}/attachments`);
    return data.data;
  },
};
