import { create } from "zustand";

export interface LessonTranscript {
  lessonId: string;
  transcriptAssetId: string | null;

  transcriptAsset?: {
    id: string;
    fileName?: string;
    originalFileName?: string;
    mimeType?: string;
  };

  [key: string]: any;
}

interface LessonTranscriptState {
  transcripts: LessonTranscript[];

  setTranscripts: (
    transcripts: LessonTranscript[]
  ) => void;

  addTranscript: (
    transcript: LessonTranscript
  ) => void;

  updateTranscript: (
    transcript: Partial<LessonTranscript> & {
      lessonId: string;
    }
  ) => void;

  deleteTranscript: (
    lessonId: string
  ) => void;

  clearTranscripts: () => void;
}

export const useLessonTranscriptStore =
  create<LessonTranscriptState>((set) => ({
    transcripts: [],

    setTranscripts: (transcripts) =>
      set({ transcripts }),

    addTranscript: (transcript) =>
      set((state) => ({
        transcripts: [
          ...state.transcripts.filter(
            (t) =>
              t.lessonId !==
              transcript.lessonId
          ),
          transcript,
        ],
      })),

    updateTranscript: (transcript) =>
      set((state) => ({
        transcripts:
          state.transcripts.map((t) =>
            t.lessonId ===
            transcript.lessonId
              ? {
                  ...t,
                  ...transcript,
                }
              : t
          ),
      })),

    deleteTranscript: (lessonId) =>
      set((state) => ({
        transcripts:
          state.transcripts.filter(
            (t) =>
              t.lessonId !== lessonId
          ),
      })),

    clearTranscripts: () =>
      set({
        transcripts: [],
      }),
  }));