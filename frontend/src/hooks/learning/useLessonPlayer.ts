import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { LessonPlayerAPI, LessonPlayerDetails, LessonPlayerAttachment } from "../../core/api/learning/lessonPlayer.api";
import { useLessonPlayerStore } from "../../store/learning/lessonPlayer.store";

export const useLessonPlayerKeys = {
  all: ["lesson-player"] as const,
  details: (lessonId: string) => [...useLessonPlayerKeys.all, "details", lessonId] as const,
  attachments: (lessonId: string) => [...useLessonPlayerKeys.all, "attachments", lessonId] as const,
};

/**
 * Hook to fetch lesson player details using backend route:
 * GET /api/v1/learning/player/lesson/:lessonId
 */
export const useLessonPlayer = (lessonId?: string, enabled = true) => {
  const setPlayerDetails = useLessonPlayerStore((state) => state.setPlayerDetails);

  const query = useQuery<LessonPlayerDetails>({
    queryKey: useLessonPlayerKeys.details(lessonId || ""),
    queryFn: () => LessonPlayerAPI.getLessonPlayerDetails(lessonId!),
    enabled: !!lessonId && enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });

  useEffect(() => {
    if (query.data) {
      setPlayerDetails(query.data);
    }
  }, [query.data, setPlayerDetails]);

  return query;
};

/**
 * Hook to fetch lesson player attachments using backend route:
 * GET /api/v1/learning/player/lesson/:lessonId/attachments
 */
export const useLessonPlayerAttachments = (lessonId?: string, enabled = true) => {
  const setAttachments = useLessonPlayerStore((state) => state.setAttachments);

  const query = useQuery<LessonPlayerAttachment[]>({
    queryKey: useLessonPlayerKeys.attachments(lessonId || ""),
    queryFn: () => LessonPlayerAPI.getLessonAttachments(lessonId!),
    enabled: !!lessonId && enabled,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (query.data) {
      setAttachments(query.data);
    }
  }, [query.data, setAttachments]);

  return query;
};
