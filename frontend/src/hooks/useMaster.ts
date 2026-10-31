import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  getSkillsApi,
  createSkillApi,
  updateSkillApi,
  deleteSkillApi,
} from "../core/api/skill.api";

import {
  getTagsApi,
  createTagApi,
  updateTagApi,
  deleteTagApi,
} from "../core/api/tag.api";

import {
  useMasterStore,
} from "../store/master.store";

export const useSkills = () => {
  const setSkills =
    useMasterStore(
      (state) =>
        state.setSkills
    );

  return useQuery({
    queryKey: ["skills"],
    queryFn: async () => {
      const data =
        await getSkillsApi();

      setSkills(data);

      return data;
    },
    staleTime: Infinity,
  });
};

export const useTags = () => {
  const setTags =
    useMasterStore(
      (state) =>
        state.setTags
    );

  return useQuery({
    queryKey: ["tags"],
    queryFn: async () => {
      const data =
        await getTagsApi();

      setTags(data);

      return data;
    },
    staleTime: Infinity,
  });
};

export const useCreateSkill =
  () => {
    const queryClient =
      useQueryClient();

    return useMutation({
      mutationFn:
        createSkillApi,

      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: [
            "skills",
          ],
        });
      },
    });
  };


  export const useUpdateSkill =
  () => {
    const queryClient =
      useQueryClient();

    return useMutation({
      mutationFn: ({
        skillId,
        payload,
      }: {
        skillId: string;
        payload: {
          name: string;
        };
      }) =>
        updateSkillApi(
          skillId,
          payload
        ),

      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: [
            "skills",
          ],
        });
      },
    });
  };


  export const useDeleteSkill =
  () => {
    const queryClient =
      useQueryClient();

    return useMutation({
      mutationFn:
        deleteSkillApi,

      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: [
            "skills",
          ],
        });
      },
    });
  };

  export const useCreateTag =
  () => {
    const queryClient =
      useQueryClient();

    return useMutation({
      mutationFn:
        createTagApi,

      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: [
            "tags",
          ],
        });
      },
    });
  };

  export const useUpdateTag =
  () => {
    const queryClient =
      useQueryClient();

    return useMutation({
      mutationFn: ({
        tagId,
        payload,
      }: {
        tagId: string;
        payload: {
          name: string;
        };
      }) =>
        updateTagApi(
          tagId,
          payload
        ),

      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: [
            "tags",
          ],
        });
      },
    });
  };


  export const useDeleteTag =
  () => {
    const queryClient =
      useQueryClient();

    return useMutation({
      mutationFn:
        deleteTagApi,

      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: [
            "tags",
          ],
        });
      },
    });
  };

  