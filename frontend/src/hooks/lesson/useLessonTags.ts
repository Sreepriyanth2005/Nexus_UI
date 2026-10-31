// src/hooks/lesson/useLessonTags.ts

import {
  useMutation,
  useQuery,
} from "@tanstack/react-query";

import {
  getLessonTagsApi,
  createLessonTagApi,
  updateLessonTagApi,
  deleteLessonTagApi,
} from "../../core/api/lesson/lesson-tag.api";

import {
  useLessonTagStore,
} from "../../store/lesson/lessonTagStore";

export const useLessonTags = (
  lessonId: string
) => {
  const {
    tags,
    setTags,
    addTag,
    updateTag,
    deleteTag,
  } = useLessonTagStore();

  const query = useQuery({
    queryKey: [
      "lesson-tags",
      lessonId,
    ],

    enabled: !!lessonId,

    queryFn: async () => {
      const data =
        await getLessonTagsApi(
          lessonId
        );

      setTags(data);

      return data;
    },
  });

  const createMutation =
    useMutation({
      mutationFn: (
        payload: any
      ) =>
        createLessonTagApi(
          lessonId,
          payload
        ),

      onSuccess: (
        data
      ) =>
        addTag(
          data
        ),
    });

  const updateMutation =
    useMutation({
      mutationFn: ({
        tagId,
        payload,
      }: any) =>
        updateLessonTagApi(
          lessonId,
          tagId,
          payload
        ),

      onSuccess: (
        data
      ) =>
        updateTag(
          data
        ),
    });

  const deleteMutation =
    useMutation({
      mutationFn: (
        tagId: string
      ) =>
        deleteLessonTagApi(
          lessonId,
          tagId
        ),

      onSuccess: (
        _,
        tagId
      ) =>
        deleteTag(
          tagId
        ),
    });

  return {
    tags,
    query,
    createMutation,
    updateMutation,
    deleteMutation,
  };
};