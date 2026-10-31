import axios from "axios";
import { useUserStore } from "../store/user.store";
import { useAuthStore } from "../core/auth/auth.store";

const getStoredAccessToken = () => {
    const fromUserStore = useUserStore.getState().accessToken;
    const fromAuthStore = useAuthStore.getState().accessToken;

    if (fromUserStore) return fromUserStore;
    if (fromAuthStore) return fromAuthStore;

    try {
        const savedUser = localStorage.getItem("keycloak_session_user");
        if (savedUser) {
            const parsed = JSON.parse(savedUser);
            return parsed.accessToken || null;
        }
    } catch {
        // Ignore storage parsing errors and fall back to auth storage.
    }

    try {
        const savedAuth = localStorage.getItem("keycloak_session_auth");
        if (savedAuth) {
            const parsed = JSON.parse(savedAuth);
            return parsed.accessToken || null;
        }
    } catch {
        // Ignore storage parsing errors.
    }

    return null;
};

const getStoredRefreshToken = () => {
    const fromUserStore = useUserStore.getState().refreshToken;
    const fromAuthStore = useAuthStore.getState().refreshToken;

    if (fromUserStore) return fromUserStore;
    if (fromAuthStore) return fromAuthStore;

    try {
        const savedUser = localStorage.getItem("keycloak_session_user");
        if (savedUser) {
            const parsed = JSON.parse(savedUser);
            return parsed.refreshToken || null;
        }
    } catch {
        // Ignore storage parsing errors.
    }

    try {
        const savedAuth = localStorage.getItem("keycloak_session_auth");
        if (savedAuth) {
            const parsed = JSON.parse(savedAuth);
            return parsed.refreshToken || null;
        }
    } catch {
        // Ignore storage parsing errors.
    }

    return null;
};

import { attachMockAdapter } from "../mock/mockApiAdapter";

export const api = axios.create({
    baseURL: `${import.meta.env.VITE_API_URL || ""}/api/v1`,
});

// Intercept all API calls with static mock data for wireframe demonstration
attachMockAdapter(api);

api.interceptors.request.use(
    (config) => {
        const token = getStoredAccessToken();

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        const deviceId = localStorage.getItem("imi_device_id");
        if (deviceId) {
            config.headers["x-device-id"] = deviceId;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string |null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });

    failedQueue = [];
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const url = originalRequest?.url ?? "";

        /**
         * Public authentication endpoints.
         * Never refresh token or logout for these.
         */
        const isPublicAuthEndpoint =
            url.includes("/auth/login") ||
            url.includes("/auth/admin/login") ||
            url.includes("/auth/login/send-otp") ||
            url.includes("/auth/login/verify-otp") ||
            url.includes("/auth/login/resend-otp") ||
            url.includes("/auth/register/send-otp") ||
            url.includes("/auth/register/verify-otp") ||
            url.includes("/auth/register/resend-otp") ||
            url.includes("/auth/register/complete");

        /**
         * Invalid OTP / login failure should be handled
         * by the page itself.
         */
        if (error.response?.status === 401 && isPublicAuthEndpoint) {
            return Promise.reject(error);
        }

        /**
         * Auto-logout on critical Auth / Inactive 403 errors
         */
        if (error.response?.status === 403) {
            const msg = error.response?.data?.message;
            if (msg) {
                console.warn(`403 Forbidden on URL: ${error.config?.url} - ${msg}`);
            }
            const authErrorMessages = [
                "user inactive",
                "user blocked",
                "tenant assignment missing",
                "tenant not found",
                "tenant inactive",
                "tenant contract expired",
                "session or device invalid"
            ];
            
            if (msg && authErrorMessages.includes(String(msg).toLowerCase())) {
                useAuthStore.getState().logout();
            }
            return Promise.reject(error);
        }

        /**
         * Refresh token flow
         */
        if (error.response?.status === 401 && !originalRequest._retry) {
            /**
             * Refresh token itself failed
             */
            if (url.includes("/auth/refresh-token")) {
                useAuthStore.getState().logout();
                return Promise.reject(error);
            }

            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return api(originalRequest);
                    })
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const refreshToken = getStoredRefreshToken();

            if (!refreshToken) {
                isRefreshing = false;
                return Promise.reject(error);
            }

            try {
                const response = await api.post(
                    "/auth/refresh-token",
                    {
                        refreshToken,
                    }
                );

                const {
                    accessToken,
                    refreshToken: newRefreshToken,
                } = response.data;

                useUserStore
                    .getState()
                    .updateToken(accessToken, newRefreshToken);

                useAuthStore.getState().setAuth(
                    accessToken,
                    useAuthStore.getState().role,
                    useUserStore.getState().user,
                    newRefreshToken
                );

                processQueue(null, accessToken);

                isRefreshing = false;

                originalRequest.headers.Authorization = `Bearer ${accessToken}`;

                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);

                useAuthStore.getState().logout();

                isRefreshing = false;

                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);