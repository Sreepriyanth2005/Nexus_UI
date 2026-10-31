import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  careerPathKeys,
  getCareerPathsApi,
  getCareerPathApi,
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
    mutationFn: updateCareerPathApi,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: careerPathKeys.lists(),
      });

      if (selected?.id) {
        queryClient.invalidateQueries({
          queryKey: careerPathKeys.detail(selected.id),
        });
      }
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