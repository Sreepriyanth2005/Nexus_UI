import { api } from "../../../config/axios";

export interface AssetPersona {
  assetId: string;

  personaId: string;

  assignedAt: string;

  assignedBy?: string | null;

  [key: string]: any;
}

export interface CreateAssetPersonaPayload {
  personaId: string;
  assignedBy?: string;
}

export interface UpdateAssetPersonaPayload {
  personaId: string;
}

export const getAssetPersonasApi =
  async (
    assetId: string
  ): Promise<AssetPersona[]> => {
    const res = await api.get(
      `/assets/${assetId}/personas`
    );

    return (
      res.data?.personas ||
      res.data?.data ||
      []
    );
  };

export const getAssetPersonaByIdApi =
  async (
    assetId: string,
    personaId: string
  ): Promise<AssetPersona> => {
    const res = await api.get(
      `/assets/${assetId}/personas/${personaId}`
    );

    return (
      res.data?.persona ||
      res.data?.data ||
      res.data
    );
  };

export const createAssetPersonaApi =
  async (
    assetId: string,
    payload: CreateAssetPersonaPayload
  ): Promise<AssetPersona> => {
    const res = await api.post(
      `/assets/${assetId}/personas`,
      payload
    );

    return (
      res.data?.persona ||
      res.data?.data ||
      res.data
    );
  };

export const updateAssetPersonaApi =
  async (
    assetId: string,
    personaId: string,
    payload: UpdateAssetPersonaPayload
  ): Promise<AssetPersona> => {
    const res = await api.put(
      `/assets/${assetId}/personas/${personaId}`,
      payload
    );

    return (
      res.data?.persona ||
      res.data?.data ||
      res.data
    );
  };

export const deleteAssetPersonaApi =
  async (
    assetId: string,
    personaId: string
  ) => {
    const res = await api.delete(
      `/assets/${assetId}/personas/${personaId}`
    );

    return res.data;
  };