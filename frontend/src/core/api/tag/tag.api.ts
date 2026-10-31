// src/core/api/tag/tag.api.ts

import { api } from "../../../config/axios";

export interface Tag {
  id?: string;
  name: string;
  description?: string;
}

export const getTagsApi =
  async (): Promise<Tag[]> => {
    const res = await api.get(
      "/tags"
    );

    return (
      res.data?.tags ||
      res.data?.data ||
      []
    );
  };

export const getTagByIdApi =
  async (
    id: string
  ): Promise<Tag> => {
    const res = await api.get(
      `/tags/${id}`
    );

    return (
      res.data?.tag ||
      res.data?.data ||
      res.data
    );
  };

export const createTagApi =
  async (
    data: Partial<Tag>
  ) => {
    const res = await api.post(
      "/tags",
      data
    );

    return (
      res.data?.tag ||
      res.data?.data ||
      res.data
    );
  };

export const updateTagApi =
  async (
    id: string,
    data: Partial<Tag>
  ) => {
    const res = await api.patch(
      `/tags/${id}`,
      data
    );

    return (
      res.data?.tag ||
      res.data?.data ||
      res.data
    );
  };

export const deleteTagApi =
  async (
    id: string
  ) => {
    const res = await api.delete(
      `/tags/${id}`
    );

    return res.data;
  };