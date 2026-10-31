// src/store/lesson/lessonAttachmentStore.ts

import { create } from "zustand";

export interface LessonAttachment {
  id?: string;
  lessonId?: string;
  [key: string]: any;
}

interface LessonAttachmentState {
  attachments: LessonAttachment[];

  setAttachments: (
    attachments: LessonAttachment[]
  ) => void;

  addAttachment: (
    attachment: LessonAttachment
  ) => void;

  deleteAttachment: (
    id: string
  ) => void;

  clearAttachments: () => void;
}

export const useLessonAttachmentStore =
  create<LessonAttachmentState>(
    (set) => ({
      attachments: [],

      setAttachments: (
        attachments
      ) =>
        set({
          attachments,
        }),

      addAttachment: (
        attachment
      ) =>
        set((state) => ({
          attachments: [
            ...state.attachments.filter(
              (a) =>
                a.id !==
                attachment.id
            ),
            attachment,
          ],
        })),

      deleteAttachment: (
        id
      ) =>
        set((state) => ({
          attachments:
            state.attachments.filter(
              (a) =>
                a.id !== id
            ),
        })),

      clearAttachments:
        () =>
          set({
            attachments:
              [],
          }),
    })
  );