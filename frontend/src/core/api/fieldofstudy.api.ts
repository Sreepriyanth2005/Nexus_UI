import { api } from "../../config/axios";
import * as Sentry from "@sentry/react";

export type FieldOfStudy = {
    id: string;
    name: string;
    createdAt?: string;
    updatedAt?: string;
};

type ApiResponse<T> = {
    success: boolean;
    data: T;
};

// GET ALL
export const getFieldsOfStudyApi = async (): Promise<FieldOfStudy[]> => {
    try {
        const res =
            await api.get<ApiResponse<FieldOfStudy[]>>(
                "/fields-of-study"
            );

        return res.data.data;
    } catch (error) {
        Sentry.captureException(error);
        throw error;
    }
};

// GET BY ID
export const getFieldOfStudyByIdApi = async (
    id: string
): Promise<FieldOfStudy> => {
    try {
        const res =
            await api.get<ApiResponse<FieldOfStudy>>(
                `/fields-of-study/${id}`
            );

        return res.data.data;
    } catch (error) {
        Sentry.captureException(error);
        throw error;
    }
};

// CREATE
export const createFieldOfStudyApi = async (
    data: { name: string }
): Promise<FieldOfStudy> => {
    try {
        const res =
            await api.post<ApiResponse<FieldOfStudy>>(
                "/fields-of-study",
                data
            );

        return res.data.data;
    } catch (error) {
        Sentry.captureException(error);
        throw error;
    }
};

// UPDATE
export const updateFieldOfStudyApi = async (
    id: string,
    data: { name: string }
): Promise<FieldOfStudy> => {
    try {
        const res =
            await api.patch<ApiResponse<FieldOfStudy>>(
                `/fields-of-study/${id}`,
                data
            );

        return res.data.data;
    } catch (error) {
        Sentry.captureException(error);
        throw error;
    }
};

// DELETE
export const deleteFieldOfStudyApi = async (
    id: string
): Promise<{ id: string }> => {
    try {
        const res =
            await api.delete<ApiResponse<{ id: string }>>(
                `/fields-of-study/${id}`
            );

        return res.data.data;
    } catch (error) {
        Sentry.captureException(error);
        throw error;
    }
};