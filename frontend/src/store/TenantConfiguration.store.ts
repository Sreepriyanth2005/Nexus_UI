// src/store/tenant-configuration/TenantConfiguration.store.ts

import {
    createAsyncThunk,
    createSlice,
} from "@reduxjs/toolkit";

import {
    createTenantConfigurationApi,
    getTenantConfigurationsApi,
    updateTenantConfigurationApi,
    deleteTenantConfigurationApi,
} from "../core/api/TenantConfiguration.api";

export const getTenantConfigurations =
    createAsyncThunk(
        "tenantConfiguration/getAll",
        async () => {
            return await getTenantConfigurationsApi();
        }
    );

export const createTenantConfiguration =
    createAsyncThunk(
        "tenantConfiguration/create",
        async (payload: any) => {
            return await createTenantConfigurationApi(
                payload
            );
        }
    );

export const updateTenantConfiguration =
    createAsyncThunk(
        "tenantConfiguration/update",
        async ({
            id,
            payload,
        }: {
            id: string;
            payload: any;
        }) => {
            return await updateTenantConfigurationApi(
                id,
                payload
            );
        }
    );

export const deleteTenantConfiguration =
    createAsyncThunk(
        "tenantConfiguration/delete",
        async (id: string) => {
            await deleteTenantConfigurationApi(id);
            return id;
        }
    );

const tenantConfigurationSlice =
    createSlice({
        name: "tenantConfiguration",

        initialState: {
            data: [],
            loading: false,
            error: null as string | null,
        },

        reducers: {},

        extraReducers: (builder: any) => {
            builder

                .addCase(
                    getTenantConfigurations.pending,
                    (state: any) => {
                        state.loading = true;
                    }
                )

                .addCase(
                    getTenantConfigurations.fulfilled,
                    (state: any, action: any) => {
                        state.loading = false;
                        state.data = action.payload as any;
                    }
                )

                .addCase(
                    getTenantConfigurations.rejected,
                    (state: any, action: any) => {
                        state.loading = false;
                        state.error =
                            action.error.message || null;
                    }
                );
        },
    });

export default tenantConfigurationSlice.reducer;