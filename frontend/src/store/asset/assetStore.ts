import { create } from "zustand";

export interface Asset {
  id: string;

  uploadedBy?: string;
  userId?: string;
  courseId?: string;
  lessonId?: string;
  careerPathId?: string;

  assetType?: string;
  assetContext?: string;

  storagePath?: string;

  fileName?: string;
  originalFileName?: string;

  mimeType?: string;
  fileExtension?: string;

  fileSize?: number;

  bucketName?: string;
  gcsKey?: string;

  storageProvider?: string;

  uploadStatus?: string;
  uploadProgress?: number;

  metadata?: Record<string, any>;

  version?: number;

  isDownloadable?: boolean;

  createdAt?: string;
  updatedAt?: string;

  [key: string]: any;
}

interface AssetState {
  assets: Asset[];

  setAssets: (
    assets: Asset[]
  ) => void;

  addAsset: (
    asset: Asset
  ) => void;

  updateAsset: (
    asset: Partial<Asset> & {
      id: string;
    }
  ) => void;

  deleteAsset: (
    id: string
  ) => void;

  clearAssets: () => void;
}

export const useAssetStore =
  create<AssetState>((set) => ({
    assets: [],

    setAssets: (assets) =>
      set({ assets }),

    addAsset: (asset) =>
      set((state) => ({
        assets: [
          ...state.assets.filter(
            (a) =>
              a.id !== asset.id
          ),
          asset,
        ],
      })),

    updateAsset: (asset) =>
      set((state) => ({
        assets:
          state.assets.map((a) =>
            a.id === asset.id
              ? {
                  ...a,
                  ...asset,
                }
              : a
          ),
      })),

    deleteAsset: (id) =>
      set((state) => ({
        assets:
          state.assets.filter(
            (a) => a.id !== id
          ),
      })),

    clearAssets: () =>
      set({
        assets: [],
      }),
  }));