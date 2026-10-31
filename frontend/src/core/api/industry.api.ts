// src/core/api/industry.api.ts

import { api } from "../../config/axios";

export interface Industry {
    id: string;
    name: string;
    createdAt?: string;
    updatedAt?: string;
}

// GET ALL
export const getIndustriesApi = async (): Promise<Industry[]> => {
    const res = await api.get("/industries");

    return res.data?.industries || res.data?.data || [];
};

// GET BY ID
export const getIndustryByIdApi = async (
    id: string
): Promise<Industry> => {
    const res = await api.get(`/industries/${id}`);

    return res.data?.industry || res.data?.data;
};

// CREATE
export const createIndustryApi = async (
    payload: {
        name: string;
    }
): Promise<Industry> => {
    const res = await api.post(
        "/industries",
        payload
    );

    return res.data?.industry || res.data?.data;
};

// UPDATE
export const updateIndustryApi = async (
    id: string,
    payload: {
        name: string;
    }
): Promise<Industry> => {
    const res = await api.put(
        `/industries/${id}`,
        payload
    );

    return res.data?.industry || res.data?.data;
};

// DELETE
export const deleteIndustryApi = async (
    id: string
) => {
    const res = await api.delete(
        `/industries/${id}`
    );

    return res.data;
};