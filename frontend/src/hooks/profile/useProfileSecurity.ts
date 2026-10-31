// src/hooks/profile/useProfileSecurity.ts

import { useCallback } from "react";
import {getProfileSecurityApi,} from "../../core/api/profile/profile.api";
import { useProfileStore } from "../../store/profile.store";

export const useProfileSecurity = () => {
  const {
    security,
    loading,
    error,
    setSecurity,
    setLoading,
    setError,
  } = useProfileStore();

  /**
   * ============================================================
   * GET SECURITY STATUS
   * ============================================================
   */

  const getSecurity =
    useCallback(async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getProfileSecurityApi();
        setSecurity(data);
        return data;
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    }, [
      setLoading,
      setError,
      setSecurity,
    ]);

  return {
    security,
    loading,
    error,
    getSecurity,
  };
};