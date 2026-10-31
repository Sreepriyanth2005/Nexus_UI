import { create } from "zustand";
import { LessonPlayerDetails, LessonPlayerAttachment } from "../../core/api/learning/lessonPlayer.api";

interface LessonPlayerState {
  playerDetails: LessonPlayerDetails | null;
  attachments: LessonPlayerAttachment[];
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  setPlayerDetails: (details: LessonPlayerDetails | null) => void;
  setAttachments: (attachments: LessonPlayerAttachment[]) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  resetStore: () => void;
}

export const useLessonPlayerStore = create<LessonPlayerState>((set) => ({
  playerDetails: null,
  attachments: [],
  isPlaying: false,
  currentTime: 0,
  duration: 0,

  setPlayerDetails: (playerDetails) => set({ playerDetails }),
  setAttachments: (attachments) => set({ attachments }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setDuration: (duration) => set({ duration }),
  resetStore: () =>
    set({
      playerDetails: null,
      attachments: [],
      isPlaying: false,
      currentTime: 0,
      duration: 0,
    }),
}));
