// src/core/api/asset/asset-upload.api.ts

import { api } from "../../../config/axios";

export const UPLOAD_STATUS = {
  PENDING: "PENDING",
  UPLOADING: "UPLOADING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
} as const;

export type UploadStatus =
  (typeof UPLOAD_STATUS)[keyof typeof UPLOAD_STATUS];

export interface UploadSession {
  id: string;

  assetId: string;

  uploadToken: string;

  progress: number;

  status: UploadStatus;

  createdAt?: string;
  updatedAt?: string;

  [key: string]: any;
}

export interface CreateUploadSessionPayload {
  assetId: string;
}

export interface UpdateUploadSessionPayload {
  progress: number;

  status: UploadStatus;
}

export const createUploadSessionApi =
  async (
    payload: CreateUploadSessionPayload
  ): Promise<UploadSession> => {
    const res = await api.post(
      "/upload-session",
      payload
    );

    return (
      res.data?.session ||
      res.data?.data ||
      res.data
    );
  };

export const updateUploadSessionApi =
  async (
    uploadToken: string,
    payload: UpdateUploadSessionPayload
  ): Promise<UploadSession> => {
    const res = await api.put(
      `/upload/${uploadToken}`,
      payload
    );

    return (
      res.data?.session ||
      res.data?.data ||
      res.data
    );
  };

export const completeUploadApi =
  async (
    uploadToken: string
  ): Promise<any> => {
    const res = await api.post(
      `/upload/${uploadToken}/complete`
    );

    return (
      res.data?.data ||
      res.data
    );
  };