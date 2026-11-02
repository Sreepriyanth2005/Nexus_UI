import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import "../../components/common/profile/ProfileData.css";

import { useProfile } from "../../hooks/profile/useProfile";
import { useProfileAssets } from "../../hooks/profile/useProfileAssets";
import { useProfileCertificates } from "../../hooks/profile/useProfileCertificates";
import { useAssets } from "../../hooks/asset/useAssets";
import { useSkills } from "../../hooks/useMaster";

import type { UpdateProfileRequest, CareerHistory, PersonalLink } from "../../types/profile.type";

import { Country } from "country-state-city";
import parsePhoneNumberFromString from "libphonenumber-js";
import LanguageList from "language-list";
import {
  Loader2,
  Upload,
  Plus,
  X,
  ShieldCheck,
  CheckCircle2,
  User,
  Briefcase,
  Link2,
  FileText,
  Trash2,
  Globe,
  Camera,
  ArrowRight,
  ArrowLeft,
  Lock,
  Sparkles,
  ExternalLink,
  Award,
  Check,
  Building2,
  Calendar,
  AlertCircle,
  Copy,
  ChevronRight,
  Eye
} from "lucide-react";

import CareerHistorySection from "../../components/common/profile/modals/CareerHistorySection";
import nexusLogo from "../../assets/brand/nexus-logo-ink.svg";
import { Skeleton } from "../../components/ui/Skeleton/Skeleton";
import ProfileVerifyOTP from "../../components/common/profile/ProfileVerifyOTP";

const CompleteProfileSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Header Skeleton */}
      <header className="h-18 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 sm:px-10 shrink-0">
        <Skeleton className="h-9 w-36 rounded-lg" />
        <Skeleton className="h-9 w-32 rounded-xl" />
      </header>

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Sidebar Skeleton */}
          <div className="lg:col-span-4 space-y-6">
            <div className="space-y-3">
              <Skeleton className="h-6 w-32 rounded-full" />
              <Skeleton className="h-8 w-64 rounded-lg" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-6 w-14" />
              </div>
              <Skeleton className="h-2.5 w-full rounded-full" />
            </div>

            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-2xl" />
              ))}
            </div>
          </div>

          {/* Right Content Skeleton */}
          <div className="lg:col-span-8">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6 sm:p-10 space-y-6">
              <Skeleton className="h-6 w-56 rounded-lg" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Skeleton className="h-11 w-full rounded-xl" />
                <Skeleton className="h-11 w-full rounded-xl" />
              </div>
              <Skeleton className="h-11 w-full rounded-xl" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Skeleton className="h-11 w-full rounded-xl" />
                <Skeleton className="h-11 w-full rounded-xl" />
              </div>
              <Skeleton className="h-32 w-full rounded-2xl" />
              <div className="flex justify-between pt-6 border-t border-slate-100 dark:border-slate-800">
                <Skeleton className="h-10 w-28 rounded-xl" />
                <Skeleton className="h-10 w-36 rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

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

