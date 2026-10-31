// src/hooks/useSubjects.ts

import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import {
  Subject,
  getSubjects,
  getSubjectById,
  createSubject as createSubjectApi,
  updateSubject as updateSubjectApi,
  deleteSubject as deleteSubjectApi,
  CreateSubjectPayload,
  UpdateSubjectPayload,
} from "../core/api/subject.api";

export const useSubjects = () => {
  const queryClient =
    useQueryClient();

  // GET ALL SUBJECTS
  const subjectsQuery =
    useQuery({
      queryKey: ["subjects"],
      queryFn: async () => {
        const response = await getSubjects();
        const raw = (response as any)?.data || response;
        if (Array.isArray(raw)) return raw;
        if (Array.isArray((raw as any)?.items)) return (raw as any).items;
        if (Array.isArray((raw as any)?.data)) return (raw as any).data;
        if (Array.isArray((raw as any)?.subjects)) return (raw as any).subjects;
        return [];
      },
      staleTime: 60000,
      refetchOnWindowFocus: false,
      retry: 1,
    });

  // CREATE SUBJECT
  const createMutation =
    useMutation({
      mutationFn:
        createSubjectApi,

      onSuccess: () => {
        queryClient.invalidateQueries(
          {
            queryKey: [
              "subjects",
            ],
          }
        );
      },
    });

  // UPDATE SUBJECT
  const updateMutation =
    useMutation({
      mutationFn: ({
        subjectId,
        payload,
      }: {
        subjectId: string;
        payload: UpdateSubjectPayload;
      }) =>
        updateSubjectApi(
          subjectId,
          payload
        ),

      onSuccess: () => {
        queryClient.invalidateQueries(
          {
            queryKey: [
              "subjects",
            ],
          }
        );
      },
    });

  // DELETE SUBJECT
  const deleteMutation =
    useMutation({
      mutationFn: (
        subjectId: string
      ) =>
        deleteSubjectApi(
          subjectId
        ),

      onSuccess: () => {
        queryClient.invalidateQueries(
          {
            queryKey: [
              "subjects",
            ],
          }
        );
      },
    });

  // GET SUBJECT BY ID
  const fetchSubjectById =
    async (
      subjectId: string
    ): Promise<Subject> => {
      const response =
        await getSubjectById(
          subjectId
        );

      return response.data;
    };

  // CREATE SUBJECT
  const createSubject =
    async (
      payload: CreateSubjectPayload
    ): Promise<any> => {
      const response =
        await createMutation.mutateAsync(
          payload
        );

      return (response as any)?.data || response;
    };

  // UPDATE SUBJECT
  const updateSubject =
    async (
      subjectId: string,
      payload: UpdateSubjectPayload
    ): Promise<Subject> => {
      const response =
        await updateMutation.mutateAsync(
          {
            subjectId,
            payload,
          }
        );

      return response.data;
    };

  // DELETE SUBJECT
  const deleteSubject =
    async (
      subjectId: string
    ): Promise<void> => {
      await deleteMutation.mutateAsync(
        subjectId
      );
    };

  return {
    subjects:
      subjectsQuery.data ??
      [],

    loading:
      subjectsQuery.isLoading,

    error:
      subjectsQuery.error,

    refetch:
      subjectsQuery.refetch,

    fetchSubjectById,

    createSubject,

    updateSubject,

    deleteSubject,

    creating:
      createMutation.isPending,

    updating:
      updateMutation.isPending,

    deleting:
      deleteMutation.isPending,
  };
};