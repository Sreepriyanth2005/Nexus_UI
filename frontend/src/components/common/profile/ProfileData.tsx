import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import ProfileVerifyOTP from "./ProfileVerifyOTP";
import "./ProfileData.css";

import { useProfile } from "../../../hooks/profile/useProfile";
import { useProfileAssets } from "../../../hooks/profile/useProfileAssets";
import { useProfileCertificates } from "../../../hooks/profile/useProfileCertificates";
import { useProfileOnboarding } from "../../../hooks/profile/useProfileOnboarding";
import { useAssets } from "../../../hooks/asset/useAssets";
import { useSkills } from "../../../hooks/useMaster";
import {
  useLearningStatistics,
  useProgressDashboard,
  useMemberLearningCourses,
} from "../../../hooks/member-learning/memberLearning";

import type { UpdateProfileRequest, CareerHistory, PersonalLink } from "../../../types/profile.type";

import { Country } from "country-state-city";
import parsePhoneNumberFromString from "libphonenumber-js";
import CareerHistorySection from "./modals/CareerHistorySection";
import LanguageList from "language-list";

// Lucide icons
import {
  Loader2,
  X,
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  Calendar,
  Award,
  BookOpen,
  Clock,
  Briefcase,
  Link2,
  FileText,
  Upload,
  Trash2,
  Edit3,
  Check,
  CheckCircle2,
  AlertCircle,
  Camera,
  Sparkles,
  ShieldCheck,
  ExternalLink,
  Plus,
  ChevronRight,
  Copy,
  GraduationCap,
  Building2,
  Download,
  ArrowRight,
  Lock,
} from "lucide-react";

type TabId = "personal" | "professional" | "links" | "documents";

type FormState = {
  firstName: string;
  lastName: string;
  certificateName: string;
  titlePrefix: string;
  dob: string;
  gender: string;
  city: string;
  countryName: string;
  phoneCountryCode: string;
  mobileNumber: string;
  preferredLanguage: string;
  currentRole: string;
  currentEmployer: string;
  experienceLevel: string;
  industry: string;
  websiteUrl: string;
  portfolioUrl: string;
  photoUrl: string;
  resumeUrl: string;
  educationCompletionYear: string;
};

const MISSING_FIELD_LABELS: Record<string, string> = {
  fullName: "Add First & Last Name",
  country: "Select Country",
  certificateName: "Add Diploma Name",
  titlePrefix: "Select Title Prefix",
  city: "Add City",
  dob: "Add Date of Birth",
  gender: "Select Gender",
  phone: "Add Phone Number",
  currentRole: "Add Current Role",
  experienceLevel: "Select Experience Level",
  industry: "Select Industry",
  educationCompletionYear: "Add Graduation Year",
  portfolioUrl: "Add Portfolio URL",
  websiteUrl: "Add Website URL",
  photo: "Upload Profile Photo",
  resume: "Upload CV / Resume",
};

const tabs: Array<{ id: TabId; label: string; icon: any }> = [
  { id: "personal", label: "Personal", icon: User },
  { id: "professional", label: "Professional", icon: Briefcase },
  { id: "links", label: "Personal Links", icon: Link2 },
  { id: "documents", label: "Documents", icon: FileText },
];

const emptyForm: FormState = {
  firstName: "",
  lastName: "",
  certificateName: "",
  titlePrefix: "",
  dob: "",
  gender: "",
  city: "",
  countryName: "",
  phoneCountryCode: "+91",
  mobileNumber: "",
  preferredLanguage: "",
  currentRole: "",
  currentEmployer: "",
  experienceLevel: "",
  industry: "",
  websiteUrl: "",
  portfolioUrl: "",
  photoUrl: "",
  resumeUrl: "",
  educationCompletionYear: "",
};

const countries = Country.getAllCountries();

const getCountryCallingCode = (countryName: string): string => {
  const country = countries.find(
    (item) => item.name.toLowerCase() === countryName.trim().toLowerCase()
  );
  return country?.phonecode ? `+${country.phonecode}` : "+91";
};

const cleanUrl = (value: string): string | undefined => {
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed === "https://") return undefined;
  if (!/^https?:\/\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
};

const normalizePersonalLink = (link: PersonalLink): PersonalLink | undefined => {
  const url = cleanUrl(link.url);
  if (!url) return undefined;

  return {
    ...(link.id?.trim() ? { id: link.id.trim() } : {}),
    title: link.title?.trim() || "Link",
    url,
  };
};

const toDateInputValue = (value?: string | null) =>
  value ? (value.includes("T") ? value.slice(0, 10) : value) : "";

const formatDate = (value?: string | null) => {
  if (!value) return "Not provided";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const toTitle = (value?: string) =>
  (value || "").toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

const extractFilename = (url?: string) => {
  if (!url) return "Uploaded Document";
  try {
    let filename = url.split("?")[0].split("/").pop() || "Uploaded Document";
    filename = filename.replace(
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}-/,
      ""
    );
    return decodeURIComponent(filename);
  } catch {
    return "Document";
  }
};

