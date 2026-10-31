// src/hooks/category/useCategories.ts

import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import {
  getCategories,
  getCategoryById,
  createCategory as createCategoryApi,
  updateCategory as updateCategoryApi,
  deleteCategory as deleteCategoryApi,
  CreateCategoryPayload,
  UpdateCategoryPayload,
} from "../../core/api/category/category.api";

import { useCategoryStore } from "../../store/category/categoryStore";

const EMPTY_CATEGORIES: any[] = [];

export const useCategories = () => {
  const queryClient =
    useQueryClient();

  const {
    selectedCategory,
    setSelectedCategory,
    clearSelectedCategory,
  } = useCategoryStore();

  // GET ALL
  const categoriesQuery =
    useQuery({
      queryKey: ["categories"],
      queryFn: async () => {
        const response = await getCategories();
        const raw = (response as any)?.data || response;
        if (Array.isArray(raw)) return raw;
        if (Array.isArray((raw as any)?.items)) return (raw as any).items;
        if (Array.isArray((raw as any)?.data)) return (raw as any).data;
        if (Array.isArray((raw as any)?.categories)) return (raw as any).categories;
        return [];
      },
      staleTime: 60000,
      refetchOnWindowFocus: false,
      retry: 1,
    });

  // CREATE
  const createMutation =
    useMutation({
      mutationFn: async (
        payload: CreateCategoryPayload
      ) => {
        const response =
          await createCategoryApi(
            payload
          );

        return (response as any)?.data || response;
      },

      onSuccess: () => {
        queryClient.invalidateQueries(
          {
            queryKey: [
              "categories",
            ],
          }
        );
      },
    });

  // UPDATE
  const updateMutation =
    useMutation({
      mutationFn: async ({
        categoryId,
        payload,
      }: {
        categoryId: string;
        payload: UpdateCategoryPayload;
      }) => {
        const response =
          await updateCategoryApi(
            categoryId,
            payload
          );

        return response.data;
      },

      onSuccess: () => {
        queryClient.invalidateQueries(
          {
            queryKey: [
              "categories",
            ],
          }
        );
      },
    });

  // DELETE
  const deleteMutation =
    useMutation({
      mutationFn: (
        categoryId: string
      ) =>
        deleteCategoryApi(
          categoryId
        ),

      onSuccess: () => {
        queryClient.invalidateQueries(
          {
            queryKey: [
              "categories",
            ],
          }
        );
      },
    });

  // GET BY ID
  const fetchCategoryById =
    async (
      categoryId: string
    ) => {
      const response =
        await getCategoryById(
          categoryId
        );

      return response.data;
    };

  return {
    categories:
      categoriesQuery.data ??
      EMPTY_CATEGORIES,

    loading:
      categoriesQuery.isLoading,

    error:
      categoriesQuery.error,

    refetch:
      categoriesQuery.refetch,

    fetchCategoryById,

    createCategory:
      createMutation.mutateAsync,

    updateCategory:
      updateMutation.mutateAsync,

    deleteCategory:
      deleteMutation.mutateAsync,

    selectedCategory,
    setSelectedCategory,
    clearSelectedCategory,

    creating:
      createMutation.isPending,

    updating:
      updateMutation.isPending,

    deleting:
      deleteMutation.isPending,
  };
};