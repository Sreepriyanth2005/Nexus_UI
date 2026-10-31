import { useCallback } from "react";
import {deleteAssetApi,getAssetByIdApi,getAssetsApi,uploadAssetApi, generatePresignedUploadUrlApi, completeUploadAssetApi} from "../../core/api/asset/asset.api";
import {Asset,useAssetStore,} from "../../store/asset/assetStore";

import { toast } from "sonner";
import axios from "axios";

export const useAssets = () => {
  const {
    assets,
    setAssets,
    addAsset,
    updateAsset,
    deleteAsset,
    clearAssets,
  } = useAssetStore();

  const getAllAssets =
    useCallback(async (params?: Record<string, any>) => {
      const data =
        await getAssetsApi(params);

      setAssets(data);

      return data;
    }, [setAssets]);

  const getAssetById =
    useCallback(
      async (id: string) => {
        const data =
          await getAssetByIdApi(id);

        addAsset(data);

        return data;
      },
      [addAsset]
    );

  const uploadAssetDirectly = useCallback(
    async (file: File, payload: any, onProgress?: (progressEvent: any) => void, showProgress: boolean = true) => {
      let toastId: string | number | undefined;
      if (showProgress) {
        toastId = toast.loading(`Uploading ${file.name}... 0%`);
      }
      
      try {
        // 1. Get presigned URL from our backend
        const { signedUrl, ...assetData } = await generatePresignedUploadUrlApi({
          ...payload,
          fileName: file.name,
          contentType: file.type || "application/octet-stream",
          fileSize: file.size,
        });

        // 2. Upload directly to GCS using a CLEAN, isolated axios instance.
        const gcsAxios = axios.create();

        const contentType = file.type || "application/octet-stream";

        await gcsAxios.put(signedUrl, file, {
          headers: {
            "Content-Type": contentType,
          },
          withCredentials: false,
          timeout: 0,
          onUploadProgress: (progressEvent: any) => {
            if (showProgress && toastId && progressEvent.total) {
              const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              toast.loading(`Uploading ${file.name}... ${percent}%`, { id: toastId });
            }
            if (onProgress) {
              onProgress(progressEvent);
            }
          },
        });

        // 3. Notify our backend that the GCS upload is complete
        const completedAsset = await completeUploadAssetApi(assetData.id);
        addAsset(completedAsset);
        if (showProgress && toastId) {
          toast.success(`Uploaded ${file.name}`, { id: toastId });
        }
        return completedAsset;
      } catch (error) {
        if (showProgress && toastId) {
          toast.error(`Upload failed for ${file.name}`, { id: toastId });
        }
        throw error;
      }
    },
    [addAsset]
  );

  const removeAsset =
    useCallback(
      async (id: string) => {
        await deleteAssetApi(id);

        deleteAsset(id);
      },
      [deleteAsset]
    );

  const uploadAsset =
    useCallback(
      async (
        formData: FormData,
        showProgress: boolean = false
      ) => {
        const file = formData.get("file") as File;
        if (!file) {
          // If no file is present, fallback to the old API (though this shouldn't happen)
          return await uploadAssetApi(formData);
        }

        const payload: Record<string, any> = {};
        formData.forEach((value, key) => {
          if (key !== "file") {
            payload[key] = value;
          }
        });

        return uploadAssetDirectly(file, payload, undefined, showProgress);
      },
      [uploadAssetDirectly]
    );


  return {
    assets,

    getAllAssets,
    getAssetById,

    uploadAsset,
    uploadAssetDirectly,

    removeAsset,

    addAsset,
    updateAsset,
    clearAssets,
  };
};