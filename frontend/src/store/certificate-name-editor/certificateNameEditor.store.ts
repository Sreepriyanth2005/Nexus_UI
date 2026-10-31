import { create } from "zustand";

interface CertificateNameEditorState {
  tempName: string;
  confirmed: boolean;
  isEditing: boolean;
  otpDigits: string[];
  setTempName: (name: string) => void;
  setConfirmed: (confirmed: boolean) => void;
  setEditing: (editing: boolean) => void;
  setOtpDigit: (index: number, value: string) => void;
  resetOtp: () => void;
  reset: () => void;
}

export const useCertificateNameEditorStore = create<CertificateNameEditorState>((set) => ({
  tempName: "",
  confirmed: false,
  isEditing: false,
  otpDigits: ["", "", "", "", "", ""],

  setTempName: (name) => set({ tempName: name }),
  setConfirmed: (confirmed) => set({ confirmed }),
  setEditing: (editing) => set({ isEditing: editing }),

  setOtpDigit: (index, value) => set((state) => {
    const nextOtp = [...state.otpDigits];
    nextOtp[index] = value;
    return { otpDigits: nextOtp };
  }),

  resetOtp: () => set({ otpDigits: ["", "", "", "", "", ""] }),

  reset: () => set({
    tempName: "",
    confirmed: false,
    isEditing: false,
    otpDigits: ["", "", "", "", "", ""],
  }),
}));