const tabs: Array<{ id: TabId; label: string; sublabel: string; icon: any }> = [
  { id: "personal", label: "Personal Details", sublabel: "Core Identity & Credentials", icon: User },
  { id: "professional", label: "Professional", sublabel: "Career, Industry & Skills", icon: Briefcase },
  { id: "links", label: "Personal Links", sublabel: "Portfolios & Social Handles", icon: Link2 },
  { id: "documents", label: "Documents", sublabel: "Resume & Evidence", icon: FileText },
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
  preferredLanguage: "English",
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

const CompleteProfile: React.FC = () => {
  const navigate = useNavigate();

  const { uploadPhoto, uploadResume, deletePhoto, deleteResume } = useProfileAssets();
  const { profile, getProfile, saveProfile, loading } = useProfile();
  const { data: skills = [], isLoading: skillsLoading } = useSkills();
  const { uploadCertificate, deleteCertificate, certificates, refreshCertificates } = useProfileCertificates();
  const { uploadAsset } = useAssets();

  const [activeTab, setActiveTab] = useState<TabId>("personal");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
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
    .filter((skill) => !selectedSkills.some((selected) => selected.toLowerCase() === skill.name.toLowerCase()))
    .filter((skill) => !normalizedSkillQuery || skill.name.toLowerCase().includes(normalizedSkillQuery))
    .slice(0, 12);

  const addSkill = (name: string) => {
    const trimmedName = name.trim();
    if (!trimmedName || selectedSkills.some((selected) => selected.toLowerCase() === trimmedName.toLowerCase())) return;
    setSelectedSkills((current) => [...current, trimmedName]);
    setSkillQuery("");
    setSkillsOpen(false);
  };

  useEffect(() => {
    getProfile();
  }, [getProfile]);

  useEffect(() => {
    if (!profile) return;

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
      educationCompletionYear: prof.educationCompletionYear ? prof.educationCompletionYear.toString() : "",
      websiteUrl: p.websiteUrl || "",
      portfolioUrl: prof.portfolioUrl || "",
      photoUrl: p.photoUrl || "",
      resumeUrl: p.resumeUrl || "",
    });

    setPhotoPreview(p.photoUrl || "");
    setExtraLinks(profile.personalLinks?.length ? profile.personalLinks : [{ title: "LinkedIn", url: "" }]);
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
  }, [profile, refreshCertificates]);

  const completed = Number(profile?.profileCompleteness || 0);

  const getTabProgress = useCallback((tabId: TabId): { filled: number; total: number; isDone: boolean } => {
    switch (tabId) {
      case "personal": {
        let filled = 0;
        const total = 10;
        if (form.firstName) filled++;
        if (form.lastName) filled++;
        if (profile?.email) filled++;
        if (form.certificateName) filled++;
        if (form.dob) filled++;
        if (form.gender) filled++;
        if (form.city) filled++;
        if (form.countryName) filled++;
        if (form.mobileNumber) filled++;
        if (form.photoUrl) filled++;
        return { filled, total, isDone: filled >= 8 };
      }
      case "professional": {
        let filled = 0;
        const total = 4;
        if (form.currentRole) filled++;
        if (form.industry) filled++;
        if (form.experienceLevel) filled++;
        if (selectedSkills.length > 0 || learningInterests.length > 0) filled++;
        return { filled, total, isDone: filled >= 3 };
      }
      case "links": {
        let filled = 0;
        const total = 2;
        if (extraLinks.some((l) => cleanUrl(l.url))) filled++;
        if (form.portfolioUrl || form.websiteUrl) filled++;
        return { filled, total, isDone: filled >= 1 };
      }
      case "documents": {
        let filled = 0;
        const total = 2;
        if (form.resumeUrl) filled++;
        if (certificates.length > 0) filled++;
        return { filled, total, isDone: filled >= 1 };
      }
      default:
        return { filled: 0, total: 1, isDone: false };
    }
  }, [form, extraLinks, certificates, profile, selectedSkills, learningInterests]);

  const updateField = (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
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

  const handleSave = async (isFinal: boolean = false) => {
    setSaving(true);
    setError("");
    setNotice("");

    // Phone validation
    let mobileNumberToSave = form.mobileNumber.trim() || null;
    let phoneCountryCodeToSave = form.phoneCountryCode || null;
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

      if (phoneNum && !phoneNum.isValid()) {
        setError("Invalid mobile number format. Please check your phone digits and country code.");
        setSaving(false);
        return false;
      }
      if (phoneNum?.isValid()) {
        mobileNumberToSave = phoneNum.nationalNumber;
        phoneCountryCodeToSave = `+${phoneNum.countryCallingCode}`;
      }
    }

    if (form.dob) {
      const dob = new Date(form.dob);
      const today = new Date();
      if (dob > today) {
        setError("Date of birth cannot be in the future.");
        setSaving(false);
        return false;
      }
      const age = (Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
      if (age < 13) {
        setError("User must be at least 13 years of age.");
        setSaving(false);
        return false;
      }
    }

    const incompleteCareer = careerHistory.find((item) => {
      const hasAnyValue = Boolean(
        item.employer?.trim() ||
        item.jobTitle?.trim() ||
        item.jobDescription?.trim() ||
        item.startDate ||
        item.endDate
      );

      return hasAnyValue && (!item.employer?.trim() || !item.jobTitle?.trim() || !item.startDate);
    });

    if (incompleteCareer) {
      setError("Please fill out the employer, job title, and start date for each experience entry, or delete the empty card.");
      setSaving(false);
      return false;
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
        phoneCountryCode: phoneCountryCodeToSave,
        mobileNumber: mobileNumberToSave,
        currentRole: form.currentRole.trim() || null,
        currentEmployer: form.currentEmployer.trim() || null,
        experienceLevel: (form.experienceLevel as any) || null,
        industry: form.industry.trim() || null,
        educationCompletionYear: form.educationCompletionYear ? parseInt(form.educationCompletionYear, 10) : null,
        websiteUrl: cleanUrl(form.websiteUrl) || null,
        portfolioUrl: cleanUrl(form.portfolioUrl) || null,
        skills: selectedSkills,
        learningInterests: learningInterests,
        careerHistory: careerHistory
          .filter((item) => item.employer?.trim() || item.jobTitle?.trim() || item.startDate || item.endDate)
          .map((item) => ({
            ...item,
            endDate: item.isCurrentJob ? null : item.endDate || null,
          })),
        personalLinks: extraLinks
          .map(normalizePersonalLink)
          .filter((link): link is PersonalLink => Boolean(link)),
      };

      const result = await saveProfile(payload);

      if (result?.otpRequired) {
        setShowOTPModal(true);
        return false;
      }

      await getProfile();
      setNotice("Profile changes saved successfully.");
      toast.success("Profile saved successfully");

      if (isFinal) {
        localStorage.setItem("skip_complete_profile", "true");
        navigate("/member-dashboard");
      }
      return true;
    } catch (err: any) {
      const errMsg = err.response?.data?.message ?? err.message ?? "Failed to save profile";
      setError(errMsg);
      toast.error(errMsg);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async () => {
    const success = await handleSave(false);
    if (success) {
      const tabOrder: TabId[] = ["personal", "professional", "links", "documents"];
      const currentIndex = tabOrder.indexOf(activeTab);
      if (currentIndex < tabOrder.length - 1) {
        setActiveTab(tabOrder[currentIndex + 1]);
      }
    }
  };

  const handlePrevious = () => {
    const tabOrder: TabId[] = ["personal", "professional", "links", "documents"];
    const currentIndex = tabOrder.indexOf(activeTab);
    if (currentIndex > 0) {
      setActiveTab(tabOrder[currentIndex - 1]);
    }
  };

  const handleSkip = () => {
    if (profile?.id) {
      localStorage.setItem(`skip_complete_profile_${profile.id}`, "true");
    } else {
      localStorage.setItem("skip_complete_profile", "true");
    }
    navigate("/member-dashboard");
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setPhotoUploading(true);
      setError("");
      const formData = new FormData();
      formData.append("file", file);
      formData.append("assetType", "IMAGE");
      formData.append("assetContext", "USER");
      formData.append("storagePath", "avatar");

      const asset = await uploadAsset(formData);
      const updatedProfile = await uploadPhoto(asset.id);

      setPhotoPreview(updatedProfile?.profile?.photoUrl || URL.createObjectURL(file));
      setForm((prev) => ({ ...prev, photoUrl: updatedProfile?.profile?.photoUrl || "" }));
      toast.success("Profile photo updated successfully!");
    } catch (err: any) {
      setError(err.message || "Failed to upload photo");
      toast.error("Failed to upload photo");
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
      setError(err.message || "Failed to remove photo");
      toast.error("Failed to remove photo");
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
      setError(err.message || "Failed to upload resume");
      toast.error("Failed to upload resume");
    } finally {
      setResumeUploading(false);
    }
  };

  const handleDeleteResume = async () => {
    try {
      setResumeUploading(true);
      setError("");
      await deleteResume();
      setForm((prev) => ({ ...prev, resumeUrl: "" }));
      await getProfile();
      toast.success("Resume removed");
    } catch (err: any) {
      setError(err.message || "Failed to delete resume");
      toast.error("Failed to delete resume");
    } finally {
      setResumeUploading(false);
    }
  };

  const handleCertificateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    try {
      setCertificateUploading(true);
      setError("");

      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("assetType", "DOCUMENT");
        formData.append("assetContext", "USER");
        formData.append("storagePath", "certificates");

        const asset = await uploadAsset(formData);
        await uploadCertificate({
          title: file.name.length > 200 ? `${file.name.substring(0, 195)}...` : file.name,
          assetId: asset.id,
        });
      }

      await getProfile();
      toast.success("Certificate(s) uploaded successfully!");
    } catch (err: any) {
      setError(err.response?.data?.message ?? err.message ?? "Failed to upload certificate");
      toast.error("Failed to upload certificate");
    } finally {
      setCertificateUploading(false);
    }
  };

  const handleDeleteCertificate = async (certId: string) => {
    try {
      setError("");
      await deleteCertificate(certId);
      await getProfile();
      toast.success("Certificate deleted");
    } catch (err: any) {
      setError(err.message || "Failed to delete certificate");
      toast.error("Failed to delete certificate");
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

  if (loading && !profile) {
    return <CompleteProfileSkeleton />;
  }

  const currentTabIdx = tabs.findIndex((t) => t.id === activeTab);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="h-18 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-8 shrink-0 sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <img src={nexusLogo} alt="Nexus Academy" className="h-8 w-auto cursor-pointer" onClick={() => navigate("/member-dashboard")} />
          <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <span>Member Onboarding</span>
            <span>&bull;</span>
            <span className="text-amber-700 dark:text-amber-400 font-semibold">Profile Completion</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {profile?.email && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="font-medium">{profile.email}</span>
            </div>
          )}

          <button
            onClick={handleSkip}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <span>Skip for now</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Layout Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Sidebar (4 cols) */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
            {/* Header info */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Identity & Accreditations</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Complete your profile
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Finish the remaining sections to achieve 100% completion. A verified profile is required before accredited diplomas and credentials can be officially issued.
              </p>
            </div>

            {/* Completeness Card */}
            <div className="bg-gradient-to-br from-white via-white to-amber-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-amber-950/20 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Profile Completeness
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-black text-slate-900 dark:text-white">{completed}%</span>
                    <span className="text-xs font-semibold text-slate-500">
                      {completed >= 80 ? "Eligible for Diplomas" : "Incomplete"}
                    </span>
                  </div>
                </div>

                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm shadow-inner ${
                  completed >= 80
                    ? "bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300"
                    : "bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300"
                }`}>
                  {completed >= 80 ? <Check className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      completed >= 80 ? "bg-gradient-to-r from-emerald-500 to-teal-500" : "bg-gradient-to-r from-amber-500 to-yellow-500"
                    }`}
                    style={{ width: `${completed}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Minimum 80% to certify</span>
                  <span>100% Goal</span>
                </div>
              </div>
            </div>

            {/* Tabs List */}
            <nav className="space-y-2.5">
              {tabs.map((tab, idx) => {
                const isActive = activeTab === tab.id;
                const { filled, total, isDone } = getTabProgress(tab.id);
                const IconComponent = tab.icon;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl border text-left transition-all duration-200 group ${
                      isActive
                        ? "bg-amber-50/80 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700 shadow-sm"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                          isActive
                            ? "bg-amber-500 text-slate-950 font-bold"
                            : isDone
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                        }`}
                      >
                        {isDone ? <Check className="w-4 h-4 stroke-[2.5]" /> : <IconComponent className="w-4 h-4" />}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-bold ${isActive ? "text-amber-950 dark:text-amber-200" : "text-slate-800 dark:text-slate-200"}`}>
                            {tab.label}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-1">{tab.sublabel}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider ${
                          isDone
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                            : isActive
                            ? "bg-amber-200/80 text-amber-900 dark:bg-amber-900/60 dark:text-amber-300"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                        }`}
                      >
                        {filled}/{total}
                      </span>
                      <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isActive ? "translate-x-0.5 text-amber-700" : ""}`} />
                    </div>
                  </button>
                );
              })}
            </nav>

            {/* Security Guarantee Note */}
            <div className="p-4 rounded-2xl bg-slate-100/70 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 text-xs text-slate-500 space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                <span>Immutable Credential Security</span>
              </div>
              <p className="leading-relaxed text-[11px]">
                Your diploma name and sensitive identity fields are digitally signed for authenticity. Sensitive changes require OTP re-verification.
              </p>
            </div>
          </div>

          {/* Right Content Form Area (8 cols) */}
          <div className="lg:col-span-8">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6 sm:p-10 relative">
              {/* Error Notice */}
              {error && (
                <div className="mb-6 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 rounded-xl p-4 text-sm text-red-800 dark:text-red-300 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold">Unable to save profile</p>
                    <p className="text-xs text-red-700 dark:text-red-400 mt-0.5">{error}</p>
                  </div>
                </div>
              )}

              {/* Success Notice */}
              {notice && (
                <div className="mb-6 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl p-4 text-sm text-emerald-800 dark:text-emerald-300 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span className="font-medium">{notice}</span>
                </div>
              )}

              {/* Tab 1: Personal Identity */}
              {activeTab === "personal" && (
                <div className="space-y-6">
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                      <User className="w-4 h-4 text-amber-600" />
                      Core Identity & Accreditation Data
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Information used for age verification, identity validation, and official diploma generation.
                    </p>
                  </div>

                  {/* Profile Photo Uploader */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                      Profile Avatar
                    </label>
                    <div className="flex flex-col sm:flex-row items-center gap-5 p-5 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl bg-slate-50/60 dark:bg-slate-850 hover:bg-slate-50 transition-colors">
                      <div className="relative group shrink-0">
                        {photoPreview ? (
                          <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-white dark:border-slate-800 shadow-md">
                            <img src={photoPreview} alt="Avatar" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-20 h-20 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center justify-center font-bold text-xl shadow-inner">
                            {form.firstName ? form.firstName.charAt(0).toUpperCase() : <User className="w-8 h-8" />}
                          </div>
                        )}
                        {photoUploading && (
                          <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
                            <Loader2 className="w-6 h-6 text-white animate-spin" />
                          </div>
                        )}
                      </div>

                      <div className="space-y-2 flex-1 text-center sm:text-left">
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                          <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold shadow-sm transition-all">
                            <Camera className="w-3.5 h-3.5" />
                            <span>{photoPreview ? "Change Photo" : "Upload Photo"}</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handlePhotoUpload}
                              className="hidden"
                            />
                          </label>

                          {photoPreview && (
                            <button
                              type="button"
                              onClick={handleDeletePhoto}
                              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Remove</span>
                            </button>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Recommended: Square JPG, PNG or WebP, at least 400x400px. Max size 2 MB.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Names (2 cols) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                        First Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.firstName}
                        onChange={updateField("firstName")}
                        placeholder="e.g. Alex"
                        className="w-full px-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                        Last Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.lastName}
                        onChange={updateField("lastName")}
                        placeholder="e.g. Johnson"
                        className="w-full px-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium"
                      />
                    </div>
                  </div>

                  {/* Email (Readonly with badge) */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                        Primary Email Address <span className="text-rose-500">*</span>
                      </label>
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                        <Lock className="w-3 h-3 text-slate-400" /> OTP required to modify
                      </span>
                    </div>
                    <input
                      type="text"
                      disabled
                      value={profile?.email || ""}
                      className="w-full px-4 py-2.5 text-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl text-slate-600 dark:text-slate-300 font-medium cursor-not-allowed"
                    />
                  </div>

                  {/* Title Prefix & Certificate Name */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <div className="sm:col-span-1">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                        Title / Prefix
                      </label>
                      <select
                        value={form.titlePrefix}
                        onChange={updateField("titlePrefix")}
                        className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium cursor-pointer"
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
                        Name on Diplomas & Credentials <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.certificateName}
                        onChange={updateField("certificateName")}
                        placeholder="Full name as you wish it to appear on certificates"
                        className="w-full px-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all font-semibold"
                      />
                      <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-1 flex items-center gap-1 font-medium">
                        <Award className="w-3.5 h-3.5" />
                        This exact name will be engraved on your verified certificates.
                      </p>
                    </div>
                  </div>

                  {/* Language and Date of Birth */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                        Preferred Language
                      </label>
                      <select
                        value={form.preferredLanguage}
                        onChange={updateField("preferredLanguage")}
                        className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium cursor-pointer"
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
                        Date of Birth <span className="text-slate-400 font-normal lowercase">(used for age verification)</span>
                      </label>
                      <input
                        type="date"
                        value={form.dob}
                        onChange={updateField("dob")}
                        className="w-full px-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium"
                      />
                    </div>
                  </div>

                  {/* Gender and Country */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                        Gender
                      </label>
                      <select
                        value={form.gender}
                        onChange={updateField("gender")}
                        className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium cursor-pointer"
                      >
                        <option value="">Select gender...</option>
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                        Country <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={form.countryName}
                        onChange={(e) => {
                          const countryName = e.target.value;
                          const country = countries.find((item) => item.name === countryName);
                          const phoneCode = country?.phonecode ? `+${country.phonecode}` : "+91";
                          setForm((current) => ({
                            ...current,
                            countryName,
                            phoneCountryCode: phoneCode,
                          }));
                        }}
                        className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium cursor-pointer"
                      >
                        <option value="">Select country...</option>
                        {countries.map((country) => (
                          <option key={country.isoCode} value={country.name}>
                            {country.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* City and Mobile Number */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                        City
                      </label>
                      <input
                        type="text"
                        value={form.city}
                        onChange={updateField("city")}
                        placeholder="e.g. London or Toronto"
                        className="w-full px-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                        Mobile Phone Number
                      </label>
                      <div className="flex border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-amber-500/20 focus-within:border-amber-500 transition-all">
                        <span className="w-18 bg-slate-100 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700/60 px-3 py-2.5 text-xs font-mono font-bold text-slate-600 dark:text-slate-300 flex items-center justify-center select-none">
                          {form.phoneCountryCode || "+91"}
                        </span>
                        <input
                          type="tel"
                          value={form.mobileNumber}
                          onChange={(e) => {
                            let mobileNumber = e.target.value.replace(/\D/g, "");
                            setForm((current) => ({ ...current, mobileNumber }));
                          }}
                          placeholder="Phone digits"
                          inputMode="numeric"
                          className="w-full px-4 py-2.5 text-sm bg-white dark:bg-slate-900 border-none focus:outline-none font-medium"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Professional Details */}
              {activeTab === "professional" && (
                <div className="space-y-6">
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-amber-600" />
                      Professional Profile & Expertise
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Highlight your industry domain, role seniority, career milestones, and competencies.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                        Current Job Role
                      </label>
                      <input
                        type="text"
                        value={form.currentRole}
                        onChange={updateField("currentRole")}
                        placeholder="e.g. Lead Operations Director"
                        className="w-full px-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                        Experience Level
                      </label>
                      <select
                        value={form.experienceLevel}
                        onChange={updateField("experienceLevel")}
                        className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium cursor-pointer"
                      >
                        <option value="">Select experience level...</option>
                        <option value="BEGINNER">Junior / Associate (0 - 2 yrs)</option>
                        <option value="INTERMEDIATE">Mid-Level Professional (3 - 5 yrs)</option>
                        <option value="ADVANCED">Senior Specialist (6 - 10 yrs)</option>
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
                        className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium cursor-pointer"
                      >
                        <option value="">Select domain...</option>
                        <option value="Facilities & Environmental Services">Facilities & Environmental Services</option>
                        <option value="Commercial Real Estate">Commercial Real Estate</option>
                        <option value="Healthcare & Sanitation">Healthcare & Sanitation</option>
                        <option value="Technology & Data Centers">Technology & Data Centers</option>
                        <option value="Hospitality & Tourism">Hospitality & Tourism</option>
                        <option value="Education & Institutional">Education & Institutional</option>
                        <option value="Logistics & Supply Chain">Logistics & Supply Chain</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                        Education Graduation Year
                      </label>
                      <input
                        type="number"
                        min="1960"
                        max="2035"
                        value={form.educationCompletionYear}
                        onChange={updateField("educationCompletionYear")}
                        placeholder="e.g. 2022"
                        className="w-full px-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium"
                      />
                    </div>
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
                      Operational Skills & Competencies
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
                          placeholder={skillsLoading ? "Loading skills database..." : "Type skill name (e.g. Disinfection Protocols)..."}
                          className="w-full px-4 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium"
                        />
                        <button
                          type="button"
                          onClick={() => addSkill(skillQuery)}
                          disabled={!skillQuery.trim()}
                          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-sm transition-all disabled:opacity-40"
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
                              className="block w-full rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-800 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
                            >
                              {skill.name}
                            </button>
                          ))}
                          {skillQuery.trim() && !skills.some((s) => s.name.toLowerCase() === skillQuery.trim().toLowerCase()) && (
                            <button
                              type="button"
                              onClick={() => addSkill(skillQuery)}
                              className="block w-full rounded-lg border-t border-slate-100 dark:border-slate-800 px-3 py-2 text-left text-xs font-bold text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                            >
                              + Create new skill: &ldquo;{skillQuery.trim()}&rdquo;
                            </button>
                          )}
                        </div>
                      )}

                      {selectedSkills.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {selectedSkills.map((skill) => (
                            <span
                              key={skill}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-2xs"
                            >
                              <span>{skill}</span>
                              <button
                                type="button"
                                onClick={() => setSelectedSkills((current) => current.filter((item) => item !== skill))}
                                className="text-slate-400 hover:text-rose-500 transition-colors"
                                aria-label={`Remove ${skill}`}
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
                      Learning Interests & Training Goals
                    </label>
                    <input
                      type="text"
                      value={learningInterestInput}
                      onChange={(e) => setLearningInterestInput(e.target.value)}
                      onKeyDown={handleAddLearningInterest}
                      placeholder="Type a topic and press Enter (e.g. Hazardous Materials, Bio-decontamination)..."
                      className="w-full max-w-lg px-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium"
                    />

                    {learningInterests.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {learningInterests.map((interest) => (
                          <span
                            key={interest}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 shadow-2xs"
                          >
                            <span>{interest}</span>
                            <button
                              type="button"
                              onClick={() => removeLearningInterest(interest)}
                              className="text-amber-600 hover:text-rose-600 transition-colors"
                              aria-label={`Remove ${interest}`}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 3: Personal Links & Portfolios */}
              {activeTab === "links" && (
                <div className="space-y-6">
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                      <Link2 className="w-4 h-4 text-amber-600" />
                      Personal Links & Digital Presence
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Add your professional networks, LinkedIn, GitHub, and portfolio links.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      Social & Professional Links
                    </label>

                    {extraLinks.map((link, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row gap-2.5 items-center">
                        <select
                          value={link.title || "Website"}
                          onChange={(e) => handleLinkChange(idx, "title", e.target.value)}
                          className="w-full sm:w-1/3 px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-medium cursor-pointer"
                        >
                          <option value="LinkedIn">LinkedIn</option>
                          <option value="Website">Personal Website</option>
                          <option value="GitHub">GitHub</option>
                          <option value="Twitter">X / Twitter</option>
                          <option value="Portfolio">Portfolio</option>
                          <option value="Other">Other Link</option>
                        </select>

                        <div className="relative w-full flex-1">
                          <input
                            type="url"
                            value={link.url}
                            onChange={(e) => handleLinkChange(idx, "url", e.target.value)}
                            placeholder="https://..."
                            className="w-full pl-3 pr-8 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-medium font-mono text-xs"
                          />
                        </div>

                        {extraLinks.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveLink(idx)}
                            className="p-2 text-slate-400 hover:text-rose-500 transition-colors shrink-0 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Remove Link"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={handleAddLink}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition-colors mt-1"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add another profile link</span>
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
                        placeholder="https://yourwork.example.com"
                        className="w-full px-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-medium font-mono text-xs"
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
                        placeholder="https://company.example.com"
                        className="w-full px-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-medium font-mono text-xs"
                      />
                    </div>
                  </div>

                  {/* Public Profile URL Card */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                      Your Public Learning Dossier Link
                    </label>
                    <div className="flex items-center gap-2 max-w-lg">
                      <input
                        type="text"
                        readOnly
                        value={profile?.id ? `${window.location.origin}/profile/${profile.id}` : "Link generated after first save"}
                        className="w-full px-4 py-2 text-xs font-mono bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 select-all"
                      />
                      {profile?.id && (
                        <button
                          type="button"
                          onClick={handleCopyPublicUrl}
                          className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 shadow-sm transition-all"
                        >
                          {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedLink ? "Copied" : "Copy"}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Supporting Documents */}
              {activeTab === "documents" && (
                <div className="space-y-6">
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                      <FileText className="w-4 h-4 text-amber-600" />
                      Supporting Evidence & Document Records
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Upload your official CV/Resume and any external industry certifications for credential verification.
                    </p>
                  </div>

                  {/* Resume / CV Section */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      CV / Professional Resume
                    </label>

                    {form.resumeUrl ? (
                      <div className="flex items-center justify-between p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300 flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-bold text-sm text-slate-900 dark:text-white">Resume Document on File</div>
                            <div className="text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-1 mt-0.5 font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Verified & Active
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <label className="cursor-pointer px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors shadow-2xs">
                            <span>Replace</span>
                            <input
                              type="file"
                              accept=".pdf,.doc,.docx"
                              onChange={handleResumeUpload}
                              className="hidden"
                            />
                          </label>

                          <button
                            type="button"
                            onClick={handleDeleteResume}
                            disabled={resumeUploading}
                            className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                            title="Delete resume"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 text-center hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition-colors relative">
                        <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-2">
                          <Upload className="w-6 h-6" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                          Upload CV / Professional Resume
                        </h4>
                        <p className="text-xs text-slate-400 mt-1">
                          Supported formats: PDF, DOC, DOCX up to 5 MB
                        </p>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={handleResumeUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        {resumeUploading && (
                          <div className="absolute inset-0 bg-white/70 dark:bg-slate-900/70 rounded-2xl flex items-center justify-center">
                            <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* External Certificates Section */}
                  <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                          External Industry Certifications
                        </label>
                        <p className="text-xs text-slate-400">
                          Add prior certificates or diplomas to transfer professional credits.
                        </p>
                      </div>
                      <span className="text-xs font-bold text-slate-500">
                        {certificates.length} uploaded
                      </span>
                    </div>

                    <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-5 text-center hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition-colors relative">
                      <div className="flex items-center justify-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-400">
                        <Plus className="w-4 h-4" />
                        <span>Click or drag certificate files here</span>
                      </div>
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={handleCertificateUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      {certificateUploading && (
                        <div className="absolute inset-0 bg-white/70 dark:bg-slate-900/70 rounded-2xl flex items-center justify-center">
                          <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
                        </div>
                      )}
                    </div>

                    {certificates.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        {certificates.map((cert) => (
                          <div
                            key={cert.id}
                            className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 shadow-2xs"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <Award className="w-4 h-4 text-amber-600 shrink-0" />
                              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                                {cert.title}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeleteCertificate(cert.id)}
                              className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                              title="Delete certificate"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons Footer */}
              <div className="mt-10 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
                <div>
                  {currentTabIdx > 0 ? (
                    <button
                      type="button"
                      onClick={handlePrevious}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 transition-all shadow-2xs"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Previous Step</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSkip}
                      className="text-xs sm:text-sm font-semibold text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 underline underline-offset-4 transition-colors"
                    >
                      Skip for now
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleSave(false)}
                    disabled={saving}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 transition-all shadow-2xs"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin inline mr-1" /> : null}
                    Save Draft
                  </button>

                  {activeTab !== "documents" ? (
                    <button
                      type="button"
                      onClick={handleNext}
                      disabled={saving}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs sm:text-sm font-bold shadow-sm hover:shadow transition-all disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Next Step</span>}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSave(true)}
                      disabled={saving}
                      className="inline-flex items-center gap-2 px-7 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-sm hover:shadow transition-all disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      <span>Finish & Complete Profile</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* OTP Verification Modal */}
      <ProfileVerifyOTP
        isOpen={showOTPModal}
        onClose={() => setShowOTPModal(false)}
        onSuccess={() => {
          setShowOTPModal(false);
          void getProfile();
          setNotice("Profile saved successfully.");
          toast.success("Profile saved successfully.");
        }}
      />
    </div>
  );
};

export default CompleteProfile;
