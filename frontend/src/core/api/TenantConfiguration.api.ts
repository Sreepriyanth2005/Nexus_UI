// src/api/tenant-configuration/TenantConfiguration.api.ts

import { api } from "../../config/axios";

export interface TenantConfiguration {
    id?: string;

    tenantId: string;

    invitationExpiryDays: number;

    maxInvitationsPerUser: number;

    allowInvitationResend: boolean;

    invitationResendCooldown: number;

    showTrending?: boolean;

    showNewReleases?: boolean;

    [key: string]: any;
}

/**
 * CREATE
 * POST /tenant-configurations
 */
export const createTenantConfigurationApi = async (
    payload: TenantConfiguration
): Promise<TenantConfiguration> => {
    const res = await api.post(
        "/tenant-configurations",
        payload
    );

    return (
        res.data?.data ||
        res.data?.tenantConfiguration ||
        res.data
    );
};

/**
 * GET ALL
 * GET /tenant-configurations
 */
export const getTenantConfigurationsApi =
    async (): Promise<
        TenantConfiguration[]
    > => {
        const res = await api.get(
            "/tenant-configurations"
        );

        return (
            res.data?.data ||
            res.data?.tenantConfigurations ||
            []
        );
    };

/**
 * GET BY ID
 * GET /tenant-configurations/:id
 */
export const getTenantConfigurationByIdApi =
    async (
        id: string
    ): Promise<TenantConfiguration> => {
        const res = await api.get(
            `/tenant-configurations/${id}`
        );

        return (
            res.data?.data ||
            res.data?.tenantConfiguration ||
            res.data
        );
    };

/**
 * GET BY TENANT ID
 * GET /tenant-configurations/tenant/:tenantId
 */
export const getTenantConfigurationByTenantApi =
    async (
        tenantId: string
    ): Promise<TenantConfiguration> => {
        const res = await api.get(
            `/tenant-configurations/tenant/${tenantId}`
        );

        return (
            res.data?.data ||
            res.data?.tenantConfiguration ||
            res.data
        );
    };

/**
 * UPDATE
 * PUT /tenant-configurations/:id
 */
export const updateTenantConfigurationApi =
    async (
        id: string,
        payload: Partial<TenantConfiguration>
    ): Promise<TenantConfiguration> => {
        const res = await api.put(
            `/tenant-configurations/${id}`,
            payload
        );

        return (
            res.data?.data ||
            res.data?.tenantConfiguration ||
            res.data
        );
    };

/**
 * DELETE
 * DELETE /tenant-configurations/:id
 */
export const deleteTenantConfigurationApi =
    async (id: string) => {
        const res = await api.delete(
            `/tenant-configurations/${id}`
        );

        return res.data;
    };