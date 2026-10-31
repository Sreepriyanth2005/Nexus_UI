import { create } from "zustand";

type OnboardingState = {
  completionPercentage:
    number;

  currentStep:
    string;

  setOnboarding:
    (
      data: any
    ) => void;
};

export const useOnboardingStore =
  create<OnboardingState>(
    (set) => ({
      completionPercentage:
        0,

      currentStep:
        "",

      setOnboarding:
        (data) =>
          set({
            completionPercentage:
              data.completionPercentage,

            currentStep:
              data.currentStep,
          }),
    })
  );