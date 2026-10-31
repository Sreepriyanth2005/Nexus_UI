import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import ProfileVerifyOTP from "./ProfileVerifyOTP";
import "./ProfileData.css";

import { useProfile } from "../../../hooks/profile/useProfile";
import { useProfileAssets } from "../../../hooks/profile/useProfileAssets";
import { useProfileCertificates } from "../../../hooks/profile/useProfileCertificates";
import { useProfileOnboarding } from "../../../hooks/profile/useProfileOnboarding";
import { useAssets } from "../../../hooks/asset/useAssets";
import { useSkills } from "../../../hooks/useMaster";
import { useLearningStatistics, useProgressDashboard, useMemberLearningCourses } from "../../../hooks/member-learning/memberLearning";

import type { UpdateProfileRequest, CareerHistory, PersonalLink, } from "../../../types/profile.type";

import { Country } from "country-state-city";
import parsePhoneNumberFromString from "libphonenumber-js";
import CareerHistorySection from "./modals/CareerHistorySection";
import { Loader2, X } from "lucide-react";
import LanguageList from "language-list";

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
  fullName: "Add First and Last Name",
  country: "Select Country",
  certificateName: "Add Certificate Name",
  titlePrefix: "Select Title Prefix",
  city: "Add City",
  dob: "Add Date of Birth",
  gender: "Select Gender",
  phone: "Add Phone Number",
  currentRole: "Add Current Role",
  experienceLevel: "Select Experience Level",
  industry: "Select Industry",
  educationCompletionYear: "Add Education Completion Year",
  portfolioUrl: "Add a Personal Site / Blog",
  websiteUrl: "Add a Website URL",
  photo: "Add Profile Photo",
  resume: "Upload Resume",
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
  if (!url) return "Uploaded";
  try {
    let filename = url.split('?')[0].split('/').pop() || "Uploaded";
    filename = filename.replace(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}-/, '');
    return decodeURIComponent(filename);
  } catch (e) {
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
  const { uploadCertificate, deleteCertificate, certificates, refreshCertificates } = useProfileCertificates();
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
      .slice(0, 3);
  }, [memberLearningData]);

  const [activeTab, setActiveTab] = useState<TabId>("personal");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
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

  const [documents, setDocuments] = useState<any[]>([]);

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
    getOnboarding();
  }, [getProfile, getOnboarding]);

  // Populate form from profile data
  useEffect(() => {
    if (!profile) return;

    // If the user is actively editing, only update asset URLs
    // so that photo/resume uploads don't wipe out unsaved form changes
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
      preferredLanguage: profile.preferences?.preferredLanguage || "",
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
  }, [profile, refreshCertificates])

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
    [profile?.profile?.firstName, profile?.profile?.lastName]
      .filter(Boolean)
      .join(" ") ||
    [form.firstName, form.lastName]
      .filter(Boolean)
      .join(" ") ||
    "Profile";

  const completed = Number(profile?.profileCompleteness || 0);

  const getTabProgress = useCallback((tabId: TabId): string => {
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
  }, [form, extraLinks, certificates]);

  const updateField = (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
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
    setExtraLinks(prev => [
      ...prev,
      {
        title: "",
        url: "",
      },
    ]);
  };

  const handleRemoveLink = (index: number) => {
    setExtraLinks(prev => prev.filter((_, idx) => idx !== index));
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
        setError("Invalid mobile number format");
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
        setError("User must be at least 13 years old.");
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
        educationCompletionYear: form.educationCompletionYear ? parseInt(form.educationCompletionYear, 10) : null,
        websiteUrl: cleanUrl(form.websiteUrl) || null,
        portfolioUrl: cleanUrl(form.portfolioUrl) || null,
        skills: selectedSkills,
        learningInterests: learningInterests,
        careerHistory: careerHistory.length > 0 ? careerHistory.map(ch => ({
          ...ch,
          endDate: ch.isCurrentJob ? undefined : (ch.endDate || undefined)
        })) : undefined,
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
      setIsEditing(false);
    } catch (err: any) {
      const data = err.response?.data;
      if (data?.issues && Array.isArray(data.issues)) {
        const messages = data.issues.map((i: any) => {
          const field = i.path[i.path.length - 1];
          return `${field}: ${i.message}`;
        });
        setError(`Validation failed -> ${messages.join(" | ")}`);
      } else {
        setError(
          data?.message ??
          err.message ??
          "Failed to save profile"
        );
      }
    } finally {
      setSaving(false);
    }
  };


  const handlePhotoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setPhotoUploading(true);
      setError("");

      // Show instant local preview
      const localPreview = URL.createObjectURL(file);
      setPhotoPreview(localPreview);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("assetType", "IMAGE");
      formData.append("assetContext", "USER");
      formData.append("storagePath", "avatar");

      const asset = await uploadAsset(formData);
      const updatedProfile = await uploadPhoto(asset.id);

      // Update only the photo URL in form state without refetching the full profile
      const newPhotoUrl = updatedProfile?.profile?.photoUrl || localPreview;
      setPhotoPreview(newPhotoUrl);
      setForm((prev) => ({ ...prev, photoUrl: newPhotoUrl }));
    } catch (err: any) {
      // Revert preview on failure
      setPhotoPreview(form.photoUrl);
      setError(
        err.response?.data?.message ??
        err.message ??
        "Failed to upload photo"
      );
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
      await getProfile(); // Optional: ensure the backend state is in sync
    } catch (err: any) {
      setError(err.message || "Failed to delete photo");
    } finally {
      setPhotoUploading(false);
    }
  };


  const handleResumeUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
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
      setError(
        err.response?.data?.message ??
        err.message ??
        "Failed to upload resume"
      );
    } finally {
      setResumeUploading(false);
    }
  };

  const handleDocumentUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
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

        const safeTitle = file.name.length < 2
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
    } catch (err: any) {
      setError(
        err.response?.data?.message ??
        err.message ??
        "Failed to upload certificate"
      );
    } finally {
      setCertificateUploading(false);
    }
  };

  const publicSlug = useMemo(() => {
    return profile?.id
      ? `/profile/${profile.id}`
      : "";
  }, [profile]);

  const maxDobDate = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 13);
    return d.toISOString().split("T")[0];
  }, []);

  console.log("photoUrl:", profile?.profile?.photoUrl);

  // ==================== VIEW MODE - Updated to Match Screenshot ====================
  const handleTabClick = (tabId: TabId) => {
    setActiveTab(tabId);
    const element = document.getElementById(`section-${tabId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (loading && !profile) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!isEditing) {
    return (
      <div className="w-full max-w-full mx-auto min-h-full   flex flex-col md:flex-row gap-8 bg-white text-[#141414] items-start">
        <style>{`
          @keyframes pillColorBlink {
            0%, 100% { color: #446038; }
            50% { color: #7e9b6f; }
          }
          .animate-pill-color {
            animation: pillColorBlink 2s ease-in-out infinite;
          }
        `}</style>
        <aside className="w-full md:w-[280px] shrink-0 flex flex-col">
          <div className="flex flex-col bg-white rounded-[10px] border border-[#d8d8d8] shadow-[0_1px_2px_#2a11080f] hover:-translate-y-1 hover:shadow-[0_8px_28px_-8px_#11111129] transition-all duration-300 px-6 pt-8 pb-6">
            
            {/* Header / Identity section */}
            <div className="flex flex-col items-center text-center">
              <div className="h-[104px] w-[104px] rounded-full bg-gray-100 flex items-center justify-center mb-4 overflow-hidden relative border border-[#f0f0f0]">
                {profile?.profile?.photoUrl ? (
                  <img src={profile?.profile?.photoUrl} alt={fullName} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-gray-400 text-xs font-semibold">Photo</span>
                )}
              </div>
              <h2 className="font-bold text-[20px]text-[#141414] mb-1">{fullName}</h2>
              <div className="text-[12px] font-medium text-[#5c5c5c] mb-4 tracking-wide">
                {form.currentRole || "Professional"}
                {calculateAge(form.dob) !== null && ` · ${calculateAge(form.dob)} yrs`}
              </div>

              {/* Progress Circle */}
              <div className="relative flex flex-col items-center justify-center mb-5">
                <div className="relative w-[88px] h-[88px] mb-3 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="36" stroke="#f0f0f0" strokeWidth="8" fill="none" />
                    <circle 
                      cx="40" 
                      cy="40" 
                      r="36" 
                      stroke="#a17a22" 
                      strokeWidth="8" 
                      fill="none" 
                      strokeDasharray={`${2 * Math.PI * 36}`} 
                      strokeDashoffset={`${2 * Math.PI * 36 * (1 - completed / 100)}`}
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-in-out" 
                    />
                  </svg>
                  <span className="absolute text-[16px] font-bold text-[#755a12]">{completed}%</span>
                </div>
  
                {/* Pill & Text block */}
                {completion?.missingFields && completion.missingFields.length > 0 ? (
                  <div className="text-[12px] text-[#5c5c5c] mb-6 leading-[1.6] text-center w-full">
                    <div className="flex justify-center items-center gap-2 mb-0.5 w-full">
                      <span className="bg-[#dce5d3]  animate-pill-color text-[12px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-widest whitespace-nowrap">
                        {completion.missingFields.length} STEP{completion.missingFields.length > 1 ? 'S' : ''} LEFT
                      </span>
                      <span className="whitespace-nowrap">
                        {MISSING_FIELD_LABELS[completion.missingFields[0]] || completion.missingFields[0]}
                      </span>
                    </div>
                    <div>link to reach 100%.</div>
                  </div>
                ) : (
                  <div className="text-[12px] text-[#5c5c5c] mb-6 leading-[1.6] text-center w-full">
                    <div className="text-[#a17a22] font-bold mb-0.5">Profile is 100% complete!</div>
                    <div>You're all set.</div>
                  </div>
                )}
  
                {/* CTA Button */}
                {completion?.missingFields && completion.missingFields.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="w-full bg-(--btn) hover:bg-[#f1e699] border border-[#c99b2e8c] text-[#141414] rounded-full py-2.5 font-bold transition-all text-[16px] shadow-[0_1px_2px_#0000000a]"
                  >
                    Complete profile
                  </button>
                )}
              </div>
            </div>

            {/* Divider */}
            <hr className="w-full border-t border-[#f0f0f0] mt-6 mb-2" />

            {/* Stats section */}
            <div className="flex flex-col w-full text-left">
              <div className="flex justify-between items-center py-3 border-b border-[#f0f0f0] text-[14px]">
                <span className="text-[#5c5c5c]">Courses</span>
                <strong className="text-[#141414] font-bold">{learningStats?.enrolledCount || 0}</strong>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-[#f0f0f0] text-[14px]">
                <span className="text-[#5c5c5c]">Certificates</span>
                <strong className="text-[#141414] font-bold">{learningStats?.completedCount || 0}</strong>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-[#f0f0f0] text-[14px]">
                <span className="text-[#5c5c5c]">Completed</span>
                <strong className="text-[#141414] font-bold">{learningStats?.completedCount || 0}</strong>
              </div>
              <div className="flex justify-between items-center pt-3 pb-1 text-[14px]">
                <span className="text-[#5c5c5c]">Hours learned</span>
                <strong className="text-[#141414] font-bold">
                  {dashboardData?.totalLearningTime ? (dashboardData.totalLearningTime / 3600).toFixed(1) : "0"}h
                </strong>
              </div>
            </div>
            
          </div>
        </aside>

        <main className="flex-1 min-w-0 flex flex-col gap-6">
          <header className="mb-2 flex justify-between items-center">
            <div>
              <div className="text-[12px] font-bold text-[#5c5c5c] uppercase tracking-widest mb-1.5">USER PORTAL</div>
              <h1 className="text-[24px] font-bold text-[#141414] m-0 leading-none">Profile</h1>
            </div>
            <button
              onClick={() => setIsEditing(true)}
              className="bg-[#ffffff] border border-[#d4d4d8] text-[#141414] text-[14px] font-bold px-5 py-2 rounded-full hover:-translate-y-1 hover:bg-[#e4e4e7] hover:border-[#141414] hover:shadow-[0_4px_12px_#0000001a] transition-all duration-300"
            >
              Edit profile
            </button>
          </header>

          {(notice || error) && (
            <div className={`mb-5 border border-[#b6dac2] rounded-md px-3.5 py-3 bg-[#f2fbf5] text-[#166534] font-bold w-full max-w-[520px] mx-auto ${error ? "is-error" : ""}`}>
              {error || notice}
            </div>
          )}

          {/* EARNED CERTIFICATIONS */}
          <article className="border border-[#d8d8d8] rounded-[10px] bg-white p-6 shadow-[0_1px_2px_#2a11080f] hover:-translate-y-1 hover:shadow-[0_8px_28px_-8px_#11111129] transition-all duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="m-0 text-[#141414] font-bold text-[16px]">Earned certifications</h2>
              <button 
                onClick={() => navigate('/course-completed')} 
                className="text-[#5c5c5c] text-[12px] font-bold hover:text-[#141414] flex items-center gap-1 transition-colors"
              >
                View all <span className="text-[12px]">→</span>
              </button>
            </div>
            <div className="flex flex-col">
              {earnedCertifications.length > 0 ? earnedCertifications.map((item, index) => {
                const isCompleted = item.statusText === "Completed";
                const matchCert = certificates.find(c => c.title === item.title || c.title.includes(item.title) || item.title.includes(c.title));
                
                let dateStr = "-";
                if (isCompleted) {
                  const dateVal = matchCert?.issuedAt || matchCert?.createdAt;
                  if (dateVal) {
                    dateStr = new Date(dateVal).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                  } else {
                    dateStr = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                  }
                }
                
                let firstPart = item.title;
                let secondPart = "";
                const splitIndex = item.title.indexOf('·') !== -1 ? item.title.indexOf('·') : (item.title.indexOf('-') !== -1 ? item.title.indexOf('-') : -1);
                if (splitIndex > 0) {
                  firstPart = item.title.substring(0, splitIndex).trim();
                  secondPart = " · " + item.title.substring(splitIndex + 1).trim();
                }

                return (
                  <div key={item.id} className={`flex justify-between items-center py-4 ${index !== earnedCertifications.length - 1 ? "border-b border-[#f0f0f0]" : ""}`}>
                    <div className="flex items-center text-[16px]">
                      <span className="font-bold text-[#141414]">{firstPart}</span>
                      <span className="text-[#5c5c5c]">{secondPart}</span>
                      {!isCompleted && <span className="text-[#5c5c5c]">&nbsp;· in progress</span>}
                    </div>
                    <span className="text-[14px] text-[#5c5c5c] whitespace-nowrap">{dateStr}</span>
                  </div>
                );
              }) : (
                <div className="text-[14px] text-[#5c5c5c]">No earned certifications yet.</div>
              )}
            </div>
          </article>

          {/* PERSONAL */}
          <article className="border border-[#d8d8d8] rounded-[10px] bg-white p-6 shadow-[0_1px_2px_#2a11080f] hover:-translate-y-1 hover:shadow-[0_8px_28px_-8px_#11111129] transition-all duration-300">
            <h2 className="m-0 mb-2 text-[#141414] font-bold text-[16px]">Personal</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
              <div className="border-b border-[#f0f0f0] py-3.5 min-w-0">
                <span className="block text-[#5c5c5c] text-[12px] font-bold uppercase tracking-wider mb-1.5">FIRST NAME</span>
                <span className="block break-words text-[#141414] text-[16px] font-medium">{(!form.firstName || form.firstName === 'null') ? "—" : form.firstName}</span>
              </div>
              <div className="border-b border-[#f0f0f0] py-3.5 min-w-0">
                <span className="block text-[#5c5c5c] text-[12px] font-bold uppercase tracking-wider mb-1.5">LAST NAME</span>
                <span className="block break-words text-[#141414] text-[16px] font-medium">{(!form.lastName || form.lastName === 'null') ? "—" : form.lastName}</span>
              </div>
              <div className="border-b border-[#f0f0f0] py-3.5 min-w-0">
                <span className="block text-[#5c5c5c] text-[12px] font-bold uppercase tracking-wider mb-1.5">EMAIL</span>
                <span className="block break-words text-[#141414] text-[16px] font-medium">{(!profile?.email || profile.email === 'null') ? "—" : profile.email}</span>
              </div>
              <div className="border-b border-[#f0f0f0] py-3.5 min-w-0">
                <span className="block text-[#5c5c5c] text-[12px] font-bold uppercase tracking-wider mb-1.5">DATE OF BIRTH</span>
                <span className="block break-words text-[#141414] text-[16px] font-medium">{formatDate(form.dob) || "—"}</span>
              </div>
              <div className="border-b border-[#f0f0f0] py-3.5 min-w-0">
                <span className="block text-[#5c5c5c] text-[12px] font-bold uppercase tracking-wider mb-1.5">GENDER</span>
                <span className="block break-words text-[#141414] text-[16px] font-medium">{(!form.gender || form.gender === 'null') ? "—" : toTitle(form.gender)}</span>
              </div>
              <div className="border-b border-[#f0f0f0] py-3.5 min-w-0">
                <span className="block text-[#5c5c5c] text-[12px] font-bold uppercase tracking-wider mb-1.5">CITY</span>
                <span className="block break-words text-[#141414] text-[16px] font-medium">{(!form.city || form.city === 'null') ? "—" : form.city}</span>
              </div>
              <div className="border-b border-[#f0f0f0] py-3.5 min-w-0">
                <span className="block text-[#5c5c5c] text-[12px] font-bold uppercase tracking-wider mb-1.5">COUNTRY</span>
                <span className="block break-words text-[#141414] text-[16px] font-medium">{(!form.countryName || form.countryName === 'null') ? "—" : form.countryName}</span>
              </div>
              <div className="border-b border-[#f0f0f0] py-3.5 min-w-0">
                <span className="block text-[#5c5c5c] text-[12px] font-bold uppercase tracking-wider mb-1.5">PHONE</span>
                <div className="flex items-center">
                  <span className={`block break-words text-[16px] font-medium ${form.mobileNumber ? 'text-[#141414]' : 'text-[#8c8c8c]'}`}>
                    {form.mobileNumber ? `${form.phoneCountryCode} ${form.mobileNumber}` : "Not provided"}
                  </span>
                  {profile?.profile?.phoneVerified && (
                    <span className="ml-2 text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded-full inline-flex items-center gap-1 font-bold">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      Verified
                    </span>
                  )}
                </div>
              </div>
              <div className="py-3.5 min-w-0">
                <span className="block text-[#5c5c5c] text-[12px] font-bold uppercase tracking-wider mb-1.5">PREFERRED LANGUAGE</span>
                <span className="block break-words text-[#141414] text-[16px] font-medium">{(!form.preferredLanguage || form.preferredLanguage === 'null') ? "—" : form.preferredLanguage}</span>
              </div>
            </div>
          </article>

          {/* PROFESSIONAL */}
          <article className="border border-[#d8d8d8] rounded-[10px] bg-white p-6 shadow-[0_1px_2px_#2a11080f] hover:-translate-y-1 hover:shadow-[0_8px_28px_-8px_#11111129] transition-all duration-300">
            <h2 className="m-0 mb-2 text-[#141414] font-bold text-[16px]">Professional</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
              <div className="border-b border-[#f0f0f0] py-3.5 min-w-0">
                <span className="block text-[#5c5c5c] text-[12px] font-bold uppercase tracking-wider mb-1.5">CURRENT ROLE</span>
                <span className="block break-words text-[#141414] text-[16px] font-medium">{(!form.currentRole || form.currentRole === 'null') ? "—" : form.currentRole}</span>
              </div>
              <div className="border-b border-[#f0f0f0] py-3.5 min-w-0">
                <span className="block text-[#5c5c5c] text-[12px] font-bold uppercase tracking-wider mb-1.5">CURRENT EMPLOYER</span>
                <span className="block break-words text-[#141414] text-[16px] font-medium">{(!form.currentEmployer || form.currentEmployer === 'null') ? "—" : form.currentEmployer}</span>
              </div>
              <div className="border-b border-[#f0f0f0] py-3.5 min-w-0">
                <span className="block text-[#5c5c5c] text-[12px] font-bold uppercase tracking-wider mb-1.5">EXPERIENCE LEVEL</span>
                <span className="block break-words text-[#141414] text-[16px] font-medium">{(!form.experienceLevel || form.experienceLevel === 'null') ? "—" : toTitle(form.experienceLevel)}</span>
              </div>
              <div className="border-b border-[#f0f0f0] py-3.5 min-w-0">
                <span className="block text-[#5c5c5c] text-[12px] font-bold uppercase tracking-wider mb-1.5">INDUSTRY</span>
                <span className="block break-words text-[#141414] text-[16px] font-medium">{(!form.industry || form.industry === 'null') ? "—" : form.industry}</span>
              </div>
              <div className="border-b border-[#f0f0f0] py-3.5 min-w-0">
                <span className="block text-[#5c5c5c] text-[12px] font-bold uppercase tracking-wider mb-1.5">EDUCATION COMPLETION YEAR</span>
                <span className="block break-words text-[#141414] text-[16px] font-medium">{(!form.educationCompletionYear || form.educationCompletionYear === 'null') ? "—" : form.educationCompletionYear}</span>
              </div>
              <div className="py-3.5 min-w-0 md:col-span-2">
                <span className="block text-[#5c5c5c] text-[12px] font-bold uppercase tracking-wider mb-1.5">LEARNING INTERESTS</span>
                {learningInterests.length > 0 ? (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {learningInterests.map((interest) => (
                      <span
                        key={interest}
                        className="inline-flex items-center px-3 py-1 bg-[#f4f4f4] border border-[#e5e5e5] text-[#333333] text-xs font-medium rounded-full"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="block break-words text-[#141414] text-[16px] font-medium">—</span>
                )}
              </div>
            </div>
          </article>

          {/* CERTIFICATE */}
          <article className="border border-[#d8d8d8] rounded-[10px] bg-white p-6 shadow-[0_1px_2px_#2a11080f] hover:-translate-y-1 hover:shadow-[0_8px_28px_-8px_#11111129] transition-all duration-300">
            <h2 className="m-0 mb-2 text-[#141414] font-bold text-[16px]">Certificate</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
              <div className="py-3.5 min-w-0">
                <span className="block text-[#5c5c5c] text-[12px] font-bold uppercase tracking-wider mb-1.5">CERTIFICATE NAME</span>
                <span className="block break-words text-[#141414] text-[16px] font-medium">{form.certificateName || "—"}</span>
              </div>
              <div className="py-3.5 min-w-0">
                <span className="block text-[#5c5c5c] text-[12px] font-bold uppercase tracking-wider mb-1.5">TITLE / PREFIX</span>
                <span className="block break-words text-[#141414] text-[16px] font-medium">{toTitle(form.titlePrefix) || "Not set"}</span>
              </div>
            </div>
          </article>

          {/* LINKS */}
          <article className="border border-[#d8d8d8] rounded-[10px] bg-white p-6 shadow-[0_1px_2px_#2a11080f] hover:-translate-y-1 hover:shadow-[0_8px_28px_-8px_#11111129] transition-all duration-300">
            <h2 className="m-0 mb-2 text-[#141414] font-bold text-[16px]">Links</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
              <div className="border-b border-[#f0f0f0] py-3.5 min-w-0">
                <span className="block text-[#5c5c5c] text-[12px] font-bold uppercase tracking-wider mb-1.5">PERSONAL SITE / BLOG LINKS</span>
                <div className="block break-words text-[#141414] text-[16px] font-medium">
                  {extraLinks.filter((link) => cleanUrl(link.url)).length > 0 ? (
                    <div className="flex flex-col gap-1">
                      {extraLinks
                        .filter((link) => cleanUrl(link.url))
                        .map((link, index) => (
                          <a
                            key={index}
                            href={link.url.startsWith('http') ? link.url : `https://${link.url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#141414] hover:underline font-normal break-all hover:text-[#c99b2e]"
                          >
                            {link.url}
                          </a>
                        ))}
                    </div>
                  ) : (
                    <span className="text-[#5c5c5c]">Not provided</span>
                  )}
                </div>
              </div>
              <div className="border-b border-[#f0f0f0] py-3.5 min-w-0">
                <span className="block text-[#5c5c5c] text-[12px] font-bold uppercase tracking-wider mb-1.5">PORTFOLIO URL</span>
                <div className="block break-words text-[#141414] text-[16px] font-medium">
                  {form.portfolioUrl ? (
                    <a
                      href={form.portfolioUrl.startsWith('http') ? form.portfolioUrl : `https://${form.portfolioUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#141414] hover:underline font-normal break-all hover:text-[#c99b2e]"
                    >
                      {form.portfolioUrl}
                    </a>
                  ) : (
                    <span className="text-[#5c5c5c]">Not provided</span>
                  )}
                </div>
              </div>
              <div className="py-3.5 min-w-0">
                <span className="block text-[#8c8c8c] text-[10px] font-bold uppercase tracking-wider mb-1.5">WEBSITE URL</span>
                <div className="block break-words text-[#141414] text-[14px] font-medium">
                  {form.websiteUrl ? (
                    <a
                      href={form.websiteUrl.startsWith('http') ? form.websiteUrl : `https://${form.websiteUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#141414] hover:underline font-normal break-all hover:text-[#c99b2e]"
                    >
                      {form.websiteUrl}
                    </a>
                  ) : (
                    <span className="text-[#5c5c5c]">Not provided</span>
                  )}
                </div>
              </div>
            </div>
          </article>

          {/* DOCUMENTS */}
          <article className="border border-[#d8d8d8] rounded-[10px] bg-white p-6 shadow-[0_1px_2px_#2a11080f] hover:-translate-y-1 hover:shadow-[0_8px_28px_-8px_#11111129] transition-all duration-300">
            <h2 className="m-0 mb-2 text-[#141414] font-bold text-[16px]">Documents</h2>
            <div className="flex flex-col">
              <div className="border-b border-[#f0f0f0] py-3.5 min-w-0">
                <span className="block text-[#5c5c5c] text-[12px] font-bold uppercase tracking-wider mb-1.5">CV / RESUME</span>
                <div className="block break-words text-[#141414] text-[16px] font-medium">
                  {form.resumeUrl ? (
                    <a
                      href={form.resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#141414] hover:text-[#c99b2e] transition-colors"
                    >
                      {extractFilename(form.resumeUrl)}
                    </a>
                  ) : (
                    <span className="text-[#5c5c5c]">Not uploaded</span>
                  )}
                </div>
              </div>
              <div className="py-3.5 min-w-0">
                <span className="block text-[#5c5c5c] text-[12px] font-bold uppercase tracking-wider mb-1.5">EXTERNALLY EARNED CERTIFICATES + PORTFOLIO</span>
                <div className="block break-words text-[#141414] text-[14px] font-medium">
                  {certificates.length > 0 ? (
                    <div className="flex flex-col gap-1">
                      {certificates.map((cert, index) => (
                        <a
                          key={cert.id}
                          href={cert.url || "#"}
                          target={cert.url ? "_blank" : undefined}
                          rel="noopener noreferrer"
                          className="text-[#141414] hover:text-[#c99b2e] transition-colors break-all"
                        >
                          {cert.title || `Certificate ${index + 1}`}
                        </a>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[#8c8c8c]">Not uploaded</span>
                  )}
                </div>
              </div>
            </div>
          </article>
        </main>
      </div>
    );
  }

  return (
    <>
      <div className="w-full max-w-full mx-auto min-h-full  py-10 flex flex-col md:flex-row gap-8 bg-white text-[#141414] items-start">
        <aside className="w-full md:w-[280px] shrink-0 flex flex-col">
          <div className="flex flex-col bg-white rounded-xl border border-[#e5e5e5] shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300 px-6 pt-8 pb-6">
            
            <div className="flex flex-col items-center text-center">
              <div className="h-[104px] w-[104px] rounded-full bg-gray-100 flex items-center justify-center mb-4 overflow-hidden relative border border-[#e5e5e5]">
                {profile?.profile?.photoUrl ? (
                  <img src={profile?.profile?.photoUrl} alt={fullName} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-gray-400 text-xs font-semibold">Photo</span>
                )}
              </div>
              <h2 className="font-bold text-[20px] text-[#141414] mb-1">{fullName}</h2>
              <div className="text-[13px] font-medium text-[#8c8c8c] mb-6">
                Editing your profile
              </div>
              
              <div className="relative flex items-center justify-center mb-5">
                <svg className="w-[88px] h-[88px] transform -rotate-90">
                  <circle cx="44" cy="44" r="36" stroke="#f5f5f5" strokeWidth="8" fill="none" />
                  <circle
                    cx="44" cy="44" r="36"
                    stroke="#c99b2e"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 36}`}
                    strokeDashoffset={`${2 * Math.PI * 36 * (1 - completed / 100)}`}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-in-out"
                  />
                </svg>
                <span className="absolute text-[16px] font-bold text-[#755a12]">{completed}%</span>
              </div>
              
              <p className="text-[12px] text-[#5c5c5c] mb-6 px-1 leading-relaxed text-center max-w-[220px] mx-auto">
                Finish every field to reach 100% and unlock your Course Completed proof.
              </p>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-[#fef5ad] hover:bg-[#f1e699] border border-[#e5d26e] text-[#141414] rounded-full py-2.5 font-bold transition-all text-[14px] shadow-sm disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>

            <nav className="flex flex-col w-full text-left mt-6 border-t border-[#e5e5e5]">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <div 
                    key={tab.id} 
                    onClick={() => handleTabClick(tab.id)} 
                    className="flex justify-between items-center py-3.5 border-b border-[#e5e5e5] text-[13px] cursor-pointer transition-colors hover:bg-[#fafafa]"
                  >
                    <span className={isActive ? 'text-[#141414]' : 'text-[#8c8c8c]'}>{tab.label}</span>
                    <span className={`font-bold ${isActive ? 'text-[#a17a22]' : 'text-[#141414]'}`}>{getTabProgress(tab.id)}</span>
                  </div>
                );
              })}
            </nav>
            
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="w-full mt-6 bg-white text-[#8c8c8c] hover:text-[#141414] text-[13px] font-bold transition-colors"
            >
              Cancel editing
            </button>
          </div>
        </aside>

        <main className="flex-1 min-w-0 flex flex-col">
          <header className="mb-6">
            <div className="text-[10px] font-bold text-[#8c8c8c] uppercase tracking-widest mb-2">PROFILE & ACCOUNT</div>
            <h1 className="text-[24px] font-bold text-[#141414] m-0 mb-2">Edit profile</h1>
            <p className="text-[14px] text-[#5c5c5c]">Complete every field to reach 100%. Full completion is required before your Course Completed proof can be issued.</p>
          </header>

          <div className="flex flex-wrap gap-2 mb-8">
            <div className="inline-flex items-center p-1 bg-[#fafafa] border border-[#e5e5e5] rounded-full">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleTabClick(tab.id)}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[13px] transition-colors ${
                      isActive
                        ? 'bg-[#141414] text-white font-bold'
                        : 'text-[#5c5c5c] hover:text-[#141414] font-medium'
                    }`}
                  >
                    {tab.label}
                    <span className={`text-[11px] ${
                      isActive ? 'px-2 py-0.5 rounded-full bg-[#3f3822] text-white font-bold' : 'text-[#5c5c5c] font-medium'
                    }`}>
                      {getTabProgress(tab.id)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {(notice || error) && (
            <div className={`mb-6 border border-[#b6dac2] rounded-md px-4 py-3 bg-[#f2fbf5] text-[#166534] font-bold text-[14px] ${error ? "is-error" : ""}`}>
              {error || notice}
            </div>
          )}

          <div className="profile-edit-content animate-fade">
            <div id="section-personal" className="bg-white rounded-xl border border-[#e5e5e5] mb-8 scroll-mt-24">
              <div className="px-6 py-5 border-b border-[#e5e5e5]">
                <h2 className="text-[16px] font-bold text-[#141414] m-0">Personal details</h2>
              </div>
              <div className="p-6">
                <h3 className="text-[11px] font-bold text-[#5c5c5c] uppercase tracking-widest mb-6">CORE IDENTITY + DEMOGRAPHIC</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-6">
                  <div>
                    <label className="block text-[12px] font-bold text-[#141414] mb-2">First Name <span className="text-[#d92d20]">*</span></label>
                    <input className="w-full h-11 border border-[#e5e5e5] rounded-md bg-white px-3.5 text-[#141414] text-[14px] focus:outline-none focus:border-[#c99b2e] focus:ring-1 focus:ring-[#c99b2e] transition-all disabled:bg-[#fafafa] disabled:text-[#8c8c8c]" value={form.firstName} onChange={updateField("firstName")} />
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold text-[#141414] mb-2">Last Name <span className="text-[#d92d20]">*</span></label>
                    <input className="w-full h-11 border border-[#e5e5e5] rounded-md bg-white px-3.5 text-[#141414] text-[14px] focus:outline-none focus:border-[#c99b2e] focus:ring-1 focus:ring-[#c99b2e] transition-all disabled:bg-[#fafafa] disabled:text-[#8c8c8c]" value={form.lastName} onChange={updateField("lastName")} />
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold text-[#141414] mb-2 flex items-center">
                      Email <span className="text-[#d92d20] ml-1">*</span> 
                      <span className="text-[#8c8c8c] font-normal ml-1.5">(OTP required to change)</span>
                    </label>
                    <input className="w-full h-11 border border-[#e5e5e5] rounded-md bg-[#fafafa] px-3.5 text-[#8c8c8c] text-[14px] outline-none cursor-not-allowed" value={profile?.email ?? ""} readOnly />
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold text-[#141414] mb-2">Title / Prefix</label>
                    <select className="w-full h-11 border border-[#e5e5e5] rounded-md bg-white px-3.5 text-[#141414] text-[14px] focus:outline-none focus:border-[#c99b2e] focus:ring-1 focus:ring-[#c99b2e] transition-all" value={form.titlePrefix} onChange={updateField("titlePrefix")}>
                      <option value="">Select...</option>
                      <option value="MR">Mr.</option>
                      <option value="MRS">Mrs.</option>
                      <option value="MS">Ms.</option>
                      <option value="DR">Dr.</option>
                      <option value="PROF">Prof.</option>
                      <option value="NONE">None</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold text-[#141414] mb-2">Name on your Course Completed proof <span className="text-[#d92d20]">*</span></label>
                    <input className="w-full h-11 border border-[#e5e5e5] rounded-md bg-white px-3.5 text-[#141414] text-[14px] focus:outline-none focus:border-[#c99b2e] focus:ring-1 focus:ring-[#c99b2e] transition-all" value={form.certificateName} onChange={updateField("certificateName")} />
                    <p className="mt-2 text-[12px] text-[#8a6a1c] font-medium leading-tight pr-4">Controls the name shown on your Course Completed proof(s). Changes apply only to future Course Completed proofs. OTP required.</p>
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold text-[#141414] mb-2">Photo</label>
                    <div className="w-full min-h-[88px] flex items-center justify-center border border-dashed border-[#d8d8d8] rounded-md bg-[#fafafa] text-[#8c8c8c] p-4 text-center text-[12px] font-medium cursor-pointer hover:bg-[#f5f5f5] transition-colors relative">
                      {photoUploading ? (
                        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                      ) : photoPreview ? (
                        <div className="flex items-center gap-4 w-full justify-center">
                          <img src={photoPreview} alt="Preview" className="h-12 w-12 rounded-full object-cover border border-[#e5e5e5]" />
                          <div className="flex flex-col text-left">
                            <span className="text-[#141414] font-bold text-[13px]">Photo uploaded</span>
                            <button type="button" onClick={(e) => { e.preventDefault(); handleDeletePhoto(); }} className="text-[#d92d20] text-[12px] font-bold hover:underline mt-0.5 text-left">Remove photo</button>
                          </div>
                        </div>
                      ) : (
                        <label className="w-full h-full flex items-center justify-center cursor-pointer">
                          <span>Drag image or click to upload · square JPG/PNG up to 2 MB · preview shown before save</span>
                          <input type="file" accept="image/*" hidden onChange={handlePhotoUpload} />
                        </label>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold text-[#141414] mb-2">Preferred Language</label>
                    <select className="w-full h-11 border border-[#e5e5e5] rounded-md bg-white px-3.5 text-[#141414] text-[14px] focus:outline-none focus:border-[#c99b2e] focus:ring-1 focus:ring-[#c99b2e] transition-all" value={form.preferredLanguage} onChange={updateField("preferredLanguage")}>
                      <option value="">English</option>
                      {new LanguageList().getData().map((lang: { code: string; language: string }) => (
                        <option key={lang.code} value={lang.code}>{lang.language}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold text-[#141414] mb-2 flex items-center">
                      Date of birth <span className="text-[#8c8c8c] font-normal ml-1.5">(used for age verification · min 16)</span>
                    </label>
                    <input type="date" className="w-full h-11 border border-[#e5e5e5] rounded-md bg-white px-3.5 text-[#141414] text-[14px] focus:outline-none focus:border-[#c99b2e] focus:ring-1 focus:ring-[#c99b2e] transition-all" value={form.dob} max={maxDobDate} onChange={updateField("dob")} />
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold text-[#141414] mb-2">Gender</label>
                    <select className="w-full h-11 border border-[#e5e5e5] rounded-md bg-white px-3.5 text-[#141414] text-[14px] focus:outline-none focus:border-[#c99b2e] focus:ring-1 focus:ring-[#c99b2e] transition-all" value={form.gender} onChange={updateField("gender")}>
                      <option value="">Not provided</option>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                      <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold text-[#141414] mb-2">Country <span className="text-[#d92d20]">*</span></label>
                    <select className="w-full h-11 border border-[#e5e5e5] rounded-md bg-white px-3.5 text-[#141414] text-[14px] focus:outline-none focus:border-[#c99b2e] focus:ring-1 focus:ring-[#c99b2e] transition-all" value={form.countryName} onChange={(e) => {
                      const countryName = e.target.value;
                      setForm((current) => ({
                        ...current,
                        countryName,
                        phoneCountryCode: getCountryCallingCode(countryName),
                      }));
                    }}>
                      <option value="">Select country</option>
                      {countries.map((country) => (
                        <option key={country.isoCode} value={country.name}>{country.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold text-[#141414] mb-2">City</label>
                    <input className="w-full h-11 border border-[#e5e5e5] rounded-md bg-white px-3.5 text-[#141414] text-[14px] focus:outline-none focus:border-[#c99b2e] focus:ring-1 focus:ring-[#c99b2e] transition-all" value={form.city} onChange={updateField("city")} />
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold text-[#141414] mb-2">Phone</label>
                    <div className="flex gap-2">
                      <input className="w-[80px] h-11 border border-[#e5e5e5] rounded-md bg-[#fafafa] px-3.5 text-[#8c8c8c] text-[14px] outline-none cursor-not-allowed" value={form.phoneCountryCode} readOnly />
                      <input type="tel" className="flex-1 h-11 border border-[#e5e5e5] rounded-md bg-white px-3.5 text-[#141414] text-[14px] focus:outline-none focus:border-[#c99b2e] focus:ring-1 focus:ring-[#c99b2e] transition-all" value={form.mobileNumber} onChange={(e) => {
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
                      }} placeholder="Mobile number" inputMode="numeric" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="profile-edit-content animate-fade">
            <div id="section-professional" className="bg-white rounded-xl border border-[#e5e5e5] mb-8 scroll-mt-24">
              <div className="px-6 py-5 border-b border-[#e5e5e5]">
                <h2 className="text-[16px] font-bold text-[#141414] m-0">Professional details</h2>
              </div>
              <div className="p-6">
                <h3 className="text-[11px] font-bold text-[#5c5c5c] uppercase tracking-widest mb-6">PROFESSIONAL · PROFESSIONAL PROFILE</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-6">
                  <div>
                    <label className="block text-[12px] font-bold text-[#141414] mb-2">Current Role</label>
                    <input type="text" value={form.currentRole} onChange={updateField("currentRole")} placeholder="e.g. Information Architect" className="w-full h-11 border border-[#e5e5e5] rounded-md bg-white px-3.5 text-[#141414] text-[14px] focus:outline-none focus:border-[#c99b2e] focus:ring-1 focus:ring-[#c99b2e] transition-all" />
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold text-[#141414] mb-2">Experience Level</label>
                    <select value={form.experienceLevel} onChange={updateField("experienceLevel")} className="w-full h-11 border border-[#e5e5e5] rounded-md bg-white px-3.5 text-[#141414] text-[14px] focus:outline-none focus:border-[#c99b2e] focus:ring-1 focus:ring-[#c99b2e] transition-all">
                      <option value="">Select experience</option>
                      <option value="BEGINNER">BEGINNER (0-2 yrs)</option>
                      <option value="INTERMEDIATE">INTERMEDIATE</option>
                      <option value="ADVANCED">ADVANCED</option>
                      <option value="EXPERT">EXPERT</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold text-[#141414] mb-2">Industry</label>
                    <select value={form.industry} onChange={updateField("industry")} className="w-full h-11 border border-[#e5e5e5] rounded-md bg-white px-3.5 text-[#141414] text-[14px] focus:outline-none focus:border-[#c99b2e] focus:ring-1 focus:ring-[#c99b2e] transition-all">
                      <option value="">Select industry</option>
                      <option>Government</option>
                      <option>Technology</option>
                      <option>Finance</option>
                      <option>Healthcare</option>
                      <option>Education</option>
                      <option>Manufacturing</option>
                      <option>Retail</option>
                      <option>Construction</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold text-[#141414] mb-2">Current Employer</label>
                    <input type="text" value={form.currentEmployer} onChange={updateField("currentEmployer")} placeholder="Company name" className="w-full h-11 border border-[#e5e5e5] rounded-md bg-white px-3.5 text-[#141414] text-[14px] focus:outline-none focus:border-[#c99b2e] focus:ring-1 focus:ring-[#c99b2e] transition-all" />
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold text-[#141414] mb-2">Education Completion Year</label>
                    <input type="number" min="1950" max={new Date().getFullYear() + 10} value={form.educationCompletionYear} onChange={updateField("educationCompletionYear")} placeholder="e.g. 2024" className="w-full h-11 border border-[#e5e5e5] rounded-md bg-white px-3.5 text-[#141414] text-[14px] focus:outline-none focus:border-[#c99b2e] focus:ring-1 focus:ring-[#c99b2e] transition-all" />
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-[#e5e5e5]">
                  <CareerHistorySection value={careerHistory} onChange={setCareerHistory} currentEmployer={form.currentEmployer} />
                </div>

                <div className="mt-8 pt-8 border-t border-[#e5e5e5]">
                  <label className="block text-[12px] font-bold text-[#141414] mb-2">Preferred Skills</label>
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
                        className="w-full h-11 border border-[#e5e5e5] rounded-md bg-white px-3.5 text-[#141414] text-[14px] focus:outline-none focus:border-[#c99b2e] focus:ring-1 focus:ring-[#c99b2e] transition-all"
                      />
                      <button type="button" onClick={() => addSkill(skillQuery)} disabled={!skillQuery.trim()} className="shrink-0 px-3 rounded-md border border-[#c99b2e] text-[13px] font-semibold disabled:opacity-40">Add</button>
                    </div>
                    {skillsOpen && (filteredSkills.length > 0 || skillQuery.trim()) && (
                      <div className="absolute z-20 mt-1 w-full max-h-56 overflow-auto rounded-md border border-[#e5e5e5] bg-white p-1 shadow-lg">
                        {filteredSkills.map((skill) => (
                          <button type="button" key={skill.id} onClick={() => addSkill(skill.name)} className="block w-full rounded px-3 py-2 text-left text-[14px] hover:bg-[#fff8d7]">{skill.name}</button>
                        ))}
                        {skillQuery.trim() && !skills.some((skill) => skill.name.toLowerCase() === skillQuery.trim().toLowerCase()) && (
                          <button type="button" onClick={() => addSkill(skillQuery)} className="block w-full rounded border-t border-[#f0f0f0] px-3 py-2 text-left text-[14px] font-semibold hover:bg-[#fff8d7]">Add new skill: {skillQuery.trim()}</button>
                        )}
                      </div>
                    )}
                    {selectedSkills.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {selectedSkills.map((skill) => (
                          <span key={skill} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#f5f5f5] text-[#141414] text-[13px] font-medium rounded-full border border-[#e5e5e5]">
                            {skill}
                            <button type="button" onClick={() => setSelectedSkills((current) => current.filter((item) => item !== skill))} aria-label={`Remove ${skill}`} className="text-[#8c8c8c] hover:text-[#d92d20]"><X size={14} /></button>
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="mt-2 text-[12px] text-gray-500">Existing skills come from the database. New skills are created when you save.</p>
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-[#e5e5e5]">
                  <label className="block text-[12px] font-bold text-[#141414] mb-2">Learning interests</label>
                  <input
                    type="text"
                    value={learningInterestInput}
                    onChange={(e) => setLearningInterestInput(e.target.value)}
                    onKeyDown={handleAddLearningInterest}
                    placeholder="Type and press Enter to add"
                    className="w-full h-11 border border-[#e5e5e5] rounded-md bg-white px-3.5 text-[#141414] text-[14px] focus:outline-none focus:border-[#c99b2e] focus:ring-1 focus:ring-[#c99b2e] transition-all"
                  />

                  {learningInterests.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {learningInterests.map((interest) => (
                        <span
                          key={interest}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#f4f4f4] text-[#333333] text-[13px] font-medium rounded-full border border-[#e5e5e5]"
                        >
                          {interest}
                          <button
                            type="button"
                            onClick={() => removeLearningInterest(interest)}
                            className="text-[#8c8c8c] hover:text-[#d92d20] flex items-center justify-center bg-transparent border-0 cursor-pointer"
                            aria-label={`Remove ${interest}`}
                          >
                            <X size={14} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="profile-edit-content animate-fade">
            <div id="section-links" className="bg-white rounded-xl border border-[#e5e5e5] mb-8 scroll-mt-24">
              <div className="px-6 py-5 border-b border-[#e5e5e5]">
                <h2 className="text-[16px] font-bold text-[#141414] m-0">Personal links</h2>
              </div>
              <div className="p-6">
                <h3 className="text-[11px] font-bold text-[#5c5c5c] uppercase tracking-widest mb-6">PERSONAL LINKS · MULTIPLE LINKS ALLOWED</h3>

                <div className="mb-8 pb-8 border-b border-[#e5e5e5]">
                  <label className="block text-[12px] font-bold text-[#141414] mb-4 flex items-center">
                    Personal Site / Blog Links <span className="text-[#8c8c8c] font-normal ml-1.5">(optional)</span>
                  </label>
                  <div className="flex flex-col gap-3">
                    {extraLinks.map((link, index) => (
                      <div key={`${index}-${link.url}`} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                        <input className="w-full sm:w-1/3 h-11 border border-[#e5e5e5] rounded-md bg-white px-3.5 text-[#141414] text-[14px] focus:outline-none focus:border-[#c99b2e] focus:ring-1 focus:ring-[#c99b2e] transition-all" value={link.title} placeholder="e.g. Portfolio" onChange={(e) => handleLinkChange(index, "title", e.target.value)} />
                        <input className="flex-1 w-full h-11 border border-[#e5e5e5] rounded-md bg-white px-3.5 text-[#141414] text-[14px] focus:outline-none focus:border-[#c99b2e] focus:ring-1 focus:ring-[#c99b2e] transition-all" value={link.url} placeholder="https://" onChange={(e) => handleLinkChange(index, "url", e.target.value)} />
                        <button type="button" onClick={() => handleRemoveLink(index)} className="h-11 px-4 text-[#d92d20] text-[13px] font-bold hover:bg-[#fff5f5] rounded-md transition-colors whitespace-nowrap border border-transparent hover:border-[#fed7d7]">
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={handleAddLink} className="mt-4 h-10 px-5 bg-white border border-[#d8d8d8] text-[#141414] text-[13px] font-bold rounded-md hover:bg-[#fafafa] transition-colors inline-flex items-center justify-center">
                    + Add another link
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-6">
                  <div>
                    <label className="block text-[12px] font-bold text-[#141414] mb-2">Portfolio URL</label>
                    <input className="w-full h-11 border border-[#e5e5e5] rounded-md bg-white px-3.5 text-[#141414] text-[14px] focus:outline-none focus:border-[#c99b2e] focus:ring-1 focus:ring-[#c99b2e] transition-all" value={form.portfolioUrl} onChange={updateField("portfolioUrl")} placeholder="https://" />
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold text-[#141414] mb-2">Website URL</label>
                    <input className="w-full h-11 border border-[#e5e5e5] rounded-md bg-white px-3.5 text-[#141414] text-[14px] focus:outline-none focus:border-[#c99b2e] focus:ring-1 focus:ring-[#c99b2e] transition-all" value={form.websiteUrl} onChange={updateField("websiteUrl")} placeholder="https://" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[12px] font-bold text-[#141414] mb-2 flex items-center">
                      Public profile URL <span className="text-[#8c8c8c] font-normal ml-1.5">(Auto-generated · share-friendly · works only at 100%)</span>
                    </label>
                    <input className="w-full max-w-md h-11 border border-[#e5e5e5] rounded-md bg-[#fafafa] px-3.5 text-[#8c8c8c] text-[14px] outline-none cursor-not-allowed" value={publicSlug} readOnly />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="profile-edit-content animate-fade">
            <div id="section-documents" className="bg-white rounded-xl border border-[#e5e5e5] mb-8 scroll-mt-24">
              <div className="px-6 py-5 border-b border-[#e5e5e5]">
                <h2 className="text-[16px] font-bold text-[#141414] m-0">Documents</h2>
              </div>
              <div className="p-6">
                <h3 className="text-[11px] font-bold text-[#5c5c5c] uppercase tracking-widest mb-6">DOCUMENTS · SUPPORTING EVIDENCE</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-[12px] font-bold text-[#141414] mb-2 flex flex-col sm:flex-row sm:items-center gap-1">
                      CV / Resume <span className="text-[#8c8c8c] font-normal">(PDF, DOC, DOCX · up to 5 MB)</span>
                    </label>
                    
                    <div className="w-full min-h-[88px] flex items-center justify-center border border-dashed border-[#d8d8d8] rounded-md bg-[#fafafa] p-4 text-center text-[13px] font-medium transition-colors hover:bg-[#f5f5f5]">
                      {resumeUploading ? (
                        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                      ) : (
                        <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer text-[#5c5c5c]">
                          <span className="font-bold text-[#141414]">{form.resumeUrl ? "Replace Resume" : "Upload Resume"}</span>
                          <span className="text-[11px] mt-1">Drag file here or click to browse</span>
                          <input type="file" accept=".pdf,.doc,.docx" hidden onChange={handleResumeUpload} />
                        </label>
                      )}
                    </div>

                    {form.resumeUrl && (
                      <div className="mt-3 flex items-center justify-between p-3 bg-[#f9f9f9] border border-[#e5e5e5] rounded-md">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <svg className="w-4 h-4 text-[#5c5c5c] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                          <span className="text-[13px] text-[#141414] truncate font-medium">{extractFilename(form.resumeUrl)}</span>
                        </div>
                        <button type="button" onClick={async () => {
                          try {
                            await deleteResume();
                            await getProfile();
                          } catch {
                            setError("Failed to delete resume");
                          }
                        }} className="text-[#d92d20] text-[12px] font-bold hover:underline flex-shrink-0 ml-4">
                          Remove
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[12px] font-bold text-[#141414] mb-2 flex flex-col sm:flex-row sm:items-center gap-1">
                      Externally Earned Certificates <span className="text-[#8c8c8c] font-normal">(Multiple supported)</span>
                    </label>

                    <div className="w-full min-h-[88px] flex items-center justify-center border border-dashed border-[#d8d8d8] rounded-md bg-[#fafafa] p-4 text-center text-[13px] font-medium transition-colors hover:bg-[#f5f5f5]">
                      {certificateUploading ? (
                        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                      ) : (
                        <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer text-[#5c5c5c]">
                          <span className="font-bold text-[#141414]">Add Certificate</span>
                          <span className="text-[11px] mt-1">Upload PDF, PNG, JPG</span>
                          <input type="file" accept=".pdf,.png,.jpg,.jpeg" multiple hidden onChange={handleDocumentUpload} />
                        </label>
                      )}
                    </div>

                    {certificates.length > 0 && (
                      <div className="mt-3 flex flex-col gap-2">
                        {certificates.map((certificate) => (
                          <div key={certificate.id} className="flex items-center justify-between p-3 bg-[#f9f9f9] border border-[#e5e5e5] rounded-md">
                            <div className="flex items-center gap-2 overflow-hidden">
                              <svg className="w-4 h-4 text-[#5c5c5c] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                              <span className="text-[13px] text-[#141414] truncate font-medium">{certificate.title || "Certificate"}</span>
                            </div>
                            <button type="button" onClick={async () => {
                              if (!certificate.id) return;
                              try {
                                await deleteCertificate(certificate.id);
                                await getProfile();
                              } catch {
                                setError("Failed to delete certificate");
                              }
                            }} className="text-[#d92d20] text-[12px] font-bold hover:underline flex-shrink-0 ml-4">
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>

        </main>
      </div>

      {showOTPModal && (
        <ProfileVerifyOTP
          isOpen={showOTPModal}
          onClose={() => setShowOTPModal(false)}
          onSuccess={() => {
            getProfile();
            setIsEditing(false);
            setShowOTPModal(false);
          }}
        />
      )}

    </>
  );
};

export default ProfileData;