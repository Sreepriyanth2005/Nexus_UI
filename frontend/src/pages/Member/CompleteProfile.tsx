import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router";
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
import { Loader2, Upload, Plus, X } from "lucide-react";

import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Avatar } from "../../components/ui/Avatar";
import CareerHistorySection from "../../components/common/profile/modals/CareerHistorySection";
import nexusLogo from "../../assets/brand/nexus-logo-ink.svg";

import { Skeleton } from "../../components/ui/Skeleton/Skeleton";
import ProfileVerifyOTP from "../../components/common/profile/ProfileVerifyOTP";

const CompleteProfileSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen lg:h-screen bg-gray-50 font-sans text-gray-900 flex flex-col lg:overflow-hidden">
      <header className="h-[72px] bg-white border-b border-gray-200 flex items-center px-4 sm:px-8 shrink-0 z-10 relative">
        <Skeleton className="h-9 w-32" />
      </header>

      <div className="flex-1 flex justify-center lg:overflow-hidden">
        <div className="w-full flex flex-col lg:flex-row gap-8 lg:gap-11 h-full pt-10 px-4 md:px-6 lg:pt-11 lg:px-14">
          {/* Left Sidebar Skeleton */}
          <div className="w-full lg:w-[320px] flex-shrink-0 space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-8 w-56" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex items-center justify-between">
              <div className="flex-1 mr-4">
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
              <Skeleton className="h-8 w-14" />
            </div>

            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded-full" />
              ))}
            </div>
          </div>

          {/* Right Content Skeleton */}
          <div className="flex-1 min-w-0 pb-10">
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 sm:p-10 space-y-6">
              <Skeleton className="h-4 w-48 border-b pb-2" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-11 w-full rounded-lg" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-11 w-full rounded-lg" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-11 w-full rounded-lg" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-11 w-full rounded-lg" />
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-24 w-full rounded-lg" />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Skeleton className="h-10 w-28 rounded-lg" />
                <Skeleton className="h-10 w-36 rounded-lg" />
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

