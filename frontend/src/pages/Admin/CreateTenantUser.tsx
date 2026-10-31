import React, { useEffect, useState } from "react";
import Papa from "papaparse";
import { useNavigate, useLocation } from "react-router";
import { toast, Toaster } from "sonner";

import { getRoles } from "../../core/api/role.api";
import { getGroupsApi, getGroupMembersApi, Group } from "../../core/api/group.api";
import { 
  TenantUser, 
  getInviteHistoryApi, 
  resendInviteApi, 
  cancelInviteApi, 
  BulkUser, 
  InviteHistoryItem, 
  getTenantUsersByTenantIdApi
} from "../../core/api/tenantuser.api";
import { useTenantUserStore } from "../../store/tenantuser.store";
import { 
  getTenantConfigurationByTenantApi, 
  createTenantConfigurationApi, 
  updateTenantConfigurationApi 
} from "../../core/api/TenantConfiguration.api";
import { getTenantDashboardApi } from "../../core/api/tenant.api";
import { Icon } from "../../components/ui/Icon";
import { useGetTenantById } from "../../hooks/tenant";

const getStatusStyles = (status: string) => {
    switch (status) {
        case "Valid":
            return "bg-green-50 text-green-700 border-green-200";
        case "Invalid email":
        case "Missing name":
        case "Missing due date":
        case "Invalid date format":
        case "Invalid role":
            return "bg-red-50 text-red-700 border-red-200";
        case "Duplicate":
        case "Already exists":
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

const CreateTenantUser: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { createUser, bulkCreateUsers, loading } = useTenantUserStore();

  // --- UI Mode ---
  const [mode, setMode] = useState<'single' | 'bulk'>('single');

  // --- Shared Data State ---
  const [dataLoading, setDataLoading] = useState(false);
  const [missingConfiguration, setMissingConfiguration] = useState(false);


  const [configFormData, setConfigFormData] = useState<{
      invitationExpiryDays: string;
      maxInvitationsPerUser: string;
      allowInvitationResend: boolean;
      invitationResendCooldown: string;
  }>({
      invitationExpiryDays: "",
      maxInvitationsPerUser: "",
      allowInvitationResend: false,
      invitationResendCooldown: "",
  });
  const [configurationId, setConfigurationId] = useState("");
  const [configLoading, setConfigLoading] = useState(false);

  const [tenantName, setTenantName] = useState(location.state?.tenantName || "");
  const { mutateAsync: getTenant } = useGetTenantById();

  // --- Single User State ---
  const [groups, setGroups] = useState<Group[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    mobile: "",
    departmentId: "",
    roleId: "",
  });

  const [expiry, setExpiry] = useState("48h");

  const isFormValid =
    form.firstName.trim() !== "" &&
    form.lastName.trim() !== "" &&
    form.email.trim() !== "" &&
    form.roleId !== "";

// --- Bulk User State ---
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [validUsers, setValidUsers] = useState<BulkUser[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [inviteHistory, setInviteHistory] = useState<InviteHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [config, setConfig] = useState<{ maxInvitationsPerUser: number; invitationResendCooldown: number } | null>(null);

  const [activeBulkTab, setActiveBulkTab] = useState<"upload" | "select_groups" | "select_users" | "history">("upload");
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [groupSearchTerm, setGroupSearchTerm] = useState("");
  const [groupUsers, setGroupUsers] = useState<any[]>([]);
  const [groupUsersLoading, setGroupUsersLoading] = useState(false);

  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [tenantUsers, setTenantUsers] = useState<any[]>([]);
  const [tenantUsersLoading, setTenantUsersLoading] = useState(false);

  const getInitials = (firstName: string, lastName: string) => {
    return `${(firstName || '').charAt(0)}${(lastName || '').charAt(0)}`.toUpperCase() || 'U';
  };

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

  const getTenantId = () => {
    if (location.state?.tenantId) {
      return location.state.tenantId;
    }
    try {
      const storedUser = localStorage.getItem('keycloak_session_user');
      if (!storedUser) return "";
      const parsed = JSON.parse(storedUser);
      const user = parsed?.user || parsed;
      return user?.tenantId || user?.tenant?.id || user?.organizationId || "";
    } catch (error) {
      console.error("Failed to parse session user", error);
      return "";
    }
  };

  const loadData = async () => {
    setDataLoading(true);
    try {
      const tenantId = getTenantId();
      if (!tenantId) {
        setDataLoading(false);
        return;
      }

      try {
        const tenantData = await getTenant(tenantId);
        if (tenantData?.name) {
          setTenantName(tenantData.name);
        }
      } catch (err) {
        console.error("Failed to get tenant details", err);
      }

      let configData;
      try {
        configData = await getTenantConfigurationByTenantApi(tenantId);
        if (configData && configData.id) {
            setConfigFormData({
                invitationExpiryDays: configData.invitationExpiryDays?.toString() || "",
                maxInvitationsPerUser: configData.maxInvitationsPerUser?.toString() || "",
                allowInvitationResend: configData.allowInvitationResend ?? false,
                invitationResendCooldown: configData.invitationResendCooldown?.toString() || "",
            });
            setConfigurationId(configData.id ?? "");
        } else {
            setMissingConfiguration(true);
        }
      } catch (error) {
        console.error("No configuration found");
        setMissingConfiguration(true);
      }

      const departmentData = await getGroupsApi(tenantId);
      const groupList: Group[] = Array.isArray(departmentData) ? departmentData : [];
      setGroups(groupList);

      const roleData = await getRoles();
      const filteredRoles = (roleData || []).filter(
        (role: any) => role.code === "CORPORATE_ADMIN" || role.code === "CORPORATE_USER"
      );
      setRoles(filteredRoles);

      const defaultGroup = groupList.find((g: any) => g.tenantId === tenantId) || groupList[0];
      const defaultRole = filteredRoles.find((r: any) => r.code === "CORPORATE_USER");

      setForm((prev) => ({
        ...prev,
        departmentId: defaultGroup?.id ?? prev.departmentId,
        roleId: defaultRole?.id ?? prev.roleId,
      }));
    } catch (error) {
      console.error(error);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

useEffect(() => {
    const loadGroupUsers = async () => {
      if (selectedGroupIds.length === 0) {
        setGroupUsers([]);
        return;
      }
      const tenantId = getTenantId();
      if (!tenantId) return;

      setGroupUsersLoading(true);
      try {
        let allUsers: any[] = [];
        for (const groupId of selectedGroupIds) {
          const members = await getGroupMembersApi(tenantId, groupId);
          if (members && Array.isArray(members)) {
            const groupName = groups.find(g => g.id === groupId)?.name || "Unknown";
            const enhancedMembers = members.map(m => ({ ...m, groupName }));
            allUsers = [...allUsers, ...enhancedMembers];
          }
        }
        
        // Remove duplicates by email
        const uniqueUsers = Array.from(new Map(allUsers.map(u => [u.email, u])).values());
        
        const usersWithStatus = uniqueUsers.map(u => ({
            ...u,
            status: "Not yet invited"
        }));

        setGroupUsers(usersWithStatus);
      } catch (error) {
        console.error("Error loading group users:", error);
      } finally {
        setGroupUsersLoading(false);
      }
    };

    loadGroupUsers();
  }, [selectedGroupIds, groups]);

  useEffect(() => {
    if (activeBulkTab === 'select_users' && tenantUsers.length === 0) {
      const loadUsers = async () => {
        const tenantId = getTenantId();
        if (!tenantId) return;
        setTenantUsersLoading(true);
        try {
          const users = await getTenantUsersByTenantIdApi(tenantId);
          setTenantUsers(users || []);
        } catch (error) {
          console.error("Error loading users:", error);
        } finally {
          setTenantUsersLoading(false);
        }
      };
      loadUsers();
    }
  }, [activeBulkTab, tenantUsers.length]);

  // --- Single User Handlers ---
  const handleSingleSubmit = async () => {
    const department = groups.find((item) => item.id === form.departmentId);
    const role = roles.find((item) => item.id === form.roleId);

    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || !role) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      const tenantId = getTenantId();
      if (tenantId) {
        const dashboard = await getTenantDashboardApi(tenantId);
        const allocated = dashboard?.seats?.allocatedSeats || 0;
        const total = dashboard?.seats?.totalSeats || 0;
        if (allocated >= total && total > 0) {
          toast.error("Corporate user creation is exceeding the seat count. Please contact super admin.");
          return;
        }
      }
    } catch (err) {
      console.error("Failed to fetch tenant dashboard for seat check", err);
    }

    const payload: TenantUser = {
      email: form.email.trim(),
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      roleId: role.id,
      roleCode: role.code,
      roleName: role.name,
      departmentIds: [],
      status: "ACTIVE",
    };

    const success = await createUser(payload);

    if (success) {
      toast.success("User created successfully");
      const tenantId = getTenantId();
      const defaultGroup = groups.find((g: any) => g.tenantId === tenantId) || groups[0];
      const defaultRole = roles.find((r: any) => r.code === "CORPORATE_USER");
      setForm({
        firstName: "",
        lastName: "",
        email: "",
        mobile: "",
        departmentId: defaultGroup?.id || "",
        roleId: defaultRole?.id || "",
      });
    } else {
        toast.error("Failed to create user");
    }
  };

  // --- Bulk Invite Handlers ---
  const fetchInviteHistory = async () => {
    try {
        setHistoryLoading(true);
        setHistoryError(null);
        const tenantId = getTenantId();
        if (!tenantId) {
            setHistoryError("Couldn't determine your tenant. Try logging in again.");
            setInviteHistory([]);
            return;
        }
        const data = await getInviteHistoryApi(tenantId);
        if (data && data.invitations) {
            setInviteHistory(data.invitations);
            try {
                const configData = await getTenantConfigurationByTenantApi(tenantId);
                setConfig(configData || null);
            } catch (err) {
                setConfig(data.config || null);
            }
        } else {
            setInviteHistory(Array.isArray(data) ? data : []);
        }
    } catch (error: any) {
        setHistoryError(error?.response?.data?.message || error?.message || "Failed to load invite history.");
        setInviteHistory([]);
        setConfig(null);
    } finally {
        setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (mode === 'bulk' && (showHistory || activeBulkTab === 'history')) {
        fetchInviteHistory();
    }
  }, [mode, showHistory, activeBulkTab]);

  const handleConfigSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const tenantId = getTenantId();
    if (!tenantId) return;

    const payload: any = {
        tenantId,
        allowInvitationResend: configFormData.allowInvitationResend,
    };

    if (configFormData.invitationExpiryDays !== "") {
        payload.invitationExpiryDays = Number(configFormData.invitationExpiryDays);
    }
    if (configFormData.maxInvitationsPerUser !== "") {
        payload.maxInvitationsPerUser = Number(configFormData.maxInvitationsPerUser);
    }
    if (configFormData.invitationResendCooldown !== "") {
        payload.invitationResendCooldown = Number(configFormData.invitationResendCooldown);
    }

    try {
        setConfigLoading(true);
        if (configurationId) {
            await updateTenantConfigurationApi(configurationId, payload);
            toast.success("Configuration Updated Successfully");
        } else {
            const created = await createTenantConfigurationApi(payload);
            setConfigurationId(created.id || "");
            toast.success("Configuration Created Successfully");
            setMissingConfiguration(false);
        }
    } catch (error) {
        console.error(error);
        toast.error("Failed to save configuration");
    } finally {
        setConfigLoading(false);
    }
  };

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    let existingEmails = new Set<string>();
    try {
      const tenantId = getTenantId();
      if (tenantId) {
        const users = await getTenantUsersByTenantIdApi(tenantId);
        users.forEach((u: any) => existingEmails.add(u.email.toLowerCase()));
      }
    } catch (err) {
      console.error("Failed to load existing users for validation", err);
    }

    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result: any) => {
            const emailsInFile = new Set<string>();
            const preview = result.data.map((row: any, index: number) => {
                let status = "Valid";
                const email = row.email?.trim() || "";
                const firstName = row.firstName?.trim() || "";
                const lastName = row.lastName?.trim() || "";
                const courseNames = row.courseNames?.trim() || "";
                const careerPathNames = row.careerPathNames?.trim() || "";
                let dueDate = row.dueDate?.trim() || "";
                let hasInvalidDate = false;
                if (dueDate) {
                    const parts = dueDate.split(/[-/]/);
                    if (parts.length === 3 && parts[2].length === 4) {
                        const p0 = parseInt(parts[0], 10);
                        const p1 = parseInt(parts[1], 10);
                        if (p1 > 12) {
                            // MM-DD-YYYY
                            dueDate = `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
                        } else {
                            // Assume DD-MM-YYYY
                            dueDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                        }
                    } else if (parts.length === 3 && parts[0].length === 4) {
                        // YYYY-MM-DD
                        dueDate = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
                    } else {
                        hasInvalidDate = true;
                    }
                }
                const roleName = row.roleName?.trim() || "";

                if (!email || !isValidEmail(email)) {
                    status = "Invalid email";
                } else if (existingEmails.has(email.toLowerCase())) {
                    status = "Already exists";
                } else if (emailsInFile.has(email.toLowerCase())) {
                    status = "Duplicate";
                } else if (roleName !== "CORPORATE_USER") {
                    status = "Invalid role";
                } else if (!firstName || !lastName) {
                    status = "Missing name";
                } else if ((courseNames || careerPathNames) && !dueDate) {
                    status = "Missing due date";
                } else if (hasInvalidDate) {
                    status = "Invalid date format";
                } else {
                    emailsInFile.add(email.toLowerCase());
                }

                return {
                    row: index + 1,
                    email,
                    firstName,
                    lastName,
                    roleName: row.roleName?.trim() || "",
                    departmentName: row.departmentName?.trim() || "",
                    courseNames,
                    careerPathNames,
                    dueDate,
                    status,
                };
            });
            setPreviewRows(preview);
            setValidUsers(preview.filter((item: any) => item.status === "Valid").map((item: any) => ({
                email: item.email,
                firstName: item.firstName,
                lastName: item.lastName,
                roleName: item.roleName,
                departmentName: item.departmentName,
                courseNames: item.courseNames,
                careerPathNames: item.careerPathNames,
                dueDate: item.dueDate,
            })));
        },
    });
  };

  const handleSendInvites = async () => {
    try {
        const tenantId = getTenantId();
        if (!tenantId) {
            toast.error("Tenant ID not found.");
            return;
        }

        try {
            const dashboard = await getTenantDashboardApi(tenantId);
            const allocated = dashboard?.seats?.allocatedSeats || 0;
            const total = dashboard?.seats?.totalSeats || 0;
            if (allocated + validUsers.length > total && total > 0) {
                toast.error("Corporate user creation is exceeding the seat count. Please contact super admin.");
                return;
            }
        } catch (err) {
            console.error("Failed to check seats", err);
        }

        const result = await bulkCreateUsers(tenantId, validUsers);
        
        const successCount = result?.successCount ?? result?.data?.successCount;
        const failedCount = result?.failedCount ?? result?.data?.failedCount;

        if (successCount === undefined && failedCount === undefined) {
            toast.success(result?.message || "Users imported and invites sent successfully");
        } else {
            if (successCount > 0) {
                toast.success(`Bulk upload completed.\n\nSuccess: ${successCount}\nFailed: ${failedCount}`);
            } else {
                toast.error(`All ${failedCount} invite(s) failed. Check the data and try again.`);
            }
        }
        setPreviewRows([]);
        setValidUsers([]);
        setShowHistory(true);
    } catch (error: any) {
        const msg = error?.response?.data?.message || error?.message || "Failed to invite users";
        toast.error(msg);
    }
  };

  const downloadSampleCSV = () => {
    const headers = ["email", "firstName", "lastName", "roleName", "departmentName", "courseNames", "careerPathNames", "dueDate"];
    const rows = [["", "", "", "CORPORATE_USER", "", "", "", ""]];
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

  const handleResend = async (invitationId: string) => {
    try {
        const tenantId = getTenantId();
        if (!tenantId) {
            toast.error("Tenant ID not found.");
            return;
        }
        setResendLoadingId(invitationId);
        await resendInviteApi(tenantId, invitationId);
        toast.success("Invitation resent successfully!");
        fetchInviteHistory();
    } catch (error: any) {
        toast.error(error?.response?.data?.message || "Failed to resend invitation");
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
          toast.success("Invitation cancelled successfully!");
          setShowCancelModal(false);
          setInvitationToCancel(null);
          fetchInviteHistory();
      } catch (error: any) {
          toast.error(error?.response?.data?.message || "Failed to cancel invitation");
      } finally {
          setCancelLoading(false);
      }
  };

  // --- Rendering ---
  if (dataLoading) {
    return (
      <main className="min-w-0 relative overflow-y-auto bg-[#fff] min-h-screen">
        <div className="w-full relative z-10">
          {/* Skeleton header */}
          <div className="h-[16px] w-[80px] bg-[#f0f0ee] rounded-[4px] mb-[14px] animate-pulse" />
          <div className="mb-[22px]">
            <div className="h-[12px] w-[140px] bg-[#f0f0ee] rounded-[4px] mb-[8px] animate-pulse" />
            <div className="h-[28px] w-[260px] bg-[#ebebea] rounded-[6px] mb-[10px] animate-pulse" />
            <div className="h-[14px] w-[380px] bg-[#f0f0ee] rounded-[4px] animate-pulse" />
          </div>
          {/* Skeleton mode toggle */}
          <div className="inline-flex bg-[#eeeeea] rounded-[10px] gap-[4px] mb-[22px] p-[4px]">
            <div className="h-[36px] w-[110px] bg-[#e4e4e0] rounded-[8px] animate-pulse" />
            <div className="h-[36px] w-[110px] bg-[#e4e4e0] rounded-[8px] animate-pulse" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-[24px] items-start">
            <div className="flex flex-col gap-[18px]">
              {/* Skeleton card 1 – User Profile */}
              <div className="bg-[#fff] border border-[#1111111a] rounded-[14px] shadow-[0_4px_16px_-4px_rgba(42,17,8,0.1)]">
                <div className="flex justify-between items-center px-[28px] py-[18px] pb-[16px] border-b border-[#1111111a]">
                  <div className="h-[12px] w-[90px] bg-[#ebebea] rounded-[4px] animate-pulse" />
                  <div className="h-[12px] w-[130px] bg-[#f0f0ee] rounded-[4px] animate-pulse" />
                </div>
                <div className="p-[24px] px-[28px] pb-[28px]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-[24px] gap-y-[18px]">
                    {[0,1,2,3].map(i => (
                      <div key={i}>
                        <div className="h-[11px] w-[80px] bg-[#f0f0ee] rounded-[4px] mb-[8px] animate-pulse" />
                        <div className="h-[40px] w-full bg-[#f5f5f3] rounded-[8px] animate-pulse" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {/* Skeleton card 2 – Access */}
              <div className="bg-[#fff] border border-[#1111111a] rounded-[14px] shadow-[0_4px_16px_-4px_rgba(42,17,8,0.1)]">
                <div className="flex justify-between items-center px-[28px] py-[18px] pb-[16px] border-b border-[#1111111a]">
                  <div className="h-[12px] w-[60px] bg-[#ebebea] rounded-[4px] animate-pulse" />
                  <div className="h-[12px] w-[110px] bg-[#f0f0ee] rounded-[4px] animate-pulse" />
                </div>
                <div className="p-[24px] px-[28px] pb-[28px]">
                  <div className="h-[11px] w-[40px] bg-[#f0f0ee] rounded-[4px] mb-[8px] animate-pulse" />
                  <div className="h-[40px] w-full bg-[#f5f5f3] rounded-[8px] animate-pulse" />
                </div>
              </div>
            </div>
            {/* Skeleton summary rail */}
            <div className="flex flex-col gap-[16px] sticky top-[84px]">
              <div className="bg-[#fff] border border-[#1111111a] rounded-[14px] p-[18px] px-[20px]">
                <div className="h-[11px] w-[70px] bg-[#ebebea] rounded-[4px] mb-[14px] animate-pulse" />
                <div className="flex flex-col gap-[12px]">
                  {[80, 100, 60].map((w, i) => (
                    <div key={i}>
                      <div className="h-[10px] bg-[#f0f0ee] rounded-[4px] mb-[4px] animate-pulse" style={{ width: `${w}%` }} />
                      <div className="h-[16px] bg-[#f5f5f3] rounded-[4px] animate-pulse" style={{ width: `${w - 20}%` }} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="h-[46px] w-full bg-[#FCF7AE] rounded-full border border-[#c99b2e4d] animate-pulse" />
              <div className="h-[46px] w-full bg-[#f5f5f3] rounded-full border border-[#1111111a] animate-pulse" />
            </div>
          </div>
        </div>
      </main>
    );
  }



  const validCount = previewRows.filter((x) => x.status === "Valid").length;

  const showSummary = mode === 'single' || (mode === 'bulk' && activeBulkTab === 'upload');

  return (
    <>
      <Toaster position="top-right" />

      
      <main className="min-w-0 relative overflow-y-auto bg-[#fff] min-h-screen">
        <div className="w-full relative z-10">
          {/* Header Region */}
          <button 
            className="inline-flex items-center gap-[6px] font-sans text-[12px] tracking-[0.1em] uppercase text-[#5c5c5c] font-bold bg-none border-none mb-[14px] cursor-pointer hover:text-[#b8523e] transition-colors"
            onClick={() => navigate("/manage-roles")}
          >
            <Icon size={14}><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></Icon>
            {tenantName || "Corporate"}
          </button>
          
          <div className="mb-[22px]">
            <div className="font-sans text-[12px] tracking-[0.08em] uppercase text-[#5c5c5c] font-semibold mb-[6px]">Corporate · {tenantName || "Corporate"}</div>
            <h1 className="font-sans text-[24px] text-[#141414] font-extrabold leading-[1.2] m-0 mb-[8px]">Create corporate user</h1>
            <p className="text-[16px] text-[#3a3a3a] leading-[1.55] m-0">Add a single user, or import many at once. An invite link is sent to each new user.</p>
          </div>

          <div className="inline-flex bg-[#eeeeea] rounded-[10px] gap-[4px] mb-[22px] p-[4px]">
            <button 
                onClick={() => setMode('single')}
                className={`flex items-center gap-[6px] px-[16px] py-[8px] rounded-[8px] text-[16px] font-bold transition-colors ${mode === 'single' ? 'bg-[#fff] shadow-sm text-[#141414]' : 'text-[#5c5c5c] hover:text-[#141414]'}`}
            >
              <Icon size={14}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></Icon>
              Single user
            </button>
            <button 
                onClick={() => setMode('bulk')}
                className={`flex items-center gap-[6px] px-[16px] py-[8px] rounded-[8px] text-[16px] font-bold transition-colors ${mode === 'bulk' ? 'bg-[#fff] shadow-sm text-[#141414]' : 'text-[#5c5c5c] hover:text-[#141414]'}`}
            >
              <Icon size={14}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></Icon>
              Bulk import
            </button>
          </div>

          <div className={`grid grid-cols-[minmax(0,1fr)] ${showSummary ? 'lg:grid-cols-[minmax(0,1fr)_320px]' : ''} gap-[24px] items-start`}>
            <div className="flex flex-col gap-[18px] min-w-0">
              
              {mode === 'single' && (
                <>
                  {/* Single User Form */}
                  <div className="bg-[#fff] border border-[#1111111a] rounded-[14px] shadow-[0_4px_16px_-4px_rgba(42,17,8,0.1)] transition-all duration-200">
                    <div className="flex justify-between items-center px-[28px] py-[18px] pb-[16px] border-b border-[#1111111a]">
                      <span className="font-sans text-[12px] tracking-[0.14em] uppercase text-[#3a3a3a] font-bold">User profile</span>
                      <span className="font-sans text-[12px] tracking-[0.1em] uppercase text-[#8c8c8c] font-semibold">Identity & contact</span>
                    </div>
                    <div className="p-[24px] px-[28px] pb-[28px]">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-[24px] gap-y-[18px]">
                        <div className="m-0">
                          <label className="block font-sans text-[12px] tracking-[0.14em] uppercase text-[#5c5c5c] font-bold mb-[8px]">First name <span className="text-[#c99b2e]">*</span></label>
                          <input type="text" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder="Ahmed" className="w-full h-[40px] px-[14px] font-sans text-[16px] text-[#141414] bg-[#fff] border border-[#11111129] rounded-[8px] transition-all placeholder:text-[#5c5c5c] focus:border-[#5c5c5c] focus:outline-none focus:ring-[4px] focus:ring-[#1111110d]" />
                        </div>
                        <div className="m-0">
                          <label className="block font-sans text-[12px] tracking-[0.14em] uppercase text-[#5c5c5c] font-bold mb-[8px]">Last name <span className="text-[#c99b2e]">*</span></label>
                          <input type="text" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="Al-Rashid" className="w-full h-[40px] px-[14px] font-sans text-[16px] text-[#141414] bg-[#fff] border border-[#11111129] rounded-[8px] transition-all placeholder:text-[#5c5c5c] focus:border-[#5c5c5c] focus:outline-none focus:ring-[4px] focus:ring-[#1111110d]" />
                        </div>
                        <div className="m-0">
                          <label className="block font-sans text-[12px] tracking-[0.14em] uppercase text-[#5c5c5c] font-bold mb-[8px]">Work email <span className="text-[#c99b2e]">*</span></label>
                          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="ahmed@bankmuscat.om" className="w-full h-[40px] px-[14px] font-sans text-[16px] text-[#141414] bg-[#fff] border border-[#11111129] rounded-[8px] transition-all placeholder:text-[#5c5c5c] focus:border-[#5c5c5c] focus:outline-none focus:ring-[4px] focus:ring-[#1111110d]" />
                          <p className="font-sans text-[14px] text-[#5c5c5c] leading-[1.5] mt-[6px] m-0">Invite link will be sent to this address. Locked after user accepts.</p>
                        </div>
                        <div className="m-0">
                          <label className="block font-sans text-[12px] tracking-[0.14em] uppercase text-[#5c5c5c] font-bold mb-[8px]">Mobile</label>
                          <input type="tel" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} placeholder="+968 9X XXX XXXX" className="w-full h-[40px] px-[14px] font-sans text-[16px] text-[#141414] bg-[#fff] border border-[#11111129] rounded-[8px] transition-all placeholder:text-[#5c5c5c] focus:border-[#5c5c5c] focus:outline-none focus:ring-[4px] focus:ring-[#1111110d]" />
                        </div>

                      </div>
                    </div>
                  </div>

                  <div className="bg-[#fff] border border-[#1111111a] rounded-[14px] shadow-[0_4px_16px_-4px_rgba(42,17,8,0.1)] transition-all duration-200">
                    <div className="flex justify-between items-center px-[28px] py-[18px] pb-[16px] border-b border-[#1111111a]">
                      <span className="font-sans text-[12px] tracking-[0.14em] uppercase text-[#3a3a3a] font-bold">Access</span>
                      <span className="font-sans text-[12px] tracking-[0.1em] uppercase text-[#8c8c8c] font-semibold">Role & permissions</span>
                    </div>
                    <div className="p-[24px] px-[28px] pb-[28px]">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-[24px] gap-y-[18px]">
                        <div className="m-0">
                          <label className="block font-sans text-[12px] tracking-[0.14em] uppercase text-[#5c5c5c] font-bold mb-[8px]">Role <span className="text-[#c99b2e]">*</span></label>
                          <select disabled value={form.roleId} onChange={(e) => setForm({ ...form, roleId: e.target.value })} className="w-full h-[40px] px-[14px] font-sans text-[16px] text-[#141414] bg-[#fff] border border-[#11111129] rounded-[8px] transition-all disabled:opacity-70 disabled:cursor-not-allowed">
                            <option value="">Select Role</option>
                            {roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
                          </select>
                          <p className="font-sans text-[14px] text-[#5c5c5c] leading-[1.5] mt-[6px] m-0">Corporate Admin can manage users and assignments for this tenant.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#fff] border border-[#1111111a] rounded-[14px] shadow-[0_4px_16px_-4px_rgba(42,17,8,0.1)] transition-all duration-200">
                    <div className="flex justify-between items-center px-[28px] py-[18px] pb-[16px] border-b border-[#1111111a]">
                      <span className="font-sans text-[12px] tracking-[0.14em] uppercase text-[#3a3a3a] font-bold">Tenant Configuration</span>
                      <span className="font-sans text-[12px] tracking-[0.1em] uppercase text-[#8c8c8c] font-semibold">Settings</span>
                    </div>
                    <form onSubmit={handleConfigSubmit} className="p-[24px] px-[28px] pb-[28px]">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-[24px] gap-y-[18px]">
                        <div className="m-0">
                          <label className="block font-sans text-[12px] tracking-[0.14em] uppercase text-[#5c5c5c] font-bold mb-[8px]">Tenant</label>
                          <input type="text" value={tenantName} disabled className="w-full h-[40px] px-[14px] font-sans text-[16px] text-[#141414] bg-[#f5f5f5] border border-[#11111129] rounded-[8px] transition-all disabled:opacity-70 disabled:cursor-not-allowed" />
                        </div>
                        <div className="m-0">
                          <label className="block font-sans text-[12px] tracking-[0.14em] uppercase text-[#5c5c5c] font-bold mb-[8px]">Invitation Expiry Days <span className="text-[#c99b2e]">*</span></label>
                          <input type="number" min={1} required value={configFormData.invitationExpiryDays} onChange={(e) => setConfigFormData({ ...configFormData, invitationExpiryDays: e.target.value })} className="w-full h-[40px] px-[14px] font-sans text-[16px] text-[#141414] bg-[#fff] border border-[#11111129] rounded-[8px] transition-all placeholder:text-[#5c5c5c] focus:border-[#5c5c5c] focus:outline-none focus:ring-[4px] focus:ring-[#1111110d]" />
                        </div>
                        <div className="m-0">
                          <label className="block font-sans text-[12px] tracking-[0.14em] uppercase text-[#5c5c5c] font-bold mb-[8px]">Max Invitations Per User</label>
                          <input type="number" min={1} value={configFormData.maxInvitationsPerUser} onChange={(e) => setConfigFormData({ ...configFormData, maxInvitationsPerUser: e.target.value })} className="w-full h-[40px] px-[14px] font-sans text-[16px] text-[#141414] bg-[#fff] border border-[#11111129] rounded-[8px] transition-all placeholder:text-[#5c5c5c] focus:border-[#5c5c5c] focus:outline-none focus:ring-[4px] focus:ring-[#1111110d]" />
                        </div>
                        <div className="m-0">
                          <label className="block font-sans text-[12px] tracking-[0.14em] uppercase text-[#5c5c5c] font-bold mb-[8px]">Invitation Resend Cooldown (Minutes)</label>
                          <input type="number" min={0} value={configFormData.invitationResendCooldown} onChange={(e) => setConfigFormData({ ...configFormData, invitationResendCooldown: e.target.value })} className="w-full h-[40px] px-[14px] font-sans text-[16px] text-[#141414] bg-[#fff] border border-[#11111129] rounded-[8px] transition-all placeholder:text-[#5c5c5c] focus:border-[#5c5c5c] focus:outline-none focus:ring-[4px] focus:ring-[#1111110d]" />
                        </div>
                        <div className="m-0 md:col-span-2 flex items-center mt-[8px]">
                          <label className="flex items-center gap-[8px] cursor-pointer">
                            <input type="checkbox" checked={configFormData.allowInvitationResend} onChange={(e) => setConfigFormData({ ...configFormData, allowInvitationResend: e.target.checked })} className="w-[18px] h-[18px] rounded-[4px] border-[#11111129] text-[#141414] focus:ring-[#1111110d]" />
                            <span className="font-sans text-[16px] text-[#141414] font-medium">Allow Invitation Resend</span>
                          </label>
                        </div>
                      </div>
                      <div className="mt-[24px] pt-[24px] border-t border-[#1111111a] flex justify-end">
                        <button type="submit" disabled={configLoading || !getTenantId()} className="px-[24px] py-[10px] bg-[#FCF7AE] text-[#141414] font-sans text-[16px] font-bold rounded-[8px] hover:bg-[#e8e39f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-[#d6d294]">
                          {configLoading ? "Saving..." : "Save Configuration"}
                        </button>
                      </div>
                    </form>
                  </div>
                </>
              )}

              {mode === 'bulk' && (
                <>
                                    {/* Bulk Tabs */}
                  <div className="flex gap-[32px] border-b border-[#1111111a] mb-[24px]">
                    <button
                        onClick={() => setActiveBulkTab("upload")}
                        className={`pb-[12px] font-sans text-[14px] font-bold tracking-[0.05em] uppercase ${activeBulkTab === "upload" ? "border-b-[2px] border-[#c99b2e] text-[#141414]" : "text-[#5c5c5c] hover:text-[#141414]"}`}
                    >Upload file</button>
                    <button
                        onClick={() => setActiveBulkTab("select_groups")}
                        className={`pb-[12px] font-sans text-[14px] font-bold tracking-[0.05em] uppercase ${activeBulkTab === "select_groups" ? "border-b-[2px] border-[#c99b2e] text-[#141414]" : "text-[#5c5c5c] hover:text-[#141414]"}`}
                    >Select groups</button>
                    <button
                        onClick={() => setActiveBulkTab("select_users")}
                        className={`pb-[12px] font-sans text-[14px] font-bold tracking-[0.05em] uppercase ${activeBulkTab === "select_users" ? "border-b-[2px] border-[#c99b2e] text-[#141414]" : "text-[#5c5c5c] hover:text-[#141414]"}`}
                    >Select users</button>
                    <button
                        onClick={() => setActiveBulkTab("history")}
                        className={`pb-[12px] font-sans text-[14px] font-bold tracking-[0.05em] uppercase ${activeBulkTab === "history" ? "border-b-[2px] border-[#c99b2e] text-[#141414]" : "text-[#5c5c5c] hover:text-[#141414]"}`}
                    >History</button>
                  </div>

                  {activeBulkTab === "upload" && (
                    <>
                      <div className={`bg-[#fff] border border-[#1111111a] rounded-[14px] shadow-[0_4px_16px_-4px_rgba(42,17,8,0.1)] transition-all duration-200 ${previewRows.length > 0 ? "opacity-50 pointer-events-none" : ""}`}>
                        <div className="flex justify-between items-center px-[24px] py-[16px] border-b border-[#1111111a]">
                          <span className="font-sans text-[12px] font-bold tracking-[0.08em] uppercase text-[#5c5c5c]">Bulk Import Users</span>
                          <span className="font-sans text-[12px] font-bold tracking-[0.08em] uppercase text-[#8c8c8c]">Import Data with Preview</span>
                        </div>
                        <div className="p-[24px]">
                          <label className="cursor-pointer block border border-dashed border-[#11111129] rounded-[8px] bg-[#F6F6F4] p-[28px] text-center hover:bg-[#efefef] transition-colors">
                            <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                            <div className="flex flex-col items-center justify-center">
                              <Icon size={24} className="text-[#5c5c5c] mb-[16px]"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></Icon>
                              <p className="font-sans text-[14px] text-[#5c5c5c] m-0 mb-[8px]">Drop a CSV / Excel file here, or click to browse</p>
                              <p className="font-sans text-[12px] text-[#8c8c8c] m-0">Columns: first name, last name, email, mobile, job title, role</p>
                            </div>
                          </label>
                          <div className="mt-[20px]">
                            <button onClick={downloadSampleCSV} className="inline-flex items-center gap-[8px] font-sans text-[14px] font-medium text-[#9A7222] hover:underline">
                              <Icon size={16}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></Icon>
                              Download CSV template
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="bg-[#fff] border border-[#1111111a] rounded-[14px] shadow-[0_4px_16px_-4px_rgba(42,17,8,0.1)] overflow-hidden transition-all duration-200 mt-[24px]">
                        <div className="flex justify-between items-center px-[28px] py-[18px] pb-[16px]">
                          <span className="font-sans text-[12px] tracking-[0.14em] uppercase text-[#141414] font-bold">Preview</span>
                          <span className="font-sans text-[10px] tracking-[0.1em] uppercase text-[#8c8c8c] font-semibold">{previewRows.length} rows detected</span>
                        </div>
                        <div className="border-t border-[#1111111a] overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                              <thead className="bg-[#f6f6f4] border-b border-[#1111111a]">
                                <tr>
                                  <th className="px-[16px] py-[12px] font-sans text-[12px] font-bold uppercase tracking-[0.05em] text-[#5c5c5c]">Row</th>
                                  <th className="px-[16px] py-[12px] font-sans text-[12px] font-bold uppercase tracking-[0.05em] text-[#5c5c5c]">Email</th>
                                  <th className="px-[16px] py-[12px] font-sans text-[12px] font-bold uppercase tracking-[0.05em] text-[#5c5c5c]">First Name</th>
                                  <th className="px-[16px] py-[12px] font-sans text-[12px] font-bold uppercase tracking-[0.05em] text-[#5c5c5c]">Last Name</th>
                                  <th className="px-[16px] py-[12px] font-sans text-[12px] font-bold uppercase tracking-[0.05em] text-[#5c5c5c]">Role</th>
                                  <th className="px-[16px] py-[12px] font-sans text-[12px] font-bold uppercase tracking-[0.05em] text-[#5c5c5c]">Course / Path</th>
                                  <th className="px-[16px] py-[12px] font-sans text-[12px] font-bold uppercase tracking-[0.05em] text-[#5c5c5c]">Due Date</th>
                                  <th className="px-[16px] py-[12px] font-sans text-[12px] font-bold uppercase tracking-[0.05em] text-[#5c5c5c]">Status</th>
                                  <th className="px-[16px] py-[12px] w-[40px]"></th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#1111111a]">
                                {previewRows.map((item) => (
                                  <tr key={item.row} className="hover:bg-[#f6f6f4]">
                                    <td className="px-[16px] py-[12px] font-sans text-[14px] font-medium text-[#5c5c5c]">{item.row}</td>
                                    <td className="px-[16px] py-[12px] font-sans text-[14px] text-[#141414]">{item.email}</td>
                                    <td className="px-[16px] py-[12px] font-sans text-[14px] font-bold text-[#141414]">{item.firstName}</td>
                                    <td className="px-[16px] py-[12px] font-sans text-[14px] font-bold text-[#141414]">{item.lastName}</td>
                                    <td className="px-[16px] py-[12px] font-sans text-[14px] text-[#5c5c5c]">{item.roleName}</td>
                                    <td className="px-[16px] py-[12px] font-sans text-[14px] text-[#5c5c5c] max-w-[160px] truncate" title={[item.courseNames, item.careerPathNames].filter(Boolean).join(' | ')}>
                                      {item.courseNames || item.careerPathNames
                                        ? [item.courseNames, item.careerPathNames].filter(Boolean).join(' | ')
                                        : <span className="text-[#bbb]">—</span>}
                                    </td>
                                    <td className="px-[16px] py-[12px] font-sans text-[14px] text-[#5c5c5c]">
                                      {item.dueDate || <span className="text-[#bbb]">—</span>}
                                    </td>
                                    <td className="px-[16px] py-[12px]">
                                      <span className={`inline-block px-[8px] py-[4px] rounded-full text-[12px] font-semibold border ${getStatusStyles(item.status)}`}>{item.status}</span>
                                    </td>
                                    <td className="px-[16px] py-[12px] text-right">
                                      <button 
                                        onClick={() => {
                                          setPreviewRows(prev => {
                                            const updated = prev.filter(r => r.row !== item.row);
                                            setValidUsers(updated.filter((r: any) => r.status === "Valid").map((r: any) => ({
                                              email: r.email,
                                              firstName: r.firstName,
                                              lastName: r.lastName,
                                              roleName: r.roleName,
                                              departmentName: r.departmentName,
                                              courseNames: r.courseNames,
                                              careerPathNames: r.careerPathNames,
                                              dueDate: r.dueDate,
                                            })));
                                            return updated;
                                          });
                                        }}
                                        className="text-[#8c8c8c] hover:text-[#141414] transition-colors"
                                      >
                                        <Icon size={16}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></Icon>
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                                {previewRows.length === 0 && (
                                  <tr>
                                    <td colSpan={9} className="px-[16px] py-[32px] text-center font-sans text-[14px] text-[#5c5c5c]">No data to preview. Upload a CSV file first.</td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                        {previewRows.length > 0 && (
                          <div className="p-[16px] flex items-center gap-[16px] bg-[#f6f6f4] border-t border-[#1111111a]">
                            <button onClick={() => { setPreviewRows([]); setValidUsers([]); }} className="font-sans text-[14px] font-bold text-[#141414] bg-none border border-[#11111129] px-[16px] py-[8px] rounded-[8px] hover:bg-[#fff]">Clear</button>
                            <span className="font-sans text-[14px] text-[#3a3a3a]">{validCount} valid users ready</span>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                  
                  {activeBulkTab === 'select_groups' && (
                    <div className="flex flex-col gap-[24px] pb-[100px]">
                      {/* Group Selection Area with Info Card */}
                      <div className="grid grid-cols-[1fr_320px] gap-[24px] mb-[32px] items-start">
                        <div className="flex flex-col gap-[24px]">
                          <div className="flex flex-col">
                            <div className="mb-[12px] px-[4px]">
                          <span className="font-sans text-[12px] font-bold tracking-[0.08em] uppercase text-[#5c5c5c]">Group Selection</span>
                        </div>
                        <div className="bg-[#fff] border border-[#11111129] rounded-[8px] overflow-hidden">
                          <div className="relative border-b border-[#1111111a] bg-[#fff]">
                            <div className="absolute left-[16px] top-1/2 -translate-y-1/2 text-[#8c8c8c]">
                              <Icon size={16}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></Icon>
                            </div>
                            <input 
                              type="text" 
                              placeholder="Search groups..." 
                              value={groupSearchTerm}
                              onChange={e => setGroupSearchTerm(e.target.value)}
                              className="w-full h-[52px] pl-[44px] pr-[16px] bg-transparent outline-none font-sans text-[15px] text-[#141414] placeholder:text-[#8c8c8c]"
                            />
                          </div>
                          
                          <div className="overflow-hidden">
                            <div className="max-h-[300px] overflow-y-auto">
                              {groups.filter(g => g.name.toLowerCase().includes(groupSearchTerm.toLowerCase())).map((group) => {
                                const isSelected = group.id ? selectedGroupIds.includes(group.id) : false;
                                return (
                                  <label key={group.id} className="flex items-center justify-between px-[16px] py-[14px] border-b border-[#1111111a] last:border-0 hover:bg-[#f6f6f4] cursor-pointer transition-colors">
                                    <div className="flex items-center gap-[12px]">
                                      <div className={`w-[18px] h-[18px] rounded-[4px] border flex items-center justify-center transition-colors ${isSelected ? "bg-[#15803d] border-[#15803d]" : "bg-[#fff] border-[#11111129]"}`}>
                                        {isSelected && <Icon size={12} className="text-[#fff]"><polyline points="20 6 9 17 4 12"/></Icon>}
                                      </div>
                                      <span className="font-sans text-[15px] text-[#141414]">{group.name}</span>
                                    </div>
                                    <span className="font-sans text-[13px] text-[#8c8c8c]">{group.userIds?.length || 0} users</span>
                                    <input type="checkbox" className="hidden" checked={isSelected} onChange={(e) => {
                                      if (e.target.checked) {
                                        if (group.id) setSelectedGroupIds([...selectedGroupIds, group.id]);
                                      } else {
                                        setSelectedGroupIds(selectedGroupIds.filter(id => id !== group.id));
                                      }
                                    }} />
                                  </label>
                                );
                              })}
                            </div>
                            <div className="bg-[#F6F6F4] border-t border-[#1111111a] px-[16px] py-[12px] flex justify-between items-center">
                              <span className="font-sans text-[13px] text-[#5c5c5c]">{selectedGroupIds.length} groups selected · {groupUsers.length} users</span>
                              <button onClick={() => {
                                if (selectedGroupIds.length === groups.length) {
                                  setSelectedGroupIds([]);
                                } else {
                                  setSelectedGroupIds(groups.map(g => g.id).filter((id): id is string => !!id));
                                }
                              }} className="font-sans text-[13px] font-semibold text-[#9A7222] hover:underline">
                                {selectedGroupIds.length === groups.length ? "Deselect all" : "Select all"}
                              </button>
                            </div>
                          </div>
                        </div>
                        </div>

                      {/* Users Preview Table */}
                      <div className="flex flex-col gap-[12px]">
                        <div className="flex justify-between items-end px-[4px]">
                          <span className="font-sans text-[15px] font-bold text-[#141414]">Users in selected groups</span>
                          <span className="font-sans text-[12px] font-bold tracking-[0.08em] uppercase text-[#8c8c8c]">{groupUsers.length} USERS</span>
                        </div>
                        
                        <div className="bg-[#fff] border border-[#1111111a] rounded-[12px] overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                              <thead className="bg-[#F6F6F4] border-b border-[#1111111a]">
                                <tr>
                                  <th className="px-[24px] py-[14px] font-sans text-[11px] font-bold uppercase tracking-[0.08em] text-[#8c8c8c]">Name <span className="ml-[2px]">↕</span></th>
                                  <th className="px-[24px] py-[14px] font-sans text-[11px] font-bold uppercase tracking-[0.08em] text-[#8c8c8c]">Email <span className="ml-[2px]">↕</span></th>
                                  <th className="px-[24px] py-[14px] font-sans text-[11px] font-bold uppercase tracking-[0.08em] text-[#8c8c8c]">Group <span className="ml-[2px]">↕</span></th>
                                  <th className="px-[24px] py-[14px] font-sans text-[11px] font-bold uppercase tracking-[0.08em] text-[#8c8c8c]">Status <span className="ml-[2px]">↕</span></th>
                                </tr>
                              </thead>
                            <tbody className="divide-y divide-[#1111111a]">
                              {groupUsersLoading ? (
                                <tr>
                                  <td colSpan={4} className="px-[24px] py-[32px] text-center font-sans text-[14px] text-[#5c5c5c]">Loading users...</td>
                                </tr>
                              ) : groupUsers.length === 0 ? (
                                <tr>
                                  <td colSpan={4} className="px-[24px] py-[32px] text-center font-sans text-[14px] text-[#5c5c5c]">No users found. Select a group above.</td>
                                </tr>
                              ) : (
                                groupUsers.map((user, idx) => (
                                  <tr key={idx} className="hover:bg-[#f6f6f4]">
                                    <td className="px-[24px] py-[16px] font-sans text-[14px] text-[#141414]">{user.firstName} {user.lastName}</td>
                                    <td className="px-[24px] py-[16px] font-sans text-[14px] text-[#5c5c5c]">{user.email}</td>
                                    <td className="px-[24px] py-[16px] font-sans text-[14px] text-[#5c5c5c]">{user.groupName}</td>
                                    <td className="px-[24px] py-[16px]">
                                      <span className={`inline-flex items-center gap-[6px] px-[10px] py-[4px] rounded-full text-[12px] font-semibold bg-[#e8f3ec] text-[#2e7d32]`}>
                                        <div className="w-[6px] h-[6px] rounded-full bg-[#2e7d32]"></div>
                                        {user.status}
                                      </span>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      </div>
                      
                      {groupUsers.length > 0 && (
                        <div className="px-[4px] mt-[4px]">
                          <span className="font-sans text-[14px] text-[#5c5c5c]">Showing {groupUsers.length} users. 1 already invited.</span>
                        </div>
                      )}
                      
                      {/* Send Invites Bar */}
                      <div className="bg-[#fff] border border-[#1111111a] rounded-[12px] p-[20px] px-[24px] flex items-center justify-between mt-[16px]">
                        <div className="font-sans text-[16px] text-[#5c5c5c]">
                          <strong className="text-[#141414] font-semibold">{groupUsers.length} users</strong> eligible to invite
                        </div>
                        <button 
                          disabled={groupUsers.length === 0}
                          onClick={() => toast.success(`Invites sent to ${groupUsers.length} users!`)}
                          className={`inline-flex items-center gap-[8px] font-sans text-[15px] font-bold px-[24px] py-[12px] rounded-[24px] border-[1px] transition-all ${
                            groupUsers.length === 0 
                              ? "bg-[#f6f6f4] text-[#8c8c8c] border-[#1111111a] cursor-not-allowed" 
                              : "bg-[#FCF7AE] text-[#141414] border-[#c99b2e40] hover:bg-[#ebd85b] hover:-translate-y-[1px]"
                          }`}
                        >
                          Send invites ({groupUsers.length})
                          <Icon size={16}><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></Icon>
                        </button>
                      </div>
                      </div>
                      
                      {/* Right Info Card */}
                      <div className="bg-[#fff] border border-[#1111111a] rounded-[12px] overflow-hidden shadow-sm">
                        <div className="px-[20px] py-[16px] border-b border-[#1111111a]">
                          <span className="font-sans text-[15px] font-bold text-[#141414]">Group invite</span>
                        </div>
                        <div className="p-[20px] flex flex-col gap-[16px]">
                          <p className="font-sans text-[14px] text-[#5c5c5c] leading-[1.6] m-0">
                            Select one or more groups. All users in selected groups will be invited. Users already on the platform are excluded automatically.
                          </p>
                          <p className="font-sans text-[14px] text-[#5c5c5c] leading-[1.6] m-0">
                            Groups are sourced from your corporate identity provider.
                          </p>
                        </div>
                      </div>
                    </div>
                    </div>
                  )}

                  {activeBulkTab === 'select_users' && (
                    <div className="grid grid-cols-[1fr_320px] gap-[24px] mb-[32px] items-start">
                      <div className="flex flex-col">
                        <div className="mb-[12px] px-[4px]">
                          <span className="font-sans text-[12px] font-bold tracking-[0.08em] uppercase text-[#5c5c5c]">USER SEARCH</span>
                        </div>
                        <div className="bg-[#fff] border border-[#11111129] rounded-[8px] overflow-hidden">
                          <div className="relative border-b border-[#1111111a] bg-[#fff]">
                            <div className="absolute left-[16px] top-1/2 -translate-y-1/2 text-[#8c8c8c]">
                              <Icon size={16}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></Icon>
                            </div>
                            <input 
                              type="text" 
                              placeholder="Search by name, email, or identifier..." 
                              value={userSearchTerm}
                              onChange={e => setUserSearchTerm(e.target.value)}
                              className="w-full h-[52px] pl-[44px] pr-[16px] bg-transparent outline-none font-sans text-[15px] text-[#141414] placeholder:text-[#8c8c8c]"
                            />
                          </div>
                          
                          <div className="overflow-hidden">
                            <div className="max-h-[300px] overflow-y-auto">
                              {tenantUsersLoading ? (
                                <div className="px-[24px] py-[32px] text-center font-sans text-[14px] text-[#5c5c5c]">Loading users...</div>
                              ) : (
                                tenantUsers.filter(u => 
                                  `${u.firstName} ${u.lastName}`.toLowerCase().includes(userSearchTerm.toLowerCase()) || 
                                  u.email.toLowerCase().includes(userSearchTerm.toLowerCase())
                                ).map((user) => {
                                  const isSelected = selectedUserIds.includes(user.id);
                                  return (
                                    <label key={user.id} className="flex items-center gap-[16px] px-[16px] py-[16px] border-b border-[#1111111a] last:border-0 hover:bg-[#f6f6f4] cursor-pointer transition-colors">
                                      <div className={`flex-shrink-0 w-[18px] h-[18px] rounded-[4px] border flex items-center justify-center transition-colors ${isSelected ? "bg-[#15803d] border-[#15803d]" : "bg-[#fff] border-[#11111129]"}`}>
                                        {isSelected && <Icon size={12} className="text-[#fff]"><polyline points="20 6 9 17 4 12"/></Icon>}
                                      </div>
                                      
                                      <div className="flex items-center gap-[12px] flex-1">
                                        <div className="w-[32px] h-[32px] rounded-full bg-[#f6e8c4] border border-[#c99b2e33] flex items-center justify-center font-sans text-[12px] font-bold text-[#755a12] flex-shrink-0">
                                          {getInitials(user.firstName, user.lastName)}
                                        </div>
                                        <div className="flex flex-col">
                                          <span className="font-sans text-[14px] font-bold text-[#141414] leading-[1.2]">{user.firstName} {user.lastName}</span>
                                          <span className="font-sans text-[13px] text-[#8c8c8c] mt-[2px]">{user.email}</span>
                                        </div>
                                      </div>
                                      <input type="checkbox" className="hidden" checked={isSelected} onChange={(e) => {
                                        if (e.target.checked) {
                                          setSelectedUserIds([...selectedUserIds, user.id]);
                                        } else {
                                          setSelectedUserIds(selectedUserIds.filter(id => id !== user.id));
                                        }
                                      }} />
                                    </label>
                                  );
                                })
                              )}
                            </div>
                            <div className="bg-[#F6F6F4] border-t border-[#1111111a] px-[20px] py-[16px] flex justify-between items-center">
                              <span className="font-sans text-[14px] text-[#5c5c5c]">{selectedUserIds.length} users selected</span>
                              <button 
                                onClick={() => toast.success(`Invites sent to ${selectedUserIds.length} users!`)}
                                className="inline-flex items-center gap-[8px] bg-[#FCF7AE] text-[#141414] font-sans text-[14px] font-bold px-[20px] py-[10px] rounded-full border-[1.5px] border-[#c99b2e8c] shadow-[0_2px_8px_-2px_rgba(42,17,8,0.12)] hover:bg-[#ebd85b] hover:-translate-y-[1px] transition-all"
                              >
                                Send invites ({selectedUserIds.length})
                                <Icon size={14}><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></Icon>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Right Info Card */}
                      <div className="bg-[#fff] border border-[#1111111a] rounded-[12px] overflow-hidden shadow-sm">
                        <div className="px-[20px] py-[16px] border-b border-[#1111111a]">
                          <span className="font-sans text-[15px] font-bold text-[#141414]">User selection</span>
                        </div>
                        <div className="p-[20px] flex flex-col gap-[16px]">
                          <p className="font-sans text-[14px] text-[#5c5c5c] leading-[1.6] m-0">
                            Search for individual users by name, email, or other identifiers. Select multiple users simultaneously.
                          </p>
                          <p className="font-sans text-[14px] text-[#5c5c5c] leading-[1.6] m-0">
                            User directory is sourced from your corporate identity provider.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeBulkTab === 'history' && (
                    <div className="bg-[#fff] border border-[#1111111a] rounded-[14px] shadow-[0_4px_16px_-4px_rgba(42,17,8,0.1)] overflow-hidden transition-all duration-200">
                      <div className="flex justify-between items-center px-[28px] py-[18px] pb-[16px] border-b border-[#1111111a]">
                        <span className="font-sans text-[12px] tracking-[0.14em] uppercase text-[#141414] font-bold">Bulk Invite History</span>
                        <button onClick={fetchInviteHistory} className="font-sans text-[14px] font-bold text-[#b8523e] hover:underline">{historyLoading ? "Refreshing..." : "↻ Refresh"}</button>
                      </div>
                      {historyError && <div className="px-[24px] py-[12px] bg-red-50 border-b border-red-100 font-sans text-[14px] text-red-700">{historyError}</div>}
                      {historyLoading ? (
                        <div className="px-[24px] py-[32px] text-center font-sans text-[14px] text-[#5c5c5c]">Loading...</div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead className="bg-[#f6f6f4] border-b border-[#1111111a]">
                              <tr>
                                <th className="px-[16px] py-[12px] font-sans text-[14px] font-bold uppercase tracking-[0.05em] text-[#5c5c5c]">Date</th>
                                <th className="px-[16px] py-[12px] font-sans text-[14px] font-bold uppercase tracking-[0.05em] text-[#5c5c5c]">Email</th>
                                <th className="px-[16px] py-[12px] font-sans text-[14px] font-bold uppercase tracking-[0.05em] text-[#5c5c5c]">Expires At</th>
                                <th className="px-[16px] py-[12px] font-sans text-[14px] font-bold uppercase tracking-[0.05em] text-[#5c5c5c] text-center">Resend Count</th>
                                <th className="px-[16px] py-[12px] font-sans text-[14px] font-bold uppercase tracking-[0.05em] text-[#5c5c5c]">Status</th>
                                <th className="px-[16px] py-[12px] font-sans text-[14px] font-bold uppercase tracking-[0.05em] text-[#5c5c5c] text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#1111111a]">
                              {inviteHistory.length > 0 ? (() => {
                                const latestByEmail = new Map<string, string>();
                                inviteHistory.forEach((inv: any) => {
                                  const email = (inv.user?.email || inv.email || "").toLowerCase().trim();
                                  if (email) {
                                    const existingLatest = latestByEmail.get(email);
                                    if (!existingLatest) {
                                      latestByEmail.set(email, inv.id);
                                    } else {
                                      const currentItem = inviteHistory.find((i: any) => i.id === existingLatest);
                                      const currentCreatedAt = currentItem?.createdAt ? new Date(currentItem.createdAt).getTime() : 0;
                                      const invCreatedAt = inv.createdAt ? new Date(inv.createdAt).getTime() : 0;
                                      if (invCreatedAt > currentCreatedAt) {
                                        latestByEmail.set(email, inv.id);
                                      }
                                    }
                                  }
                                });

                                return inviteHistory.map((inv: any) => {
                                  let status = "Pending";
                                  if (inv.user?.status) status = (inv.user.status === "ACTIVE" || inv.user.status === "Active") ? "Active" : "Inactive";
                                  else if (inv.used) status = "Completed";
                                  else if (inv.expiresAt && new Date(inv.expiresAt).getTime() < Date.now()) status = "Expired";
                                  
                                  const email = (inv.user?.email || inv.email || "").toLowerCase().trim();
                                  const isLatest = email ? latestByEmail.get(email) === inv.id : true;
                                  return (
                                    <tr key={inv.id} className="hover:bg-[#f6f6f4]">
                                      <td className="px-[16px] py-[12px] font-sans text-[14px] text-[#5c5c5c]">{inv.createdAt ? new Date(inv.createdAt).toLocaleString() : "—"}</td>
                                    <td className="px-[16px] py-[12px] font-sans text-[14px] font-bold text-[#141414]">{inv.user?.email || inv.email || "—"}</td>
                                    <td className="px-[16px] py-[12px] font-sans text-[14px] text-[#5c5c5c]">{inv.expiresAt ? new Date(inv.expiresAt).toLocaleString() : "—"}</td>
                                    <td className="px-[16px] py-[12px] font-sans text-[14px] font-medium text-[#141414] text-center">{inv.resendCount || 0}</td>
                                    <td className="px-[16px] py-[12px]"><span className={`inline-block px-[8px] py-[4px] rounded-full text-[12px] font-semibold border ${getStatusStyles(status)}`}>{status}</span></td>
                                    <td className="px-[16px] py-[12px] text-right">
                                      {(inv.status === "PENDING" || inv.status === "EXPIRED" || status === "Pending" || status === "Expired") && (
                                          <div className="flex justify-end gap-[8px]">
                                            {(() => {
                                                const maxResends = config?.maxInvitationsPerUser ?? 10;
                                                const cooldownMinutes = config?.invitationResendCooldown ?? 60;
                                                const cooldownMs = cooldownMinutes * 60 * 1000;
                                                let isCooldownActive = false;
                                                const lastSentTime = inv.lastResentAt || inv.sentAt || inv.createdAt;
                                                if (lastSentTime) {
                                                    const elapsed = now - new Date(lastSentTime).getTime();
                                                    if (elapsed < cooldownMs) isCooldownActive = true;
                                                }
                                                const isMaxReached = inv.resendCount >= maxResends;
                                                return (
                                                  <button 
                                                    onClick={() => handleResend(inv.id)} 
                                                    disabled={!isLatest || resendLoadingId === inv.id || isMaxReached || isCooldownActive} 
                                                    className="px-[12px] py-[4px] font-sans text-[12px] font-medium text-[#b8523e] border border-[#b8523e] rounded-[4px] hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    title={!isLatest ? "A newer invitation exists for this email" : ""}
                                                  >
                                                    {resendLoadingId === inv.id ? "..." : "Resend"}
                                                  </button>
                                                )
                                            })()}
                                            {(inv.status === "PENDING" || status === "Pending") && (
                                                <button onClick={() => handleCancelClick(inv)} className="px-[12px] py-[4px] font-sans text-[12px] font-medium text-[#141414] border border-[#11111129] rounded-[4px] hover:bg-[#f6f6f4]">Cancel</button>
                                            )}
                                          </div>
                                      )}
                                    </td>
                                  </tr>
                                );
                              });
                              })() : (
                                <tr><td colSpan={6} className="px-[16px] py-[32px] text-center font-sans text-[14px] text-[#5c5c5c]">No invitations found</td></tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

            </div>

            {/* Save Bar / Summary Panel (Sticky Rail) */}
            {showSummary && (
            <aside className="flex flex-col gap-[16px] sticky top-[84px]">
              <div className="bg-[#fff] border border-[#1111111a] rounded-[14px] p-[18px] px-[20px]">
                <h3 className="font-sans text-[12px] font-bold tracking-[0.12em] uppercase text-[#5c5c5c] mb-[14px] m-0">Summary</h3>
                <dl className="flex flex-col gap-[12px] m-0">
                  <div className="flex flex-col gap-[3px]">
                    <dt className="font-sans text-[12px] font-bold tracking-[0.08em] uppercase text-[#5c5c5c]">Mode</dt>
                    <dd className="font-sans text-[16px] text-[#141414] m-0">{mode === 'single' ? 'Single user' : 'Bulk import'}</dd>
                  </div>
                  {mode === 'single' ? (
                    <div className="flex flex-col gap-[3px]">
                      <dt className="font-sans text-[12px] font-bold tracking-[0.08em] uppercase text-[#5c5c5c]">Name</dt>
                      <dd className={`font-sans text-[16px] m-0 ${(form.firstName || form.lastName) ? 'text-[#141414]' : 'text-[#8c8c8c]'}`}>{(form.firstName || form.lastName) ? `${form.firstName} ${form.lastName}`.trim() : 'Not set'}</dd>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-[3px]">
                      <dt className="font-sans text-[12px] font-bold tracking-[0.08em] uppercase text-[#5c5c5c]">Users</dt>
                      <dd className="font-sans text-[16px] text-[#141414] m-0">{validCount} ready to invite</dd>
                    </div>
                  )}
                  {mode === 'single' && (
                    <div className="flex flex-col gap-[3px]">
                      <dt className="font-sans text-[12px] font-bold tracking-[0.08em] uppercase text-[#5c5c5c]">Role</dt>
                      <dd className="font-sans text-[16px] text-[#141414] m-0">Corporate User</dd>
                    </div>
                  )}
                </dl>
              </div>

              <div className="flex flex-col gap-[10px]">
                {mode === 'single' ? (
                  <button onClick={handleSingleSubmit} disabled={loading || !isFormValid} className="w-full inline-flex items-center justify-center gap-[8px] px-[18px] py-[11px] bg-[#FCF7AE] text-[#141414] font-sans text-[16px] font-bold rounded-full border-[1.5px] border-[#c99b2e8c] shadow-[0_4px_16px_-4px_rgba(42,17,8,0.12)] transition-all hover:bg-[#ebd85b] hover:-translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed">
                    {loading ? (
                      <>
                        <svg className="animate-spin h-[18px] w-[18px] text-[#141414] flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Creating…
                      </>
                    ) : "Create & send invite"}
                  </button>
                ) : (
                  !showHistory && (
                    <button onClick={handleSendInvites} disabled={loading || validUsers.length === 0} className="w-full inline-flex items-center justify-center gap-[8px] px-[18px] py-[11px] bg-[#FCF7AE] text-[#141414] font-sans text-[16px] font-bold rounded-full border-[1.5px] border-[#c99b2e8c] shadow-[0_4px_16px_-4px_rgba(42,17,8,0.12)] transition-all hover:bg-[#ebd85b] hover:-translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed">
                      {loading ? (
                        <>
                          <svg className="animate-spin h-[18px] w-[18px] text-[#141414] flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Sending…
                        </>
                      ) : "Create & send invites"}
                    </button>
                  )
                )}
                <button onClick={() => navigate("/manage-roles")} className="w-full inline-flex items-center justify-center gap-[8px] px-[18px] py-[11px] bg-[#fff] text-[#141414] font-sans text-[16px] font-bold rounded-full border-[1.5px] border-[#11111129] transition-all hover:bg-[#f6f6f4]">
                  Cancel
                </button>
              </div>
            </aside>
            )}
          </div>
        </div>
      </main>

      {showCancelModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#141414]/50">
          <div className="w-full max-w-md bg-[#fff] border border-[#1111111a] rounded-[14px] p-[24px] shadow-[0_24px_48px_-16px_rgba(42,17,8,0.1)]">
            <h3 className="font-sans text-[18px] font-bold text-[#141414] m-0">Cancel Invitation?</h3>
            <p className="mt-[8px] font-sans text-[16px] text-[#5c5c5c] m-0">
              Are you sure you want to cancel the invitation for <strong className="text-[#141414]">{invitationToCancel?.email || invitationToCancel?.user?.email}</strong>?
            </p>
            <div className="mt-[16px] font-sans text-[14px] text-[#141414] bg-[#f6f6f4] p-[12px] rounded-[8px] border border-[#1111111a]">
              <strong>Resend Count:</strong> {invitationToCancel?.resendCount ?? 0} / {config?.maxInvitationsPerUser ?? 10}
            </div>
            <div className="mt-[16px]">
              <label className="block font-sans text-[14px] font-bold text-[#141414] mb-[4px]">Type <strong>delete</strong> to confirm and reset resend count:</label>
              <input type="text" value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} placeholder="delete" className="w-full h-[40px] px-[14px] font-sans text-[16px] text-[#141414] bg-[#fff] border border-[#11111129] rounded-[8px] focus:border-[#5c5c5c] focus:outline-none focus:ring-[4px] focus:ring-[#1111110d] transition-all" />
            </div>
            <div className="mt-[24px] flex justify-end gap-[12px]">
              <button onClick={() => { setShowCancelModal(false); setInvitationToCancel(null); setDeleteConfirmText(""); }} className="px-[16px] py-[8px] font-sans text-[14px] font-bold text-[#141414] bg-[#fff] border-[1.5px] border-[#11111129] rounded-full hover:bg-[#f6f6f4]">Close</button>
              <button onClick={confirmCancel} disabled={cancelLoading || deleteConfirmText !== "delete"} className="px-[16px] py-[8px] font-sans text-[14px] font-bold text-[#fff] bg-[#c12a1c] rounded-full hover:bg-red-700 disabled:opacity-50">{cancelLoading ? "Cancelling..." : "Yes, Cancel"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CreateTenantUser;