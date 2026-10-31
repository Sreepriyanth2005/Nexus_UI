// src/pages/tenant-configuration/TenantConfiguration.tsx

import React, {
    useEffect,
    useState,
} from "react";

import {
    getTenantByIdApi,
} from "../../core/api/tenant.api";

import {
    createTenantConfigurationApi,
    getTenantConfigurationByTenantApi,
    updateTenantConfigurationApi,
} from "../../core/api/TenantConfiguration.api";

const TenantConfiguration = () => {

    const [tenantName, setTenantName] =
        useState("");
    const [loading, setLoading] =
        useState(false);
    const [dataLoading, setDataLoading] =
        useState(true);
    const [configurationId, setConfigurationId] =
        useState("");
    const getTenantId = () => {
        try {
            const storedUser =
                localStorage.getItem('keycloak_session_user');

            if (!storedUser) {
                return "";
            }

            const parsed = JSON.parse(storedUser);

            const user = parsed?.user || parsed;

            return (
                user?.tenantId ||
                user?.tenant?.id ||
                user?.organizationId ||
                ""
            );
        } catch (error) {
            console.error(
                "Failed to parse session user",
                error
            );

            return "";
        }
    };

    const [formData, setFormData] = useState<{
        tenantId: string;
        invitationExpiryDays: string;
        maxInvitationsPerUser: string;
        allowInvitationResend: boolean;
        invitationResendCooldown: string;
    }>({
        tenantId: getTenantId(),

        invitationExpiryDays: "",

        maxInvitationsPerUser: "",

        allowInvitationResend: false,

        invitationResendCooldown: "",
    });

    useEffect(() => {
        const init = async () => {
            setDataLoading(true);
            try {
                await Promise.all([loadTenants(), loadConfiguration()]);
            } finally {
                setDataLoading(false);
            }
        };
        init();
    }, []);

    const loadConfiguration = async () => {
        try {
            const tenantId = getTenantId();

            if (!tenantId) return;

            const response =
                await getTenantConfigurationByTenantApi(
                    tenantId
                );

            if (response) {
                setFormData({
                    tenantId,

                    invitationExpiryDays:
                        response.invitationExpiryDays?.toString() || "",

                    maxInvitationsPerUser:
                        response.maxInvitationsPerUser?.toString() || "",

                    allowInvitationResend:
                        response.allowInvitationResend ?? false,

                    invitationResendCooldown:
                        response.invitationResendCooldown?.toString() || "",
                });

                setConfigurationId(
                    response.id ?? ""
                );
            }
        } catch (error) {
            console.log(
                "No configuration found"
            );
        }
    };

    const loadTenants = async () => {
        try {
            const tenantId = getTenantId();
            if (!tenantId) return;

            const tenant = await getTenantByIdApi(tenantId);

            if (tenant?.name) {
                setTenantName(tenant.name);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleSubmit = async (
        e: React.FormEvent
    ) => {
        e.preventDefault();

        const payload: any = {
            tenantId: formData.tenantId,
            allowInvitationResend: formData.allowInvitationResend,
        };

        if (formData.invitationExpiryDays !== "") {
            payload.invitationExpiryDays = Number(formData.invitationExpiryDays);
        }
        if (formData.maxInvitationsPerUser !== "") {
            payload.maxInvitationsPerUser = Number(formData.maxInvitationsPerUser);
        }
        if (formData.invitationResendCooldown !== "") {
            payload.invitationResendCooldown = Number(formData.invitationResendCooldown);
        }

        try {
            setLoading(true);

            if (configurationId) {
                await updateTenantConfigurationApi(
                    configurationId,
                    payload
                );

                alert(
                    "Configuration Updated Successfully"
                );
            } else {
                const created =
                    await createTenantConfigurationApi(
                        payload
                    );

                setConfigurationId(
                    created.id || ""
                );

                alert(
                    "Configuration Created Successfully"
                );
            }
        } catch (error) {
            console.error(error);
            alert("Failed");
        } finally {
            setLoading(false);
        }
    };

    if (dataLoading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900" />
                    <p className="text-sm font-medium text-gray-500">Loading configuration…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="bg-white border rounded-xl p-6 max-w-xl">

                <h2 className="text-xl font-bold mb-6">
                    Tenant Configuration
                </h2>

                <form
                    onSubmit={handleSubmit}
                    className="space-y-4"
                >
                    {/* Tenant */}

                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Tenant
                        </label>

                        <input
                            type="text"
                            value={tenantName}
                            disabled
                            className="w-full border rounded-lg p-3 bg-gray-100 cursor-not-allowed"
                        />
                    </div>

                    {/* Invitation Expiry */}

                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Invitation Expiry Days
                        </label>

                        <input
                            type="number"
                            min={1}
                            className="w-full border rounded-lg p-3"
                            value={
                                formData.invitationExpiryDays
                            }
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    invitationExpiryDays: e.target.value,
                                })
                            }
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Max Invitations Per User
                        </label>

                        <input
                            type="number"
                            min={1}
                            value={formData.maxInvitationsPerUser}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    maxInvitationsPerUser: e.target.value,
                                })
                            }
                            className="w-full border rounded-lg p-3"
                        />
                    </div>

                    <div>
                        <label className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                checked={
                                    formData.allowInvitationResend
                                }
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        allowInvitationResend:
                                            e.target.checked,
                                    })
                                }
                            />

                            <span>
                                Allow Invitation Resend
                            </span>
                        </label>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Invitation Resend Cooldown (Minutes)
                        </label>

                        <input
                            type="number"
                            min={0}
                            value={
                                formData.invitationResendCooldown
                            }
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    invitationResendCooldown:
                                        e.target.value,
                                })
                            }
                            className="w-full border rounded-lg p-3"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={
                            loading ||
                            !formData.tenantId
                        }
                        className="px-5 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
                    >
                        {loading
                            ? "Saving..."
                            : "Save Configuration"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default TenantConfiguration;