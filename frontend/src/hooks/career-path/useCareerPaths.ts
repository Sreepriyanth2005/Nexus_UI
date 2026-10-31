import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  careerPathKeys,
  getCareerPathsApi,
  getCareerPathApi,
  getAllCareerPathsApi,
  getMyCareerPathsApi,
  createCareerPathApi,
  updateCareerPathApi,
  deleteCareerPathApi,
  publishCareerPathApi,
  unpublishCareerPathApi,
} from "../../core/api/career-path/career-path.api";

import { useCareerPathStore } from "../../store/career-path/careerPathStore";

export const useCareerPaths = (params?: any) => {

  const queryClient = useQueryClient();
  const { selected, setSelected } = useCareerPathStore();

  const listQuery = useQuery({
    queryKey: careerPathKeys.list(params),
    queryFn: () => getCareerPathsApi(params),
  });

  const detailQuery = useQuery({
    queryKey: careerPathKeys.detail(selected?.id ?? ""),
    queryFn: () => getCareerPathApi(selected!.id),
    enabled: !!selected?.id,
  });

  const createMutation = useMutation({
    mutationFn: createCareerPathApi,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: careerPathKeys.lists(),
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
  }) =>
    updateCareerPathApi({
      id,
      data,
    }),

  onSuccess: (_, variables) => {
    queryClient.invalidateQueries({
      queryKey: careerPathKeys.lists(),
    });

    queryClient.invalidateQueries({
      queryKey: careerPathKeys.detail(variables.id),
    });
  },
});

  const deleteMutation = useMutation({
    mutationFn: deleteCareerPathApi,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: careerPathKeys.lists(),
      });
    },
  });

  const publishMutation = useMutation({
    mutationFn: publishCareerPathApi,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: careerPathKeys.lists(),
      });
    },
  });

  const unpublishMutation = useMutation({
    mutationFn: unpublishCareerPathApi,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: careerPathKeys.lists(),
      });
    },
  });

  return {
    ...listQuery,

    selected,
    setSelected,

    detailQuery,

    createMutation,
    updateMutation,
    deleteMutation,

    publishMutation,
    unpublishMutation,
  };
};

export const useMyCareerPaths = (userId?: string, queryParams?: any) => {
  return useQuery({
    queryKey: [...careerPathKeys.list(queryParams), "my-career-paths", userId],
    queryFn: () => getMyCareerPathsApi(userId!, queryParams),
    enabled: !!userId,
  });
};