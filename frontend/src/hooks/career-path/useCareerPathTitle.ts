import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  careerPathTitleKeys,
  getCareerPathTitleApi,
  updateCareerPathTitleApi,
  deleteCareerPathTitleApi,
} from "../../core/api/career-path/career-path-title.api";

export const useCareerPathTitle = (careerPathId?: string) => {
  const queryClient = useQueryClient();

  const detailQuery = useQuery({
    queryKey: careerPathTitleKeys.detail(careerPathId ?? ""),
    queryFn: () => getCareerPathTitleApi(careerPathId!),
    enabled: !!careerPathId,
  });

  const updateMutation = useMutation({
    mutationFn: updateCareerPathTitleApi,

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: careerPathTitleKeys.detail(variables.careerPathId),
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCareerPathTitleApi,
  });

  return {
    data: detailQuery.data?.data,
    isLoading: detailQuery.isLoading,
    error: detailQuery.error,

    getQuery: detailQuery,

    updateMutation,
    deleteMutation,
  };
};