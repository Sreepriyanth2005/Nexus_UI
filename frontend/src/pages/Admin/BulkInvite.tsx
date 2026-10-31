import React, { useEffect, useState } from "react";
import Papa from "papaparse";
import {
    getInviteHistoryApi,
    resendInviteApi,
    cancelInviteApi,
    BulkUser,
    InviteHistoryItem,
} from "../../core/api/tenantuser.api";
import { getTenantConfigurationByTenantApi } from "../../core/api/TenantConfiguration.api";
import { getTenantDashboardApi } from "../../core/api/tenant.api";
import { getGroupsApi } from "../../core/api/group.api";
import { toast, Toaster } from "sonner";

import { useTenantUserStore } from "../../store/tenantuser.store";

const getStatusStyles = (status: string) => {
    switch (status) {
        case "Valid":
            return "bg-green-50 text-green-700 border-green-200";
        case "Invalid email":
            return "bg-red-50 text-red-700 border-red-200";
        case "Duplicate":
            return "bg-yellow-50 text-yellow-700 border-yellow-200";
        case "Pending":
            return "bg-yellow-50 text-yellow-700 border-yellow-200";
        case "Completed":
        case "Active":
            return "bg-green-50 text-green-700 border-green-200";
        case "Inactive":
            return "bg-gray-50 text-gray-700 border-gray-200";
        default:
            return "bg-gray-100 text-gray-700 border-gray-200";
    }
};

