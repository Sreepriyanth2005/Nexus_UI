// src/hooks/lesson/useLessonSkills.ts

import {
  useMutation,
  useQuery,
} from "@tanstack/react-query";

import {
  getLessonSkillsApi,
  createLessonSkillApi,
  updateLessonSkillApi,
  deleteLessonSkillApi,
} from "../../core/api/lesson/lesson-skill.api";

import {
  useLessonSkillStore,
} from "../../store/lesson/lessonSkillStore";

export const useLessonSkills = (
  lessonId: string
) => {
  const {
    skills,
    setSkills,
    addSkill,
    updateSkill,
    deleteSkill,
  } = useLessonSkillStore();

  const query = useQuery({
    queryKey: [
      "lesson-skills",
      lessonId,
    ],

    enabled: !!lessonId,

    queryFn: async () => {
      const data =
        await getLessonSkillsApi(
          lessonId
        );

      setSkills(data);

      return data;
    },
  });

  const createMutation =
    useMutation({
      mutationFn: (
        payload: any
      ) =>
        createLessonSkillApi(
          lessonId,
          payload
        ),

      onSuccess: (
        data
      ) =>
        addSkill(
          data
        ),
    });

  const updateMutation =
    useMutation({
      mutationFn: ({
        skillId,
        payload,
      }: any) =>
        updateLessonSkillApi(
          lessonId,
          skillId,
          payload
        ),

      onSuccess: (
        data
      ) =>
        updateSkill(
          data
        ),
    });

  const deleteMutation =
    useMutation({
      mutationFn: (
        skillId: string
      ) =>
        deleteLessonSkillApi(
          lessonId,
          skillId
        ),

      onSuccess: (
        _,
        skillId
      ) =>
        deleteSkill(
          skillId
        ),
    });

  return {
    skills,
    query,
    createMutation,
    updateMutation,
    deleteMutation,
  };
};