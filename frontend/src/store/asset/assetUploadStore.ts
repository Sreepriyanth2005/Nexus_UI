import { create } from "zustand";

export interface UploadSession {
  id?: string;

  assetId?: string;

  uploadToken?: string;

  progress?: number;

  status?: string;

  createdAt?: string;
  updatedAt?: string;

  [key: string]: any;
}

interface UploadState {
  uploadSession:
    | UploadSession
    | null;

  setUploadSession: (
    session: UploadSession
  ) => void;

  updateProgress: (
    progress: number
  ) => void;

  clearUploadSession:
    () => void;
}

export const useAssetUploadStore =
  create<UploadState>(
    (set) => ({
      uploadSession: null,

      setUploadSession: (
        session
      ) =>
        set({
          uploadSession:
            session,
        }),

      updateProgress: (
        progress
      ) =>
        set((state) => ({
          uploadSession:
            state.uploadSession
              ? {
                  ...state.uploadSession,
                  progress,
                }
              : null,
        })),

      clearUploadSession:
        () =>
          set({
            uploadSession:
              null,
          }),
    })
  );