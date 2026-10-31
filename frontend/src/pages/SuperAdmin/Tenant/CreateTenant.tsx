import React, { useEffect, useState, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router";
import { createTenantApi, updateTenantApi } from "../../../core/api/tenant.api";
import { useTenantStore } from "../../../store/tenant.store";
import { getIndustriesApi, createIndustryApi } from "../../../core/api/industry.api";
import { getTenantUsersByTenantIdApi, updateTenantAdminApi } from "../../../core/api/tenantuser.api";
import { Country } from "country-state-city";
import Select from "react-select";
import {
  Building2,
  Briefcase,
  Globe,
  Calendar,
  Users,
  Mail,
  User,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  Plus,
  ArrowLeft,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Phone,
  Shield,
  Layers,
  Check,
  X,
  Info,
  Server,
  FileCheck
} from "lucide-react";
import { Skeleton } from "../../../components/ui/Skeleton/Skeleton";

const ENCRYPTION_SECRET = "super-secret";
const getDecryptionKey = async () => {
  const enc = new TextEncoder();
  const secretKey = enc.encode(ENCRYPTION_SECRET);
  const hash = await window.crypto.subtle.digest("SHA-256", secretKey);
  return await window.crypto.subtle.importKey(
    "raw",
    hash,
    { name: "AES-CBC" },
    false,
    ["decrypt"]
  );
};

const decryptPassword = async (encryptedStr: string) => {
  if (!encryptedStr || !encryptedStr.includes(":")) return encryptedStr;
  const parts = encryptedStr.split(":");
  if (parts[0].length !== 32) return encryptedStr;

  try {
    const ivHex = parts[0];
    const encryptedHex = parts.slice(1).join(":");

    const iv = new Uint8Array(ivHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)));
    const encryptedBytes = new Uint8Array(encryptedHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)));

    const key = await getDecryptionKey();
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: "AES-CBC", iv: iv },
      key,
      encryptedBytes
    );

    return new TextDecoder().decode(decryptedBuffer);
  } catch (err) {
    console.error("Failed to decrypt password", err);
    return encryptedStr;
  }
};

const initialForm = {
  name: "",
  industryId: "",
  seatCount: 0,
  country: "",
  status: "ACTIVE",
  contractStartDate: "",
  contractEndDate: "",
  firstName: "",
  lastName: "",
  adminEmail: "",
  mobileNumber: "",
  password: "",
  confirmPassword: "",
  address: "",
  notes: "",
};

const SEAT_PRESETS = [50, 100, 250, 500, 1000];

