// src/hooks/asset/useProfileAssetUpload.ts

import { useState } from "react";
import { useAssets } from "./asset/useAssets";

const getSessionUserId = () => {
  const sessionUser = JSON.parse(
    localStorage.getItem('keycloak_session_user') || "{}"
  );

  return sessionUser.userId || sessionUser.id || "";
};

export const useProfileAssetUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { uploadAsset } = useAssets();

  const uploadProfilePhoto = async (file: File) => {
    try {
      setUploading(true);

      const formData = new FormData();

      formData.append("file", file);
      formData.append("assetType", "IMAGE");
      formData.append("assetContext", "USER");
      formData.append("storagePath", "avatar");

      const userId = getSessionUserId();

      if (!userId) {
        throw new Error("User ID not found.");
      }

      formData.append("userId", userId);

      return await uploadAsset(formData);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const uploadResume = async (file: File) => {
    try {
      setUploading(true);

      const formData = new FormData();

      formData.append("file", file);

      // Asset type
      formData.append("assetType", "DOCUMENT");

      // IMPORTANT: Must be USER, not RESUME
      formData.append("assetContext", "USER");

      // Must match STORAGE_PATHS.USER
      formData.append("storagePath", "documents");

      const userId = getSessionUserId();

      if (!userId) {
        throw new Error("User ID not found.");
      }

      formData.append("userId", userId);

      return await uploadAsset(formData);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return {
    uploading,
    progress,
    uploadProfilePhoto,
    uploadResume,
  };
};