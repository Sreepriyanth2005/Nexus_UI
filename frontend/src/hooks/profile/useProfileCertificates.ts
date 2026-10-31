// src/hooks/profile/useProfileCertificates.ts

import { useCallback } from "react";
import {
  deleteCertificateApi,
  uploadCertificateApi,
} from "../../core/api/profile/profile.api";

import type {
  Certificate,
  UploadCertificateRequest,
} from "../../types/profile.type";

import { useProfileStore } from "../../store/profile.store";

export const useProfileCertificates = () => {
  const {
    certificates,
    loading,
    error,

    setCertificates,
    addCertificate,
    removeCertificate,

    setLoading,
    setError,
  } = useProfileStore();

  const getErrorMessage = (err: any): string =>
    err?.response?.data?.message ??
    err?.message ??
    "Something went wrong";

  /**
   * ============================================================
   * ADD CERTIFICATE
   * ============================================================
   */

  const uploadCertificate = useCallback(
    async (
      payload: UploadCertificateRequest
    ): Promise<Certificate> => {
      try {
        setLoading(true);
        setError(null);

        const certificate =
          await uploadCertificateApi(payload);

        addCertificate(certificate);

        return certificate;
      } catch (err: any) {
        const message = getErrorMessage(err);
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [addCertificate, setLoading, setError]
  );

  /**
   * ============================================================
   * DELETE CERTIFICATE
   * ============================================================
   */

  const deleteCertificate = useCallback(
    async (
      certificateId: string
    ): Promise<void> => {
      try {
        setLoading(true);
        setError(null);

        await deleteCertificateApi(
          certificateId
        );

        removeCertificate(
          certificateId
        );
      } catch (err: any) {
        const message = getErrorMessage(err);
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [
      removeCertificate,
      setLoading,
      setError,
    ]
  );

  /**
   * ============================================================
   * REPLACE ALL CERTIFICATES
   * ============================================================
   */

  const refreshCertificates =
    useCallback(
      (
        data: Certificate[]
      ): void => {
        setCertificates(data);
      },
      [setCertificates]
    );

  return {
    certificates,

    loading,
    error,

    uploadCertificate,
    deleteCertificate,

    refreshCertificates,
  };
};