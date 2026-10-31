import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getLearningPath,
  getSubjectsList,
  getCoursesList,
  updateLearningPath,
} from "../../core/api/admin-learning-path/adminLearningPath.api";
import {
  AdminLearningPathDto,
  SubjectDto,
  CourseSelectionDto,
  LearningPathFormModel,
} from "../../core/api/admin-learning-path/adminLearningPath.types";

export const useLearningPath = (id: string) => {
  return useQuery<AdminLearningPathDto>({
    queryKey: ["career-paths", "detail", id],
    queryFn: () => getLearningPath(id),
    enabled: !!id,
  });
};

export const useSubjects = () => {
  return useQuery<SubjectDto[]>({
    queryKey: ["subjects"],
    queryFn: getSubjectsList,
  });
};

export const useCourses = () => {
  return useQuery<CourseSelectionDto[]>({
    queryKey: ["courses", "selection-list"],
    queryFn: getCoursesList,
  });
};

export const useUpdateLearningPath = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: {
        formModel: LearningPathFormModel;
        updatedCourses: { id: string; title: string }[];
        originalCourses: { id: string; title: string }[];
      };
    }) => updateLearningPath(id, payload),
    onSuccess: (_, variables) => {
      // Invalidate both detail and list queries to trigger refreshing
      queryClient.invalidateQueries({ queryKey: ["career-paths"] });
    },
  });
};
