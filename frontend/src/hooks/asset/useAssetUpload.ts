import { useCallback } from "react";

import {
  completeUploadApi,
  createUploadSessionApi,
  updateUploadSessionApi,
  type UpdateUploadSessionPayload,
} from "../../core/api/asset/asset-upload.api";

import { useAssetUploadStore } from "../../store/asset/assetUploadStore";

export const useUploadSession =
  () => {
    const {
      uploadSession,
      setUploadSession,
      updateProgress,
      clearUploadSession,
    } =
      useAssetUploadStore();

    const createSession =
      useCallback(
        async (
          assetId: string
        ) => {
          const data =
            await createUploadSessionApi({
              assetId,
            });

          setUploadSession(
            data
          );

          return data;
        },
        [setUploadSession]
      );

    const updateSession =
      useCallback(
        async (
          uploadToken: string,
          payload: UpdateUploadSessionPayload
        ) => {
          const data =
            await updateUploadSessionApi(
              uploadToken,
              payload
            );

          setUploadSession(
            data
          );

          return data;
        },
        [setUploadSession]
      );

    const completeSession =
      useCallback(
        async (
          uploadToken: string
        ) => {
          return await completeUploadApi(
            uploadToken
          );
        },
        []
      );

    return {
      uploadSession,

      createSession,
      updateSession,
      completeSession,

      updateProgress,
      clearUploadSession,
    };
  };