const BulkInvite: React.FC = () => {
    const [previewRows, setPreviewRows] = useState<any[]>([]);
    const [validUsers, setValidUsers] = useState<BulkUser[]>([]);
    const [loading, setLoading] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [inviteHistory, setInviteHistory] = useState<InviteHistoryItem[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyError, setHistoryError] = useState<string | null>(null);
    const [config, setConfig] = useState<{ maxInvitationsPerUser: number; invitationResendCooldown: number } | null>(null);
    
    const [missingConfiguration, setMissingConfiguration] = useState(false);
    const [missingGroup, setMissingGroup] = useState(false);
    const [dataLoading, setDataLoading] = useState(true);

    // Cancel modal state
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [invitationToCancel, setInvitationToCancel] = useState<any>(null);
    const [cancelLoading, setCancelLoading] = useState(false);
    const [resendLoadingId, setResendLoadingId] = useState<string | null>(null);
    const [deleteConfirmText, setDeleteConfirmText] = useState("");
    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const checkConfig = async () => {
            const tenantId = getTenantId();
            if (!tenantId) {
                setDataLoading(false);
                return;
            }
            try {
                const configData = await getTenantConfigurationByTenantApi(tenantId);
                if (!configData || !configData.id) {
                    setMissingConfiguration(true);
                    setDataLoading(false);
                    return;
                }
            } catch (err) {
                setMissingConfiguration(true);
                setDataLoading(false);
                return;
            } 
            
            try {
                const groups = await getGroupsApi(tenantId);
                if (!Array.isArray(groups) || groups.length === 0) {
                    setMissingGroup(true);
                }
            } catch (err) {
                setMissingGroup(true);
            } finally {
                setDataLoading(false);
            }
        };
        checkConfig();
    }, []);

    const { bulkCreateUsers } = useTenantUserStore();

    const isValidEmail = (email: string) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const getTenantId = () => {
        try {
            const storedUser = localStorage.getItem("keycloak_session_user");
            if (!storedUser) return "";
            const parsed = JSON.parse(storedUser);
            const user = parsed?.user || parsed;
            return user?.tenantId || user?.tenant?.id || user?.organizationId || "";
        } catch (error) {
            console.error("Failed to parse session user", error);
            return "";
        }
    };

    const fetchInviteHistory = async () => {
        try {
            setHistoryLoading(true);
            setHistoryError(null);

            const tenantId = getTenantId();
            if (!tenantId) {
                setHistoryError(
                    "Couldn't determine your tenant. Try logging in again."
                );
                setInviteHistory([]);
                return;
            }

            const data = await getInviteHistoryApi(tenantId);
            if (data && data.invitations) {
                setInviteHistory(data.invitations);

                try {
                    const configData = await getTenantConfigurationByTenantApi(tenantId);
                    setConfig(configData || null);
                    console.log("Tenant Config from DB explicitly:", {
                        invitationResendCooldown: configData?.invitationResendCooldown,
                        maxInvitationsPerUser: configData?.maxInvitationsPerUser,
                    });
                } catch (err) {
                    console.error("Failed to fetch tenant configuration", err);
                    setConfig(data.config || null);
                }
            } else {
                setInviteHistory(Array.isArray(data) ? data : []);
            }
        } catch (error: any) {
            console.error("Failed to fetch invite history", error);
            setHistoryError(
                error?.response?.data?.message ||
                error?.message ||
                "Failed to load invite history."
            );
            setInviteHistory([]);
            setConfig(null);
        } finally {
            setHistoryLoading(false);
        }
    };

    // Fetch whenever the History tab is opened. handleSendInvites no longer
    // calls fetchInviteHistory itself — it just flips showHistory to true,
    // which triggers this effect. That avoids firing the request twice.
    useEffect(() => {
        if (showHistory) {
            fetchInviteHistory();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showHistory]);

    const validCount = previewRows.filter((x) => x.status === "Valid").length;
    const invalidCount = previewRows.filter((x) => x.status === "Invalid email").length;
    const duplicateCount = previewRows.filter((x) => x.status === "Duplicate").length;

    const handleResend = async (invitationId: string) => {
        try {
            setResendLoadingId(invitationId);
            const tenantId = getTenantId();
            if (!tenantId) {
                alert("Tenant ID not found.");
                return;
            }
            await resendInviteApi(tenantId, invitationId);
            alert("Invitation resent successfully!");
            fetchInviteHistory();
        } catch (error: any) {
            alert(error?.response?.data?.message || error?.message || "Failed to resend invitation");
        } finally {
            setResendLoadingId(null);
        }
    };

    const handleCancelClick = (inv: any) => {
        setInvitationToCancel(inv);
        setDeleteConfirmText("");
        setShowCancelModal(true);
    };

    const confirmCancel = async () => {
        if (!invitationToCancel) return;
        try {
            setCancelLoading(true);
            await cancelInviteApi(invitationToCancel.id);
            alert("Invitation cancelled successfully!");
            setShowCancelModal(false);
            setInvitationToCancel(null);
            fetchInviteHistory();
        } catch (error: any) {
            alert(error?.response?.data?.message || error?.message || "Failed to cancel invitation");
        } finally {
            setCancelLoading(false);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (result: any) => {
                const emails = new Set<string>();

                const preview = result.data.map((row: any, index: number) => {
                    let status = "Valid";
                    const email = row.email?.trim() || "";

                    if (!email || !isValidEmail(email)) {
                        status = "Invalid email";
                    } else if (emails.has(email.toLowerCase())) {
                        status = "Duplicate";
                    } else {
                        emails.add(email.toLowerCase());
                    }

                    return {
                        row: index + 1,
                        email,
                        firstName: row.firstName?.trim() || "",
                        lastName: row.lastName?.trim() || "",
                        roleName: row.roleName?.trim() || "",
                        departmentName: row.departmentName?.trim() || "",
                        courseNames: row.courseNames?.trim() || "",
                        status,
                    };
                });

                setPreviewRows(preview);

                const validUsersData = preview
                    .filter((item: any) => item.status === "Valid")
                    .map((item: any) => ({
                        email: item.email,
                        firstName: item.firstName,
                        lastName: item.lastName,
                        roleName: item.roleName,
                        departmentName: item.departmentName,
                        courseNames: item.courseNames,
                    }));

                setValidUsers(validUsersData);
            },
        });
    };

    const handleSendInvites = async () => {
        try {
            const tenantId = getTenantId();

            if (!tenantId) {
                alert("Tenant ID not found.");
                return;
            }

            setLoading(true);
            try {
                const configData = await getTenantConfigurationByTenantApi(tenantId);
                
                // If it explicitly returns success: false or missing id
                if (configData && (configData as any).success === false) {
                    toast.error("Please submit the configuration data first before sending bulk invites");
                    setLoading(false);
                    return;
                }
                
                if (!configData || (!configData.id && !configData.tenantId)) {
                    toast.error("Please submit the configuration data first before sending bulk invites");
                    setLoading(false);
                    return;
                }
            } catch (err: any) {
                const apiMessage = err?.response?.data?.message;
                toast.error(apiMessage || "Please submit the configuration data first before sending bulk invites");
                setLoading(false);
                return;
            }

            try {
                const dashboard = await getTenantDashboardApi(tenantId);
                const allocated = dashboard?.seats?.allocatedSeats || 0;
                const total = dashboard?.seats?.totalSeats || 0;
                
                if (allocated + validUsers.length > total && total > 0) {
                    toast.error("Corporate user creation is exceeding the seat count. Please contact super admin.");
                    setLoading(false);
                    return;
                }
            } catch (err) {
                console.error("Failed to fetch tenant dashboard for seat check", err);
            }

            const result = await bulkCreateUsers(tenantId, validUsers);

            if (!result.success) {
                toast.error(result.message || "Tenant configuration not found");
                setLoading(false);
                return;
            }

            const summary = result.data;

            toast.success(
                `Bulk upload completed.\n\nSuccess: ${summary.successCount}\nFailed: ${summary.failedCount}`
            );

            console.log("Bulk Upload Result", summary);

            setPreviewRows([]);
            setValidUsers([]);

            // Switching tabs triggers the useEffect above, which fetches
            // history. No need to call fetchInviteHistory() here too.g
            setShowHistory(true);
        } catch (error) {
            console.error(error);
            toast.error("Failed to invite users");
        } finally {
            setLoading(false);
        }
    };

    const downloadSampleCSV = () => {
        const headers = ["email", "firstName", "lastName", "roleName", "departmentName", "courseNames"];
        const rows = [["", "", "", "CORPORATE_USER", "", ""]];
        const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "sample-invite-template.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (dataLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#ffffff]">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900" />
                    <p className="text-sm font-medium text-gray-500">Checking configuration…</p>
                </div>
            </div>
        );
    }

    if (missingConfiguration) {
        return (
            <div className="min-h-screen bg-[#ffffff] p-10 flex items-center justify-center">
                <div className="max-w-md w-full rounded-2xl border border-red-200 bg-red-50 p-8 text-center shadow-sm animate-in zoom-in duration-300">
                    <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-red-800 mb-3">Configuration Required</h2>
                    <p className="text-sm text-red-600 mb-8 leading-relaxed">
                        This tenant's configuration data is missing. You must first create the configuration data before you can bulk invite users.
                    </p>
                    <a href="/tenant-configuration" className="inline-block px-8 py-3 bg-red-600 font-medium text-white rounded-xl hover:bg-red-700 transition-all shadow-sm hover:shadow-md">
                        Go to Tenant Configuration
                    </a>
                </div>
            </div>
        );
    }

    if (missingGroup) {
        return (
            <div className="min-h-screen bg-[#ffffff] p-10 flex items-center justify-center">
                <div className="max-w-md w-full rounded-2xl border border-red-200 bg-red-50 p-8 text-center shadow-sm animate-in zoom-in duration-300">
                    <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-red-800 mb-3">Group Required</h2>
                    <p className="text-sm text-red-600 mb-8 leading-relaxed">
                        This tenant has no groups created. You must first create at least one group (department) before you can bulk invite users.
                    </p>
                    <a href="/create-groups" className="inline-block px-8 py-3 bg-red-600 font-medium text-white rounded-xl hover:bg-red-700 transition-all shadow-sm hover:shadow-md">
                        Go to Create Group
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#ffffff] p-6">
            <Toaster position="top-right" />
            <div className="mx-auto">
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <h1 className="text-3xl font-bold text-gray-900">Invite Users</h1>
                    {/* <p className="mt-2 text-sm text-gray-500">
                        Add team members to your corporate tenant. Invite links expire in 48 hours.
                    </p> */}

                    {/* Tabs */}
                    <div className="mt-8 flex gap-8 border-b border-gray-200">
                        <button
                            onClick={() => setShowHistory(false)}
                            className={`pb-3 text-sm font-semibold ${!showHistory
                                ? "border-b-2 border-gray-900 text-gray-900"
                                : "text-gray-500"
                                }`}
                        >
                            Upload CSV
                        </button>

                        <button className="pb-3 text-sm font-medium text-gray-500 hover:text-gray-900">
                            Paste emails
                        </button>

                        <button
                            onClick={() => setShowHistory(true)}
                            className={`pb-3 text-sm font-medium ${showHistory
                                ? "border-b-2 border-gray-900 text-gray-900"
                                : "text-gray-500 hover:text-gray-900"
                                }`}
                        >
                            History
                        </button>
                    </div>

                    {/* HISTORY TAB */}
                    {showHistory && (
                        <div className="mt-6 rounded-2xl border border-gray-200 bg-white overflow-hidden">
                            <div className="border-b px-6 py-4 flex items-center justify-between">
                                <h3 className="text-lg font-bold">Bulk Invite History</h3>
                                <button
                                    onClick={fetchInviteHistory}
                                    className="text-sm text-blue-600 hover:underline"
                                >
                                    {historyLoading ? "Refreshing..." : "↻ Refresh"}
                                </button>
                            </div>

                            {historyError && (
                                <div className="px-6 py-3 bg-red-50 border-b border-red-100 text-sm text-red-700">
                                    {historyError}
                                </div>
                            )}

                            {historyLoading ? (
                                <div className="px-6 py-8 text-center text-gray-500">
                                    Loading...
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Date</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Email</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Expires At</th>
                                                <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-gray-500">Resend Count</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Last Resent At</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Used At</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Invitation Status</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Status</th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {inviteHistory.length > 0 ? (
                                                inviteHistory.map((inv: any) => {
                                                    const dateValue = inv.createdAt;
                                                    const formattedDate = dateValue
                                                        ? new Date(dateValue).toLocaleString()
                                                        : "—";

                                                    const email = inv.user?.email || inv.email || "—";

                                                    // const firstName =
                                                    //     inv.user?.profile?.firstName ||
                                                    //     inv.user?.firstName ||
                                                    //     inv.invitedUser?.profile?.firstName ||
                                                    //     inv.invitedUser?.firstName ||
                                                    //     inv.firstName ||
                                                    //     "—";

                                                    // const lastName =
                                                    //     inv.user?.profile?.lastName ||
                                                    //     inv.user?.lastName ||
                                                    //     inv.invitedUser?.profile?.lastName ||
                                                    //     inv.invitedUser?.lastName ||
                                                    //     inv.lastName ||
                                                    //     "—";

                                                    // There's no `status` field on the invitation record —
                                                    // it has to be derived from `used` and `expiresAt`.
                                                    let status: string;
                                                    if (inv.user?.status) {
                                                        status = inv.user.status === "ACTIVE" || inv.user.status === "Active" ? "Active" : "Inactive";
                                                    } else if (inv.used) {
                                                        status = "Completed";
                                                    } else if (
                                                        inv.expiresAt &&
                                                        new Date(inv.expiresAt).getTime() < Date.now()
                                                    ) {
                                                        status = "Expired";
                                                    } else {
                                                        status = "Pending";
                                                    }

                                                    return (
                                                        <tr
                                                            key={inv.id}
                                                            className="border-t hover:bg-gray-50"
                                                        >
                                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                                {formattedDate}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-gray-800">
                                                                {email}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                                {inv.expiresAt ? new Date(inv.expiresAt).toLocaleString() : "—"}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-center text-gray-800 font-medium">
                                                                {inv.resendCount || 0}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                                {inv.lastResentAt ? new Date(inv.lastResentAt).toLocaleString() : "—"}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                                {inv.usedAt ? new Date(inv.usedAt).toLocaleString() : (inv.used ? "Yes" : "—")}
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <span className="rounded-full border px-2 py-1 text-[10px] font-semibold bg-gray-100 text-gray-700">
                                                                    {inv.status || "PENDING"}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusStyles(status)}`}>
                                                                    {status}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-right">
                                                                {(inv.status === "PENDING" || inv.status === "EXPIRED" || status === "Pending" || status === "Expired") && (
                                                                    <div className="flex justify-end gap-2">
                                                                        {(() => {
                                                                            const maxResends = config?.maxInvitationsPerUser ?? 10;
                                                                            const cooldownMinutes = config?.invitationResendCooldown ?? 60;
                                                                            const cooldownMs = cooldownMinutes * 60 * 1000;

                                                                            let isCooldownActive = false;
                                                                            let timeString = "";

                                                                            const lastSentTime = inv.lastResentAt || inv.sentAt || inv.createdAt;

                                                                            if (lastSentTime) {
                                                                                const elapsed = now - new Date(lastSentTime).getTime();
                                                                                if (elapsed < cooldownMs) {
                                                                                    isCooldownActive = true;
                                                                                    const remainingSeconds = Math.ceil((cooldownMs - elapsed) / 1000);
                                                                                    const m = Math.floor(remainingSeconds / 60);
                                                                                    const s = remainingSeconds % 60;
                                                                                    timeString = `${m}m ${s}s`;
                                                                                }
                                                                            }

                                                                            const isMaxReached = inv.resendCount >= maxResends;

                                                                            return (
                                                                                <div className="flex flex-col items-end gap-1">
                                                                                    <button
                                                                                        onClick={() => handleResend(inv.id)}
                                                                                        disabled={resendLoadingId === inv.id || isMaxReached || isCooldownActive}
                                                                                        className="rounded px-3 py-1 text-xs font-medium text-blue-600 border border-blue-600 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed min-w-[70px]"
                                                                                    >
                                                                                        {resendLoadingId === inv.id ? "..." : "Resend"}
                                                                                    </button>
                                                                                    {isCooldownActive && !isMaxReached && (
                                                                                        <span className="text-[10px] text-gray-500 font-medium">
                                                                                            Wait: {timeString}
                                                                                        </span>
                                                                                    )}
                                                                                    {isMaxReached && (
                                                                                        <div className="mt-1 max-w-[160px] rounded border border-red-200 bg-red-50 p-1.5 text-[10px] leading-tight text-red-600 shadow-sm flex items-start gap-1">
                                                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                                                            </svg>
                                                                                            <span>This user in count are already close, please cancle all count or remove the count display.</span>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            );
                                                                        })()}

                                                                        {(inv.status === "PENDING" || status === "Pending") && (
                                                                            <button
                                                                                onClick={() => handleCancelClick(inv)}
                                                                                className="rounded px-3 py-1 text-xs font-medium text-red-600 border border-red-600 hover:bg-red-50"
                                                                            >
                                                                                Cancel
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            ) : (
                                                <tr>
                                                    <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                                                        No invitations found
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* UPLOAD TAB */}
                    {!showHistory && (
                        <div>
                            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-4">
                                {/* Upload Box */}
                                <div className={`rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 lg:col-span-3 ${previewRows.length > 0 ? "opacity-50 pointer-events-none" : ""}`}>
                                    <div className="flex flex-col items-center justify-center text-center">
                                        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 0115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                            </svg>
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900">Drop CSV file here</h3>
                                        <p className="mt-2 text-sm text-gray-500">or click to browse · up to 10MB</p>
                                        <label className="mt-6 cursor-pointer rounded-xl bg-gray-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-black">
                                            Choose File
                                            <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                                        </label>
                                        <div className="mt-6 text-sm text-gray-500">
                                            Need a template?{" "}
                                            <button onClick={downloadSampleCSV} className="font-semibold text-blue-600 hover:underline">
                                                Download sample CSV
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* CSV Format Info */}
                                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                                    <h3 className="text-lg font-bold text-gray-900">CSV Format</h3>
                                    <div className="mt-4 space-y-3 text-sm text-gray-600">
                                        <p><span className="font-semibold text-gray-800">Required:</span> email, firstName, lastName</p>
                                        <p><span className="font-semibold text-gray-800">Optional:</span> roleName, departmentName, courseNames</p>
                                        <p>UTF-8 encoded · header row required · 1000 rows max per upload.</p>
                                    </div>
                                </div>

                            </div>

                            {/* Preview Table */}
                            <div className="mt-10">
                                <div className="mb-5 flex items-center justify-between">
                                    <h2 className="text-xl font-bold text-gray-900">
                                        Preview · {previewRows.length} rows detected
                                    </h2>
                                </div>

                                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[900px]">
                                            <thead className="bg-gray-50">
                                                <tr className="border-b border-gray-200">
                                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Row</th>
                                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Email</th>
                                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">First Name</th>
                                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Last Name</th>
                                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Role</th>
                                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Department / Group</th>
                                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Course</th>
                                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {previewRows.map((item) => (
                                                    <tr key={item.row} className="transition hover:bg-gray-50">
                                                        <td className="px-6 py-5 text-sm font-medium text-gray-700">{item.row}</td>
                                                        <td className="px-6 py-5 text-sm text-gray-700">{item.email}</td>
                                                        <td className="px-6 py-5 text-sm font-semibold text-gray-900">{item.firstName}</td>
                                                        <td className="px-6 py-5 text-sm font-semibold text-gray-900">{item.lastName}</td>
                                                        <td className="px-6 py-5 text-sm text-gray-700">{item.roleName}</td>
                                                        <td className="px-6 py-5 text-sm text-gray-500">{item.departmentName}</td>
                                                        <td className="px-6 py-5 text-sm text-gray-500">{item.courseNames}</td>
                                                        <td className="px-6 py-5">
                                                            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusStyles(item.status)}`}>
                                                                {item.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                    <p className="text-sm text-gray-500">
                                        {validCount} valid · {invalidCount} invalid · {duplicateCount} duplicate
                                    </p>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => {
                                                setPreviewRows([]);
                                                setValidUsers([]);
                                            }}
                                            className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
                                        >
                                            Fix & Reupload
                                        </button>
                                        <button
                                            onClick={handleSendInvites}
                                            disabled={loading || validUsers.length === 0}
                                            className="rounded-xl bg-gray-900 px-6 py-3 text-sm font-semibold text-white disabled:opacity-50"
                                        >
                                            {loading ? "Sending..." : `Send Invites (${validUsers.length})`}
                                        </button>
                                    </div>
                                </div>
                            </div>

                        </div>
                    )}
                </div>
            </div>

            {/* CANCEL CONFIRMATION MODAL */}
            {showCancelModal && (
                <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                        <h3 className="text-xl font-bold text-gray-900">Cancel Invitation?</h3>
                        <p className="mt-4 text-sm text-gray-600">
                            Are you sure you want to cancel the invitation for <strong className="text-gray-900">{invitationToCancel?.email || invitationToCancel?.user?.email}</strong>?
                        </p>
                        <div className="mt-4 text-sm text-gray-800 bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <strong>Resend Count:</strong> {invitationToCancel?.resendCount ?? 0} / {config?.maxInvitationsPerUser ?? 10}
                        </div>
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Type <strong>delete</strong> to confirm and reset resend count:
                            </label>
                            <input
                                type="text"
                                value={deleteConfirmText}
                                onChange={(e) => setDeleteConfirmText(e.target.value)}
                                className="w-full rounded-xl border border-gray-300 p-2.5 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                                placeholder="delete"
                            />
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowCancelModal(false);
                                    setInvitationToCancel(null);
                                    setDeleteConfirmText("");
                                }}
                                className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                            >
                                Close
                            </button>
                            <button
                                onClick={confirmCancel}
                                disabled={cancelLoading || deleteConfirmText !== "delete"}
                                className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                            >
                                {cancelLoading ? "Cancelling..." : "Yes, Cancel"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BulkInvite;
