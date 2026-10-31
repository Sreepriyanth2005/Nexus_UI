// src/hooks/profile/useProfile.ts

import { useCallback } from "react";

import {
 
  selfDeleteAccountApi,
  getProfileApi,
  getProfileAuditsApi,
  getUserAuditsApi,
  updateProfileApi,
  verifyProfileOtpApi,
  resendProfileOtpApi,
  cancelPendingProfileUpdateApi,
  getProfileCompletionApi,
} from "../../core/api/profile/profile.api";

import type {
  UpdateProfileRequest,
  VerifyProfileOtpRequest,
} from "../../types/profile.type";

import { useProfileStore } from "../../store/profile.store";

export const useProfile = () => {
  const {
    profile,
    audits,
    userAudits,

    loading,
    error,

    setProfile,
    updateProfile,
    completion,
    setCompletion,
    setAudits,
    setUserAudits,

    setLoading,
    setError,

    clearProfile,

    openOtpDialog,
    closeOtpDialog,

    setPendingProfile,
  } = useProfileStore();

  /**
   * ============================================================
   * GET PROFILE
   * ============================================================
   */

  const getProfile = useCallback(async () => {
    try {
      setLoading(true);
     setError(null);

      const data = await getProfileApi();

      setProfile(data);

      return data;
    } catch (err: any) {
      setError(err.message);

      throw err;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setProfile]);

  /**
   * ============================================================
   * GET PROFILE COMPLETION
   * ============================================================
   */

  const getCompletion = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getProfileCompletionApi();

      setCompletion(data);

      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setCompletion]);

  /**
   * ============================================================
   * UPDATE PROFILE
   * ============================================================
   */

  const saveProfile = useCallback(
    async (payload: UpdateProfileRequest) => {
      try {
        setLoading(true);
        setError(null);

        const response =
          await updateProfileApi(payload);

        if (response.otpRequired) {
          setPendingProfile(payload);
          openOtpDialog();

          return response;
        }

        updateProfile(response.data);

        return response;
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [
      setLoading,
      setError,
      updateProfile,
      openOtpDialog,
      setPendingProfile,
    ]
  );

  /**
   * ============================================================
   * VERIFY OTP
   * ============================================================
   */

  const verifyOtp = useCallback(
    async (
      payload: VerifyProfileOtpRequest
    ) => {
      try {
        setLoading(true);
       setError(null);

        const response =
          await verifyProfileOtpApi(payload);

        if (response.success) {
          closeOtpDialog();

          const latest =
            await getProfileApi();

          setProfile(latest);

          setPendingProfile(null);
        }

        return response;
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [
      closeOtpDialog,
      getProfile,
      setError,
      setLoading,
      setPendingProfile,
      setProfile,
    ]
  );

  /**
   * ============================================================
   * RESEND OTP
   * ============================================================
   */

  const resendOtp = useCallback(async () => {
    try {
      setLoading(true);

      return await resendProfileOtpApi();
    } finally {
      setLoading(false);
    }
  }, [setLoading]);

  /**
   * ============================================================
   * CANCEL OTP UPDATE
   * ============================================================
   */

  const cancelPendingUpdate =
    useCallback(async () => {
      try {
        setLoading(true);

        const response =
          await cancelPendingProfileUpdateApi();

        closeOtpDialog();

        setPendingProfile(null);

        return response;
      } finally {
        setLoading(false);
      }
    }, [
      closeOtpDialog,
      setPendingProfile,
      setLoading,
    ]);

  /**
   * ============================================================
   * AUDITS
   * ============================================================
   */

  const getAudits = useCallback(async () => {
    try {
      setLoading(true);

      const data =
        await getProfileAuditsApi();

      setAudits(data);

      return data;
    } finally {
      setLoading(false);
    }
  }, [setAudits, setLoading]);

  const getUserAudits = useCallback(async () => {
    try {
      setLoading(true);

      const data =
        await getUserAuditsApi();

      setUserAudits(data);

      return data;
    } finally {
      setLoading(false);
    }
  }, [setUserAudits, setLoading]);

  /**
   * ============================================================
   * DELETE ACCOUNT
   * ============================================================
   */

  const deleteAccount =
    useCallback(async (otp: string) => {
      try {
        setLoading(true);

        const response =
          await selfDeleteAccountApi(otp);

        clearProfile();

        return response;
      } finally {
        setLoading(false);
      }
    }, [
      clearProfile,
      setLoading,
    ]);

  return {
    profile,
    completion,
    audits,
    userAudits,
    loading,
    error,
    getProfile,
    getCompletion,
    saveProfile,
    verifyOtp,
    resendOtp,
    cancelPendingUpdate,
    getAudits,
    getUserAudits,
    deleteAccount,
    clearProfile,
  };
};