const CreateTenant: React.FC = () => {
  const [countryOptions, setCountryOptions] = useState<any[]>([]);
  const [industryOptions, setIndustryOptions] = useState<any[]>([]);
  const [industryModal, setIndustryModal] = useState(false);
  const [newIndustryName, setNewIndustryName] = useState("");

  useEffect(() => {
    const loadIndustries = async () => {
      try {
        const data = await getIndustriesApi();
        setIndustryOptions(data);
      } catch (error) {
        console.error(error);
      }
    };
    loadIndustries();
  }, []);

  useEffect(() => {
    const countries = Country.getAllCountries();
    setCountryOptions(countries);
  }, []);

  const location = useLocation();
  const navigate = useNavigate();
  const editTenant = location.state?.editTenant;
  const isEdit = !!editTenant;

  const [formData, setFormData] = useState(() => initialForm);
  const [adminUserId, setAdminUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(isEdit);

  useEffect(() => {
    if (isEdit && editTenant) {
      setFormData({
        ...initialForm,
        name: editTenant.name || "",
        industryId: editTenant.industryId || "",
        seatCount: editTenant.seatCount || 0,
        country: editTenant.country || "",
        status: editTenant.status || "ACTIVE",
        contractStartDate: editTenant.contractStartDate ? editTenant.contractStartDate.split("T")[0] : "",
        contractEndDate: editTenant.contractEndDate ? editTenant.contractEndDate.split("T")[0] : "",
      });

      const fetchAdminUser = async () => {
        try {
          const users = await getTenantUsersByTenantIdApi(editTenant.id || editTenant._id);
          const sortedUsers = [...users].sort((a: any, b: any) => {
            const dateA = new Date(a.createdAt || a.created_at || 0).getTime();
            const dateB = new Date(b.createdAt || b.created_at || 0).getTime();
            return dateA - dateB;
          });

          const admin =
            sortedUsers.find((u: any) => {
              const roleCode = (u.roleCode || u.role?.code || "").toUpperCase();
              const roleName = (u.roleName || u.role?.name || "").toUpperCase();
              const adminRoles = ["CORP_ADMIN", "CORPORATE ADMIN", "TENANT_ADMIN", "ADMIN", "SUPER_ADMIN"];
              if (
                adminRoles.includes(roleCode) ||
                adminRoles.includes(roleName) ||
                roleCode.includes("ADMIN") ||
                roleName.includes("ADMIN")
              )
                return true;

              if (Array.isArray(u.roles)) {
                return u.roles.some((r: any) => {
                  const c = (typeof r === "string" ? r : r.code || "").toUpperCase();
                  const n = (typeof r === "string" ? r : r.name || "").toUpperCase();
                  return adminRoles.includes(c) || adminRoles.includes(n) || c.includes("ADMIN") || n.includes("ADMIN");
                });
              }
              return false;
            }) || sortedUsers[0];

          if (admin) {
            setAdminUserId(admin.id || admin._id);
            let decodedPassword = "";
            if (admin.keycloakInternalPassword) {
              decodedPassword = await decryptPassword(admin.keycloakInternalPassword);
            }

            setFormData((prev) => ({
              ...prev,
              firstName: admin.firstName || admin.profile?.firstName || "",
              lastName: admin.lastName || admin.profile?.lastName || "",
              adminEmail: admin.email || "",
              mobileNumber: admin.mobileNumber || admin.profile?.mobileNumber || "",
              password: decodedPassword,
              confirmPassword: decodedPassword,
            }));
          }
        } catch (e) {
          console.error("Failed to load admin user data", e);
        } finally {
          setIsLoading(false);
        }
      };

      fetchAdminUser();
    } else {
      setFormData(initialForm);
      setIsLoading(false);
    }
  }, [isEdit, editTenant]);

  const selectedCountry = useMemo(
    () => countryOptions.find((c) => c.isoCode === formData.country),
    [countryOptions, formData.country]
  );

  const selectedIndustry = useMemo(
    () => industryOptions.find((i) => i.id === formData.industryId),
    [industryOptions, formData.industryId]
  );

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const todayDateStr = new Date().toISOString().split("T")[0];
  const { addTenant } = useTenantStore();

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const resetForm = () => {
    setFormData(initialForm);
    setErrors({});
  };

  const toISODate = (date: string) => {
    if (!date) return "";
    return new Date(date).toISOString();
  };

  const getPhoneLength = (countryCode: string) => {
    switch (countryCode) {
      case "IN":
      case "US":
      case "CA":
      case "GB":
        return 10;
      case "AE":
      case "AU":
        return 9;
      case "SG":
        return 8;
      default:
        return 15;
    }
  };

  const validateForm = () => {
    const newErrors: any = {};

    if (!formData.name.trim()) {
      newErrors.name = "Organization name is required";
    }

    if (!formData.industryId) {
      newErrors.industryId = "Industry is required";
    }

    if (!formData.country) {
      newErrors.country = "Country is required";
    }

    if (!formData.seatCount || formData.seatCount <= 0) {
      newErrors.seatCount = "Seat count must be greater than 0";
    }

    if (!formData.contractStartDate) {
      newErrors.contractStartDate = "Contract start date is required";
    }

    if (!formData.contractEndDate) {
      newErrors.contractEndDate = "Contract end date is required";
    }

    if (formData.contractStartDate && formData.contractEndDate) {
      const start = new Date(formData.contractStartDate);
      const end = new Date(formData.contractEndDate);
      if (end <= start) {
        newErrors.contractEndDate = "End date must be greater than start date";
      }
    }

    if (!isEdit) {
      if (!formData.adminEmail.trim()) {
        newErrors.adminEmail = "Admin work email is required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.adminEmail.trim())) {
        newErrors.adminEmail = "Please enter a valid email address";
      }

      if (!formData.firstName.trim()) {
        newErrors.firstName = "First name is required";
      }

      if (!formData.lastName.trim()) {
        newErrors.lastName = "Last name is required";
      }

      if (!formData.password) {
        newErrors.password = "Password is required";
      } else if (formData.password.length < 8) {
        newErrors.password = "Password must be at least 8 characters";
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }

      if (!formData.mobileNumber.trim()) {
        newErrors.mobileNumber = "Mobile number is required";
      } else {
        const requiredLength = getPhoneLength(formData.country);
        if (formData.mobileNumber.length !== requiredLength) {
          newErrors.mobileNumber = `Mobile number must be ${requiredLength} digits`;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const createIndustryMutation = useMutation({
    mutationFn: createIndustryApi,
    onSuccess: (industry) => {
      setIndustryOptions((prev) => [...prev, industry]);
      setFormData((prev) => ({
        ...prev,
        industryId: industry.id,
      }));
      setIndustryModal(false);
      setNewIndustryName("");
      showToast("success", `Sector "${industry.name}" added successfully`);
    },
    onError: (error: any) => {
      showToast("error", error?.response?.data?.message || "Failed to create industry");
    },
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    if (name === "mobileNumber") {
      const cleaned = value.replace(/\D/g, "");
      const maxLength = formData.country ? getPhoneLength(formData.country) : 15;
      setFormData((prev) => ({
        ...prev,
        mobileNumber: cleaned.slice(0, maxLength),
      }));
      setErrors((prev: any) => ({
        ...prev,
        mobileNumber: "",
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: name === "seatCount" ? Number(value) : value,
    }));

    setErrors((prev: any) => ({
      ...prev,
      [name]: "",
    }));
  };

  const createMutation = useMutation({
    mutationFn: createTenantApi,
    onSuccess: (data) => {
      addTenant(data);
      showToast("success", "Enterprise tenant provisioned successfully!");
      setTimeout(() => {
        navigate("/corporate-management");
      }, 1200);
    },
    onError: (error: any) => {
      console.error(error);
      showToast("error", error?.response?.data?.message || "Tenant provisioning failed");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: any) => updateTenantApi(editTenant.id || editTenant._id, payload),
    onSuccess: () => {
      showToast("success", "Enterprise tenant updated successfully!");
      setTimeout(() => {
        navigate("/corporate-management");
      }, 1000);
    },
    onError: (error: any) => {
      console.error(error);
      showToast("error", error?.response?.data?.message || "Tenant update failed");
    },
  });

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const now = new Date();
    const isEndDateExpired = formData.contractEndDate ? new Date(formData.contractEndDate) < now : false;
    let computedStatus = formData.status || "ACTIVE";
    if (isEndDateExpired) {
      computedStatus = "EXPIRED";
    } else if (computedStatus === "EXPIRED") {
      computedStatus = "ACTIVE";
    }

    const payload = {
      name: formData.name.trim(),
      industryId: formData.industryId,
      seatCount: Number(formData.seatCount),
      country: formData.country,
      status: computedStatus,
      contractStartDate: toISODate(formData.contractStartDate),
      contractEndDate: toISODate(formData.contractEndDate),
      adminUser: {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.adminEmail.trim(),
        mobileNumber: formData.mobileNumber.trim(),
        password: formData.password,
      },
    };

    if (isEdit) {
      const updatePayload = {
        name: payload.name,
        industryId: payload.industryId,
        seatCount: payload.seatCount,
        country: payload.country,
        status: computedStatus,
        contractStartDate: payload.contractStartDate,
        contractEndDate: payload.contractEndDate,
      };

      if (adminUserId) {
        const userUpdatePayload: any = {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          mobileNumber: formData.mobileNumber.trim(),
        };
        if (formData.password) {
          userUpdatePayload.password = formData.password;
        }

        try {
          const tenantId = editTenant.id || editTenant._id;
          await updateTenantAdminApi(tenantId, adminUserId, userUpdatePayload);
        } catch (e: any) {
          console.error("Failed to update admin data", e);
          showToast("error", e?.response?.data?.message || "Failed to update admin data");
          return;
        }
      }

      updateMutation.mutate(updatePayload);
    } else {
      createMutation.mutate(payload);
    }
  };

  // Monogram initials for live card
  const getInitials = (name: string) => {
    if (!name) return "NT";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  // Duration in months
  const contractDurationMonths = useMemo(() => {
    if (!formData.contractStartDate || !formData.contractEndDate) return null;
    const start = new Date(formData.contractStartDate);
    const end = new Date(formData.contractEndDate);
    const diffMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    return diffMonths > 0 ? diffMonths : null;
  }, [formData.contractStartDate, formData.contractEndDate]);

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 space-y-6 w-full min-h-screen bg-slate-50">
        <div className="space-y-3">
          <Skeleton className="h-8 w-64 rounded-xl" />
          <Skeleton className="h-4 w-96 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-72 rounded-2xl" />
            <Skeleton className="h-72 rounded-2xl" />
          </div>
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </div>
    );
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* FLOATING NOTIFICATION TOAST */}
      {toast && (
        <div className="fixed top-6 right-6 z-[9999] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl shadow-slate-900/10 border backdrop-blur-md transition-all animate-in fade-in slide-in-from-top-3">
          {toast.type === "success" ? (
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
          )}
          <div>
            <p className="text-xs font-semibold text-slate-800">
              {toast.type === "success" ? "Operation Successful" : "Validation Error"}
            </p>
            <p className="text-xs text-slate-600 font-medium">{toast.message}</p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* TOP NAVIGATION & HEADER */}
        <div>
          <button
            onClick={() => navigate("/corporate-management")}
            className="group inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-blue-600 mb-3 px-3 py-1.5 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            <span>Return to Corporate Directory</span>
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 ring-4 ring-blue-50">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                    {isEdit ? "Edit Enterprise Tenant" : "Onboard New Enterprise Tenant"}
                  </h1>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                    <Sparkles className="w-3.5 h-3.5" />
                    Multi-Tenant Fleet
                  </span>
                </div>
                <p className="text-sm text-slate-500 mt-0.5">
                  Configure corporate identity, license capacity, regional jurisdiction, and primary administrative delegate
                </p>
              </div>
            </div>

            {/* Quick Status Pill */}
            <div className="inline-flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs self-start sm:self-auto">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-medium text-slate-600">
                Isolation Realm: <strong className="text-slate-900 font-semibold">{formData.name ? formData.name.toLowerCase().replace(/[^a-z0-9]/g, "-") : "pending"}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* MAIN 2-COLUMN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: FORM SECTIONS (8 COLS) */}
          <div className="lg:col-span-8 space-y-6">
            {/* CARD 1: ENTERPRISE IDENTITY & JURISDICTION */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 md:p-7 space-y-6 transition-all hover:border-slate-300">
              <div className="flex items-center justify-between pb-5 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 font-semibold">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Enterprise Identity & Jurisdiction</h2>
                    <p className="text-xs text-slate-500">Legal entity title, industrial sector classification, and operational territory</p>
                  </div>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 uppercase tracking-wider">
                  Step 01
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* ORGANIZATION NAME */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="flex items-center justify-between text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    <span>
                      Organization Legal Name <span className="text-blue-600 font-bold">*</span>
                    </span>
                    <span className="text-[11px] text-slate-400 font-normal">Official Registered Title</span>
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      name="name"
                      id="cct-org-name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g. Bank Muscat, Oman Oil, or Nexus Global Ltd."
                      className={`w-full h-11 pl-10 pr-4 text-sm bg-white rounded-xl border ${
                        errors.name
                          ? "border-rose-400 bg-rose-50/20 text-rose-900 focus:ring-2 focus:ring-rose-200"
                          : "border-slate-200 text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/15"
                      } transition outline-none placeholder:text-slate-400 shadow-2xs font-medium`}
                    />
                  </div>
                  {errors.name && (
                    <p className="text-xs text-rose-600 font-medium flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.name}
                    </p>
                  )}
                </div>

                {/* INDUSTRY SECTOR */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Industry Sector <span className="text-blue-600 font-bold">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setIndustryModal(true)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      New Sector
                    </button>
                  </div>
                  <div className="relative">
                    <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
                    <select
                      name="industryId"
                      value={formData.industryId}
                      onChange={(e) => {
                        if (e.target.value === "ADD_NEW") {
                          setIndustryModal(true);
                        } else {
                          handleChange(e);
                        }
                      }}
                      className={`w-full h-11 pl-10 pr-8 text-sm bg-white rounded-xl border ${
                        errors.industryId
                          ? "border-rose-400 bg-rose-50/20 text-rose-900"
                          : "border-slate-200 text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/15"
                      } transition outline-none appearance-none cursor-pointer shadow-2xs font-medium`}
                    >
                      <option value="">Select industry classification...</option>
                      {industryOptions.map((ind: any) => (
                        <option key={ind.id} value={ind.id}>
                          {ind.name}
                        </option>
                      ))}
                      <option value="ADD_NEW" className="font-semibold text-blue-600">
                        + Add Custom Industry Sector
                      </option>
                    </select>
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
                      ▼
                    </div>
                  </div>
                  {errors.industryId && (
                    <p className="text-xs text-rose-600 font-medium flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.industryId}
                    </p>
                  )}
                </div>

                {/* COUNTRY / JURISDICTION */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                    Territory / Country <span className="text-blue-600 font-bold">*</span>
                  </label>
                  <Select
                    options={countryOptions.map((c) => ({
                      value: c.isoCode,
                      label: `${c.flag ? c.flag + " " : ""}${c.name} (${c.isoCode})`,
                      rawName: c.name,
                    }))}
                    value={
                      countryOptions
                        .map((c) => ({
                          value: c.isoCode,
                          label: `${c.flag ? c.flag + " " : ""}${c.name} (${c.isoCode})`,
                          rawName: c.name,
                        }))
                        .find((opt) => opt.value === formData.country) || null
                    }
                    onChange={(selected) =>
                      setFormData((prev) => ({
                        ...prev,
                        country: selected?.value || "",
                        mobileNumber: "",
                      }))
                    }
                    placeholder="Search or select country..."
                    isClearable
                    styles={{
                      control: (base, state) => ({
                        ...base,
                        height: "44px",
                        minHeight: "44px",
                        borderRadius: "0.75rem",
                        borderColor: errors.country ? "#f87171" : state.isFocused ? "#2563eb" : "#e2e8f0",
                        boxShadow: state.isFocused ? "0 0 0 2px rgba(37, 99, 235, 0.15)" : "none",
                        "&:hover": {
                          borderColor: state.isFocused ? "#2563eb" : "#cbd5e1",
                        },
                        backgroundColor: "#ffffff",
                        fontSize: "0.875rem",
                        fontWeight: 500,
                      }),
                      option: (base, state) => ({
                        ...base,
                        backgroundColor: state.isSelected ? "#2563eb" : state.isFocused ? "#eff6ff" : "#ffffff",
                        color: state.isSelected ? "#ffffff" : "#1e293b",
                        fontSize: "0.875rem",
                        cursor: "pointer",
                      }),
                      menu: (base) => ({
                        ...base,
                        borderRadius: "0.75rem",
                        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
                        border: "1px solid #e2e8f0",
                        zIndex: 50,
                      }),
                    }}
                  />
                  {errors.country && (
                    <p className="text-xs text-rose-600 font-medium flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.country}
                    </p>
                  )}
                </div>

                {/* STATUS */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                    Operational Status
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      disabled={!isEdit}
                      onClick={() => setFormData((prev) => ({ ...prev, status: "ACTIVE" }))}
                      className={`h-11 px-4 rounded-xl border flex items-center justify-center gap-2.5 text-xs font-semibold transition-all ${
                        formData.status === "ACTIVE"
                          ? "bg-emerald-50 border-emerald-300 text-emerald-800 ring-2 ring-emerald-500/15"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      } ${!isEdit ? "cursor-default" : "cursor-pointer"}`}
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Active (Production Realm)
                    </button>
                    <button
                      type="button"
                      disabled={!isEdit}
                      onClick={() => setFormData((prev) => ({ ...prev, status: "INACTIVE" }))}
                      className={`h-11 px-4 rounded-xl border flex items-center justify-center gap-2.5 text-xs font-semibold transition-all ${
                        formData.status === "INACTIVE"
                          ? "bg-slate-100 border-slate-300 text-slate-800 ring-2 ring-slate-400/15"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      } ${!isEdit ? "cursor-default" : "cursor-pointer"}`}
                    >
                      <span className="w-2 h-2 rounded-full bg-slate-400" />
                      Inactive / Suspended
                    </button>
                  </div>
                  {!isEdit && (
                    <p className="text-[11px] text-slate-400 mt-1">
                      New enterprise onboarding automatically initiates under Active production realm.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* CARD 2: LICENSING & SEAT CAPACITY */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 md:p-7 space-y-6 transition-all hover:border-slate-300">
              <div className="flex items-center justify-between pb-5 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 font-semibold">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Licensing & Provisioning Capacity</h2>
                    <p className="text-xs text-slate-500">Contractual validity terms, service period, and provisioned learner seat threshold</p>
                  </div>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 uppercase tracking-wider">
                  Step 02
                </span>
              </div>

              <div className="space-y-5">
                {/* CONTRACT DATES */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* START DATE */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                      Contract Effective Start Date <span className="text-blue-600 font-bold">*</span>
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      <input
                        type="date"
                        name="contractStartDate"
                        value={formData.contractStartDate}
                        min={todayDateStr}
                        onChange={handleChange}
                        className={`w-full h-11 pl-10 pr-4 text-sm bg-white rounded-xl border ${
                          errors.contractStartDate
                            ? "border-rose-400 bg-rose-50/20 text-rose-900"
                            : "border-slate-200 text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/15"
                        } transition outline-none font-medium shadow-2xs`}
                      />
                    </div>
                    {errors.contractStartDate && (
                      <p className="text-xs text-rose-600 font-medium flex items-center gap-1 mt-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {errors.contractStartDate}
                      </p>
                    )}
                  </div>

                  {/* END DATE */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                      Contract Maturity End Date <span className="text-blue-600 font-bold">*</span>
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      <input
                        type="date"
                        name="contractEndDate"
                        value={formData.contractEndDate}
                        min={formData.contractStartDate || todayDateStr}
                        onChange={handleChange}
                        className={`w-full h-11 pl-10 pr-4 text-sm bg-white rounded-xl border ${
                          errors.contractEndDate
                            ? "border-rose-400 bg-rose-50/20 text-rose-900"
                            : "border-slate-200 text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/15"
                        } transition outline-none font-medium shadow-2xs`}
                      />
                    </div>
                    {errors.contractEndDate && (
                      <p className="text-xs text-rose-600 font-medium flex items-center gap-1 mt-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {errors.contractEndDate}
                      </p>
                    )}
                  </div>
                </div>

                {/* SEAT COUNT & PRESETS */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                      Contracted Seat Quota <span className="text-blue-600 font-bold">*</span>
                    </label>
                    <span className="text-xs text-slate-500 font-medium">
                      Maximum provisioned learner accounts
                    </span>
                  </div>

                  <div className="relative">
                    <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      type="number"
                      name="seatCount"
                      value={formData.seatCount === 0 ? "" : formData.seatCount}
                      onChange={handleChange}
                      placeholder="e.g. 250"
                      min="1"
                      className={`w-full h-11 pl-10 pr-4 text-sm bg-white rounded-xl border ${
                        errors.seatCount
                          ? "border-rose-400 bg-rose-50/20 text-rose-900 focus:ring-2 focus:ring-rose-200"
                          : "border-slate-200 text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/15"
                      } transition outline-none font-semibold shadow-2xs`}
                    />
                  </div>
                  {errors.seatCount && (
                    <p className="text-xs text-rose-600 font-medium flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.seatCount}
                    </p>
                  )}

                  {/* Quick Preset Pills */}
                  <div className="flex items-center flex-wrap gap-2 pt-1">
                    <span className="text-xs text-slate-400 font-medium mr-1">Quick Select:</span>
                    {SEAT_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({ ...prev, seatCount: preset }));
                          setErrors((prev: any) => ({ ...prev, seatCount: "" }));
                        }}
                        className={`text-xs px-3 py-1 rounded-lg border font-semibold transition-all cursor-pointer ${
                          formData.seatCount === preset
                            ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                            : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        {preset.toLocaleString()} Seats
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 3: PRIMARY CORPORATE ADMINISTRATOR */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 md:p-7 space-y-6 transition-all hover:border-slate-300">
              <div className="flex items-center justify-between pb-5 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 font-semibold">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Primary Corporate Administrator</h2>
                    <p className="text-xs text-slate-500">Root corporate admin credentials with administrative Keycloak realm delegation</p>
                  </div>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 uppercase tracking-wider">
                  Step 03
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* FIRST NAME */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                    First Name {!isEdit && <span className="text-blue-600 font-bold">*</span>}
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      placeholder="e.g. Salim"
                      className={`w-full h-11 pl-10 pr-4 text-sm bg-white rounded-xl border ${
                        errors.firstName
                          ? "border-rose-400 bg-rose-50/20 text-rose-900 focus:ring-2 focus:ring-rose-200"
                          : "border-slate-200 text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/15"
                      } transition outline-none font-medium shadow-2xs`}
                    />
                  </div>
                  {errors.firstName && (
                    <p className="text-xs text-rose-600 font-medium flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.firstName}
                    </p>
                  )}
                </div>

                {/* LAST NAME */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                    Last Name {!isEdit && <span className="text-blue-600 font-bold">*</span>}
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      placeholder="e.g. Al-Harthy"
                      className={`w-full h-11 pl-10 pr-4 text-sm bg-white rounded-xl border ${
                        errors.lastName
                          ? "border-rose-400 bg-rose-50/20 text-rose-900 focus:ring-2 focus:ring-rose-200"
                          : "border-slate-200 text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/15"
                      } transition outline-none font-medium shadow-2xs`}
                    />
                  </div>
                  {errors.lastName && (
                    <p className="text-xs text-rose-600 font-medium flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.lastName}
                    </p>
                  )}
                </div>

                {/* ADMIN EMAIL */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                    Corporate Email {!isEdit && <span className="text-blue-600 font-bold">*</span>}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      type="email"
                      name="adminEmail"
                      value={formData.adminEmail}
                      onChange={handleChange}
                      disabled={isEdit}
                      placeholder="admin@corporatename.com"
                      className={`w-full h-11 pl-10 pr-4 text-sm rounded-xl border ${
                        errors.adminEmail
                          ? "border-rose-400 bg-rose-50/20 text-rose-900"
                          : "border-slate-200 text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/15"
                      } ${isEdit ? "bg-slate-100/70 text-slate-500 cursor-not-allowed" : "bg-white"} transition outline-none font-medium shadow-2xs`}
                    />
                  </div>
                  {errors.adminEmail && (
                    <p className="text-xs text-rose-600 font-medium flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.adminEmail}
                    </p>
                  )}
                  {isEdit && (
                    <p className="text-[11px] text-slate-400">Primary corporate admin email is identity-locked.</p>
                  )}
                </div>

                {/* MOBILE PHONE */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                    Mobile Phone {!isEdit && <span className="text-blue-600 font-bold">*</span>}
                  </label>
                  <div className="flex rounded-xl shadow-2xs">
                    <div className="h-11 px-3.5 flex items-center border border-r-0 border-slate-200 rounded-l-xl bg-slate-50 text-slate-600 text-xs font-semibold select-none">
                      <Phone className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                      +{selectedCountry?.phonecode || "--"}
                    </div>
                    <input
                      type="text"
                      name="mobileNumber"
                      value={formData.mobileNumber}
                      onChange={handleChange}
                      className={`flex-1 h-11 bg-white border border-slate-200 rounded-r-xl px-4 text-sm font-medium outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/15 ${
                        errors.mobileNumber ? "border-rose-400 bg-rose-50/20 text-rose-900" : ""
                      }`}
                      placeholder={
                        formData.country === "IN" || formData.country === "US"
                          ? "9876543210"
                          : "Enter mobile number"
                      }
                    />
                  </div>
                  {errors.mobileNumber && (
                    <p className="text-xs text-rose-600 font-medium flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.mobileNumber}
                    </p>
                  )}
                </div>

                {/* PASSWORD */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                    Security Password {!isEdit && <span className="text-blue-600 font-bold">*</span>}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder={isEdit ? "Leave blank to preserve password" : "Min 8 characters"}
                      className={`w-full h-11 pl-10 pr-11 text-sm bg-white rounded-xl border ${
                        errors.password
                          ? "border-rose-400 bg-rose-50/20 text-rose-900"
                          : "border-slate-200 text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/15"
                      } transition outline-none font-medium shadow-2xs`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-rose-600 font-medium flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.password}
                    </p>
                  )}
                </div>

                {/* CONFIRM PASSWORD */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                    Confirm Password {!isEdit && <span className="text-blue-600 font-bold">*</span>}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder={isEdit ? "Re-enter new password if changed" : "Re-enter password"}
                      className={`w-full h-11 pl-10 pr-11 text-sm bg-white rounded-xl border ${
                        errors.confirmPassword
                          ? "border-rose-400 bg-rose-50/20 text-rose-900"
                          : "border-slate-200 text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/15"
                      } transition outline-none font-medium shadow-2xs`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-xs text-rose-600 font-medium flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>

              {/* Security Hint */}
              <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 flex items-start gap-3">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-600 leading-relaxed">
                  Upon onboarding completion, the Corporate Administrator receives automated realm provisioning with direct access to user management, course assignment, and team reporting.
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: STICKY ENTERPRISE DOSSIER & ACTIONS (4 COLS) */}
          <div className="lg:col-span-4 sticky top-6 space-y-6">
            {/* LIVE DOSSIER PREVIEW CARD */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden transition-all">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-5 text-white">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full backdrop-blur-xs">
                    {isEdit ? "Enterprise Record" : "Live Tenant Preview"}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    {formData.status || "ACTIVE"}
                  </span>
                </div>

                {/* Big Monogram Avatar */}
                <div className="mt-4 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white text-blue-700 font-black text-xl flex items-center justify-center shadow-md ring-4 ring-white/20 shrink-0">
                    {getInitials(formData.name)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-white truncate leading-tight">
                      {formData.name || "Enterprise Tenant"}
                    </h3>
                    <p className="text-xs text-blue-100 truncate mt-0.5">
                      {selectedIndustry?.name || "Sector Unspecified"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Dossier Body Details */}
              <div className="p-5 space-y-4 text-xs">
                {/* Jurisdiction */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="text-slate-500 font-medium flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-slate-400" />
                    Jurisdiction
                  </span>
                  <span className="font-semibold text-slate-900">
                    {selectedCountry ? `${selectedCountry.name} (${selectedCountry.isoCode})` : "Not Selected"}
                  </span>
                </div>

                {/* Seat Capacity */}
                <div className="pb-3 border-b border-slate-100 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      Learner Seat Quota
                    </span>
                    <span className="font-bold text-blue-600 text-sm">
                      {formData.seatCount ? Number(formData.seatCount).toLocaleString() : 0} Seats
                    </span>
                  </div>
                  {/* Visual Capacity Bar */}
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: formData.seatCount > 0 ? "100%" : "0%" }}
                    />
                  </div>
                </div>

                {/* Contract Duration */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="text-slate-500 font-medium flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Contract Terms
                  </span>
                  <span className="font-semibold text-slate-900">
                    {contractDurationMonths ? `${contractDurationMonths} Months Duration` : "Pending Dates"}
                  </span>
                </div>

                {/* Primary Admin Snapshot */}
                <div className="pt-1 pb-1 space-y-1.5">
                  <span className="text-slate-500 font-medium flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    Corporate Primary Contact
                  </span>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                      {formData.firstName ? formData.firstName[0].toUpperCase() : "A"}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 truncate">
                        {formData.firstName || formData.lastName
                          ? `${formData.firstName} ${formData.lastName}`.trim()
                          : "Admin Name"}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {formData.adminEmail || "admin@corporatedomain.com"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Multi-Tenant Governance Checklist */}
                <div className="pt-2 space-y-2 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-slate-600 text-[11px]">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Dedicated Keycloak realm isolation</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 text-[11px]">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Auto-provisioned RBAC role structures</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 text-[11px]">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Enterprise audit logging & data isolation</span>
                  </div>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="p-5 bg-slate-50/80 border-t border-slate-100 space-y-3">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm rounded-xl shadow-sm shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {isEdit ? "Saving Changes..." : "Provisioning Tenant..."}
                    </span>
                  ) : (
                    <>
                      <FileCheck className="w-4 h-4" />
                      {isEdit ? "Save Tenant Updates" : "Create Enterprise Tenant"}
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={resetForm}
                  disabled={isSubmitting}
                  className="w-full h-11 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-sm rounded-xl border border-slate-200 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <X className="w-4 h-4 text-slate-400" />
                  Clear Form
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CREATE INDUSTRY MODAL */}
      {industryModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Add Industry Sector</h2>
                  <p className="text-xs text-slate-500">Define a new corporate sector classification</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIndustryModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                  Sector Title <span className="text-blue-600 font-bold">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Telecommunications, Healthcare, Aviation"
                  value={newIndustryName}
                  onChange={(e) => setNewIndustryName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newIndustryName.trim()) {
                      createIndustryMutation.mutate({ name: newIndustryName.trim() });
                    }
                  }}
                  className="w-full h-11 px-4 text-sm bg-white rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/15 outline-none font-medium"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIndustryModal(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (newIndustryName.trim()) {
                      createIndustryMutation.mutate({ name: newIndustryName.trim() });
                    }
                  }}
                  disabled={!newIndustryName.trim() || createIndustryMutation.isPending}
                  className="px-5 py-2.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl shadow-sm shadow-blue-500/25 transition cursor-pointer disabled:opacity-50"
                >
                  {createIndustryMutation.isPending ? "Adding..." : "Add Sector"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateTenant;
