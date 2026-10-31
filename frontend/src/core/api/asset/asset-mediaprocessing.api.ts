import { api } from "../../../config/axios";

export type ProcessingStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED";

export interface MediaProcessing {
  id: string;

  assetId: string;

  duration?: number;

  width?: number;
  height?: number;

  bitrate?: number;
  fps?: number;

  codec?: string;

  thumbnailAssetId?: string;

  hlsManifestPath?: string;

  status: ProcessingStatus;

  createdAt?: string;
  updatedAt?: string;

  [key: string]: any;
}

export interface CreateMediaProcessingPayload {
  assetId: string;

  duration?: number;

  width?: number;
  height?: number;

  bitrate?: number;
  fps?: number;

  codec?: string;

  thumbnailAssetId?: string;

  hlsManifestPath?: string;

  status: ProcessingStatus;
}

export type UpdateMediaProcessingPayload =
  Partial<CreateMediaProcessingPayload>;

export const getMediaProcessingsApi =
  async (): Promise<
    MediaProcessing[]
  > => {
    const res = await api.get(
      "/media-processing"
    );

    return (
      res.data?.items ||
      res.data?.data ||
      []
    );
  };

export const getMediaProcessingByIdApi =
  async (
    id: string
  ): Promise<MediaProcessing> => {
    const res = await api.get(
      `/media-processing/${id}`
    );

    return (
      res.data?.item ||
      res.data?.data ||
      res.data
    );
  };

export const createMediaProcessingApi =
  async (
    payload: CreateMediaProcessingPayload
  ): Promise<MediaProcessing> => {
    const res = await api.post(
      "/media-processing",
      payload
    );

    return (
      res.data?.item ||
      res.data?.data ||
      res.data
    );
  };

export const updateMediaProcessingApi =
  async (
    id: string,
    payload: UpdateMediaProcessingPayload
  ): Promise<MediaProcessing> => {
    const res = await api.put(
      `/media-processing/${id}`,
      payload
    );

    return (
      res.data?.item ||
      res.data?.data ||
      res.data
    );
  };

export const deleteMediaProcessingApi =
  async (
    id: string
  ) => {
    const res = await api.delete(
      `/media-processing/${id}`
    );

    return res.data;
  };

export const getAssetProcessingStatusApi =
  async (
    assetId: string
  ) => {
    const res = await api.get(
      `/assets/${assetId}/status`
    );

    return (
      res.data?.data ||
      res.data
    );
  };

export const transcodeAssetApi =
  async (
    assetId: string,
    payload?: Record<string, any>
  ) => {
    const res = await api.post(
      `/assets/${assetId}/transcode`,
      payload
    );

    return res.data;
  };

export const generateThumbnailApi =
  async (
    assetId: string,
    payload?: Record<string, any>
  ) => {
    const res = await api.post(
      `/assets/${assetId}/thumbnail`,
      payload
    );

    return res.data;
  };

export const generateCaptionApi =
  async (
    assetId: string,
    payload?: Record<string, any>
  ) => {
    const res = await api.post(
      `/assets/${assetId}/caption`,
      payload
    );

    return res.data;
  };