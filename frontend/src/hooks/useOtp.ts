import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getOtpConfig, updateOtpConfig, OtpConfig } from "../core/api/otp.api";
import { useSettingsStore } from "../store/settings.store";
import { useEffect } from "react";

export const useGetOtpConfig = () => {
  const setOtpConfig = useSettingsStore((state) => state.setOtpConfig);

  return useQuery({
    queryKey: ["otpConfig"],
    queryFn: async () => {
      const data = await getOtpConfig();
      setOtpConfig(data);
      return data;
    },
  });
};

export const useUpdateOtpConfig = () => {
  const queryClient = useQueryClient();
  const setOtpConfig = useSettingsStore((state) => state.setOtpConfig);

  return useMutation({
    mutationFn: (config: Partial<OtpConfig>) => updateOtpConfig(config),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["otpConfig"] });
      setOtpConfig(response.data || response);
    },
  });
};
