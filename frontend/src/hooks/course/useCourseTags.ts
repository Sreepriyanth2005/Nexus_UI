// src/hooks/course/useCourseTags.ts

import {
  useMutation,
  useQuery,
} from "@tanstack/react-query";

import {
  getCourseTagsApi,
  createCourseTagApi,
  updateCourseTagApi,
  deleteCourseTagApi,
} from "../../core/api/course/course-tag.api";

import {
  useCourseTagStore,
} from "../../store/course/courseTagStore";

export const useCourseTags = (
  courseId: string
) => {
  const {
    tags,
    setTags,
    addTag,
    updateTag,
    deleteTag,
  } = useCourseTagStore();

  const query = useQuery({
    queryKey: [
      "course-tags",
      courseId,
    ],

    enabled: !!courseId,

    queryFn: async () => {
      const data =
        await getCourseTagsApi(
          courseId
        );

      setTags(data);

      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (
      payload: any
    ) =>
      createCourseTagApi(
        courseId,
        payload
      ),

    onSuccess: (
      data
    ) => {
      addTag(data);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      tagId,
      payload,
    }: {
      tagId: string;
      payload: any;
    }) =>
      updateCourseTagApi(
        courseId,
        tagId,
        payload
      ),

    onSuccess: (
      data
    ) => {
      updateTag(data);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (
      tagId: string
    ) =>
      deleteCourseTagApi(
        courseId,
        tagId
      ),

    onSuccess: (
      _,
      tagId
    ) => {
      deleteTag(tagId);
    },
  });

  return {
    tags,
    query,
    createMutation,
    updateMutation,
    deleteMutation,
  };
};