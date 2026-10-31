import { useQuery } from "@tanstack/react-query";

import {
  getLessonTypes,
  getLessonStatuses,
  getCourseStatuses,
  getDifficultyLevels,
  getCareerPathStatuses,
  getVisibilities,
  getPreviewAccessType,
} from "../core/api/enum.api";

import { useEnumStore } from "../store/enum.store";

export const useLessonTypes = () => {
  const setLessonTypes = useEnumStore(
    (state) => state.setLessonTypes
  );

  return useQuery({
    queryKey: ["lesson-types"],
    queryFn: async () => {
      try {
        const raw = await getLessonTypes();
        const data = Array.isArray(raw) ? raw : (Array.isArray((raw as any)?.data) ? (raw as any).data : []);
        const result = data.length > 0 ? data : ["VIDEO", "DOCUMENT", "AUDIO", "TEXT", "ARTICLE", "PDF"];
        setLessonTypes(result);
        return result;
      } catch {
        const fallback = ["VIDEO", "DOCUMENT", "AUDIO", "TEXT", "ARTICLE", "PDF"];
        setLessonTypes(fallback);
        return fallback;
      }
    },
    staleTime: Infinity,
  });
};

export const useLessonStatuses = () => {
  const setLessonStatuses = useEnumStore(
    (state) => state.setLessonStatuses
  );

  return useQuery({
    queryKey: ["lesson-statuses"],
    queryFn: async () => {
      const data = await getLessonStatuses();
      setLessonStatuses(data);
      return data;
    },
    staleTime: Infinity,
  });
};

export const useCourseStatuses = () => {
  const setCourseStatuses = useEnumStore(
    (state) => state.setCourseStatuses
  );

  return useQuery({
    queryKey: ["course-statuses"],
    queryFn: async () => {
      const data = await getCourseStatuses();
      setCourseStatuses(data);
      return data;
    },
    staleTime: Infinity,
  });
};

export const useDifficultyLevels = () => {
  const setDifficultyLevels = useEnumStore(
    (state) => state.setDifficultyLevels
  );

  return useQuery({
    queryKey: ["difficulty-levels"],
    queryFn: async () => {
      try {
        const raw = await getDifficultyLevels();
        const data = Array.isArray(raw) ? raw : (Array.isArray((raw as any)?.data) ? (raw as any).data : []);
        const result = data.length > 0 ? data : ["BEGINNER", "INTERMEDIATE", "ADVANCED"];
        setDifficultyLevels(result);
        return result;
      } catch {
        const fallback = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];
        setDifficultyLevels(fallback);
        return fallback;
      }
    },
    staleTime: Infinity,
  });
};

export const useCareerPathStatuses = () => {
  const setCareerPathStatuses = useEnumStore(
    (state) => state.setCareerPathStatuses
  );

  return useQuery({
    queryKey: ["career-path-statuses"],
    queryFn: async () => {
      const data = await getCareerPathStatuses();
      setCareerPathStatuses(data);
      return data;
    },
    staleTime: Infinity,
  });
};

export const useVisibilities = () => {
  const setVisibilities = useEnumStore(
    (state) => state.setVisibilities
  );

  return useQuery({
    queryKey: ["visibilities"],
    queryFn: async () => {
      const data = await getVisibilities();
      setVisibilities(data);
      return data;
    },
    staleTime: Infinity,
  });
  
};

export const usePreviewAccessType = () => {
  const setPreviewAccessType = useEnumStore(
    (state) => state.setPreviewAccessType
  );

  return useQuery({
    queryKey: ["preview-access-type"],
    queryFn: async () => {
      const data = await getPreviewAccessType();
      setPreviewAccessType(data);
      return data;
    },
    staleTime: Infinity,
  });
};