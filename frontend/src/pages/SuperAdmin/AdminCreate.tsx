import * as React from "react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, Mail, ChevronDown, Check, X, Plus, Calendar, ArrowLeft } from "../../assets/icons";
import { Eye } from "../../assets/icons";
import { EyeOff } from "lucide-react";
import { getRoles, type Role } from "../../core/api/role.api";
import {
  createInternalUser,
  updateInternalUser,
  setAccountExpiry,
  InternalUser,
} from "../../core/api/internal-user/internalUser.api";
import { useUser, useUsers, useAdminDepartments } from "../../hooks/internal-user/useInternalUser";
import { Skeleton } from "../../components/ui/Skeleton/Skeleton";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { Country } from "country-state-city";
import { useAuthStore } from "../../core/auth/auth.store";
import { 
  useAdminChangeStatus, 
  useAdminHardPurge,
  useDeleteUser,
  useReactivateUser 
} from "../../hooks/internal-user/useInternalUser";

/* ---------------- DEPARTMENT AUTOCOMPLETE / CREATABLE SELECT ---------------- */
const DepartmentSelect: React.FC<{
  value: string;
  onChange: (val: string) => void;
  options: string[];
  onAddOption: (newOption: string) => void;
}> = ({ value, onChange, options, onAddOption }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter((opt) =>
    opt.toLowerCase().includes(search.toLowerCase())
  );

  const exactMatch = options.some(
    (opt) => opt.toLowerCase() === search.trim().toLowerCase()
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <input
          type="text"
          value={isOpen ? search : value}
          onChange={(e) => {
            setSearch(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => {
            setSearch(value);
            setIsOpen(true);
          }}
          placeholder="e.g. Content Operations"
          className="w-full h-12 px-4 pr-10 border border-[var(--line-strong)] rounded-[var(--r-md)] focus:border-[var(--ink)] focus:ring-1 focus:ring-[var(--ink)] outline-none text-[length:var(--fs-body)] [font-family:var(--font-sans)] bg-[var(--paper)] text-[var(--ink)] placeholder:text-[var(--ink-mute)]"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {value && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
                setSearch("");
              }}
              className="text-[var(--ink-faint)] hover:text-[var(--ink-soft)] p-1"
            >
              <X width={16} height={16} />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="text-[var(--ink-faint)] hover:text-[var(--ink-soft)] p-1"
          >
            <ChevronDown width={16} height={16} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-[var(--paper)] border border-[var(--line)] rounded-[var(--r-md)] shadow-[var(--shadow-card)] max-h-60 overflow-y-auto py-1 animate-in fade-in duration-150">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  onChange(option);
                  setSearch(option);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-[length:var(--fs-body)] [font-family:var(--font-sans)] flex items-center justify-between transition-colors ${value === option ? "font-[var(--fw-semibold)] text-[var(--ink)] bg-[var(--paper-2)]" : "text-[var(--ink)] hover:bg-[var(--paper-2)]"
                  }`}
              >
                <span>{option}</span>
                {value === option && <Check width={16} height={16} className="text-[var(--ink)]" />}
              </button>
            ))
          ) : (
            <div className="px-4 py-2 text-[length:var(--fs-meta)] text-[var(--ink-mute)] [font-family:var(--font-sans)]">No matching departments</div>
          )}

          {search.trim() && !exactMatch && (
            <button
              type="button"
              onClick={() => {
                const newDept = search.trim();
                onAddOption(newDept);
                onChange(newDept);
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-2.5 text-[length:var(--fs-body)] [font-family:var(--font-sans)] font-[var(--fw-medium)] text-[var(--ink)] hover:bg-[var(--paper-2)] border-t border-[var(--line)] flex items-center gap-2"
            >
              <Plus width={16} height={16} />
              <span>Create "{search.trim()}"</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

/* ---------------- MAIN ADMIN CREATE COMPONENT ---------------- */
const AdminCreate: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const userId = searchParams.get("id");
  const queryClient = useQueryClient();
  const { role } = useAuthStore();
  const isAdmin = role === "SUPER_ADMIN" || role === "TENANT_ADMIN" || role === "ADMIN";
  const [editingAdmin, setEditingAdmin] = useState<InternalUser | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const todayStr = new Date().toISOString().split("T")[0];

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    country: "",
    roles: [] as string[],
    department: "",
    isTemporaryAccess: false,
    expiryDate: "",
  });

  const [departmentOptions, setDepartmentOptions] = useState<string[]>([]);

  const countries = React.useMemo(() => Country.getAllCountries().map(c => c.name), []);

  /* ---------------- ROLES ---------------- */
  const { data: roles = [] } = useQuery<Role[]>({
    queryKey: ["roles"],
    queryFn: getRoles,
  });

  /* ---------------- USERS ---------------- */
  // Fetch specific user if in edit mode (userId exists)
  const { data: specificUser, isLoading: isUserLoading } = useUser(userId || "");
  const { data: internalUsers = [], isLoading: isUsersLoading } = useUsers();
  
  const isLoading = isUserLoading || isUsersLoading;

  /* ---------------- DEPARTMENTS ---------------- */
  const { data: fetchedDepartments } = useAdminDepartments();

  // Populate existing department names from fetched departments
  React.useEffect(() => {
    if (fetchedDepartments && fetchedDepartments.length > 0) {
      const existingDepts = fetchedDepartments.map((d) => d.name);
      setDepartmentOptions((prev) => Array.from(new Set([...prev, ...existingDepts])));
    }
  }, [fetchedDepartments]);

  // Load user details when editing
  React.useEffect(() => {
    if (!userId || !specificUser || roles.length === 0) return;

    const user = specificUser;

    if (user) {
      setEditingAdmin(user);

      const mappedRoleCodes = user.roles.map((roleName) => {
        const foundRole = roles.find((r) => r.name === roleName || r.code === roleName);
        return foundRole ? foundRole.code : roleName;
      });

      const expiryRaw = (user as any).accountExpiresAt || (user as any).lifecycle?.accountExpiresAt || user.superAdminExpiryDate;
      let hasTempAccess = false;
      let expDateStr = "";

      if (expiryRaw) {
        hasTempAccess = true;
        expDateStr = new Date(expiryRaw).toISOString().split("T")[0];
      }

      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        password: "",
        confirmPassword: "",
        country: user.country || "",
        roles: mappedRoleCodes,
        department: user.department || "",
        isTemporaryAccess: hasTempAccess,
        expiryDate: expDateStr,
      });

      if (user.department && !departmentOptions.includes(user.department)) {
        setDepartmentOptions((prev) => [...prev, user.department as string]);
      }
    }
  }, [userId, specificUser, roles]);

  /* ---------------- CREATE / UPDATE MUTATIONS ---------------- */
  const createMutation = useMutation({
    mutationFn: createInternalUser,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InternalUser> }) =>
      updateInternalUser(id, data),
  });

  const changeStatusMutation = useAdminChangeStatus();
  const hardPurgeMutation = useAdminHardPurge();
  const softDeleteMutation = useDeleteUser();
  const reactivateMutation = useReactivateUser();

  const handleRoleChange = (roleCode: string) => {
    setFormData((prev) => {
      const exists = prev.roles.includes(roleCode);
      return {
        ...prev,
        roles: exists ? prev.roles.filter((r) => r !== roleCode) : [...prev.roles, roleCode],
      };
    });
  };

  const handleAddDepartmentOption = (newDept: string) => {
    if (!departmentOptions.includes(newDept)) {
      setDepartmentOptions((prev) => [...prev, newDept]);
    }
  };

  /* ---------------- FORM SUBMIT ---------------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingAdmin && formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    // Expiry Date Validation
    if (formData.isTemporaryAccess) {
      if (!formData.expiryDate) {
        toast.error("Access expiry date is required when temporary access is enabled.");
        return;
      }
      if (formData.expiryDate < todayStr) {
        toast.error("Access expiry date cannot be in the past.");
        return;
      }
    }

    const formattedExpiryDate = formData.isTemporaryAccess && formData.expiryDate
      ? `${formData.expiryDate}T23:59:59.000Z`
      : undefined;

    try {
      setIsSubmitting(true);
      let targetUserId = editingAdmin?.id;

      const firstName = formData.firstName.trim();
      const lastName = formData.lastName.trim();

      if (editingAdmin) {
        let finalRoles = [...formData.roles];
        if (formData.isTemporaryAccess && !finalRoles.includes("SUPER_ADMIN")) {
          finalRoles.push("SUPER_ADMIN");
        }

        await updateMutation.mutateAsync({
          id: editingAdmin.id,
          data: {
            firstName,
            lastName,
            email: formData.email,
            country: formData.country,
            roles: finalRoles,
            department: formData.department,
            superAdminExpiryDate: formattedExpiryDate,
          },
        });
      } else {
        let finalRoles = [...formData.roles];
        if (formData.isTemporaryAccess && !finalRoles.includes("SUPER_ADMIN")) {
          finalRoles.push("SUPER_ADMIN");
        }

        const createdUser = await createMutation.mutateAsync({
          firstName,
          lastName,
          email: formData.email,
          password: formData.password,
          country: formData.country,
          roles: finalRoles,
          department: formData.department,
          superAdminExpiryDate: formattedExpiryDate,
        });
        targetUserId = createdUser?.id;
      }

      queryClient.invalidateQueries({ queryKey: ["internal-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-departments"] });
      toast.success(editingAdmin ? "Admin user updated successfully." : "Admin user created successfully.");
      navigate("/admin-user-management");
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || "Operation failed.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };


  // Map selected role codes to role names for summary
  const selectedRoleNames = formData.roles.map((code) => {
    const found = roles.find((r) => r.code === code || r.name === code);
    return found ? found.name : code;
  });

  const handleLifecycleAction = async (action: 'SUSPENDED' | 'INACTIVE' | 'ACTIVE' | 'SOFT_DELETE' | 'PURGE') => {
    if (!editingAdmin?.id) return;
    const confirmMsg = action === 'PURGE' 
      ? "Are you sure you want to completely delete this user? This cannot be undone."
      : action === 'SOFT_DELETE'
      ? "Are you sure you want to soft delete this user? They will be scheduled for purge."
      : `Are you sure you want to change the user status to ${action}?`;
      
    if (!window.confirm(confirmMsg)) return;

    try {
      setIsSubmitting(true);
      if (action === 'PURGE') {
        await hardPurgeMutation.mutateAsync(editingAdmin.id);
      } else if (action === 'SOFT_DELETE') {
        await softDeleteMutation.mutateAsync(editingAdmin.id);
      } else if (action === 'ACTIVE') {
        await reactivateMutation.mutateAsync(editingAdmin.id);
      } else {
        await changeStatusMutation.mutateAsync({ userId: editingAdmin.id, status: action, reason: "Admin action via UI" });
      }
      queryClient.invalidateQueries({ queryKey: ["internal-users"] });
      toast.success(`User ${action === 'PURGE' ? 'deleted' : 'status updated'} successfully.`);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Operation failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formattedExpirySummary = formData.expiryDate
    ? new Date(formData.expiryDate).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
    : "";

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 w-full min-h-screen bg-[var(--surface)]">
        <div className="space-y-2 mb-8">
          <Skeleton className="h-8 w-1/4 rounded-[var(--r-sm)]" />
          <Skeleton className="h-4 w-1/3 rounded-[var(--r-sm)]" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Skeleton className="h-[100px] rounded-[var(--r-lg)]" />
          <Skeleton className="h-[100px] rounded-[var(--r-lg)]" />
          <Skeleton className="h-[100px] rounded-[var(--r-lg)]" />
          <Skeleton className="h-[100px] rounded-[var(--r-lg)]" />
        </div>
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    );
  }

  return (
    <>
      {/* Breadcrumb / Top Bar */}
      <div>
        <button
          type="button"
          onClick={() => navigate("/admin-user-management")}
          className="mb-5 flex items-center gap-1.5 text-[length:var(--fs-label)] font-[var(--fw-bold)] uppercase tracking-[var(--ls-label)] text-[var(--ink-mute)] transition-colors hover:text-[var(--ink)] [font-family:var(--font-serif)]"
        >
          <ArrowLeft width={14} height={14} strokeWidth={2.5} />
          BACK TO USERS
        </button>

        <div>
          <span className="mb-1.5 block text-[length:var(--fs-label)] font-[var(--fw-bold)] uppercase tracking-[var(--ls-label)] text-[var(--ink-mute)] [font-family:var(--font-serif)]">
            USER MANAGEMENT · SUPER ADMIN ONLY
          </span>
          <h1 className="mb-2 text-[length:var(--fs-h1)] font-[var(--fw-extrabold)] tracking-tight text-[var(--ink)] [font-family:var(--font-sans)]">
            {editingAdmin ? "Update admin user" : "Create admin user"}
          </h1>
          <p className="mb-7 max-w-3xl text-[length:var(--fs-body)] leading-relaxed text-[var(--ink-soft)] [font-family:var(--font-sans)]">
            Add a new administrator and assign the roles that define what they can manage across Nexus Learning.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT SIDE FORM CARDS (2 COLS) */}
          <div className="lg:col-span-2 space-y-6">

            {/* SINGLE UNIFIED FORM CARD */}
            <div className="bg-[var(--paper)] rounded-[var(--r-lg)] border border-[var(--line)] shadow-[var(--shadow-sm)] py-5 px-4 sm:px-[22px] hover:shadow-[var(--shadow-hover)] hover:border-[var(--line-strong)] transition-all">
              
              {/* 1. IDENTITY SECTION */}
              <div className="mb-8">
                <h2 className="text-[length:var(--fs-label)] font-[var(--fw-bold)] uppercase tracking-[var(--ls-label)] text-[var(--ink-mute)] [font-family:var(--font-serif)] mb-4.5">
                  IDENTITY
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5.5">
                  <div>
                    <label className="block text-[length:var(--fs-label)] font-[var(--fw-semibold)] uppercase tracking-[var(--ls-label)] text-[var(--ink-mute)] [font-family:var(--font-serif)] mb-2">
                      FIRST NAME *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      placeholder="Faris"
                      className="w-full h-12 px-4 border border-[var(--line-strong)] rounded-[var(--r-md)] focus:border-[var(--ink)] focus:ring-1 focus:ring-[var(--ink)] outline-none text-[length:var(--fs-body)] [font-family:var(--font-sans)] bg-[var(--paper)] text-[var(--ink)]"
                    />
                  </div>

                  <div>
                    <label className="block text-[length:var(--fs-label)] font-[var(--fw-semibold)] uppercase tracking-[var(--ls-label)] text-[var(--ink-mute)] [font-family:var(--font-serif)] mb-2">
                      LAST NAME *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      placeholder="Al-Maamari"
                      className="w-full h-12 px-4 border border-[var(--line-strong)] rounded-[var(--r-md)] focus:border-[var(--ink)] focus:ring-1 focus:ring-[var(--ink)] outline-none text-[length:var(--fs-body)] [font-family:var(--font-sans)] bg-[var(--paper)] text-[var(--ink)]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[length:var(--fs-label)] font-[var(--fw-semibold)] uppercase tracking-[var(--ls-label)] text-[var(--ink-mute)] [font-family:var(--font-serif)] mb-2">
                      EMAIL ADDRESS *
                    </label>
                    <input
                      type="email"
                      required
                      disabled={!!editingAdmin}
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="faris@nexus.org"
                      className="w-full h-12 px-4 border border-[var(--line-strong)] rounded-[var(--r-md)] focus:border-[var(--ink)] focus:ring-1 focus:ring-[var(--ink)] outline-none text-[length:var(--fs-body)] [font-family:var(--font-sans)] bg-[var(--paper)] text-[var(--ink)] disabled:bg-[var(--paper-2)] disabled:text-[var(--ink-mute)] disabled:cursor-not-allowed"
                    />
                  </div>

                  {!editingAdmin && (
                    <>
                      <div>
                        <label className="block text-[length:var(--fs-label)] font-[var(--fw-semibold)] uppercase tracking-[var(--ls-label)] text-[var(--ink-mute)] [font-family:var(--font-serif)] mb-2">
                          PASSWORD *
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            required={!editingAdmin}
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            placeholder="Create a strong password"
                            className="w-full h-12 px-4 pr-10 border border-[var(--line-strong)] rounded-[var(--r-md)] focus:border-[var(--ink)] focus:ring-1 focus:ring-[var(--ink)] outline-none text-[length:var(--fs-body)] [font-family:var(--font-sans)] bg-[var(--paper)] text-[var(--ink)]"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ink-mute)] hover:text-[var(--ink)] focus:outline-none transition-colors"
                            title={showPassword ? "Hide password" : "Show password"}
                          >
                            {showPassword ? <EyeOff width={18} height={18} /> : <Eye width={18} height={18} />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[length:var(--fs-label)] font-[var(--fw-semibold)] uppercase tracking-[var(--ls-label)] text-[var(--ink-mute)] [font-family:var(--font-serif)] mb-2">
                          CONFIRM PASSWORD *
                        </label>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            required={!editingAdmin}
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            placeholder="Confirm your password"
                            className="w-full h-12 px-4 pr-10 border border-[var(--line-strong)] rounded-[var(--r-md)] focus:border-[var(--ink)] focus:ring-1 focus:ring-[var(--ink)] outline-none text-[length:var(--fs-body)] [font-family:var(--font-sans)] bg-[var(--paper)] text-[var(--ink)]"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ink-mute)] hover:text-[var(--ink)] focus:outline-none transition-colors"
                            title={showConfirmPassword ? "Hide password" : "Show password"}
                          >
                            {showConfirmPassword ? <EyeOff width={18} height={18} /> : <Eye width={18} height={18} />}
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-[length:var(--fs-label)] font-[var(--fw-semibold)] uppercase tracking-[var(--ls-label)] text-[var(--ink-mute)] [font-family:var(--font-serif)] mb-2">
                      COUNTRY *
                    </label>
                    <div className="relative">
                    <select
                      required
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      className="w-full h-12 px-4 appearance-none border border-[var(--line-strong)] rounded-[var(--r-md)] focus:border-[var(--ink)] focus:ring-1 focus:ring-[var(--ink)] outline-none text-[length:var(--fs-body)] [font-family:var(--font-sans)] bg-[var(--paper)] text-[var(--ink)]"
                    >
                      <option value="" disabled>Select a country</option>
                      {countries.map((country) => (
                        <option key={country} value={country}>
                          {country}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[var(--ink-mute)]">
                      <ChevronDown width={16} height={16} />
                    </div>
                  </div>
                </div>
                </div>
              </div>
              
              <hr className="border-[var(--line)]" />

              {/* 2. ROLES SECTION */}
              <div className="mb-5.5">
                <h2 className="text-[length:var(--fs-label)] font-[var(--fw-bold)] uppercase tracking-[var(--ls-label)] text-[var(--ink-mute)] [font-family:var(--font-serif)] mb-4.5">
                  ROLES
                </h2>

                <label className="block text-[length:var(--fs-label)] font-[var(--fw-semibold)] uppercase tracking-[var(--ls-label)] text-[var(--ink-mute)] [font-family:var(--font-serif)] mb-2">
                  ASSIGN ROLES *
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2.5">
                  {roles
                    .filter((role) => {
                      const excludedRoles = [
                        "Visitor",
                        "VISITOR",
                        "Corporate User",
                        "CORPORATE_USER",
                        "Corporate Admin",
                        "CORPORATE_ADMIN",
                        "Platform Support",
                        "SUPPORT",
                        "SYSTEM_SUPPORT_ENGINEER",
                      ];
                      return (
                        !excludedRoles.includes(role.name) &&
                        !excludedRoles.includes(role.code)
                      );
                    })
                    .map((role) => {
                      const isChecked = formData.roles.includes(role.code);

                      const getRoleDisplayName = (r: { code: string; name: string }) => {
                        const code = (r.code || "").toUpperCase();
                        const name = (r.name || "").toUpperCase();

                        if (code === "SUPER_ADMIN" || name.includes("SUPER ADMIN") || name.includes("SUPER_ADMIN")) {
                          return "System Super Administrator";
                        }
                        if (code === "CONTENT_DEVELOPER" || name.includes("CONTENT DEVELOPER")) {
                          return "Content Developer";
                        }
                        if (code === "SME" || name === "SME" || name.includes("SUBJECT MATTER EXPERT")) {
                          return "Subject Matter Expert (SME)";
                        }
                        if (code === "MEMBER" || name.includes("MEMBER") || name.includes("LEARNER")) {
                          return "Standard Member (Learner)";
                        }
                        return r.name;
                      };

                      return (
                        <label
                          key={role.id}
                          className={`
                            flex items-center gap-3 py-[14px] px-[16px] rounded-2xl border transition cursor-pointer hover:border-[var(--line-strong)]
                            ${isChecked ? "border-[var(--ink)] bg-[var(--paper-2)]" : "border-[var(--line)]"}
                          `}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleRoleChange(role.code)}
                            className="w-4 h-4 rounded border-[var(--line-strong)] accent-[var(--ink)] cursor-pointer"
                          />
                          <span className="text-[length:var(--fs-body)] font-[var(--fw-medium)] text-[var(--ink)] [font-family:var(--font-sans)]">{getRoleDisplayName(role)}</span>
                        </label>
                      );
                    })}
                </div>

                <p className="text-[length:var(--fs-meta)] text-[var(--ink-mute)] [font-family:var(--font-sans)]">
                  Users can have multiple roles. Permissions are the union of all assigned roles.
                </p>
              </div>

              <hr className="border-[var(--line)]" />

              {/* 3. ACCESS SECTION */}
              <div>
                <h2 className="text-[length:var(--fs-label)] font-[var(--fw-bold)] uppercase tracking-[var(--ls-label)] text-[var(--ink-mute)] [font-family:var(--font-serif)] mb-3.5">
                  ACCESS
                </h2>

                {/* Department / Team Autocomplete Select */}
                <div className="mb-5 hidden">
                  <label className="block text-[length:var(--fs-label)] font-[var(--fw-semibold)] uppercase tracking-[var(--ls-label)] text-[var(--ink-mute)] [font-family:var(--font-serif)] mb-2">
                    DEPARTMENT / TEAM
                  </label>
                  <DepartmentSelect
                    value={formData.department}
                    onChange={(val) => setFormData({ ...formData, department: val })}
                    options={departmentOptions}
                    onAddOption={handleAddDepartmentOption}
                  />
                  <p className="text-[length:var(--fs-meta)] text-[var(--ink-mute)] [font-family:var(--font-sans)] mt-2">
                    Optional. Group this admin under a department or team for organisation and reporting.
                  </p>
                </div>

                {/* Temporary Admin Access Checkbox */}
                <div className="mb-5">
                  <label className="block text-[length:var(--fs-label)] font-[var(--fw-semibold)] uppercase tracking-[var(--ls-label)] text-[var(--ink-mute)] [font-family:var(--font-serif)] mb-2">
                    TEMPORARY ADMIN ACCESS
                  </label>
                  <label className="flex items-center gap-3 py-[14px] px-[16px] rounded-2xl border border-[var(--line-strong)] bg-[var(--paper)] hover:border-[var(--ink-mute)] cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.isTemporaryAccess}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          isTemporaryAccess: e.target.checked,
                          expiryDate: e.target.checked ? formData.expiryDate : "",
                        })
                      }
                      className="w-4 h-4 rounded border-[var(--line-strong)] accent-[var(--ink)]"
                    />
                    <span className="text-[length:var(--fs-body)] font-[var(--fw-medium)] text-[var(--ink)] [font-family:var(--font-sans)]">
                      Grant time-bound Super Admin access
                    </span>
                  </label>
                  <p className="text-[length:var(--fs-meta)] text-[var(--ink-mute)] [font-family:var(--font-sans)] mt-2">
                    When enabled, the user is automatically granted a Super Admin role that expires after the date below.
                  </p>
                </div>

                {/* Access Expires On Date Picker */}
                <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                  <label className="block text-[length:var(--fs-label)] font-[var(--fw-semibold)] uppercase tracking-[var(--ls-label)] text-[var(--ink-mute)] [font-family:var(--font-serif)] mb-2">
                    ACCESS EXPIRES ON
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      min={todayStr}
                      disabled={!formData.isTemporaryAccess}
                      required={formData.isTemporaryAccess}
                      value={formData.expiryDate}
                      onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                      className="w-full h-12 px-4 border border-[var(--line-strong)] rounded-[var(--r-md)] focus:border-[var(--ink)] focus:ring-1 focus:ring-[var(--ink)] outline-none text-[length:var(--fs-body)] [font-family:var(--font-sans)] bg-[var(--paper)] text-[var(--ink)] disabled:bg-[var(--paper-2)] disabled:text-[var(--ink-mute)] disabled:cursor-not-allowed"
                    />
                  </div>
                  <p className="text-[length:var(--fs-meta)] text-[var(--ink-mute)] [font-family:var(--font-sans)] mt-2">
                    Required only when temporary access is enabled. Leave blank for permanent access.
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT SIDE SUMMARY & INVITE FLOW (1 COL) */}
          <div className="space-y-6 lg:sticky lg:top-6">

            {/* Summary Card */}
            <div className="bg-[var(--paper)] rounded-[var(--r-lg)] border border-[var(--line)] shadow-[var(--shadow-sm)] py-[18px] px-4 sm:px-[20px]">
              <h3 className="text-[length:var(--fs-label)] font-[var(--fw-bold)] uppercase tracking-[var(--ls-label)] text-[var(--ink-mute)] [font-family:var(--font-serif)] mb-3.5">
                NEW ADMIN SUMMARY
              </h3>

              <div className="space-y-4 text-[length:var(--fs-meta)]">
                <div>
                  <span className="block text-[length:var(--fs-label)] uppercase tracking-[var(--ls-label)] text-[var(--ink-mute)] font-[var(--fw-semibold)] [font-family:var(--font-serif)]">NAME</span>
                  <span className="text-[length:var(--fs-body)] text-[var(--ink)] [font-family:var(--font-sans)]">
                    {`${formData.firstName} ${formData.lastName}`.trim() || "Not set"}
                  </span>
                </div>

                <div>
                  <span className="block text-[length:var(--fs-label)] uppercase tracking-[var(--ls-label)] text-[var(--ink-mute)] font-[var(--fw-semibold)] [font-family:var(--font-serif)]">EMAIL</span>
                  <span className="text-[length:var(--fs-body)] text-[var(--ink)] [font-family:var(--font-sans)]">{formData.email || "Not set"}</span>
                </div>

                <div>
                  <span className="block text-[length:var(--fs-label)] uppercase tracking-[var(--ls-label)] text-[var(--ink-mute)] font-[var(--fw-semibold)] [font-family:var(--font-serif)]">COUNTRY</span>
                  <span className="text-[length:var(--fs-body)] text-[var(--ink)] [font-family:var(--font-sans)]">{formData.country || "Not set"}</span>
                </div>

                <div>
                  <span className="block text-[length:var(--fs-label)] uppercase tracking-[var(--ls-label)] text-[var(--ink-mute)] font-[var(--fw-semibold)] [font-family:var(--font-serif)]">ROLES</span>
                  <span className="text-[length:var(--fs-body)] text-[var(--ink)] [font-family:var(--font-sans)]">
                    {selectedRoleNames.length > 0 ? selectedRoleNames.join(", ") : "None selected"}
                  </span>
                </div>

                <div>
                  <span className="block text-[length:var(--fs-label)] uppercase tracking-[var(--ls-label)] text-[var(--ink-mute)] font-[var(--fw-semibold)] [font-family:var(--font-serif)]">ACCESS</span>
                  <div className="text-[length:var(--fs-body)] text-[var(--ink)] [font-family:var(--font-sans)]">
                    {!formData.isTemporaryAccess ? (
                      <span>Permanent</span>
                    ) : (
                      <div className="space-y-0.5">
                        <span className="text-[var(--c-honey-text)] font-[var(--fw-bold)] block">Temporary</span>
                        <span className="text-[length:var(--fs-meta)] text-[var(--ink-mute)] block">
                          Expires: {formattedExpirySummary || formData.expiryDate || "Not selected"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Invite Flow Notice Card */}
            <div
              className="py-[18px] px-4 sm:px-[20px] text-[var(--c-honey-text)] bg-[var(--c-honey-wash)] rounded-[var(--r-md)] border border-[var(--c-honey-soft)] flex items-start gap-4"
            >
              <div className="w-9 h-9 shrink-0 flex items-center justify-center bg-[var(--paper)] rounded-[var(--r-md)] shadow-[var(--shadow-sm)] border border-[var(--c-honey-soft)]">
                <Mail width={18} height={18} className="text-[var(--c-honey-deep)]" />
              </div>
              <div>
                <h4 className="text-[length:var(--fs-label)] font-[var(--fw-bold)] uppercase tracking-[var(--ls-label)] text-[var(--c-honey-deep)] [font-family:var(--font-serif)] mb-1">
                  INVITE FLOW
                </h4>
                <p className="text-[length:var(--fs-body)] leading-relaxed text-[var(--c-honey-text)] [font-family:var(--font-sans)]">
                  Creating an admin user sends an email with a one-time setup link. The system issues a time-bound OTP on each login; no password is required.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                type="submit"
                disabled={
                  !formData.firstName ||
                  !formData.lastName ||
                  !formData.email ||
                  !formData.country ||
                  (!editingAdmin && (!formData.password || !formData.confirmPassword)) ||
                  formData.roles.length === 0 ||
                  (formData.isTemporaryAccess && !formData.expiryDate) ||
                  isSubmitting
                }
                className={`
                  w-full h-12 rounded-[var(--r-pill)] text-[length:var(--fs-body)] font-[var(--fw-semibold)] [font-family:var(--font-sans)] flex items-center justify-center gap-2 transition-all shadow-[var(--shadow-sm)] border
                  ${!formData.firstName ||
                    !formData.lastName ||
                    !formData.email ||
                    !formData.country ||
                    (!editingAdmin && (!formData.password || !formData.confirmPassword)) ||
                    formData.roles.length === 0 ||
                    (formData.isTemporaryAccess && !formData.expiryDate) ||
                    isSubmitting
                    ? "bg-[var(--paper-2)] text-[var(--ink-mute)] border-[var(--line)] cursor-not-allowed"
                    : "bg-[var(--btn)] text-[var(--ink)] border-[var(--honey)] hover:-translate-y-1 hover:shadow-[var(--shadow-sm)]"
                  }
                `}
              >
                {isSubmitting && <RefreshCw width={16} height={16} className="animate-spin" />}
                {isSubmitting
                  ? "Saving..."
                  : editingAdmin
                    ? "Update User"
                    : "Create and send invite"}
              </button>

              <button
                type="button"
                onClick={() => navigate("/admin-user-management")}
                className="w-full h-12 bg-[var(--paper)] border border-[var(--line-strong)] rounded-3xl font-[var(--fw-semibold)] text-[var(--ink)] hover:bg-[var(--paper-2)] transition-colors shadow-sm"
              >
                Cancel
              </button>
            </div>

            {/* Lifecycle Danger Zone */}
            {editingAdmin && isAdmin && (
              <div className="bg-red-50 border border-red-200 rounded-3xl p-6 md:p-8 mt-6">
                <h2 className="text-[length:var(--fs-label)] font-[var(--fw-bold)] uppercase tracking-wider text-red-600 mb-4">
                  DANGER ZONE (LIFECYCLE OPTIONS)
                </h2>
                <p className="text-[length:var(--fs-label)] text-red-500 mb-6">
                  Warning: These actions immediately affect the user's ability to access the system.
                </p>
                <div className="flex flex-col sm:flex-row flex-wrap gap-3">
                  {editingAdmin.status !== 'ACTIVE' && (
                    <button
                      type="button"
                      onClick={() => handleLifecycleAction('ACTIVE')}
                      className="w-full sm:w-auto px-4 py-2 border border-green-300 text-green-700 bg-[var(--paper)] rounded-xl hover:bg-green-50 transition text-[length:var(--fs-meta)] font-[var(--fw-medium)]"
                    >
                      Activate User
                    </button>
                  )}
                  {editingAdmin.status !== 'SUSPENDED' && (
                    <button
                      type="button"
                      onClick={() => handleLifecycleAction('SUSPENDED')}
                      className="w-full sm:w-auto px-4 py-2 border border-yellow-300 text-yellow-700 bg-[var(--paper)] rounded-xl hover:bg-yellow-50 transition text-[length:var(--fs-meta)] font-[var(--fw-medium)]"
                    >
                      Suspend User
                    </button>
                  )}
                  {editingAdmin.status !== 'INACTIVE' && editingAdmin.status !== 'DELETED' && (
                    <button
                      type="button"
                      onClick={() => handleLifecycleAction('INACTIVE')}
                      className="w-full sm:w-auto px-4 py-2 border border-[var(--line-strong)] text-[var(--ink-soft)] bg-[var(--paper)] rounded-xl hover:bg-[var(--paper-2)] transition text-[length:var(--fs-meta)] font-[var(--fw-medium)]"
                    >
                      Deactivate User
                    </button>
                  )}
                  {editingAdmin.status !== 'DELETED' && (
                    <button
                      type="button"
                      onClick={() => handleLifecycleAction('SOFT_DELETE')}
                      className="w-full sm:w-auto px-4 py-2 border border-[var(--line-strong)] text-[var(--ink-soft)] bg-[var(--paper)] rounded-xl hover:bg-[var(--paper-2)] transition text-[length:var(--fs-meta)] font-[var(--fw-medium)]"
                    >
                      Soft Delete User
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleLifecycleAction('PURGE')}
                    className="w-full sm:w-auto px-4 py-2 border border-red-300 text-red-600 bg-[var(--paper)] rounded-xl hover:bg-red-50 transition text-[length:var(--fs-meta)] font-[var(--fw-medium)] sm:ml-auto"
                  >
                    Delete User (Hard Purge)
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>
      </form>
    </>
  );
};

export default AdminCreate;