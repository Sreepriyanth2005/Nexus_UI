import axios from "axios";

import { appEnv } from "../../config/env";

// Add a custom property to config for tracking latency
declare module 'axios' {
  export interface InternalAxiosRequestConfig {
    metadata?: { startTime: number };
  }
}

import { attachMockAdapter } from "../../mock/mockApiAdapter";

export const apiClient = axios.create({
  baseURL: appEnv.apiBaseUrl,
  timeout: 15000,
});

attachMockAdapter(apiClient);

apiClient.interceptors.request.use(
  (config) => {
    config.metadata = { startTime: Date.now() };

    let token = localStorage.getItem("accessToken");
    if (!token) {
      try {
        const savedAuth = localStorage.getItem("keycloak_session_auth");
        if (savedAuth) {
          token = JSON.parse(savedAuth).accessToken;
        }
      } catch (e) { }
    }

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => {
    const latency = Date.now() - (response.config.metadata?.startTime || Date.now());
    console.debug(`[Performance] API Latency [${response.config.method?.toUpperCase()} ${response.config.url}]: ${latency}ms`);
    return response;
  },
  (error) => {
    const latency = Date.now() - (error.config?.metadata?.startTime || Date.now());
    console.debug(`[Performance] API Latency (Error) [${error.config?.method?.toUpperCase()} ${error.config?.url}]: ${latency}ms`);

    if (error.response) {
      console.error("API Error:", error.response.status, error.response.data);
    } else {
      console.error("API Error (Network/Timeout):", error.message);
    }

    if (error.response && error.response.status === 401) {
      console.warn("Session expired or invalid token. Logging out...");
      // Clear all possible auth tokens from local storage
      localStorage.removeItem("accessToken");
      localStorage.removeItem("keycloak_session_auth");
      
      // Redirect to login page
      window.location.href = "/";
    }

    if (error.response && error.response.status === 403) {
      console.error("403 Forbidden on URL:", error.config?.url);
      // window.location.href = "/unauthorized";
    }

    return Promise.reject(error);
  }
);