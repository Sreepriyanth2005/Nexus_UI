// src/hooks/course/useCourseSkills.ts

import {
  useMutation,
  useQuery,
} from "@tanstack/react-query";

import {
  getCourseSkillsApi,
  createCourseSkillApi,
  updateCourseSkillApi,
  deleteCourseSkillApi,
} from "../../core/api/course/course-skill.api";

import {
  useCourseSkillStore,
} from "../../store/course/courseSkillStore";

export const useCourseSkills =
  (
    courseId: string
  ) => {
    const {
      skills,
      setSkills,
      addSkill,
      updateSkill,
      deleteSkill,
    } =
      useCourseSkillStore();

    const query =
      useQuery({
        queryKey: [
          "course-skills",
          courseId,
        ],

        enabled:
          !!courseId,

        queryFn:
          async () => {
            const data =
              await getCourseSkillsApi(
                courseId
              );

            setSkills(
              data
            );

            return data;
          },
      });

    const createMutation =
      useMutation({
        mutationFn: (
          payload
        ) =>
          createCourseSkillApi(
            courseId,
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
          updateCourseSkillApi(
            courseId,
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
          deleteCourseSkillApi(
            courseId,
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