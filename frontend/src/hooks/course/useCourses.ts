// src/hooks/useCourses.ts

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  courseApi,
  courseKeys,
  CourseListParams,
} from "../../core/api/course/course.api";

export const useCourses = (params?: CourseListParams) => {
  const queryClient = useQueryClient();

  // ============================
  // Queries
  // ============================

  const courses = useQuery({
    queryKey: courseKeys.list(params),
    queryFn: async () => (await courseApi.list(params)).data,
  });

  // ============================
  // Mutations
  // ============================

  const createMutation = useMutation({
    mutationFn: (payload: FormData) =>
      courseApi.create(payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: courseKeys.lists(),
      });
    },
  });

  const updateMutation = useMutation({
   mutationFn: ({
  id,
  data,
}: {
  id: string;
  data: any;
}) => courseApi.update(id, data),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: courseKeys.detail(variables.id),
      });

      queryClient.invalidateQueries({
        queryKey: courseKeys.lists(),
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      courseApi.delete(id),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: courseKeys.lists(),
      });
    },
  });

  const publishMutation = useMutation({
    mutationFn: (id: string) =>
      courseApi.publish(id),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: courseKeys.lists(),
      });
    },
  });

  const unpublishMutation = useMutation({
    mutationFn: (id: string) =>
      courseApi.unpublish(id),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: courseKeys.lists(),
      });
    },
  });

  const regenerateShareTokenMutation = useMutation({
    mutationFn: (id: string) =>
      courseApi.regenerateShareToken(id),
  });

  return {
    // Query
    courses,

    // Mutations
    createMutation,
    updateMutation,
    deleteMutation,
    publishMutation,
    unpublishMutation,
    regenerateShareTokenMutation,
  };
};

export const useMyCourses = (userId?: string, queryParams?: CourseListParams) => {
  return useQuery({
    queryKey: [...courseKeys.lists(), "my-courses", userId, queryParams],
    queryFn: async () => (await courseApi.getMyCourses(userId!, queryParams)).data,
    enabled: !!userId,
  });
};