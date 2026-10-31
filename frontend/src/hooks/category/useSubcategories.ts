// src/hooks/category/useSubcategories.ts

import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import {
  getSubcategories,
  getSubcategoryById,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
  CreateSubcategoryPayload,
  UpdateSubcategoryPayload,
} from "../../core/api/category/subcategory.api";

import { useSubcategoryStore } from "../../store/category/subcategoryStore";

const EMPTY_SUBCATEGORIES: any[] = [];

export const useSubcategories = (
  categoryId?: string
) => {
  const queryClient =
    useQueryClient();

  const {
    selectedSubcategory,
    setSelectedSubcategory,
    clearSelectedSubcategory,
  } = useSubcategoryStore();

  const subcategoriesQuery =
    useQuery({
      queryKey: [
        "subcategories",
        categoryId,
      ],

      queryFn: async () => {
        try {
          const response =
            await getSubcategories(
              categoryId!
            );

          const list = (response as any)?.data || response;
          return Array.isArray(list) ? list : [];
        } catch (err) {
          console.warn("Failed to fetch subcategories:", err);
          return [];
        }
      },

      enabled:
        Boolean(categoryId && categoryId !== "new" && categoryId.trim() !== ""),
      staleTime: 60000,
      gcTime: 300000,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      retry: false,
    });

  const createMutation =
    useMutation({
      mutationFn: ({
        categoryId,
        payload,
      }: {
        categoryId: string;
        payload: CreateSubcategoryPayload;
      }) =>
        createSubcategory(
          categoryId,
          payload
        ),

      onSuccess: () => {
        queryClient.invalidateQueries(
          {
            queryKey: [
              "subcategories",
            ],
          }
        );
      },
    });

  const updateMutation =
    useMutation({
      mutationFn: ({
        categoryId,
        subCategoryId,
        payload,
      }: {
        categoryId: string;
        subCategoryId: string;
        payload: UpdateSubcategoryPayload;
      }) =>
        updateSubcategory(
          categoryId,
          subCategoryId,
          payload
        ),

      onSuccess: () => {
        queryClient.invalidateQueries(
          {
            queryKey: [
              "subcategories",
            ],
          }
        );
      },
    });

  const deleteMutation =
    useMutation({
      mutationFn: ({
        categoryId,
        subCategoryId,
      }: {
        categoryId: string;
        subCategoryId: string;
      }) =>
        deleteSubcategory(
          categoryId,
          subCategoryId
        ),

      onSuccess: () => {
        queryClient.invalidateQueries(
          {
            queryKey: [
              "subcategories",
            ],
          }
        );
      },
    });

  const fetchSubcategoryById =
    async (
      subCategoryId: string
    ) => {
      const response =
        await getSubcategoryById(
          subCategoryId
        );

      return response.data;
    };

  return {
    subcategories:
      subcategoriesQuery.data ??
      EMPTY_SUBCATEGORIES,

    loading:
      subcategoriesQuery.isLoading,

    error:
      subcategoriesQuery.error,

    refetch:
      subcategoriesQuery.refetch,

    fetchSubcategoryById,

    createSubcategory:
      createMutation.mutateAsync,

    updateSubcategory:
      updateMutation.mutateAsync,

    deleteSubcategory:
      deleteMutation.mutateAsync,

    selectedSubcategory,
    setSelectedSubcategory,
    clearSelectedSubcategory,

    creating:
      createMutation.isPending,

    updating:
      updateMutation.isPending,

    deleting:
      deleteMutation.isPending,
  };
};