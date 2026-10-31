import { apiClient } from "./axios";

apiClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);
