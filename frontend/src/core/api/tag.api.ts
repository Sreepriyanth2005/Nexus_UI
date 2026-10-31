import { api } from "../../config/axios";
import { Tag } from "../../types/master.types";

export const getTagsApi = async (): Promise<Tag[]> => {
  const res = await api.get("/tags");

  return (
    res.data?.data ||
    []
  );
};

export const getTagByIdApi = async (
  tagId: string
): Promise<Tag> => {
  const res = await api.get(`/tags/${tagId}`);

  return res.data.data;
};

export const createTagApi = async (
  payload: { name: string }
) => {
  const res = await api.post(
    "/tags",
    payload
  );

  return res.data;
};

export const updateTagApi = async (
  tagId: string,
  payload: { name: string }
) => {
  const res = await api.patch(
    `/tags/${tagId}`,
    payload
  );

  return res.data;
};

export const deleteTagApi = async (
  tagId: string
) => {
  const res = await api.delete(
    `/tags/${tagId}`
  );

  return res.data;
};