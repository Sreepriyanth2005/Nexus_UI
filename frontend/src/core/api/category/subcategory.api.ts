import { api } from "../../../config/axios";

export interface Subcategory {
  id: string;
  name: string;
  categoryId: string;
}

export interface CreateSubcategoryPayload {
  name: string;
}

export interface UpdateSubcategoryPayload {
  name?: string;
}

export interface SubcategoryResponse {
  success: boolean;
  message?: string;
  data: Subcategory;
}

export interface SubcategoriesResponse {
  success: boolean;
  data: Subcategory[];
}

export const getSubcategories =
  async (categoryId: string) => {

    const url =
      `/categories/${categoryId}/sub-categories`;

    console.log("REQUEST:", url);

    const { data } =
      await api.get(url);

    return data;
  };

export const getSubcategoryById =
  async (
    subCategoryId: string
  ): Promise<SubcategoryResponse> => {
    const { data } =
      await api.get(
        `/sub-categories/${subCategoryId}`
      );

    return data;
  };

export const createSubcategory =
  async (
    categoryId: string,
    payload: CreateSubcategoryPayload
  ): Promise<SubcategoryResponse> => {
    const { data } =
      await api.post(
        `/categories/${categoryId}/sub-categories`,
        payload
      );

    return data;
  };

export const updateSubcategory =
  async (
    categoryId: string,
    subCategoryId: string,
    payload: UpdateSubcategoryPayload
  ): Promise<SubcategoryResponse> => {
    const { data } =
      await api.put(
        `/categories/${categoryId}/sub-categories/${subCategoryId}`,
        payload
      );

    return data;
  };

export const deleteSubcategory =
  async (
    categoryId: string,
    subCategoryId: string
  ) => {
    const { data } =
      await api.delete(
        `/categories/${categoryId}/sub-categories/${subCategoryId}`
      );

    return data;
  };