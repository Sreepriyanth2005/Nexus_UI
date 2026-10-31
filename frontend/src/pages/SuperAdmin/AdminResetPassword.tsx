import React, { useState } from "react";
import { Search, Info, Eye, X, ChevronDown } from "../../assets/icons";
import { Loader2, EyeOff } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "../../components/ui/Skeleton/Skeleton";
import { getInternalUsers, resetInternalUserPassword, activateInternalUser, deactivateInternalUser, suspendInternalUser, InternalUser } from "../../core/api/internal-user/internalUser.api";
import { useSystemRoles } from "../../hooks/useRolesPermissions";
import { toast } from "sonner";

const AdminResetPassword = () => {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("All roles");
    const [selectedUser, setSelectedUser] = useState<InternalUser | null>(null);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { data: users = [], isLoading, isError } = useQuery({
        queryKey: ["internal-users-all"],
        queryFn: () => getInternalUsers({ limit: 1000 }),
    });

    const { data: systemRoles = [] } = useSystemRoles();

    const filteredUsers = React.useMemo(() => {
        return users.filter(user => {
            if (!user.roles || user.roles.length === 0) return false;
            
            const upperRoles = user.roles.map(r => r.toUpperCase());
            const adminRoles = systemRoles.length > 0
                ? systemRoles.map(r => typeof r === "string" ? r.toUpperCase() : (r as any).code?.toUpperCase() || "")
                : [
                    "SUPER_ADMIN",
                    "CONTENT_DEVELOPER",
                    "CONTENT DEVELOPER",
                    "SME",
                    "MEMBER",
                ];
            
            const isAdmin = upperRoles.some(r => adminRoles.includes(r));
            if (!isAdmin) return false;

            const matchesSearch =
                user.firstName.toLowerCase().includes(search.toLowerCase()) ||
                user.lastName.toLowerCase().includes(search.toLowerCase()) ||
                user.email.toLowerCase().includes(search.toLowerCase());

            const primaryRole = user.roles[0] || "";
            const matchesRole = roleFilter === "All roles" || primaryRole === roleFilter;

            return matchesSearch && matchesRole;
        });
    }, [users, systemRoles, search, roleFilter]);

    const resetPasswordMutation = useMutation({
        mutationFn: ({ id, password }: { id: string; password?: string }) => resetInternalUserPassword(id, password),
        onSuccess: () => {
            toast.success("Password reset successfully!");
            closeModal();
            queryClient.invalidateQueries({ queryKey: ["internal-users-all"] });
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || "Failed to reset password");
        }
    });

    const statusMutation = useMutation({
        mutationFn: async ({ id, status }: { id: string, status: string }) => {
            if (status === "ACTIVE") return activateInternalUser(id);
            if (status === "INACTIVE") return deactivateInternalUser(id);
            if (status === "SUSPENDED") return suspendInternalUser(id);
            throw new Error(`Status update to ${status} is not supported directly.`);
        },
        onSuccess: () => {
            toast.success("User status updated successfully!");
            queryClient.invalidateQueries({ queryKey: ["internal-users-all"] });
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || "Failed to update status");
        }
    });

    const handleStatusChange = (id: string, newStatus: string) => {
        statusMutation.mutate({ id, status: newStatus });
    };

    const calculatePasswordStrength = (pwd: string) => {
        if (!pwd) return 0;
        let score = 0;
        if (pwd.length >= 8) score += 1;
        if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score += 1;
        if (/[0-9]/.test(pwd)) score += 1;
        if (/[^A-Za-z0-9]/.test(pwd)) score += 1;
        return score;
    };
    const strengthScore = calculatePasswordStrength(newPassword);

    // --- Derived validation (placed after mutation so isPending is accessible) ---
    const passwordStrong = strengthScore === 4;
    const passwordsMatch = newPassword !== "" && confirmPassword !== "" && newPassword === confirmPassword;
    const confirmTouched = confirmPassword.length > 0;
    const confirmMismatch = confirmTouched && confirmPassword !== newPassword;
    const canSubmit = passwordStrong && passwordsMatch && !resetPasswordMutation.isPending;

    const openModal = (user: InternalUser) => {
        setSelectedUser(user);
        setNewPassword("");
        setConfirmPassword("");
        setShowNewPassword(false);
        setShowConfirmPassword(false);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setTimeout(() => setSelectedUser(null), 200);
    };

    const handleReset = () => {
        if (!selectedUser) return;
        if (!newPassword || newPassword !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }
        if (newPassword.length < 8) {
            toast.error("Password must be at least 8 characters");
            return;
        }
        resetPasswordMutation.mutate({ id: selectedUser.id, password: newPassword });
    };

    const generateStrongPassword = () => {
        const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
        const lower = 'abcdefghijkmnpqrstuvwxyz';
        const digits = '23456789';
        const special = '!@#$%^&*-_';
        const all = upper + lower + digits + special;
        let pwd = [
            upper[Math.floor(Math.random() * upper.length)],
            upper[Math.floor(Math.random() * upper.length)],
            lower[Math.floor(Math.random() * lower.length)],
            lower[Math.floor(Math.random() * lower.length)],
            digits[Math.floor(Math.random() * digits.length)],
            digits[Math.floor(Math.random() * digits.length)],
            special[Math.floor(Math.random() * special.length)],
        ];
        for (let i = pwd.length; i < 16; i++) {
            pwd.push(all[Math.floor(Math.random() * all.length)]);
        }
        const password = pwd.sort(() => Math.random() - 0.5).join('');
        setNewPassword(password);
        setConfirmPassword(password);
        setShowNewPassword(true);
        setShowConfirmPassword(true);
    };

    const formatRole = (role: string) => {
        if (role === "SUPER_ADMIN") return "Super Admin";
        if (role === "CONTENT_DEVELOPER") return "Content Developer";
        if (role === "SME") return "SME";
        if (role === "MEMBER") return "Member";
        
        return role
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    };

    const getRoleBadgeStyle = (role: string) => {
        const formatted = formatRole(role);
        switch (formatted) {
            case "Super Admin": return "bg-blue-950/40 text-blue-300 border-blue-500/30";
            case "Content Developer": return "bg-indigo-950/40 text-indigo-300 border-indigo-500/30";
            case "SME": return "bg-purple-950/40 text-purple-300 border-purple-500/30";
            case "Member": return "bg-emerald-950/40 text-emerald-300 border-emerald-500/30";
            default: return "bg-[var(--paper-2)] text-[var(--ink-soft)] border-[var(--line-strong)]";
        }
    };

    const formatTimeAgo = (dateStr?: string) => {
        if (!dateStr) return "Never";
        const date = new Date(dateStr);
        const diffInSeconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
        const diffInMinutes = Math.floor(diffInSeconds / 60);
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h ago`;
        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays}d ago`;
    };

    const rolesAvailable = Array.from(new Set(users.flatMap(u => u.roles))).filter(r => !["MEMBER", "VISITOR", "CORPORATE_USER"].includes(r.toUpperCase()));

    if (isLoading) {
        return (
            <div className="p-6 space-y-6 w-full">
                <div className="space-y-2 mb-8">
                    <Skeleton className="h-8 w-1/4 rounded-[var(--r-sm)]" />
                    <Skeleton className="h-4 w-1/3 rounded-[var(--r-sm)]" />
                </div>
                <Skeleton className="h-[400px] w-full rounded-xl" />
            </div>
        );
    }

    return (
        <>
            <div>
                {/* Header */}
                <div className="apr-page-head pt-[28px] px-4 md:px-[32px] pb-[20px] border-b border-[var(--line-strong)]">
                    <p className="text-[length:var(--fs-label)] font-[var(--fw-bold)] tracking-widest text-[var(--ink-mute)] uppercase mb-1.5 font-[family-name:var(--font-serif)]">ACCESS CONTROL</p>
                    <h1 className="text-[length:var(--fs-h1)] font-[800] text-[var(--ink)] mb-1.5 font-[family-name:var(--font-serif)]">Reset admin passwords</h1>
                    <p className="text-[length:var(--fs-body)] text-[var(--ink-mute)]">
                        Super Admin only. Set a new password for any admin or corporate admin account. All resets<br />
                        are written to the audit log.
                    </p>
                </div>

                <div className="apr-body py-[24px] px-4 md:px-[32px]">
                    {/* Main Content Area */}
                    <div className="border border-[var(--line-strong)] rounded-xl bg-[var(--paper)] shadow-sm overflow-hidden">
                        {/* Table Header Section */}
                        <div className="apr-card-head pt-[16px] px-4 md:px-[20px] pb-[12px] border-b border-[var(--line)] flex items-center justify-between">
                            <h2 className="text-[length:var(--fs-body)] font-[var(--fw-bold)] text-[var(--ink)] font-[family-name:var(--font-serif)]">Admin accounts</h2>
                            <div className="px-2.5 py-1 border border-[var(--line-strong)] rounded-full text-[length:var(--fs-label)] font-[var(--fw-semibold)] text-[var(--ink-soft)] font-[family-name:var(--font-serif)]">
                                {filteredUsers.length} accounts
                            </div>
                        </div>
                        <div className="apr-card-body pt-[18px] px-4 md:px-[20px] pb-[20px]">
                            {/* Filters */}
                            <div className="apr-search-row mb-[20px] flex flex-col md:flex-row gap-4">
                                <div className="relative flex-1">

                                    <input
                                        type="text"
                                        placeholder="Search by name or email"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="w-full px-[14px] h-[40px] text-[length:var(--fs-meta)] text-[var(--ink)] border border-[var(--line-strong)] rounded-[var(--r-md)] transition-all focus:outline-none focus:border-[var(--ink-mute)] focus:ring-0 focus:shadow-[0_0_0_4px_rgba(42,17,8,0.04)]"
                                    />
                                </div>
                                <div className="relative w-full md:w-48">
                                    <select
                                        value={roleFilter}
                                        onChange={(e) => setRoleFilter(e.target.value)}
                                        className="w-full pl-[14px] pr-[36px] h-[40px] text-[length:var(--fs-meta)] text-[var(--ink)] border border-[var(--line-strong)] rounded-[var(--r-md)] transition-all focus:outline-none focus:border-[var(--honey)] focus:ring-0 focus:shadow-none appearance-none cursor-pointer"
                                    >
                                        <option value="All roles">All roles</option>
                                        {rolesAvailable.map(role => (
                                            <option key={role} value={role}>{formatRole(role)}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-[14px] top-1/2 -translate-y-1/2 text-[var(--ink-mute)] pointer-events-none" width={16} height={16} />
                                </div>
                            </div>

                            {/* Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr>
                                            <th className="pb-[10px] text-[length:var(--fs-label)] font-[var(--fw-semibold)] text-[var(--ink-mute)] uppercase tracking-wider border-b border-[var(--line)] whitespace-nowrap font-[family-name:var(--font-serif)]">ACCOUNT</th>
                                            <th className="pb-[10px] text-[length:var(--fs-label)] font-[var(--fw-semibold)] text-[var(--ink-mute)] uppercase tracking-wider border-b border-[var(--line)] whitespace-nowrap font-[family-name:var(--font-serif)] pl-4">ROLE</th>
                                            {/* <th className="pb-[10px] text-[length:var(--fs-label)] font-[var(--fw-semibold)] text-[var(--ink-mute)] uppercase tracking-wider border-b border-[var(--line)]">STATUS</th> */}
                                            {/* <th className="pb-[10px] text-[length:var(--fs-label)] font-[var(--fw-semibold)] text-[var(--ink-mute)] uppercase tracking-wider border-b border-[var(--line)]">PASSWORD</th> */}
                                            <th className="pb-[10px] text-[length:var(--fs-label)] font-[var(--fw-semibold)] text-[var(--ink-mute)] uppercase tracking-wider border-b border-[var(--line)] whitespace-nowrap font-[family-name:var(--font-serif)] pl-4">LAST LOGIN</th>
                                            <th className="pb-[10px] text-[length:var(--fs-label)] font-[var(--fw-semibold)] text-[var(--ink-mute)] uppercase tracking-wider border-b border-[var(--line)] text-right whitespace-nowrap pl-4">ACTION</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredUsers.length === 0 ? (
                                            <tr><td colSpan={6} className="px-6 py-8 text-center text-[length:var(--fs-meta)] text-[var(--ink-mute)] font-[family-name:var(--font-serif)]">No users found.</td></tr>
                                        ) : (
                                            filteredUsers.map((user, idx) => (
                                                <tr key={user.id} className={idx !== filteredUsers.length - 1 ? "border-b border-[var(--line)]" : ""}>
                                                    <td className="py-[14px] px-0 whitespace-nowrap">
                                                        <div className="flex flex-col">
                                                            <span className="text-[length:var(--fs-body)] font-[var(--fw-semibold)] text-[var(--ink)]">{user.firstName} {user.lastName}</span>
                                                            <span className="text-[length:var(--fs-meta)] text-[var(--ink-mute)] font-[family-name:var(--font-serif)]">{user.email}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-[14px] px-0 whitespace-nowrap pl-4">
                                                        {user.roles[0] ? (
                                                            <span className={`px-2.5 py-0.5 border rounded-full text-[length:var(--fs-label)] font-[600] font-[family-name:var(--font-serif)] ${getRoleBadgeStyle(user.roles[0])}`}>
                                                                {formatRole(user.roles[0])}
                                                            </span>
                                                        ) : (
                                                            <span className="text-[length:var(--fs-label)] text-[var(--ink-faint)] italic">—</span>
                                                        )}
                                                    </td>
                                                    {/* <td className="py-[14px] px-0">
                                                        <div className="flex items-center gap-2">
                                                            <select
                                                                value={user.status || "ACTIVE"}
                                                                onChange={(e) => handleStatusChange(user.id, e.target.value)}
                                                                disabled={statusMutation.isPending}
                                                                className={`px-2 py-1 text-[length:var(--fs-label)] font-[var(--fw-semibold)] rounded-md border outline-none focus:ring-1 cursor-pointer ${user.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700 border-emerald-200 focus:ring-emerald-300" :
                                                                    user.status === "INACTIVE" ? "bg-[var(--paper-2)] text-[var(--ink-soft)] border-[var(--line-strong)] focus:ring-[var(--line-strong)]" :
                                                                        user.status === "SUSPENDED" ? "bg-red-50 text-red-700 border-red-200 focus:ring-red-300" :
                                                                            "bg-[var(--paper)] text-[var(--ink-soft)] border-[var(--line-strong)] focus:ring-[var(--line-strong)]"
                                                                    }`}
                                                            >
                                                                <option value="ACTIVE" className="bg-[var(--paper)] text-[var(--ink)]">ACTIVE</option>
                                                                <option value="INACTIVE" className="bg-[var(--paper)] text-[var(--ink)]">INACTIVE</option>
                                                                <option value="SUSPENDED" className="bg-[var(--paper)] text-[var(--ink)]">SUSPENDED</option>
                                                                {user.status && !["ACTIVE", "INACTIVE", "SUSPENDED"].includes(user.status) && (
                                                                    <option value={user.status} className="bg-[var(--paper)] text-[var(--ink)]">{user.status}</option>
                                                                )}
                                                            </select>
                                                            {statusMutation.isPending && statusMutation.variables?.id === user.id && (
                                                                <Loader2 size={14} className="animate-spin text-[var(--ink-faint)]" />
                                                            )}
                                                        </div>
                                                    </td> */}
                                                    {/* <td className="py-[14px] px-0">
                                                        {user.keycloakInternalPassword ? (
                                                            <span
                                                                title={user.keycloakInternalPassword}
                                                                className="group inline-flex items-center gap-1 cursor-default"
                                                            >
                                                                <span className="text-[length:var(--fs-label)] font-mono text-[var(--ink-soft)] bg-[var(--paper-2)] border border-[var(--line-strong)] px-2 py-0.5 rounded-md tracking-widest select-all">
                                                                    {user.keycloakInternalPassword}
                                                                </span>
                                                            </span>
                                                        ) : (
                                                            <span className="text-[length:var(--fs-label)] text-[var(--ink-faint)] italic">—</span>
                                                        )}
                                                    </td> */}
                                                    <td className="py-[14px] px-0 whitespace-nowrap pl-4">
                                                        <span className="text-[length:var(--fs-meta)] text-[var(--ink-mute)] ">{formatTimeAgo(user.lastLogin)}</span>
                                                    </td>
                                                    <td className="py-[14px] px-0 text-right whitespace-nowrap pl-4">
                                                        <div className="flex items-center justify-end gap-3">
                                                            {user.keycloakInternalPassword && (
                                                                <span className="group inline-flex items-center gap-1 cursor-default" title="Current Password">
                                                                    <span className="text-[length:var(--fs-meta)] font-[family-name:var(--font-serif)] text-[var(--ink-deep)] bg-[var(--paper-2)] border border-[var(--line-strong)] px-2.5 py-1 rounded-md tracking-widest select-all">
                                                                        {user.keycloakInternalPassword}
                                                                    </span>
                                                                </span>
                                                            )}
                                                            <button
                                                                onClick={() => openModal(user)}
                                                                className="px-4 py-1.5 border border-[var(--line-strong)] rounded-full text-[length:var(--fs-meta)] font-[700] text-[var(--ink)] hover:border-[var(--ink-mute)] hover:bg-[var(--paper-2)] transition-all hover:-translate-y-0.5 cursor-pointer"
                                                            >
                                                                Reset password
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && selectedUser && (
                <div className="fixed inset-0 z-99999 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[var(--paper)] rounded-2xl shadow-xl w-full max-w-[440px] overflow-hidden">
                        {/* Modal Header */}
                        <div className="apr-modal-head pt-[22px] px-[26px] pb-[18px] border-b border-[var(--line)] flex justify-between items-start">
                            <div>
                                <h2 className="text-[length:var(--fs-body)] font-[var(--fw-bold)] text-[var(--ink)] font-[family-name:var(--font-sans)]">Set new password</h2>
                                <p className="text-[length:var(--fs-meta)] text-[var(--ink-mute)] mt-1 font-[family-name:var(--font-serif)]">
                                    {selectedUser.firstName} {selectedUser.lastName} ({selectedUser.email}) · {formatRole(selectedUser.roles[0] || "")}
                                </p>
                            </div>
                            <button onClick={closeModal} className="text-[var(--ink-faint)] hover:text-[var(--ink-soft)] transition p-0">
                                <X width={18} height={18} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={(e) => { e.preventDefault(); handleReset(); }}>
                            <input type="text" name="username" id="username" autoComplete="username" value={selectedUser?.email || ""} className="hidden" readOnly />
                            <div className="py-[22px] px-[26px]">
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="block text-[length:var(--fs-meta)] font-[var(--fw-semibold)] text-[var(--ink)]">New password</label>
                                            <button
                                                type="button"
                                                onClick={generateStrongPassword}
                                                className="text-[length:var(--fs-label)] font-[var(--fw-semibold)] text-[var(--c-honey-text)] hover:text-[var(--c-honey)] transition-colors"
                                            >
                                                Generate auto password
                                            </button>
                                        </div>
                                        <div className="relative">
                                            <input
                                                type={showNewPassword ? "text" : "password"}
                                                name="new-password"
                                                id="apr-new-pw"
                                                autoComplete="new-password"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                placeholder="Enter new password"
                                                className="apr-input bg-transparent w-full h-[40px] py-0 pl-[14px] pr-[44px] border border-[var(--line-strong)] rounded-xl text-[length:var(--fs-meta)] placeholder-[var(--ink-faint)] focus:outline-none focus:border-[var(--ink-mute)] focus:ring-1 focus:ring-[var(--ink-mute)]"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ink-faint)] hover:text-[var(--ink-soft)]"
                                            >
                                                {showNewPassword ? <EyeOff width={16} height={16} /> : <Eye width={16} height={16} />}
                                            </button>
                                        </div>
                                        <div className="flex gap-[6px] mt-2 mb-2 px-1">
                                            {[1, 2, 3, 4].map(level => (
                                                <div 
                                                    key={level} 
                                                    className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                                                        strengthScore >= level 
                                                            ? strengthScore < 2 ? "bg-red-400" : strengthScore < 4 ? "bg-yellow-400" : "bg-[var(--c-check)]"
                                                            : "bg-[var(--paper-2)]"
                                                    }`}
                                                ></div>
                                            ))}
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <p className="text-[length:var(--fs-label)] font-[var(--fw-semibold)] text-[var(--ink-mute)] ml-1">
                                                Minimum 8 characters, include uppercase and a number
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[length:var(--fs-meta)] font-[var(--fw-semibold)] text-[var(--ink)] mb-2 mt-2">Confirm password</label>
                                        <div className="relative">
                                            <input
                                                type={showConfirmPassword ? "text" : "password"}
                                                name="confirm-password"
                                                id="apr-confirm-pw"
                                                autoComplete="new-password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                placeholder="Re-enter new password"
                                                className={`apr-input bg-transparent w-full h-[40px] py-0 pl-[14px] pr-[44px] border rounded-xl text-[length:var(--fs-meta)] placeholder-[var(--ink-faint)] focus:outline-none focus:ring-1 transition ${confirmMismatch
                                                    ? "border-red-400 focus:border-red-400 focus:ring-red-300"
                                                    : "border-[var(--line-strong)] focus:border-[var(--ink-mute)] focus:ring-[var(--ink-mute)]"
                                                    }`}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ink-faint)] hover:text-[var(--ink-soft)]"
                                            >
                                                {showConfirmPassword ? <EyeOff width={16} height={16} /> : <Eye width={16} height={16} />}
                                            </button>
                                        </div>
                                        {confirmMismatch && (
                                            <p className="text-[length:var(--fs-label)] text-red-500 mt-1.5 ml-1 font-[var(--fw-medium)]">
                                                Passwords do not match
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="apr-modal-foot pt-[14px] px-[26px] pb-[20px] border-t border-[var(--line)] flex justify-end gap-3">
                                <button
                                    onClick={closeModal}
                                    disabled={resetPasswordMutation.isPending}
                                    className="px-5 py-2.5 border border-[var(--line-strong)] rounded-full text-[length:var(--fs-meta)] font-[var(--fw-bold)] text-[var(--ink)] bg-[var(--paper)] hover:border-[var(--ink-mute)] hover:bg-[var(--paper-2)] transition-all hover:-translate-y-0.5 hover:shadow-md cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!canSubmit}
                                    className="px-5 py-2.5 rounded-full text-[length:var(--fs-meta)] font-[var(--fw-bold)] transition-all flex items-center gap-2 border bg-[#fef5b5] text-[var(--ink)] border-[#f5d547] hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer disabled:hover:translate-y-0 disabled:hover:shadow-none"
                                >
                                    {resetPasswordMutation.isPending && <Loader2 size={16} className="animate-spin" />}
                                    Set password
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default AdminResetPassword;
