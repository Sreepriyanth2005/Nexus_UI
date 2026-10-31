import { useEffect, useRef } from "react";
import { useAuthStore } from "../core/auth/auth.store";
import { useUserStore } from "../store/user.store";
import { api } from "../config/axios";

export const useSessionTimeout = () => {
    const { logout, setAuth, role } = useAuthStore();
    const { accessToken, refreshToken, user, updateToken } = useUserStore();
    const isRefreshing = useRef(false);
    const lastActivityTime = useRef<number>(Date.now());
    const inactivityThreshold = useRef<number>(10080 * 60 * 1000); // default 7 days in ms

    // Fetch session timeout config based on role
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const response = await api.get("/auth/otp-config/public");
                const { userSessionTimeoutMinutes, adminSessionTimeoutMinutes } = response.data.data;
                
                const isSuperAdminOrAdmin = role === 'SUPER_ADMIN' || role === 'ADMIN';
                const timeoutMinutes = isSuperAdminOrAdmin ? 
                    (adminSessionTimeoutMinutes ?? 30) : 
                    (userSessionTimeoutMinutes ?? 10080);
                    
                inactivityThreshold.current = timeoutMinutes * 60 * 1000;
            } catch (err) {
                console.error("Failed to fetch public session config", err);
            }
        };
        fetchConfig();
    }, [role]);

    // Track user activity
    useEffect(() => {
        const updateActivity = () => {
            lastActivityTime.current = Date.now();
        };
        
        // Use passive listeners to not block scrolling/events
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
        events.forEach(event => {
            window.addEventListener(event, updateActivity, { passive: true });
        });

        // Interval to check if user exceeded the inactivity threshold
        const checkInactivityInterval = setInterval(() => {
            if (!accessToken) return;
            
            const timeSinceLastActivity = Date.now() - lastActivityTime.current;
            if (timeSinceLastActivity > inactivityThreshold.current) {
                console.log("User inactive for too long. Logging out.");
                logout();
            }
        }, 60000); // Check every minute

        return () => {
            events.forEach(event => {
                window.removeEventListener(event, updateActivity);
            });
            clearInterval(checkInactivityInterval);
        };
    }, [accessToken, logout]);

    // Proactive Token Refresh
    useEffect(() => {
        if (!accessToken || !refreshToken) return;

        try {
            const parts = accessToken.split(".");
            if (parts.length !== 3) return;

            const payload = JSON.parse(atob(parts[1]));
            if (payload && payload.exp) {
                const expiresInMs = payload.exp * 1000 - Date.now();
                // Proactively refresh 30 seconds before access token expires
                const refreshTimeMs = expiresInMs - 30000;

                if (refreshTimeMs > 0) {
                    const timer = setTimeout(async () => {
                        if (isRefreshing.current) return;
                        
                        // Stop refresh if inactive
                        const timeSinceLastActivity = Date.now() - lastActivityTime.current;
                        if (timeSinceLastActivity > inactivityThreshold.current) {
                            console.log("Skipping token refresh due to user inactivity.");
                            logout();
                            return;
                        }

                        isRefreshing.current = true;
                        try {
                            const response = await api.post(
                                "/auth/refresh-token",
                                { refreshToken }
                            );
                            const { accessToken: newAccess, refreshToken: newRefresh } = response.data;
                            updateToken(newAccess, newRefresh);
                            setAuth(newAccess, role, user, newRefresh);
                        } catch (error) {
                            console.error("Proactive session refresh failed", error);
                            // If refresh fails (e.g. max session reached), log them out
                            logout();
                        } finally {
                            isRefreshing.current = false;
                        }
                    }, refreshTimeMs);

                    return () => clearTimeout(timer);
                }
            }
        } catch (error) {
            console.error("Failed to parse token for session timeout", error);
        }
    }, [accessToken, refreshToken, logout, setAuth, role, user, updateToken]);
};
