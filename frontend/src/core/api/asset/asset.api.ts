import { api } from "../../../config/axios";
import type { AxiosProgressEvent } from "axios";


export type AssetType =
  | "VIDEO"
  | "AUDIO"
  | "IMAGE"
  | "DOCUMENT"
  | "ARCHIVE"
  | "OTHER";

export type AssetContext =
  | "USER"
  | "COURSE"
  | "LESSON"
  | "CAREER_PATH"
  | "GENERAL";

export type UploadStatus =
  | "PENDING"
  | "UPLOADING"
  | "COMPLETED"
  | "FAILED";

export interface Asset {
  id: string;

  uploadedBy?: string;
  userId?: string;
  courseId?: string;
  lessonId?: string;
  careerPathId?: string;

  assetType?: AssetType;
  assetContext?: AssetContext;

  storagePath?: string;

  fileName?: string;
  originalFileName?: string;

  mimeType?: string;
  fileExtension?: string;

  fileSize?: number;

  bucketName?: string;
  gcsKey?: string;

  storageProvider?: string;

  uploadStatus?: UploadStatus;
  uploadProgress?: number;

  metadata?: Record<string, any>;

  version?: number;

  isDownloadable?: boolean;

  createdAt?: string;
  updatedAt?: string;

  [key: string]: any;
}

export interface UploadAssetPayload {
  uploadedBy?: string;
  userId?: string;
  courseId?: string;
  lessonId?: string;
  careerPathId?: string;

  assetType: AssetType;
  assetContext: AssetContext;

  storagePath: string;

  isDownloadable?: boolean;

  metadata?: Record<string, any>;
}

export const getAssetsApi =
  async (params?: Record<string, any>): Promise<Asset[]> => {
    const res = await api.get("/assets", { params });

    return (
      res.data?.assets ||
      res.data?.data ||
      []
    );
  };

export const getAssetByIdApi =
  async (
    assetId: string
  ): Promise<Asset> => {
    const res = await api.get(
      `/assets/${assetId}`
    );

    return (
      res.data?.asset ||
      res.data?.data ||
      res.data
    );
  };

export const uploadAssetApi =
  async (
    formData: FormData,
    onProgress?: (
      event: AxiosProgressEvent
    ) => void
  ) => {

    const res =
      await api.post(
        "/assets/upload",
        formData,
        {
          headers: {
            "Content-Type":
              "multipart/form-data",
          },

          onUploadProgress:
            onProgress,
        }
      );

    return (
      res.data?.asset ||
      res.data?.data ||
      res.data
    );
  };

export const generatePresignedUploadUrlApi =
  async (payload: any) => {
    const res = await api.post(
      "/assets/upload/presigned-url",
      payload
    );
    return res.data?.data || res.data;
  };

export const completeUploadAssetApi =
  async (assetId: string) => {
    const res = await api.post(
      `/assets/${assetId}/complete`
    );
    return res.data?.data || res.data;
  };

export const deleteAssetApi =
  async (
    assetId: string
  ) => {
    const res = await api.delete(
      `/assets/${assetId}`
    );

    return res.data;
  };



