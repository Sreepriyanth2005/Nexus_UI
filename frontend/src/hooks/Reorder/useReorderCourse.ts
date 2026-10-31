import { useMutation, useQueryClient } from "@tanstack/react-query";
import { reorderCareerPathCoursesApi, ReorderCoursesInput } from "../../core/api/Reorder/ReorderCourses.api";

export const useReorderCourses = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      careerPathId,
      data,
    }: {
      careerPathId: string;
      data: ReorderCoursesInput;
    }) => reorderCareerPathCoursesApi(careerPathId, data),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({
        queryKey: ["career-path-courses", variables.careerPathId],
      });
    },
  });
};
