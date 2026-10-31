// src/store/subject.store.ts

import { create } from "zustand";
import { Subject } from "../core/api/subject.api";

interface SubjectState {
  selectedSubject: Subject | null;

  setSelectedSubject: (
    subject: Subject | null
  ) => void;

  clearSelectedSubject: () => void;
}

export const useSubjectStore =
  create<SubjectState>((set) => ({
    selectedSubject: null,

    setSelectedSubject: (
      subject
    ) =>
      set({
        selectedSubject:
          subject,
      }),

    clearSelectedSubject:
      () =>
        set({
          selectedSubject:
            null,
        }),
  }));