const calculateAge = (dob?: string | null) => {
  if (!dob) return null;
  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

const ProfileData: React.FC = () => {
  const navigate = useNavigate();

  const { uploadPhoto, uploadResume, deletePhoto, deleteResume } = useProfileAssets();
  const { profile, getProfile, saveProfile, loading, completion, getCompletion } = useProfile();
  const { data: skills = [], isLoading: skillsLoading } = useSkills();
  const { uploadCertificate, deleteCertificate, certificates, refreshCertificates } =
    useProfileCertificates();
  const { uploadAsset } = useAssets();
  const { getOnboarding } = useProfileOnboarding();

  const { data: learningStats } = useLearningStatistics(profile?.id || "", !!profile?.id);
  const { data: dashboardData } = useProgressDashboard(profile?.id || "", !!profile?.id);
  const { data: memberLearningData } = useMemberLearningCourses(
    profile?.id || "",
    "Enrolled",
    {},
    "",
    "",
    1,
    9999,
    !!profile?.id
  );

  const earnedCertifications = useMemo(() => {
    if (!memberLearningData?.data) return [];
    return memberLearningData.data
      .filter((c: any) => c.statusText === "Completed" || c.statusText === "In progress")
      .slice(0, 4);
  }, [memberLearningData]);

  const [activeTab, setActiveTab] = useState<TabId>("personal");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [extraLinks, setExtraLinks] = useState<PersonalLink[]>([{ title: "LinkedIn", url: "" }]);
  const [careerHistory, setCareerHistory] = useState<CareerHistory[]>([]);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [photoUploading, setPhotoUploading] = useState(false);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [certificateUploading, setCertificateUploading] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Local state for skills and language
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [skillQuery, setSkillQuery] = useState("");
  const [skillsOpen, setSkillsOpen] = useState(false);
  const [learningInterests, setLearningInterests] = useState<string[]>([]);
  const [learningInterestInput, setLearningInterestInput] = useState("");

  const normalizedSkillQuery = skillQuery.trim().toLowerCase();
  const filteredSkills = skills
    .filter(
      (skill) =>
        !selectedSkills.some((selected) => selected.toLowerCase() === skill.name.toLowerCase())
    )
    .filter((skill) => !normalizedSkillQuery || skill.name.toLowerCase().includes(normalizedSkillQuery))
    .slice(0, 12);

  const addSkill = (name: string) => {
    const trimmedName = name.trim();
    if (
      !trimmedName ||
      selectedSkills.some((selected) => selected.toLowerCase() === trimmedName.toLowerCase())
    )
      return;
    setSelectedSkills((current) => [...current, trimmedName]);
    setSkillQuery("");
    setSkillsOpen(false);
  };

  useEffect(() => {
    getProfile();
    getOnboarding();
  }, [getProfile, getOnboarding]);

  // Populate form from profile data
  useEffect(() => {
    if (!profile) return;

    if (isEditing) {
      const p = profile.profile || {};
      setForm((prev) => ({
        ...prev,
        photoUrl: p.photoUrl || "",
        resumeUrl: p.resumeUrl || "",
      }));
      setPhotoPreview(p.photoUrl || "");
      return;
    }

    const p = profile.profile || {};
    const prof = profile.professionalProfile || {};

    setForm({
      firstName: p.firstName || "",
      lastName: p.lastName || "",
      certificateName: p.certificateName || [p.firstName, p.lastName].filter(Boolean).join(" "),
      titlePrefix: p.titlePrefix || "",
      dob: toDateInputValue(p.dob),
      gender: p.gender || "",
      city: p.city || "",
      countryName: p.countryName || "",
      phoneCountryCode: p.phoneCountryCode || "+91",
      mobileNumber: p.mobileNumber || "",
      preferredLanguage: profile.preferences?.preferredLanguage || "English",
      currentRole: prof.currentRole || "",
      currentEmployer: prof.currentEmployer || "",
      experienceLevel: prof.experienceLevel || "",
      industry: prof.industry || "",
      educationCompletionYear: prof.educationCompletionYear
        ? prof.educationCompletionYear.toString()
        : "",
      websiteUrl: p.websiteUrl || "",
      portfolioUrl: prof.portfolioUrl || "",
      photoUrl: p.photoUrl || "",
      resumeUrl: p.resumeUrl || "",
    });

    setPhotoPreview(p.photoUrl || "");
    setExtraLinks(
      profile.personalLinks?.length ? profile.personalLinks : [{ title: "LinkedIn", url: "" }]
    );
    setCareerHistory(profile.professionalProfile?.careerHistory || []);
    setSelectedSkills(profile.skills?.map((item) => item.name) || []);
    setLearningInterests(profile.learningInterests?.map((item) => item.name) || []);

    if ((profile.professionalProfile as any)?.externalCertificates) {
      refreshCertificates(
        ((profile.professionalProfile as any).externalCertificates as any[]).map((cert) => ({
          id: cert.id,
          title: cert.title,
          issuer: cert.issuer,
          assetId: cert.userAssetId,
          issuedAt: cert.issuedAt,
          createdAt: cert.createdAt,
        }))
      );
    }
  }, [profile, refreshCertificates, isEditing]);

  useEffect(() => {
    getCompletion();
  }, [getCompletion]);

  useEffect(() => {
    if (!careerHistory || careerHistory.length === 0) return;
    const latestJob = [...careerHistory].sort((a, b) => {
      const aIsCurrent = Boolean(a.isCurrentJob);
      const bIsCurrent = Boolean(b.isCurrentJob);
      if (aIsCurrent && !bIsCurrent) return -1;
      if (!aIsCurrent && bIsCurrent) return 1;
      const aDate = a.startDate ? new Date(a.startDate).getTime() : 0;
      const bDate = b.startDate ? new Date(b.startDate).getTime() : 0;
      return bDate - aDate;
    })[0];

    if (latestJob) {
      setForm((prev) => ({
        ...prev,
        currentEmployer: latestJob.employer ?? prev.currentEmployer,
        currentRole: latestJob.jobTitle ?? prev.currentRole,
      }));
    }
  }, [careerHistory]);

  const fullName =
    [profile?.profile?.firstName, profile?.profile?.lastName].filter(Boolean).join(" ") ||
    [form.firstName, form.lastName].filter(Boolean).join(" ") ||
    "Member Profile";

  const completed = Number(profile?.profileCompleteness || 0);

  const getTabProgress = useCallback(
    (tabId: TabId): string => {
      switch (tabId) {
        case "personal":
          let filled = 0;
          if (form.firstName) filled++;
          if (form.lastName) filled++;
          if (form.certificateName) filled++;
          if (form.dob) filled++;
          if (form.gender) filled++;
          if (form.city) filled++;
          if (form.countryName) filled++;
          if (form.mobileNumber) filled++;
          if (form.photoUrl) filled++;
          return `${filled}/9`;
        case "professional":
          let pfilled = 0;
          if (form.currentRole) pfilled++;
          if (form.currentEmployer) pfilled++;
          if (form.experienceLevel) pfilled++;
          if (form.industry) pfilled++;
          if (form.educationCompletionYear) pfilled++;
          if (selectedSkills.length > 0) pfilled++;
          if (learningInterests.length > 0) pfilled++;
          return `${pfilled}/7`;
        case "links":
          let lfilled = 0;
          if (form.portfolioUrl) lfilled++;
          if (extraLinks.some((l) => cleanUrl(l.url))) lfilled++;
          return `${lfilled}/2`;
        case "documents":
          let d = 0;
          if (form.resumeUrl) d++;
          if (certificates.length > 0) d++;
          return `${d}/2`;
        default:
          return "0/1";
      }
    },
    [form, extraLinks, certificates, selectedSkills, learningInterests]
  );

  const updateField =
    (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleAddLearningInterest = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const val = learningInterestInput.trim();
      if (val && !learningInterests.some((item) => item.toLowerCase() === val.toLowerCase())) {
        setLearningInterests((prev) => [...prev, val]);
      }
      setLearningInterestInput("");
    }
  };

  const removeLearningInterest = (interest: string) => {
    setLearningInterests((prev) => prev.filter((item) => item !== interest));
  };

  const handleLinkChange = (index: number, field: "title" | "url", value: string) => {
    setExtraLinks((prev) =>
      prev.map((link, idx) => (idx === index ? { ...link, [field]: value } : link))
    );
  };

  const handleAddLink = () => {
    setExtraLinks((prev) => [...prev, { title: "Website", url: "" }]);
  };

  const handleRemoveLink = (index: number) => {
    setExtraLinks((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setNotice("");

    if (form.mobileNumber.trim()) {
      const selectedCountry = countries.find(
        (c) => c.name.toLowerCase() === form.countryName.trim().toLowerCase()
      );
      const isoCode = selectedCountry?.isoCode as any;
      const fullPhone = `${form.phoneCountryCode}${form.mobileNumber}`.replace(/\s/g, "");

      let phoneNum = parsePhoneNumberFromString(form.mobileNumber.trim(), isoCode);
      if (!phoneNum?.isValid()) {
        phoneNum = parsePhoneNumberFromString(fullPhone, isoCode);
      }

      if (!phoneNum?.isValid()) {
        setError("Invalid mobile number format. Please check digits and try again.");
        setSaving(false);
        return;
      }

      if (isoCode && phoneNum.country && phoneNum.country !== isoCode) {
        setError(`Mobile number does not match the selected country (${form.countryName})`);
        setSaving(false);
        return;
      }
    }

    if (form.dob) {
      const dob = new Date(form.dob);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      dob.setHours(0, 0, 0, 0);

      if (dob > today) {
        setError("Date of birth cannot be in the future.");
        setSaving(false);
        return;
      }

      const age = (Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
      if (age < 13) {
        setError("User must be at least 13 years of age.");
        setSaving(false);
        return;
      }
    }

    try {
      const payload: UpdateProfileRequest = {
        firstName: form.firstName.trim() || null,
        lastName: form.lastName.trim() || null,
        certificateName: form.certificateName.trim() || null,
        titlePrefix: (form.titlePrefix as any) || null,
        city: form.city.trim() || null,
        countryName: form.countryName.trim() || null,
        dob: form.dob || null,
        gender: (form.gender as any) || null,
        preferredLanguage: form.preferredLanguage || null,
        phoneCountryCode: form.phoneCountryCode || null,
        mobileNumber: form.mobileNumber.trim() || null,
        currentRole: form.currentRole.trim() || null,
        currentEmployer: form.currentEmployer.trim() || null,
        experienceLevel: (form.experienceLevel as any) || null,
        industry: form.industry.trim() || null,
        educationCompletionYear: form.educationCompletionYear
          ? parseInt(form.educationCompletionYear, 10)
          : null,
        websiteUrl: cleanUrl(form.websiteUrl) || null,
        portfolioUrl: cleanUrl(form.portfolioUrl) || null,
        skills: selectedSkills,
        learningInterests: learningInterests,
        careerHistory:
          careerHistory.length > 0
            ? careerHistory.map((ch) => ({
                ...ch,
                endDate: ch.isCurrentJob ? undefined : ch.endDate || undefined,
              }))
            : undefined,
        personalLinks: extraLinks
          .map(normalizePersonalLink)
          .filter((link): link is PersonalLink => Boolean(link)),
      };

      const result = await saveProfile(payload);

      if (result?.otpRequired) {
        setShowOTPModal(true);
        setSaving(false);
        return;
      }

      await getProfile();
      setNotice("Profile updated successfully.");
      toast.success("Profile updated successfully!");
      setIsEditing(false);
    } catch (err: any) {
      const data = err.response?.data;
      if (data?.issues && Array.isArray(data.issues)) {
        const messages = data.issues.map((i: any) => {
          const field = i.path[i.path.length - 1];
          return `${field}: ${i.message}`;
        });
        setError(`Validation failed: ${messages.join(" | ")}`);
        toast.error(`Validation failed: ${messages[0]}`);
      } else {
        const msg = data?.message ?? err.message ?? "Failed to save profile";
        setError(msg);
        toast.error(msg);
      }
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setPhotoUploading(true);
      setError("");

      const localPreview = URL.createObjectURL(file);
      setPhotoPreview(localPreview);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("assetType", "IMAGE");
      formData.append("assetContext", "USER");
      formData.append("storagePath", "avatar");

      const asset = await uploadAsset(formData);
      const updatedProfile = await uploadPhoto(asset.id);

      const newPhotoUrl = updatedProfile?.profile?.photoUrl || localPreview;
      setPhotoPreview(newPhotoUrl);
      setForm((prev) => ({ ...prev, photoUrl: newPhotoUrl }));
      toast.success("Profile photo updated successfully!");
    } catch (err: any) {
      setPhotoPreview(form.photoUrl);
      const msg = err.response?.data?.message ?? err.message ?? "Failed to upload photo";
      setError(msg);
      toast.error(msg);
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleDeletePhoto = async () => {
    try {
      setPhotoUploading(true);
      setError("");
      await deletePhoto();
      setPhotoPreview("");
      setForm((prev) => ({ ...prev, photoUrl: "" }));
      await getProfile();
      toast.success("Profile photo removed");
    } catch (err: any) {
      setError(err.message || "Failed to delete photo");
      toast.error("Failed to delete photo");
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setResumeUploading(true);
      setError("");

      const formData = new FormData();
      formData.append("file", file);
      formData.append("assetType", "DOCUMENT");
      formData.append("assetContext", "USER");
      formData.append("storagePath", "documents");

      const asset = await uploadAsset(formData);
      await uploadResume(asset.id);
      await getProfile();
      toast.success("Resume uploaded successfully!");
    } catch (err: any) {
      const msg = err.response?.data?.message ?? err.message ?? "Failed to upload resume";
      setError(msg);
      toast.error(msg);
    } finally {
      setResumeUploading(false);
    }
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setCertificateUploading(true);
      setError("");

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("file", file);
        formData.append("assetType", "DOCUMENT");
        formData.append("assetContext", "USER");
        formData.append("storagePath", "certificates");

        const asset = await uploadAsset(formData);

        const safeTitle =
          file.name.length < 2
            ? `${file.name} Certificate`
            : file.name.length > 200
            ? file.name.substring(0, 195) + "..."
            : file.name;

        await uploadCertificate({
          title: safeTitle,
          assetId: asset.id,
        });
      }

      await getProfile();
      toast.success("Certificate(s) uploaded successfully!");
    } catch (err: any) {
      const msg = err.response?.data?.message ?? err.message ?? "Failed to upload certificate";
      setError(msg);
      toast.error(msg);
    } finally {
      setCertificateUploading(false);
    }
  };

  const handleCopyPublicUrl = () => {
    if (!profile?.id) return;
    const fullUrl = `${window.location.origin}/profile/${profile.id}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedLink(true);
    toast.success("Public profile link copied to clipboard!");
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const maxDobDate = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 13);
    return d.toISOString().split("T")[0];
  }, []);

  const handleTabClick = (tabId: TabId) => {
    setActiveTab(tabId);
    const element = document.getElementById(`section-${tabId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (loading && !profile) {
    return (
      <div className="flex min-h-[450px] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
        <span className="text-xs font-semibold text-slate-400">Loading profile data...</span>
      </div>
    );
  }

  // ==================== VIEW MODE ====================
  if (!isEditing) {
    return (
      <div className="w-full max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row gap-8 items-start min-h-screen text-slate-900 dark:text-slate-100">
        {/* Left Sidebar */}
        <aside className="w-full lg:w-[320px] shrink-0 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 flex flex-col items-center text-center">
            {/* Avatar */}
            <div className="relative mb-4 group">
              <div className="w-24 h-24 rounded-2xl bg-amber-100 dark:bg-amber-950/50 border-2 border-white dark:border-slate-800 shadow-md overflow-hidden flex items-center justify-center">
                {profile?.profile?.photoUrl ? (
                  <img
                    src={profile.profile.photoUrl}
                    alt={fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-black text-amber-700 dark:text-amber-400">
                    {fullName.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 flex items-center justify-center shadow-xs">
                <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
              </div>
            </div>

            {/* Name & Title */}
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white leading-tight">
              {fullName}
            </h2>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5 flex-wrap justify-center">
              <span>{form.currentRole || "Operations Specialist"}</span>
              {calculateAge(form.dob) !== null && (
                <>
                  <span>&bull;</span>
                  <span>{calculateAge(form.dob)} yrs</span>
                </>
              )}
              {form.countryName && (
                <>
                  <span>&bull;</span>
                  <span>{form.countryName}</span>
                </>
              )}
            </p>

            {/* Completeness Ring */}
            <div className="mt-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-100 dark:border-slate-800 w-full flex flex-col items-center">
              <div className="relative w-20 h-20 flex items-center justify-center mb-3">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    stroke="currentColor"
                    strokeWidth="7"
                    fill="none"
                    className="text-slate-200 dark:text-slate-700"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    stroke="currentColor"
                    strokeWidth="7"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 34}`}
                    strokeDashoffset={`${2 * Math.PI * 34 * (1 - completed / 100)}`}
                    strokeLinecap="round"
                    className={`transition-all duration-1000 ease-out ${
                      completed >= 80 ? "text-emerald-500" : "text-amber-500"
                    }`}
                  />
                </svg>
                <span className="absolute text-base font-black text-slate-900 dark:text-white">
                  {completed}%
                </span>
              </div>

              {/* Status Message */}
              {completion?.missingFields && completion.missingFields.length > 0 ? (
                <div className="space-y-2 text-center w-full">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                    <Sparkles className="w-3 h-3" />
                    {completion.missingFields.length} Step
                    {completion.missingFields.length > 1 ? "s" : ""} Remaining
                  </span>
                  <p className="text-[11px] text-slate-500 line-clamp-1">
                    {MISSING_FIELD_LABELS[completion.missingFields[0]] || completion.missingFields[0]}
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="w-full mt-2 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Complete Profile</span>
                  </button>
                </div>
              ) : (
                <div className="text-center space-y-1">
                  <div className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck className="w-4 h-4" />
                    <span>100% Certified Profile</span>
                  </div>
                  <p className="text-[11px] text-slate-400">Fully verified for accredited diplomas</p>
                </div>
              )}
            </div>

            {/* Metrics List */}
            <div className="w-full mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-3 text-left">
              <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-850/40 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                  Enrolled
                </span>
                <span className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                  {learningStats?.enrolledCount || 0}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-850/40 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                  Diplomas
                </span>
                <span className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-amber-500" />
                  {learningStats?.completedCount || 0}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-850/40 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                  Completed
                </span>
                <span className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  {learningStats?.completedCount || 0}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-850/40 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                  Hours Active
                </span>
                <span className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-indigo-500" />
                  {dashboardData?.totalLearningTime
                    ? (dashboardData.totalLearningTime / 3600).toFixed(1)
                    : "0"}
                  h
                </span>
              </div>
            </div>

            {/* Quick Public Link */}
            {profile?.id && (
              <button
                type="button"
                onClick={handleCopyPublicUrl}
                className="w-full mt-4 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
              >
                {copiedLink ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                )}
                <span>{copiedLink ? "Link Copied!" : "Copy Public Dossier Link"}</span>
              </button>
            )}
          </div>
        </aside>

        {/* Right Content Area */}
        <main className="flex-1 min-w-0 space-y-6">
          {/* Header Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                <span>User Portal</span>
                <span>&bull;</span>
                <span className="text-amber-600 dark:text-amber-400">Personal Dossier</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Member Profile
              </h1>
            </div>

            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-950 font-bold text-sm shadow-sm transition-all self-start sm:self-auto"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Profile</span>
            </button>
          </div>

          {/* Feedback Notice */}
          {(notice || error) && (
            <div
              className={`p-4 rounded-xl border flex items-center gap-3 text-sm font-semibold ${
                error
                  ? "bg-red-50 dark:bg-red-950/40 border-red-200 text-red-800 dark:text-red-300"
                  : "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 text-emerald-800 dark:text-emerald-300"
              }`}
            >
              {error ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
              <span>{error || notice}</span>
            </div>
          )}

          {/* Earned Certifications Overview */}
          <article className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-600" />
                <span>Earned Certifications & SOP Masteries</span>
              </h2>
              <button
                onClick={() => navigate("/course-completed")}
                className="text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1"
              >
                <span>View all credentials</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {earnedCertifications.length > 0 ? (
                earnedCertifications.map((item: any) => {
                  const isCompleted = item.statusText === "Completed";
                  return (
                    <div key={item.id} className="py-3.5 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            isCompleted
                              ? "bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                          }`}
                        >
                          <Award className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                            {item.title}
                          </h4>
                          <p className="text-xs text-slate-400">
                            {item.category || "Operational Mastery"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isCompleted
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                          }`}
                        >
                          {isCompleted ? "Accredited" : "In Progress"}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-6 text-center text-xs text-slate-400">
                  No earned certifications recorded yet.
                </div>
              )}
            </div>
          </article>

          {/* Personal Information */}
          <article className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-amber-600" />
              <span>Personal Identity & Demographics</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  First Name
                </span>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {form.firstName || "—"}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Last Name
                </span>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {form.lastName || "—"}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Email Address
                </span>
                <p className="text-sm font-semibold text-slate-900 dark:text-white break-all">
                  {profile?.email || "—"}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Date of Birth
                </span>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {formatDate(form.dob)}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Gender
                </span>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {toTitle(form.gender) || "—"}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Location
                </span>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {[form.city, form.countryName].filter(Boolean).join(", ") || "—"}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Phone Number
                </span>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {form.mobileNumber
                    ? `${form.phoneCountryCode} ${form.mobileNumber}`
                    : "Not provided"}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Preferred Language
                </span>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {form.preferredLanguage || "English"}
                </p>
              </div>
            </div>
          </article>

          {/* Professional Information */}
          <article className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-amber-600" />
              <span>Professional Experience & Competencies</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Current Role
                </span>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {form.currentRole || "—"}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Current Employer
                </span>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {form.currentEmployer || "—"}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Experience Level
                </span>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {toTitle(form.experienceLevel) || "—"}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Industry Domain
                </span>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {form.industry || "—"}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Graduation Year
                </span>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {form.educationCompletionYear || "—"}
                </p>
              </div>
            </div>

            {/* Learning Interests Chips */}
            {learningInterests.length > 0 && (
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Training Interests
                </span>
                <div className="flex flex-wrap gap-2">
                  {learningInterests.map((interest) => (
                    <span
                      key={interest}
                      className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </article>

          {/* Certificate Credential Identity */}
          <article className="bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-800/40 rounded-2xl p-6 shadow-sm bg-gradient-to-br from-white via-white to-amber-50/20 dark:from-slate-900 dark:to-amber-950/20">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              <span>Accredited Diploma Name</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Official Name Engraved on Diplomas
                </span>
                <p className="text-base font-black text-amber-900 dark:text-amber-300">
                  {form.certificateName || fullName}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Title / Honorific
                </span>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {toTitle(form.titlePrefix) || "None"}
                </p>
              </div>
            </div>
          </article>

          {/* Documents & Links Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Links */}
            <article className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Link2 className="w-4 h-4 text-amber-600" />
                <span>Web & Portfolio Links</span>
              </h2>

              <div className="space-y-3">
                {extraLinks.filter((l) => cleanUrl(l.url)).length > 0 ? (
                  extraLinks
                    .filter((l) => cleanUrl(l.url))
                    .map((link, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-400">{link.title || "Link"}:</span>
                        <a
                          href={link.url.startsWith("http") ? link.url : `https://${link.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1 truncate max-w-[200px]"
                        >
                          <span>{link.url}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      </div>
                    ))
                ) : (
                  <p className="text-xs text-slate-400">No external links registered.</p>
                )}
              </div>
            </article>

            {/* Documents */}
            <article className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-600" />
                <span>Verified Documents</span>
              </h2>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-bold uppercase tracking-wider">CV / Resume:</span>
                  {form.resumeUrl ? (
                    <a
                      href={form.resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-700 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{extractFilename(form.resumeUrl)}</span>
                    </a>
                  ) : (
                    <span className="text-slate-400">Not uploaded</span>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-bold uppercase tracking-wider">Certificates:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {certificates.length} document{certificates.length !== 1 ? "s" : ""} on record
                  </span>
                </div>
              </div>
            </article>
          </div>
        </main>
      </div>
    );
  }

  // ==================== EDIT MODE ====================
  return (
    <div className="w-full max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row gap-8 items-start min-h-screen text-slate-900 dark:text-slate-100">
      {/* Left Sidebar */}
      <aside className="w-full lg:w-[320px] shrink-0 space-y-6 lg:sticky lg:top-24">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-2xl bg-amber-100 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 overflow-hidden mb-3 flex items-center justify-center">
            {photoPreview ? (
              <img src={photoPreview} alt={fullName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl font-bold text-amber-700">{fullName.charAt(0)}</span>
            )}
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
            {fullName}
          </h2>
          <span className="text-xs text-amber-700 dark:text-amber-400 font-semibold mt-0.5">
            Editing Profile Mode
          </span>

          {/* Completeness Ring */}
          <div className="mt-4 flex items-center gap-3 w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800">
            <span className="text-2xl font-black text-amber-600">{completed}%</span>
            <div className="text-left text-[11px] text-slate-500 leading-tight">
              <span>Goal: 100% completion unlocks verifiable diplomas</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full mt-4 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            <span>Save Changes</span>
          </button>

          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="w-full mt-2 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            Cancel editing
          </button>
        </div>

        {/* Section Jump Tabs */}
        <nav className="space-y-1.5">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const progress = getTabProgress(tab.id);
            const IconComp = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabClick(tab.id)}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
                  isActive
                    ? "bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700 font-bold text-amber-950 dark:text-amber-200 shadow-2xs"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-2.5 text-xs font-bold">
                  <IconComp className="w-4 h-4 text-amber-600" />
                  <span>{tab.label}</span>
                </div>
                <span className="text-[11px] font-semibold text-slate-400">{progress}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content: Edit Form */}
      <main className="flex-1 min-w-0 space-y-8">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Profile & Account Setup
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              Edit Profile Dossier
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>Save Profile</span>
            </button>
          </div>
        </div>

        {/* Notices */}
        {(notice || error) && (
          <div
            className={`p-4 rounded-xl border flex items-center gap-3 text-sm font-semibold ${
              error
                ? "bg-red-50 dark:bg-red-950/40 border-red-200 text-red-800 dark:text-red-300"
                : "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 text-emerald-800 dark:text-emerald-300"
            }`}
          >
            {error ? <AlertCircle className="w-5 h-5 shrink-0" /> : <CheckCircle2 className="w-5 h-5 shrink-0" />}
            <span>{error || notice}</span>
          </div>
        )}

        {/* SECTION 1: PERSONAL */}
        <section
          id="section-personal"
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-sm scroll-mt-24"
        >
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <User className="w-4 h-4 text-amber-600" />
              <span>Personal Details & Demographics</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Core identity fields used for authentication and official accreditation.</p>
          </div>

          {/* Photo Dropzone */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
              Profile Photo
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-5 p-4 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl bg-slate-50/50 dark:bg-slate-850">
              <div className="w-18 h-18 rounded-2xl bg-amber-100 dark:bg-amber-950/60 overflow-hidden flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700 shadow-2xs relative">
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-amber-600" />
                )}
                {photoUploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  </div>
                )}
              </div>

              <div className="space-y-1.5 text-center sm:text-left">
                <div className="flex items-center gap-3 justify-center sm:justify-start">
                  <label className="cursor-pointer px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5" />
                    <span>{photoPreview ? "Change Photo" : "Upload Photo"}</span>
                    <input type="file" accept="image/*" hidden onChange={handlePhotoUpload} />
                  </label>
                  {photoPreview && (
                    <button
                      type="button"
                      onClick={handleDeletePhoto}
                      className="text-xs font-bold text-rose-600 hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">Square JPG or PNG up to 2 MB.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                First Name <span className="text-rose-500">*</span>
              </label>
              <input
                className="w-full px-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium"
                value={form.firstName}
                onChange={updateField("firstName")}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Last Name <span className="text-rose-500">*</span>
              </label>
              <input
                className="w-full px-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium"
                value={form.lastName}
                onChange={updateField("lastName")}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Primary Email <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                <Lock className="w-3 h-3" /> OTP verification required to change
              </span>
            </div>
            <input
              className="w-full px-4 py-2.5 text-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl text-slate-500 cursor-not-allowed font-medium"
              value={profile?.email ?? ""}
              readOnly
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="sm:col-span-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Title / Prefix
              </label>
              <select
                className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-medium cursor-pointer"
                value={form.titlePrefix}
                onChange={updateField("titlePrefix")}
              >
                <option value="">None</option>
                <option value="MR">Mr.</option>
                <option value="MRS">Mrs.</option>
                <option value="MS">Ms.</option>
                <option value="DR">Dr.</option>
                <option value="PROF">Prof.</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Name on Diplomas & Certificates <span className="text-rose-500">*</span>
              </label>
              <input
                className="w-full px-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 font-semibold"
                value={form.certificateName}
                onChange={updateField("certificateName")}
              />
              <p className="mt-1 text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                Exact name engraved on official accredited certificates.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Preferred Language
              </label>
              <select
                className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-medium cursor-pointer"
                value={form.preferredLanguage}
                onChange={updateField("preferredLanguage")}
              >
                <option value="English">English</option>
                {new LanguageList().getData().map((lang: { code: string; language: string }) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.language}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Date of Birth
              </label>
              <input
                type="date"
                max={maxDobDate}
                className="w-full px-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-medium"
                value={form.dob}
                onChange={updateField("dob")}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Gender
              </label>
              <select
                className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-medium cursor-pointer"
                value={form.gender}
                onChange={updateField("gender")}
              >
                <option value="">Select gender...</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
                <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Country <span className="text-rose-500">*</span>
              </label>
              <select
                className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-medium cursor-pointer"
                value={form.countryName}
                onChange={(e) => {
                  const countryName = e.target.value;
                  setForm((current) => ({
                    ...current,
                    countryName,
                    phoneCountryCode: getCountryCallingCode(countryName),
                  }));
                }}
              >
                <option value="">Select country</option>
                {countries.map((country) => (
                  <option key={country.isoCode} value={country.name}>
                    {country.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                City
              </label>
              <input
                className="w-full px-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-medium"
                value={form.city}
                onChange={updateField("city")}
                placeholder="e.g. Muscat or Dubai"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Phone Number
              </label>
              <div className="flex border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-amber-500/20">
                <span className="w-18 bg-slate-100 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 px-3 py-2.5 text-xs font-mono font-bold text-slate-600 dark:text-slate-300 flex items-center justify-center select-none">
                  {form.phoneCountryCode || "+91"}
                </span>
                <input
                  type="tel"
                  className="w-full px-4 py-2.5 text-sm bg-white dark:bg-slate-900 border-none focus:outline-none font-medium"
                  value={form.mobileNumber}
                  onChange={(e) => {
                    let mobileNumber = e.target.value.replace(/\D/g, "");
                    setForm((current) => ({ ...current, mobileNumber }));
                  }}
                  placeholder="Digits"
                  inputMode="numeric"
                />
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: PROFESSIONAL */}
        <section
          id="section-professional"
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-sm scroll-mt-24"
        >
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-amber-600" />
              <span>Professional Profile & Work Experience</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Career trajectory and operational domain expertise.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Current Role
              </label>
              <input
                type="text"
                value={form.currentRole}
                onChange={updateField("currentRole")}
                placeholder="e.g. Facilities Operations Lead"
                className="w-full px-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Experience Level
              </label>
              <select
                value={form.experienceLevel}
                onChange={updateField("experienceLevel")}
                className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-medium cursor-pointer"
              >
                <option value="">Select experience level...</option>
                <option value="BEGINNER">Junior / Entry Level (0-2 yrs)</option>
                <option value="INTERMEDIATE">Mid-Level Specialist (3-5 yrs)</option>
                <option value="ADVANCED">Senior Professional (6-10 yrs)</option>
                <option value="EXPERT">Executive / Director (10+ yrs)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Industry Domain
              </label>
              <select
                value={form.industry}
                onChange={updateField("industry")}
                className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-medium cursor-pointer"
              >
                <option value="">Select industry...</option>
                <option>Facilities & Environmental Services</option>
                <option>Healthcare & Sanitation</option>
                <option>Commercial Real Estate</option>
                <option>Technology & Data Centers</option>
                <option>Hospitality & Tourism</option>
                <option>Education & Institutional</option>
                <option>Government & Public Sector</option>
                <option>Manufacturing & Logistics</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Current Employer
              </label>
              <input
                type="text"
                value={form.currentEmployer}
                onChange={updateField("currentEmployer")}
                placeholder="Organization or Company Name"
                className="w-full px-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Graduation Completion Year
            </label>
            <input
              type="number"
              min="1950"
              max={new Date().getFullYear() + 10}
              value={form.educationCompletionYear}
              onChange={updateField("educationCompletionYear")}
              placeholder="e.g. 2023"
              className="w-full max-w-xs px-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-medium"
            />
          </div>

          {/* Career History Section */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <CareerHistorySection
              value={careerHistory}
              onChange={setCareerHistory}
              currentEmployer={form.currentEmployer}
            />
          </div>

          {/* Preferred Skills */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Preferred Skills & Competencies
            </label>
            <div className="relative max-w-lg">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={skillQuery}
                  onChange={(e) => {
                    setSkillQuery(e.target.value);
                    setSkillsOpen(true);
                  }}
                  onFocus={() => setSkillsOpen(true)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSkill(skillQuery);
                    }
                    if (e.key === "Escape") setSkillsOpen(false);
                  }}
                  placeholder={skillsLoading ? "Loading skills..." : "Type to search skills..."}
                  className="w-full px-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-medium"
                />
                <button
                  type="button"
                  onClick={() => addSkill(skillQuery)}
                  disabled={!skillQuery.trim()}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs disabled:opacity-40 transition-all shadow-2xs"
                >
                  Add
                </button>
              </div>

              {skillsOpen && (filteredSkills.length > 0 || skillQuery.trim()) && (
                <div className="absolute z-20 mt-1.5 w-full max-h-56 overflow-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-1.5 shadow-xl">
                  {filteredSkills.map((skill) => (
                    <button
                      type="button"
                      key={skill.id}
                      onClick={() => addSkill(skill.name)}
                      className="block w-full rounded-lg px-3 py-2 text-left text-xs font-semibold hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
                    >
                      {skill.name}
                    </button>
                  ))}
                  {skillQuery.trim() &&
                    !skills.some((s) => s.name.toLowerCase() === skillQuery.trim().toLowerCase()) && (
                      <button
                        type="button"
                        onClick={() => addSkill(skillQuery)}
                        className="block w-full rounded-lg border-t border-slate-100 dark:border-slate-800 px-3 py-2 text-left text-xs font-bold text-amber-700 dark:text-amber-400 hover:bg-amber-50"
                      >
                        + Create &ldquo;{skillQuery.trim()}&rdquo;
                      </button>
                    )}
                </div>
              )}

              {selectedSkills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {selectedSkills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => setSelectedSkills((cur) => cur.filter((i) => i !== skill))}
                        className="text-slate-400 hover:text-rose-500"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Learning Interests */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Learning Interests
            </label>
            <input
              type="text"
              value={learningInterestInput}
              onChange={(e) => setLearningInterestInput(e.target.value)}
              onKeyDown={handleAddLearningInterest}
              placeholder="Type topic and press Enter..."
              className="w-full max-w-lg px-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-medium"
            />
            {learningInterests.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {learningInterests.map((interest) => (
                  <span
                    key={interest}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 text-xs font-semibold rounded-full"
                  >
                    <span>{interest}</span>
                    <button
                      type="button"
                      onClick={() => removeLearningInterest(interest)}
                      className="text-amber-600 hover:text-rose-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* SECTION 3: PERSONAL LINKS */}
        <section
          id="section-links"
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-sm scroll-mt-24"
        >
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Link2 className="w-4 h-4 text-amber-600" />
              <span>Personal & Digital Links</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Showcase your verified external portfolios, GitHub, or LinkedIn.</p>
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Personal Site & Social Handles
            </label>
            {extraLinks.map((link, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row gap-2.5 items-center">
                <input
                  type="text"
                  value={link.title}
                  placeholder="Title (e.g. LinkedIn, Portfolio)"
                  onChange={(e) => handleLinkChange(idx, "title", e.target.value)}
                  className="w-full sm:w-1/3 px-3.5 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-medium"
                />
                <input
                  type="url"
                  value={link.url}
                  placeholder="https://..."
                  onChange={(e) => handleLinkChange(idx, "url", e.target.value)}
                  className="w-full sm:flex-1 px-3.5 py-2 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-medium"
                />
                {extraLinks.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveLink(idx)}
                    className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add another link</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Portfolio URL
              </label>
              <input
                type="url"
                value={form.portfolioUrl}
                onChange={updateField("portfolioUrl")}
                placeholder="https://"
                className="w-full px-4 py-2.5 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Website URL
              </label>
              <input
                type="url"
                value={form.websiteUrl}
                onChange={updateField("websiteUrl")}
                placeholder="https://"
                className="w-full px-4 py-2.5 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-medium"
              />
            </div>
          </div>
        </section>

        {/* SECTION 4: DOCUMENTS */}
        <section
          id="section-documents"
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-sm scroll-mt-24"
        >
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-600" />
              <span>Supporting Documents & Credentials</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Upload official CV and external certifications.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* CV / Resume */}
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                CV / Professional Resume
              </label>
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-5 text-center bg-slate-50/50 dark:bg-slate-850 relative">
                {resumeUploading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-amber-600 mx-auto" />
                ) : (
                  <label className="cursor-pointer block">
                    <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      {form.resumeUrl ? "Replace Resume" : "Upload Resume (PDF/DOC)"}
                    </span>
                    <span className="text-[10px] text-slate-400">Up to 5 MB</span>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      hidden
                      onChange={handleResumeUpload}
                    />
                  </label>
                )}
              </div>

              {form.resumeUrl && (
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {extractFilename(form.resumeUrl)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await deleteResume();
                        await getProfile();
                        toast.success("Resume deleted");
                      } catch {
                        setError("Failed to delete resume");
                      }
                    }}
                    className="text-rose-600 font-bold hover:underline shrink-0 ml-2"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>

            {/* External Certifications */}
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                External Industry Certificates
              </label>
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-5 text-center bg-slate-50/50 dark:bg-slate-850 relative">
                {certificateUploading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-amber-600 mx-auto" />
                ) : (
                  <label className="cursor-pointer block">
                    <Plus className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      Add Certificates
                    </span>
                    <span className="text-[10px] text-slate-400">PDF, PNG, JPG (Multiple)</span>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      multiple
                      hidden
                      onChange={handleDocumentUpload}
                    />
                  </label>
                )}
              </div>

              {certificates.length > 0 && (
                <div className="space-y-1.5">
                  {certificates.map((cert) => (
                    <div
                      key={cert.id}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Award className="w-4 h-4 text-amber-600 shrink-0" />
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {cert.title}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!cert.id) return;
                          try {
                            await deleteCertificate(cert.id);
                            await getProfile();
                            toast.success("Certificate deleted");
                          } catch {
                            setError("Failed to delete certificate");
                          }
                        }}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* OTP Modal */}
      {showOTPModal && (
        <ProfileVerifyOTP
          isOpen={showOTPModal}
          onClose={() => setShowOTPModal(false)}
          onSuccess={() => {
            getProfile();
            setIsEditing(false);
            setShowOTPModal(false);
            toast.success("Profile saved successfully.");
          }}
        />
      )}
    </div>
  );
};

export default ProfileData;
