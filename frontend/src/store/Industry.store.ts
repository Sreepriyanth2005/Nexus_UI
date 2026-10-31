// src/pages/industry/Industry.store.ts

import { create } from "zustand";
import {
    Industry,
    getIndustriesApi,
    updateIndustryApi,
    deleteIndustryApi,
} from "../core/api/industry.api";

interface IndustryState {
    industries: Industry[];
    loading: boolean;

    fetchIndustries: () => Promise<void>;

    updateIndustry: (
        id: string,
        name: string
    ) => Promise<void>;

    deleteIndustry: (
        id: string
    ) => Promise<void>;
}

export const useIndustryStore =
    create<IndustryState>((set) => ({
        industries: [],
        loading: false,

        fetchIndustries: async () => {
            set({ loading: true });

            try {
                const data =
                    await getIndustriesApi();

                set({
                    industries: data,
                });
            } finally {
                set({
                    loading: false,
                });
            }
        },

        updateIndustry: async (
            id,
            name
        ) => {
            await updateIndustryApi(id, {
                name,
            });

            const data =
                await getIndustriesApi();

            set({
                industries: data,
            });
        },

        deleteIndustry: async (
            id
        ) => {
            await deleteIndustryApi(id);

            const data =
                await getIndustriesApi();

            set({
                industries: data,
            });
        },
    }));