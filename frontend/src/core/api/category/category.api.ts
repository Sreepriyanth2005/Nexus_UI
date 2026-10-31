import { api } from "../../../config//axios";


export interface Category {
  id: string;
  name: string;
}

export interface CreateCategoryPayload {
  name: string;
}

export interface UpdateCategoryPayload {
  name?: string;
}

export interface CategoryResponse {
  success: boolean;
  message?: string;
  data: Category;
}

export interface CategoriesResponse {
  success: boolean;
  data: Category[];
}

export const createCategory = async (
  payload: CreateCategoryPayload
): Promise<CategoryResponse> => {
  const { data } = await api.post(
    "/categories",
    payload
  );

  return data;
};

export const getCategories =
  async (): Promise<CategoriesResponse> => {
    const { data } =
      await api.get("/categories");

    return data;
  };

export const getCategoryById = async (
  categoryId: string
): Promise<CategoryResponse> => {
  const { data } = await api.get(
    `/categories/${categoryId}`
  );

  return data;
};

export const updateCategory = async (
  categoryId: string,
  payload: UpdateCategoryPayload
): Promise<CategoryResponse> => {
  const { data } = await api.put(
    `/categories/${categoryId}`,
    payload
  );

  return data;
};

export const deleteCategory = async (
  categoryId: string
): Promise<{
  success: boolean;
  message: string;
}> => {
  const { data } = await api.delete(
    `/categories/${categoryId}`
  );

  return data;
};