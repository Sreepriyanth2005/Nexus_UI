// src/hooks/profile/useProfileAssets.ts

import { useCallback } from "react";
import {
  deleteProfilePhotoApi,
  deleteResumeApi,
  uploadProfilePhotoApi,
  uploadResumeApi,
} from "../../core/api/profile/profile.api";

import { useProfileStore } from "../../store/profile.store";

export const useProfileAssets = () => {
  const {
    profile,
    loading,
    error,

    setLoading,
    setError,
  } = useProfileStore();

  const getErrorMessage = (err: any): string =>
    err?.response?.data?.message ??
    err?.message ??
    "Something went wrong";

  /**
   * ============================================================
   * PROFILE PHOTO
   * ============================================================
   */

  const uploadPhoto = useCallback(
    async (assetId: string) => {
      try {
        setLoading(true);
        setError(null);

        const result = await uploadProfilePhotoApi(assetId);

        return result;
      } catch (err: any) {
        const message = getErrorMessage(err);
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError]
  );

  const deletePhoto = useCallback(
    async () => {
      try {
        setLoading(true);
        setError(null);

        const result = await deleteProfilePhotoApi();

        return result;
      } catch (err: any) {
        const message = getErrorMessage(err);
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError]
  );

  /**
   * ============================================================
   * RESUME
   * ============================================================
   */

  const uploadResume = useCallback(
    async (assetId: string) => {
      try {
        setLoading(true);
        setError(null);

        const result = await uploadResumeApi(assetId);

        return result;
      } catch (err: any) {
        const message = getErrorMessage(err);
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError]
  );

  const deleteResume = useCallback(
    async () => {
      try {
        setLoading(true);
        setError(null);

        const result = await deleteResumeApi();

        return result;
      } catch (err: any) {
        const message = getErrorMessage(err);
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError]
  );

  return {
    profile,
    loading,
    error,

    uploadPhoto,
    deletePhoto,

    uploadResume,
    deleteResume,
  };
};