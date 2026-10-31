import { create } from "zustand";

export interface MediaProcessing {
  id: string;

  assetId: string;

  duration?: number;

  width?: number;
  height?: number;

  bitrate?: number;
  fps?: number;

  codec?: string;

  thumbnailAssetId?: string;

  hlsManifestPath?: string;

  status?: string;

  createdAt?: string;
  updatedAt?: string;

  [key: string]: any;
}

interface MediaProcessingState {
  mediaProcessings:
    MediaProcessing[];

  setMediaProcessings: (
    mediaProcessings: MediaProcessing[]
  ) => void;

  addMediaProcessing: (
    mediaProcessing: MediaProcessing
  ) => void;

  updateMediaProcessing: (
    mediaProcessing: Partial<MediaProcessing> & {
      id: string;
    }
  ) => void;

  deleteMediaProcessing: (
    id: string
  ) => void;

  clearMediaProcessings:
    () => void;
}

export const useAssetMediaProcessingStore =
  create<MediaProcessingState>(
    (set) => ({
      mediaProcessings: [],

      setMediaProcessings: (
        mediaProcessings
      ) =>
        set({
          mediaProcessings,
        }),

      addMediaProcessing: (
        mediaProcessing
      ) =>
        set((state) => ({
          mediaProcessings: [
            ...state.mediaProcessings.filter(
              (m) =>
                m.id !==
                mediaProcessing.id
            ),
            mediaProcessing,
          ],
        })),

      updateMediaProcessing: (
        mediaProcessing
      ) =>
        set((state) => ({
          mediaProcessings:
            state.mediaProcessings.map(
              (m) =>
                m.id ===
                mediaProcessing.id
                  ? {
                      ...m,
                      ...mediaProcessing,
                    }
                  : m
            ),
        })),

      deleteMediaProcessing: (
        id
      ) =>
        set((state) => ({
          mediaProcessings:
            state.mediaProcessings.filter(
              (m) =>
                m.id !== id
            ),
        })),

      clearMediaProcessings:
        () =>
          set({
            mediaProcessings:
              [],
          }),
    })
  );