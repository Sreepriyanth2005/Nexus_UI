import { create } from "zustand";

type AnalyticsState = {
  analytics:
    any;

  setAnalytics:
    (
      data: any
    ) => void;
};

export const useAnalyticsStore =
  create<AnalyticsState>(
    (set) => ({
      analytics:
        null,

      setAnalytics:
        (
          data
        ) =>
          set({
            analytics:
              data,
          }),
    })
  );