import { useCallback } from "react";

import {
  createMediaProcessingApi,
  deleteMediaProcessingApi,
  generateCaptionApi,
  generateThumbnailApi,
  getAssetProcessingStatusApi,
  getMediaProcessingByIdApi,
  getMediaProcessingsApi,
  transcodeAssetApi,
  updateMediaProcessingApi,
} from "../../core/api/asset/asset-mediaprocessing.api";

import { useAssetMediaProcessingStore } from "../../store/asset/assetMediaProcessingStore";

export const useMediaProcessing =
  () => {
    const {
      mediaProcessings,
      setMediaProcessings,
      addMediaProcessing,
      updateMediaProcessing,
      deleteMediaProcessing,
      clearMediaProcessings,
    } =
      useAssetMediaProcessingStore();

    const getAll =
      useCallback(
        async () => {
          const data =
            await getMediaProcessingsApi();

          setMediaProcessings(
            data
          );

          return data;
        },
        [setMediaProcessings]
      );

    const getById =
      useCallback(
        async (
          id: string
        ) => {
          const data =
            await getMediaProcessingByIdApi(
              id
            );

          addMediaProcessing(
            data
          );

          return data;
        },
        [addMediaProcessing]
      );

    const create =
      useCallback(
        async (
          payload: any
        ) => {
          const data =
            await createMediaProcessingApi(
              payload
            );

          addMediaProcessing(
            data
          );

          return data;
        },
        [addMediaProcessing]
      );

    const update =
      useCallback(
        async (
          id: string,
          payload: any
        ) => {
          const data =
            await updateMediaProcessingApi(
              id,
              payload
            );

          updateMediaProcessing(
            data
          );

          return data;
        },
        [updateMediaProcessing]
      );

    const remove =
      useCallback(
        async (
          id: string
        ) => {
          await deleteMediaProcessingApi(
            id
          );

          deleteMediaProcessing(
            id
          );
        },
        [deleteMediaProcessing]
      );

    const getStatus =
      useCallback(
        async (
          assetId: string
        ) => {
          return await getAssetProcessingStatusApi(
            assetId
          );
        },
        []
      );

    const transcode =
      useCallback(
        async (
          assetId: string,
          payload?: any
        ) => {
          return await transcodeAssetApi(
            assetId,
            payload
          );
        },
        []
      );

    const thumbnail =
      useCallback(
        async (
          assetId: string,
          payload?: any
        ) => {
          return await generateThumbnailApi(
            assetId,
            payload
          );
        },
        []
      );

    const caption =
      useCallback(
        async (
          assetId: string,
          payload?: any
        ) => {
          return await generateCaptionApi(
            assetId,
            payload
          );
        },
        []
      );

    return {
      mediaProcessings,

      getAll,
      getById,

      create,
      update,
      remove,

      getStatus,
      transcode,
      thumbnail,
      caption,

      clearMediaProcessings,
    };
  };