const tabs: Array<{ id: TabId; label: string }> = [
  { id: "personal", label: "Personal" },
  { id: "professional", label: "Professional" },
  { id: "links", label: "Personal links" },
  { id: "documents", label: "Documents" },
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

  const { uploadPhoto, uploadResume, deletePhoto } = useProfileAssets();
  const { profile, getProfile, saveProfile, loading } = useProfile();
  const { data: skills = [], isLoading: skillsLoading } = useSkills();
  const { uploadCertificate, certificates, refreshCertificates } = useProfileCertificates();
  const { uploadAsset } = useAssets();

  const [activeTab, setActiveTab] = useState<TabId>("personal");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [extraLinks, setExtraLinks] = useState<PersonalLink[]>([{ title: "", url: "" }]);
  const [careerHistory, setCareerHistory] = useState<CareerHistory[]>([]);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [photoUploading, setPhotoUploading] = useState(false);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [certificateUploading, setCertificateUploading] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);

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
    setExtraLinks(profile.personalLinks?.length ? profile.personalLinks : [{ title: "", url: "" }]);
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

  const getTabProgress = useCallback((tabId: TabId): string => {
    switch (tabId) {
      case "personal":
        let filled = 0;
        if (form.firstName) filled++;
        if (form.lastName) filled++;
        if (profile?.email) filled++; // Email is fixed in this view
        if (form.certificateName) filled++;
        if (form.dob) filled++;
        if (form.gender) filled++;
        if (form.city) filled++;
        if (form.countryName) filled++;
        if (form.mobileNumber) filled++;
        if (form.photoUrl) filled++;
        if (form.titlePrefix) filled++;
        if (form.preferredLanguage) filled++;
        return `${filled}/12`;
      case "professional":
        let pfilled = 0;
        if (form.currentRole) pfilled++;
        if (form.industry) pfilled++;
        if (form.experienceLevel) pfilled++;
        if (learningInterests.length > 0) pfilled++;
        return `${pfilled}/4`;
      case "links":
        let lfilled = 0;
        if (extraLinks.some((l) => cleanUrl(l.url))) lfilled++;
        return `${lfilled}/1`;
      case "documents":
        let d = 0;
        if (form.resumeUrl) d++;
        if (certificates.length > 0) d++;
        return `${d}/2`;
      default:
        return "0/1";
    }
  }, [form, extraLinks, certificates, profile]);

  const updateField = (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleLinkChange = (index: number, field: "title" | "url", value: string) => {
    setExtraLinks(prev =>
      prev.map((link, idx) =>
        idx === index
          ? { ...link, [field]: value }
          : link
      )
    );
  };

  const handleAddLink = () => {
    setExtraLinks(prev => [...prev, { title: "", url: "" }]);
  };

  const handleRemoveLink = (index: number) => {
    setExtraLinks(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleAddLearningInterest = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const val = learningInterestInput.trim();
      if (val && !learningInterests.some((item) => item.toLowerCase() === val.toLowerCase())) {
        setLearningInterests(prev => [...prev, val]);
      }
      setLearningInterestInput("");
    }
  };

  const removeLearningInterest = (interest: string) => {
    setLearningInterests(prev => prev.filter(item => item !== interest));
  };

  const handleSave = async (isFinal: boolean = false) => {
    setSaving(true);
    setError("");
    setNotice("");

    // Phone validation — only block if a phone is provided AND is clearly invalid
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

      // Only block save if phone is provided but clearly invalid (not just country mismatch)
      if (phoneNum && !phoneNum.isValid()) {
        setError("Invalid mobile number format. Please check the number and try again.");
        setSaving(false);
        return false;
      }
      // If we got a valid parsed number, use the E.164 national number
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
        setError("User must be at least 13 years old.");
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
      setError("Please complete the employer, role, and start date for each experience entry, or remove the empty entry.");
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
        // Always send skills array so removals are persisted (empty array clears all skills)
        skills: selectedSkills,
        // Always send learningInterests so removals are persisted
        learningInterests: learningInterests,
        careerHistory: careerHistory.filter((item) =>
          item.employer?.trim() || item.jobTitle?.trim() || item.startDate || item.endDate
        ).map((item) => ({
          ...item,
          endDate: item.isCurrentJob ? null : (item.endDate || null),
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
      setNotice("Profile saved successfully.");

      if (isFinal) {
        localStorage.setItem("skip_complete_profile", "true");
        navigate("/member-dashboard");
      }
      return true;
    } catch (err: any) {
      setError(err.response?.data?.message ?? err.message ?? "Failed to save profile");
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
    } catch (err: any) {
      setError(err.message || "Failed to upload photo");
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
    } catch (err: any) {
      setError(err.message || "Failed to remove photo");
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
    } catch (err: any) {
      setError(err.message || "Failed to upload resume");
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
    } catch (err: any) {
      setError(err.response?.data?.message ?? err.message ?? "Failed to upload certificate");
    } finally {
      setCertificateUploading(false);
    }
  };

  if (loading && !profile) {
    return <CompleteProfileSkeleton />;
  }
  return (
    <div className="min-h-screen lg:h-screen bg-gray-50 font-sans text-gray-900 flex flex-col lg:overflow-hidden">
      <header className="h-[72px] bg-white border-b border-gray-200 flex items-center px-4 sm:px-8 shrink-0 z-10 relative">
        <img src={nexusLogo} alt="Nexus Academy" className="h-9" />
      </header>

      <div className="flex-1 flex justify-center lg:overflow-hidden">
        <div className="w-full flex flex-col lg:flex-row gap-8 lg:gap-11 h-full pt-10 px-4 md:px-6 lg:pt-11 lg:px-14">

          {/* Left Sidebar */}
          <div className="w-full lg:w-[320px] flex-shrink-0 lg:h-full lg:overflow-y-auto pb-6 lg:pb-20 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="mb-8 relative">
              <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">POST-SIGNUP</h4>
              <h1 className="text-2xl font-bold text-gray-900 mb-3">Complete your profile</h1>
              <p className="text-sm text-gray-500 leading-relaxed">
                Signup already captured your First Name, Last Name, Email and Country. Finish the remaining fields to reach 100% completion, required before your learning credential can be issued.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-6 flex items-center justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
              <div className="flex-1 mr-4">
                <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                  <div className="bg-[#eab308] h-full transition-all" style={{ width: `${completed}%` }} />
                </div>
              </div>
              <div className="text-right">
                <span className="block text-2xl font-bold">{completed}%</span>
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">COMPLETE</span>
              </div>
            </div>

            <nav className="space-y-2">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center justify-between px-5 py-3.5 rounded-full border font-medium text-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${isActive
                      ? "bg-[#fef08a] border-[#eab308] text-gray-900 shadow-sm"
                      : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                      }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`text-xs font-bold ${isActive ? "text-gray-900" : "text-gray-500"}`}>
                      {getTabProgress(tab.id)}
                    </span>
                  </button>
                );
              })}
            </nav>


          </div>

          {/* Right Content Area */}
          <div className="flex-1 min-w-0 lg:h-full lg:overflow-y-auto pb-10 lg:pb-20 lg:pr-2">
            <Card key={activeTab} className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 sm:p-10 relative animate-zoom-out-up lg:mb-8">

              {error && (
                <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 text-sm text-red-700">
                  {error}
                </div>
              )}

              {notice && (
                <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 text-sm text-green-700 flex items-center gap-2">
                  <span>✓</span> {notice}
                </div>
              )}

              {activeTab === "personal" && (
                <div className="space-y-6">
                  <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 pb-2">Personal - Core Identity and Demographic</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[12px] font-bold text-gray-600 uppercase mb-2">First Name <span className="text-red-500">*</span></label>
                      <Input type="text" value={form.firstName} onChange={updateField("firstName")} className="w-full bg-[#eeeeea] border border-(--line) rounded-lg px-4 py-2.5 text-sm focus:bg-white focus:border-gray-300 focus:ring-0 transition-colors" />
                    </div>
                    <div>
                      <label className="block text-[12px] font-bold text-gray-600 uppercase mb-2">Last Name <span className="text-red-500">*</span></label>
                      <Input type="text" value={form.lastName} onChange={updateField("lastName")} className="w-full bg-[#eeeeea] border border-(--line) rounded-lg px-4 py-2.5 text-sm focus:bg-white focus:border-gray-300 focus:ring-0 transition-colors" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[12px] font-bold text-gray-600 uppercase mb-2">Email <span className="text-red-500">*</span> <span className="text-(--ink-faint) normal-case">(OTP required to change)</span></label>
                    <Input type="text" disabled value={profile?.email || ""} className="w-full bg-[#eeeeea] border border-(--line) rounded-lg px-4 py-2.5 text-sm text-(#eeeeea) cursor-not-allowed" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[12px] font-bold text-gray-600 uppercase mb-2">Title / Prefix</label>
                      <Select value={form.titlePrefix} onChange={updateField("titlePrefix")} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:border-(--honey) focus:ring-(--honey) bg-white">
                        <option value="">Select...</option>
                        <option value="MR">Mr.</option>
                        <option value="MRS">Mrs.</option>
                        <option value="MS">Ms.</option>
                        <option value="DR">Dr.</option>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-[12px] font-bold text-gray-600 uppercase mb-2">Name on your learning credential <span className="text-red-500">*</span></label>
                      <Input type="text" value={form.certificateName} onChange={updateField("certificateName")} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:border-(--ink-label) focus:ring-(--ink-label)" />
                      <p className="text-[14px] text-(--ink-mute) mt-1 leading-tight">Pre-filled from your First Name and Last Name. Edit if you want a different name shown on your learning credential(s). OTP required to change after first save.</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[12px] font-bold text-gray-600 uppercase mb-2">Photo</label>
                    <div className="border border-dashed border-gray-300 rounded-lg bg-gray-50 p-6 flex items-center justify-center relative hover:bg-gray-100 transition-colors">
                      {photoPreview ? (
                        <div className="flex items-center gap-4">
                          <Avatar src={photoPreview} size={46} className="w-16 h-16 shadow-sm" />
                          <button type="button" onClick={handleDeletePhoto} className="text-xs font-bold text-red-600 hover:underline">Remove photo</button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500">Drag image or click to upload - square JPG/PNG up to 2 MB - preview shown before save</span>
                      )}
                      <input type="file" accept="image/*" onChange={handlePhotoUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                      {photoUploading && <div className="absolute inset-0 bg-white/50 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin" /></div>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[12px] font-bold text-gray-600 uppercase mb-2">Preferred Language</label>
                      <Select value={form.preferredLanguage} onChange={updateField("preferredLanguage")} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-1 focus:border-(--honey) focus:ring-(--honey)">
                        <option value="">English</option>
                        {new LanguageList().getData().map((lang: { code: string; language: string }) => (
                          <option key={lang.code} value={lang.code}>{lang.language}</option>
                        ))}
                      </Select>
                    </div>
                    <div>
                      <label className="block text-[12px] font-bold text-gray-600 uppercase mb-2">Date of Birth <span className="text-(--ink-faint) font-normal normal-case">(used for age verification - min 16)</span></label>
                      <Input type="date" value={form.dob} onChange={updateField("dob")} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:border-(--ink-label) focus:ring-(--ink-label)" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[12px] font-bold text-gray-600 uppercase mb-2">Gender</label>
                      <Select value={form.gender} onChange={updateField("gender")} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-1 focus:border-(--honey) focus:ring-(--honey)">
                        <option value="">Select...</option>
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="OTHER">Other</option>
                        <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-[12px] font-bold text-gray-600 uppercase mb-2">Country <span className="text-red-500">*</span></label>
                      <Select value={form.countryName} onChange={(e) => {
                        const countryName = e.target.value;
                        const country = countries.find((item) => item.name === countryName);
                        const phoneCode = country?.phonecode ? `+${country.phonecode}` : "+91";
                        setForm((current) => ({
                          ...current,
                          countryName,
                          phoneCountryCode: phoneCode,
                        }));
                      }} className="w-full border border-gray-300 bg-gray-50 rounded-lg px-4 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-1 focus:border-(--ink-label) focus:ring-(--ink-label)">
                        <option value="">Select country</option>
                        {countries.map((country) => (
                          <option key={country.isoCode} value={country.name}>{country.name}</option>
                        ))}
                      </Select>
                      <p className="text-[11px] text-gray-400 mt-1">Captured at signup. Edit to update.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[12px] font-bold text-gray-600 uppercase mb-2">City</label>
                      <Input type="text" value={form.city} onChange={updateField("city")} placeholder="e.g. Muscat" className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:border-(--ink-label) focus:ring-(--ink-label)" />
                    </div>
                    <div>
                      <label className="block text-[12px] font-bold text-gray-600 uppercase mb-2">Phone</label>
                      <div className="flex border border-gray-300 rounded-lg overflow-hidden focus-within:outline-none focus-within:ring-1 focus-within:border-(--ink-label) focus-within:ring-(--ink-label)">
                        <input type="text" value={form.phoneCountryCode} readOnly className="w-[80px] bg-gray-100 border-r border-gray-300 px-3 py-2.5 text-sm text-gray-500 outline-none cursor-not-allowed" />
                        <input type="tel" value={form.mobileNumber} onChange={(e) => {
                          let mobileNumber = e.target.value.replace(/\D/g, "");
                          const selectedCountry = countries.find((c) => c.name.toLowerCase() === form.countryName.trim().toLowerCase());
                          const isoCode = selectedCountry?.isoCode as any;
                          if (isoCode) {
                            let validPrefix = "";
                            for (let i = 1; i <= mobileNumber.length; i++) {
                              if (parsePhoneNumberFromString(mobileNumber.substring(0, i), isoCode)?.isValid()) {
                                validPrefix = mobileNumber.substring(0, i);
                                break;
                              }
                            }
                            if (validPrefix && mobileNumber.length > validPrefix.length) {
                              mobileNumber = validPrefix;
                            }
                          } else if (mobileNumber.length > 15) {
                            mobileNumber = mobileNumber.substring(0, 15);
                          }
                          setForm((current) => ({ ...current, mobileNumber }));
                        }} placeholder="Mobile number" inputMode="numeric" className="w-full px-4 py-2.5 text-sm border-none focus:outline-none focus:ring-0" />
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {activeTab === "professional" && (
                <div className="space-y-6">
                  <h3 className="text-[12px] font-bold text-(--muted) uppercase tracking-wider border-b border-gray-100 pb-2">Professional - Professional Profile</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[12px] font-bold text-gray-600 uppercase mb-2">Current Role</label>
                      <Input type="text" value={form.currentRole} onChange={updateField("currentRole")} placeholder="e.g. Information Architect" className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:border-(--ink-label) focus:ring-(--ink-label)" />
                    </div>
                    <div>
                      <label className="block text-[12px] font-bold text-gray-600 uppercase mb-2">Experience Level</label>
                      <Select value={form.experienceLevel} onChange={updateField("experienceLevel")} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-1 focus:border-(--honey) focus:ring-(--honey)">
                        <option value="">Select...</option>
                        <option value="JUNIOR">Junior</option>
                        <option value="MID">Mid-level</option>
                        <option value="SENIOR">Senior</option>
                        <option value="EXECUTIVE">Executive</option>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[12px] font-bold text-gray-600 uppercase mb-2">Industry</label>
                    <Select value={form.industry} onChange={updateField("industry")} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-1 focus:border-(--honey) focus:ring-(--honey)">
                      <option value="">Select...</option>
                      <option value="Technology">Technology</option>
                      <option value="Finance">Finance</option>
                      <option value="Healthcare">Healthcare</option>
                      <option value="Education">Education</option>
                    </Select>
                  </div>

                  <div className="pt-4">
                    <CareerHistorySection
                      value={careerHistory}
                      onChange={setCareerHistory}
                      currentEmployer={form.currentEmployer}
                    />
                  </div>

                  <div className="pt-4">
                    <label className="block text-[12px] font-bold text-gray-600 uppercase mb-2">Preferred Skills</label>
                    <div className="relative max-w-md">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={skillQuery}
                          onChange={(event) => {
                            setSkillQuery(event.target.value);
                            setSkillsOpen(true);
                          }}
                          onFocus={() => setSkillsOpen(true)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              addSkill(skillQuery);
                            }
                            if (event.key === "Escape") setSkillsOpen(false);
                          }}
                          placeholder={skillsLoading ? "Loading skills..." : "Type to search or add a skill"}
                          className="w-full h-11 border border-gray-300 rounded-lg bg-white px-4 text-sm focus:outline-none focus:border-(--ink-label) focus:ring-1 focus:ring-(--ink-label)"
                        />
                        <button type="button" onClick={() => addSkill(skillQuery)} disabled={!skillQuery.trim()} className="shrink-0 px-3 rounded-lg border border-(--honey) text-sm font-semibold disabled:opacity-40">Add</button>
                      </div>
                      {skillsOpen && (filteredSkills.length > 0 || skillQuery.trim()) && (
                        <div className="absolute z-20 mt-1 w-full max-h-56 overflow-auto rounded-lg border border-gray-200 bg-white p-1 shadow-lg">
                          {filteredSkills.map((skill) => (
                            <button type="button" key={skill.id} onClick={() => addSkill(skill.name)} className="block w-full rounded px-3 py-2 text-left text-sm hover:bg-yellow-50">{skill.name}</button>
                          ))}
                          {skillQuery.trim() && !skills.some((skill) => skill.name.toLowerCase() === skillQuery.trim().toLowerCase()) && (
                            <button type="button" onClick={() => addSkill(skillQuery)} className="block w-full rounded border-t border-gray-100 px-3 py-2 text-left text-sm font-semibold hover:bg-yellow-50">Add new skill: {skillQuery.trim()}</button>
                          )}
                        </div>
                      )}
                      {selectedSkills.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {selectedSkills.map((skill) => (
                            <span key={skill} className="inline-flex items-center gap-1 text-xs bg-gray-100 border border-gray-200 rounded-md px-2 py-1">
                              {skill}
                              <button type="button" onClick={() => setSelectedSkills((current) => current.filter((item) => item !== skill))} aria-label={`Remove ${skill}`}><X className="w-3 h-3" /></button>
                            </span>
                          ))}
                        </div>
                      )}
                      <p className="mt-2 text-xs text-gray-500">Existing skills come from the database. New skills are created when you save.</p>
                    </div>
                  </div>

                  <div className="pt-4">
                    <label className="block text-[12px] font-bold text-gray-600 uppercase mb-2">Learning interests</label>
                    <Input
                      type="text"
                      value={learningInterestInput}
                      onChange={(e) => setLearningInterestInput(e.target.value)}
                      onKeyDown={handleAddLearningInterest}
                      placeholder="Type and press Enter to add"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:border-(--ink-label) focus:ring-(--ink-label)"
                    />
                    {learningInterests.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {learningInterests.map((interest) => (
                          <span
                            key={interest}
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#f4f4f4] border border-[#e5e5e5] text-[#333333] text-xs font-medium rounded-full shadow-xs"
                          >
                            <span>{interest}</span>
                            <button
                              type="button"
                              onClick={() => removeLearningInterest(interest)}
                              className="text-gray-400 hover:text-red-500 transition-colors flex items-center justify-center p-0.5"
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

              {activeTab === "links" && (
                <div className="space-y-6">
                  <h3 className="text-[12px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 pb-2">Personal Links - Name and URL for each link</h3>

                  <div>
                    <label className="block text-[12px] font-bold text-gray-600 uppercase mb-2">Personal Site / Blog Links</label>
                    {extraLinks.map((link, idx) => (
                      <div key={idx} className="flex gap-2 mb-3 items-center">
                        <Select className="w-1/4 border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-1 focus:border-(--honey) focus:ring-(--honey)">
                          <option>Website</option>
                          <option>LinkedIn</option>
                          <option>Twitter</option>
                          <option>GitHub</option>
                        </Select>
                        <Input type="text" placeholder="Name (e.g. Linked)" className="w-1/4 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:border-(--ink-label) focus:ring-(--ink-label)" value={link.title} onChange={(e) => handleLinkChange(idx, "title", e.target.value)} />
                        <Input type="text" placeholder="https://" className="w-1/2 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:border-(--ink-label) focus:ring-(--ink-label)" value={link.url} onChange={(e) => handleLinkChange(idx, "url", e.target.value)} />
                        {extraLinks.length > 1 && (
                          <button onClick={() => handleRemoveLink(idx)} className="text-gray-400 hover:text-red-500 transition-colors shrink-0 p-1 flex items-center justify-center" title="Remove Link">
                            <X className="w-5 h-5 text-slate-500" />
                          </button>
                        )}
                      </div>
                    ))}

                    <button onClick={handleAddLink} className="text-[14px] font-bold text-gray-700 hover:text-gray-900 flex items-center gap-1 mt-1">+ Add another link</button>

                    <p className="text-[14px] text-gray-400 mt-2 mb-2">Each link has a type, a short name and a URL. Add as many as you need.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[12px] font-bold text-gray-600 uppercase mb-2">Portfolio URL</label>
                      <Input type="url" value={form.portfolioUrl} onChange={updateField("portfolioUrl")} placeholder="https://" className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm" />
                    </div>
                    <div>
                      <label className="block text-[12px] font-bold text-gray-600 uppercase mb-2">Website URL</label>
                      <Input type="url" value={form.websiteUrl} onChange={updateField("websiteUrl")} placeholder="https://" className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[12px] font-bold text-gray-600 uppercase mb-2">Public profile URL</label>
                    <Input type="text" readOnly value={profile?.id ? `/profile/${profile.id}` : ""} className="w-full md:w-1/2 border border-gray-300 rounded-lg px-4 py-2.5 text-sm bg-gray-50 text-gray-500" />
                  </div>
                </div>
              )}

              {activeTab === "documents" && (
                <div className="space-y-6">
                  <h3 className="text-[12px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 pb-2">Documents - Supporting Evidence</h3>

                  <div>
                    <label className="block text-[12px] font-bold text-gray-600 uppercase mb-2">CV / Resume <span className="text-gray-400 font-normal">(PDF, DOC, DOCX · up to 5 MB)</span></label>
                    <div className="border border-dashed border-gray-300 rounded-lg bg-gray-50 p-6 flex items-center justify-center relative hover:bg-gray-100 transition-colors">
                      <span className="text-xs text-gray-500">{form.resumeUrl ? "Resume uploaded · click to replace" : "Drag file here or click to browse"}</span>
                      <input type="file" accept=".pdf,.doc,.docx" onChange={handleResumeUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                      {resumeUploading && <div className="absolute inset-0 bg-white/50 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin" /></div>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[12px] font-bold text-gray-600 uppercase mb-2">Externally Earned Certificates <span className="text-gray-400 font-normal">(Multiple supported)</span></label>
                    <div className="border border-dashed border-gray-300 rounded-lg bg-gray-50 p-6 flex items-center justify-center relative hover:bg-gray-100 transition-colors">
                      <span className="text-xs text-gray-500">Add certificate files</span>
                      <input type="file" multiple accept=".pdf,.png,.jpg,.jpeg" onChange={handleCertificateUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                      {certificateUploading && <div className="absolute inset-0 bg-white/50 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin" /></div>}
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-10 pt-6 border-t border-gray-100 flex justify-between items-center">
                <button onClick={handleSkip} className="text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors underline underline-offset-2">
                  Skip for now
                </button>

                {activeTab !== "documents" ? (
                  <Button
                    onClick={handleNext}
                    disabled={saving}
                    className="bg-[#fef08a] hover:bg-yellow-300 text-gray-900 font-bold px-8 py-2.5 rounded-full text-sm shadow-sm transition-colors flex items-center gap-2"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Next"}
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleSave(true)}
                    disabled={saving}
                    className="bg-[#fef08a] hover:bg-yellow-300 text-gray-900 font-bold px-8 py-2.5 rounded-full text-sm shadow-sm transition-colors flex items-center gap-2"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Finish"}
                  </Button>
                )}
              </div>

            </Card>
          </div>

        </div>
      </div>

      <ProfileVerifyOTP
        isOpen={showOTPModal}
        onClose={() => setShowOTPModal(false)}
        onSuccess={() => {
          setShowOTPModal(false);
          void getProfile();
          setNotice("Profile saved successfully.");
        }}
      />
    </div>
  );
};

export default CompleteProfile;
