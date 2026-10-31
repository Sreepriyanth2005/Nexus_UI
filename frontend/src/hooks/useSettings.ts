import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { NotificationAPI, NotificationPreferences } from "../core/api/notification.api";
import { useSettingsStore } from "../store/settings.store";
import { toast } from "sonner"; // Assuming sonner is used based on package.json

export const useSettings = () => {
    const queryClient = useQueryClient();
    const { setPreferences } = useSettingsStore();

    const {
        data: preferences,
        isLoading,
        error
    } = useQuery({
        queryKey: ["settings", "preferences"],
        queryFn: async () => {
            const data = await NotificationAPI.getPreferences();
            setPreferences(data);
            return data;
        },
    });

    const mutation = useMutation({
        mutationFn: async (newPreferences: Partial<NotificationPreferences>) => {
            return await NotificationAPI.updatePreferences(newPreferences);
        },
        onSuccess: (data) => {
            queryClient.setQueryData(["settings", "preferences"], data);
            setPreferences(data);
            toast.success("Preferences saved successfully!");
        },
        onError: (error) => {
            console.error("Failed to update preferences", error);
            toast.error("Failed to save preferences.");
        }
    });

    return {
        preferences,
        isLoading,
        error,
        updatePreferences: mutation.mutateAsync,
        isUpdating: mutation.isPending
    };
};
