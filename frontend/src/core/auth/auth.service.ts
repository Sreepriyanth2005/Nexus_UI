import axios from "axios";

import { apiClient } from "../api/axios";

export type LoginUser = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  roles?: string[];
};

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  idToken?: string;
  expiresIn?: number;
  user?: LoginUser;
};

export const authService = {
  login: async (
    email: string,
    password: string,
    apiBaseUrl?: string
  ): Promise<LoginResponse> => {
    const client = apiBaseUrl
      ? axios.create({
          baseURL: apiBaseUrl,
          timeout: 15000,
        })
      : apiClient;

    const response = await client.post<LoginResponse>(
      "/api/v1/auth/login",
      {
        email,
        password,
      }
    );

    return response.data;
  },
};