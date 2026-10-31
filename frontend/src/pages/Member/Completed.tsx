import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { useProfileStore } from "../../store/profile.store";
import { useProfile } from "../../hooks/profile/useProfile";
import { useUserCertificates, useDownloadCertificate } from "../../hooks/course-completed/courseCompleted";
import { useMemberLearningCourses, useProgressDashboard } from "../../hooks/member-learning/memberLearning";
import { useCourseCompletedStore } from "../../store/course-completed/courseCompleted.store";

import { Button } from "../../components/ui/Button/Button";
import { Chip } from "../../components/ui/Chip/Chip";

import { DataTable } from "../../components/ui/DataTable/DataTable";
import type { Column } from "../../components/ui/DataTable/DataTable";

import ShareModal from "./ShareModal";
import { ChevronDown } from "lucide-react";
import { Skeleton } from "../../components/ui/Skeleton/Skeleton";

// Icons from assets
import { ArrowRight, BookOpen, Award, Clock, Eye, Share2, Download, List, Grid, CheckSquare, Sparkles, Calendar, ShieldCheck, CheckCircle2 } from "lucide-react";










import { api } from "@/config/axios";
import { useQuery } from "@tanstack/react-query";

const Completed: React.FC = () => {
    const navigate = useNavigate();
    const { getProfile } = useProfile();
    const userId = useProfileStore((state) => state.profile?.id) || "";

    useEffect(() => {
        if (!userId) {
            getProfile();
        }
    }, [userId, getProfile]);

    const [viewMode, setViewMode] = useState<"list" | "grid">("list");
    const [sortOrder, setSortOrder] = useState<"recent" | "oldest" | "name">("recent");
    const { setShareModalOpen, setSelectedCertificateId } = useCourseCompletedStore();
    const [localShareModalOpen, setLocalShareModalOpen] = useState(false);
    const [shareItem, setShareItem] = useState<{
        id: string;
        title: string;
        thumbnailUrl?: string;
        type?: string;
        shareToken?: string;
        proofId?: string;
    } | null>(null);

    // Fetch certificates to map certificate IDs for downloading/sharing
    const { data: certsResponse, isLoading: isLoadingCerts } = useUserCertificates(userId, undefined, !!userId);

    // Use the member learning hook exactly as requested
    const { data: coursesData, isLoading: isLoadingCourses } = useMemberLearningCourses(
        userId,
        "My Learning",
        {},
        "",
        "recent",
        1,
        1000,
        !!userId
    );

    const { data: progressDashboard, isLoading: isLoadingDashboard } = useProgressDashboard(userId, !!userId);

    const isLoading = isLoadingCerts || isLoadingCourses || isLoadingDashboard;
    const downloadMutation = useDownloadCertificate();

    const handleDownload = async (certId: string) => {
        try {
            const blob = await downloadMutation.mutateAsync({ certificateId: certId, userId });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `certificate-${certId}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Failed to download PDF:", err);
        }
    };

    const handleShare = (cert: any) => {
        const certId = cert.originalId || cert.id;
        setSelectedCertificateId(certId);
        setShareItem({
            id: certId,
            title: cert.course?.title || cert.title || "Course Certificate",
            thumbnailUrl: cert.course?.thumbnailAsset?.fileUrl || cert.thumbnail,
            type: "certificate",
            proofId: cert.serialNumber || cert.proofId,
            shareToken: cert.verification?.verificationToken,
        });
        setLocalShareModalOpen(true);
    };

    const certificates: any[] = useMemo(() => {
        let combined: any[] = [];
        const certMap = new Map<string, string>();
        const dateMap = new Map<string, Date>();

        // 1. Build a map of completed certificates
        if (certsResponse?.data) {
            certsResponse.data.forEach((cert: any) => {
                const certId = cert.id;
                const date = new Date(cert.issuedAt || cert.createdAt);

                if (cert.courseId) {
                    certMap.set(cert.courseId, certId);
                    dateMap.set(cert.courseId, date);
                }
                if (cert.course?.id) {
                    certMap.set(cert.course?.id, certId);
                    dateMap.set(cert.course?.id, date);
                }
                if (cert.career_path_id) {
                    certMap.set(cert.career_path_id, certId);
                    dateMap.set(cert.career_path_id, date);
                }
                if (cert.career_paths?.id) {
                    certMap.set(cert.career_paths.id, certId);
                    dateMap.set(cert.career_paths.id, date);
                }

                // Fallback for the certificate itself
                certMap.set(certId, certId);
                dateMap.set(certId, date);
            });
        }

        // 2. Iterate through the courses from MemberLearning API
        if (coursesData?.data) {
            coursesData.data.forEach((course: any) => {
                const progress = course.progress ?? 0;
                const isCompleted = course.statusText === "Completed" || progress === 100;
                const isInProgress = progress >= 5 && progress < 100;

                let durationMins = course.totalDurationMins ?? 0;

                if (isCompleted || isInProgress) {
                    combined.push({
                        id: course.id,
                        courseId: course.id,
                        status: isCompleted ? "completed" : "inprogress",
                        progressPercentage: isCompleted ? 100 : progress,
                        sortDate: dateMap.get(course.id)?.getTime() || new Date().getTime(),
                        originalId: certMap.get(course.id),
                        course: {
                            title: course.title,
                            category: { name: course.category },
                            thumbnailAsset: { fileUrl: course.thumbnailUrl },
                            duration: durationMins,
                            isCredential: true,
                            subjectName: course.subjectName
                        },
                        careerPathId: null
                    });
                }
            });
        }

        if (sortOrder === "recent") {
            combined.sort((a: any, b: any) => b.sortDate - a.sortDate);
        } else if (sortOrder === "oldest") {
            combined.sort((a: any, b: any) => a.sortDate - b.sortDate);
        } else if (sortOrder === "name") {
            combined.sort((a: any, b: any) => {
                const titleA = a.course?.title?.toLowerCase() || "";
                const titleB = b.course?.title?.toLowerCase() || "";
                return titleA.localeCompare(titleB);
            });
        }
        return combined;
    }, [certsResponse, coursesData, sortOrder]);

    const totalCourses = certificates.length;
    const completedCourses = certificates.filter(c => c.status === "completed").length;

    // Use the exact timeSpentSecs aggregated by the backend progress engine
    const totalSeconds = progressDashboard?.totalLearningTime || 0;
    const totalMinutes = Math.floor(totalSeconds / 60);
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;

    let learningTimeStr = "";
    if (hrs > 0) {
        learningTimeStr += `${hrs} hr${hrs !== 1 ? 's' : ''} `;
    }
    if (mins > 0 || hrs === 0) {
        learningTimeStr += `${mins} min${mins !== 1 ? 's' : ''}`;
    }
    learningTimeStr = learningTimeStr.trim();

    const totalCredentials = certificates.filter((c) => c.course?.isCredential && c.status === "completed").length;

    if (isLoading) {
        return (
            <div className="min-h-screen bg-paper space-y-8 pb-12">
                {/* Header Skeleton */}
                <div className="space-y-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-4 w-96 max-w-full" />
                </div>

                {/* Metrics Stats Row Skeleton */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white border border-(--line) rounded-2xl p-6 shadow-sm space-y-3">
                            <div className="flex justify-between items-center">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-8 w-8 rounded-full" />
                            </div>
                            <Skeleton className="h-8 w-20" />
                            <Skeleton className="h-3 w-40" />
                        </div>
                    ))}
                </div>

                {/* Table / List Controls Skeleton */}
                <div className="flex justify-between items-center pt-4">
                    <Skeleton className="h-6 w-40" />
                    <div className="flex gap-2">
                        <Skeleton className="h-9 w-24 rounded-lg" />
                        <Skeleton className="h-9 w-24 rounded-lg" />
                    </div>
                </div>

                {/* Table Rows Skeleton */}
                <div className="bg-white border border-(--line) rounded-2xl overflow-hidden shadow-sm divide-y divide-gray-100">
                    {[1, 2, 3, 4, 5].map((k) => (
                        <div key={k} className="p-4 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4 flex-1">
                                <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
                                <div className="space-y-1.5 flex-1">
                                    <Skeleton className="h-4 w-60" />
                                    <Skeleton className="h-3 w-32" />
                                </div>
                            </div>
                            <div className="hidden sm:flex gap-4 items-center">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-8 w-24 rounded-full" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    const columns: Column<any>[] = [
        {
            key: 'course',
            header: 'COURSE',
            render: (cert) => (
                <div className="flex items-center gap-4">
                    <div className="w-13 h-13 bg-paper rounded-md overflow-hidden border border-line shrink-0 p-0.5">
                        <div className="w-full h-full rounded-sm overflow-hidden bg-paper-2 relative flex items-center justify-center">
                            {cert.course?.thumbnailAsset?.fileUrl ? (
                                <img src={cert.course.thumbnailAsset.fileUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <BookOpen className="w-5 h-5 text-indigo-400" />
                            )}
                        </div>
                    </div>
                    <div>
                        <div className="font-bold text-ink mb-0.5">{cert.course?.title || "Unknown Course"}</div>
                        <div className="text-[12px] text-ink-mute font-medium">{cert.course?.category?.name || "Career Path"}</div>
                    </div>
                </div>
            )
        },
        {
            key: 'category',
            header: 'CATEGORY',
            render: (cert) => (
                <Chip status={cert.careerPathId ? "warning" : "success"} className="uppercase text-[10px] tracking-wider font-bold">
                    {cert.careerPathId ? "PATH" : "COURSE"}
                </Chip>
            )
        },
        {
            key: 'completed',
            header: 'COMPLETED',
            render: (cert) => (
                <div className="text-[14px] text-ink-mute">
                    {cert.status === "completed" ? (
                        <>Completed <span className="font-bold text-ink">{new Date(cert.sortDate).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric"
                        })}</span></>
                    ) : (
                        <>In Progress (<span className="font-bold text-ink">{cert.progressPercentage}%</span>)</>
                    )}
                </div>
            )
        },
        {
            key: 'actions',
            header: 'ACTIONS',
            align: 'right',
            render: (cert) => {
                const targetId = cert.courseId || cert.course?.id || cert.careerPathId;
                const isPath = !!cert.careerPathId;
                return (
                    <div className="flex items-center justify-end gap-2">
                        <Button
                            iconOnly
                            aria-label="View"
                            onClick={() => {
                                if (cert.status === "completed") {
                                    navigate(`/certificate-detail?${isPath ? 'careerPathId=' + targetId : 'courseId=' + targetId}`);
                                } else {
                                    navigate(`/course-details?id=${targetId}&type=${isPath ? 'career-path' : 'course'}`);
                                }
                            }}
                        >
                            <Eye className="w-4 h-4 text-slate-700" />
                        </Button>
                        {cert.status === "completed" && (
                            <>
                                <Button
                                    iconOnly
                                    aria-label="Share"
                                    onClick={() => handleShare(cert)}
                                >
                                    <Share2 className="w-4 h-4 text-slate-700" />
                                </Button>
                                <Button
                                    iconOnly
                                    aria-label="Download"
                                    onClick={() => {
                                        if (cert.originalId) {
                                            handleDownload(cert.originalId);
                                        } else {
                                            navigate(`/certificate-detail?${isPath ? 'careerPathId=' + targetId : 'courseId=' + targetId}`);
                                        }
                                    }}
                                >
                                    <Download className="w-4 h-4 text-slate-700" />
                                </Button>
                            </>
                        )}
                    </div>
                );
            }
        }
    ];

    return (
        <>
            {/* <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen"> */}
            {/* Header section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                <div>
                    <div className="text-[12px] font-bold text-(--ink-mute) uppercase tracking-widest">COMPLETED</div>
                    <h1 className="text-[32px] font-extrabold text-(--ink) tracking-tight">Course Completed</h1>
                    <p className="text-[16px] text-(--ink-mute)">Every course you have finished. Open any one to view, share, or download it.</p>
                </div>
                <button
                    onClick={() => navigate("/member-learning")}
                    className="h-13 px-6 mb-8 flex items-center justify-center rounded-full border border-(--line-strong) bg-(--paper) hover:bg-(--paper-2) hover:border-(--ink) hover:-translate-y-0.5 hover:shadow-sm transition-all duration-300 text-[16px] font-bold text-(--ink)"
                >
                    Browse catalog
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-[14px] mb-10">
                <div className="relative overflow-hidden flex items-center gap-4 p-6 bg-(--paper) border border-(--line) rounded-xl shadow-sm hover:-translate-y-1 hover:shadow-hover transition-all duration-300">
                    <div className="absolute -right-8 top-1/2 -translate-y-1/2 w-40 h-40 bg-(--c-honey-wash) opacity-60 blur-3xl pointer-events-none rounded-full"></div>
                    <div className="relative z-10 w-12 h-12 rounded-xl bg-(--c-honey-wash) text-(--c-honey-text) flex items-center justify-center shrink-0">
                        <CheckSquare className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="relative z-10 flex flex-col gap-0.5">
                        <span className="text-[33px] font-extrabold text-(--ink) leading-none">{completedCourses}</span>
                        <span className="text-[12px] font-medium text-(--ink-mute)">Courses completed</span>
                    </div>
                </div>
                <div className="relative overflow-hidden flex items-center gap-4 p-6 bg-(--paper) border border-(--line) rounded-xl shadow-sm hover:-translate-y-1 hover:shadow-hover transition-all duration-300">
                    <div className="absolute -right-8 top-1/2 -translate-y-1/2 w-40 h-40 bg-(--c-sage-wash) opacity-60 blur-3xl pointer-events-none rounded-full"></div>
                    <div className="relative z-10 w-12 h-12 rounded-xl bg-(--c-sage-wash) text-(--c-sage-text) flex items-center justify-center shrink-0">
                        <Award className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="relative z-10 flex flex-col gap-0.5">
                        <span className="text-[33px] font-extrabold text-(--ink) leading-none">{totalCredentials}</span>
                        <span className="text-[12px] font-medium text-(--ink-mute)">Credential earned</span>
                    </div>
                </div>
                <div className="relative overflow-hidden flex items-center gap-4 p-6 bg-(--paper) border border-(--line) rounded-xl shadow-sm hover:-translate-y-1 hover:shadow-hover transition-all duration-300">
                    <div className="absolute -right-8 top-1/2 -translate-y-1/2 w-40 h-40 bg-(--c-danger-wash) opacity-60 blur-3xl pointer-events-none rounded-full"></div>
                    <div className="relative z-10 w-12 h-12 rounded-xl bg-(--c-danger-wash) text-(--c-danger-deep) flex items-center justify-center shrink-0">
                        <Clock className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="relative z-10 flex flex-col gap-0.5">
                        <span className="text-[33px] font-extrabold text-(--ink) leading-none">{learningTimeStr}</span>
                        <span className="text-[12px] font-medium text-(--ink-mute)">Learning time</span>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <h2 className="text-[14px] font-medium text-(--ink-mute)">{totalCourses} courses completed</h2>
                <div className="flex items-center gap-[12px]">
                    <div className="flex bg-(--paper) border border-(--line) rounded-full overflow-hidden h-9.5">
                        <button
                            onClick={() => setViewMode("list")}
                            className={`w-11 h-full flex items-center justify-center transition-colors ${viewMode === "list" ? "bg-(--ink) text-(--paper)" : "text-(--ink-mute) hover:bg-(--paper-2)"}`}
                        >
                            <List className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode("grid")}
                            className={`w-11 h-full flex items-center justify-center transition-colors border-l border-(--line) ${viewMode === "grid" ? "bg-(--ink) text-(--paper)" : "text-(--ink-mute) hover:bg-(--paper-2)"}`}
                        >
                            <Grid className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="relative w-40">
                        <select
                            className="appearance-none cursor-pointer transition-colors duration-150 border border-(--line-strong) rounded-[var(--r-md)] bg-(--paper) h-10 min-h-10 text-[var(--fs-body,14px)] text-(--ink) font-medium w-full py-0 pl-[14px] pr-[36px] bg-[url(data:image/svg+xml,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20viewBox=%270%200%2024%2024%27%20fill=%27none%27%20stroke=%27%239B7165%27%20stroke-width=%272.2%27%20stroke-linecap=%27round%27%20stroke-linejoin=%27round%27%3E%3Cpath%20d=%27M6%209l6%206%206-6%27/%3E%3C/svg%3E)] bg-[position:right_13px_center] bg-no-repeat bg-[size:15px_15px] hover:bg-(--paper-2) hover:border-(--ink) focus:outline-none focus:border-(--c-honey-soft) focus:ring-1 focus:ring-(--c-honey-soft)"
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value as "recent" | "oldest" | "name")}
                        >
                            <option value="recent">Newest first</option>
                            <option value="oldest">Oldest first</option>
                            <option value="name">Course name</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Content */}
            {certificates.length === 0 ? (
                <div className="py-20 text-center border border-dashed border-(--line) rounded-xl bg-(--paper-2)">
                    <Award className="mx-auto w-12 h-12 text-slate-300 mb-3" />
                    <p className="text-(--ink-mute) font-medium text-[14px]">You haven't completed any courses yet.</p>
                    <button onClick={() => navigate("/member-learning")} className="mt-4 text-(--c-honey) font-bold hover:underline text-[14px]">
                        Start Learning
                    </button>
                </div>
            ) : viewMode === "list" ? (
                <div className="bg-(--paper) border border-(--line) rounded-xl overflow-x-auto shadow-sm">
                    <div className="min-w-200">
                        {/* Table Header */}
                        <div className="flex items-center px-6 py-4 border-b border-(--line) text-[11px] font-bold text-(--ink-mute) uppercase tracking-widest bg-(--paper)">
                            <div className="w-[45%]">COURSE</div>
                            <div className="w-[20%] text-center">CATEGORY</div>
                            <div className="w-[20%]">COMPLETED</div>
                            <div className="w-[15%] text-right">ACTIONS</div>
                        </div>
                        {/* Table Body */}
                        <div>
                            {certificates.map((cert) => {
                                const targetId = cert.courseId || cert.course?.id || cert.careerPathId;
                                const isPath = !!cert.careerPathId;
                                return (
                                    <div key={cert.id} className="flex items-center px-6 py-4 border-b border-(--line) last:border-0 hover:bg-(--paper-2) transition-colors">
                                        <div className="w-[45%] flex items-center gap-4 cursor-pointer" onClick={() => {
                                            if (cert.status === "completed") navigate(`/certificate-detail?${isPath ? 'careerPathId=' + targetId : 'courseId=' + targetId}`);
                                            else navigate(`/course-details?id=${targetId}&type=${isPath ? 'career-path' : 'course'}`);
                                        }}>
                                            <div className="w-16 h-16 rounded-lg bg-(--paper-2) border border-(--line) shrink-0 overflow-hidden flex items-center justify-center p-0.5">
                                                <div className="w-full h-full rounded-md overflow-hidden bg-(--surface-3) relative flex items-center justify-center">
                                                    {cert.course?.thumbnailAsset?.fileUrl ? (
                                                        <img src={cert.course.thumbnailAsset.fileUrl} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <BookOpen className="w-6 h-6 text-indigo-400" />
                                                    )}
                                                </div>
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-[15px] text-(--ink) leading-tight mb-1 group-hover:underline">
                                                    {cert.course?.title || "Unknown Course"}
                                                </h4>
                                                <p className="text-[13px] text-(--ink-mute)">
                                                    {cert.course?.category?.name || "Career Path"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex w-[20%] justify-center">
                                            <span className={`px-[11px] py-1 rounded-full text-[10px] tracking-widest font-bold leading-none uppercase ${cert.careerPathId ? 'bg-(--c-honey-wash) text-(--c-honey-text)' : 'bg-(--c-sage-wash) text-(--c-sage-text)'}`}>
                                                {cert.careerPathId ? "PATH" : "COURSE"}
                                            </span>
                                        </div>
                                        <div className="w-[20%] text-[13px] text-(--ink-mute)">
                                            {cert.status === "completed" ? (
                                                <>Completed <span className="font-bold text-(--ink)">{new Date(cert.sortDate).toLocaleDateString("en-GB", {
                                                    day: "numeric",
                                                    month: "short",
                                                    year: "numeric"
                                                })}</span></>
                                            ) : (
                                                <>In Progress (<span className="font-bold text-(--ink)">{cert.progressPercentage}%</span>)</>
                                            )}
                                        </div>
                                        <div className="w-[15%] flex flex-col md:flex-row items-end md:items-center justify-end gap-2">
                                            <button
                                                title="View"
                                                onClick={() => {
                                                    if (cert.status === "completed") navigate(`/certificate-detail?${isPath ? 'careerPathId=' + targetId : 'courseId=' + targetId}`);
                                                    else navigate(`/course-details?id=${targetId}&type=${isPath ? 'career-path' : 'course'}`);
                                                }}
                                                className="w-[38px] h-[38px] flex items-center justify-center rounded-full border border-(--line) hover:bg-(--c-honey-wash) hover:border-transparent transition-colors group/btn"
                                            >
                                                <Eye className="w-4 h-4 text-slate-700" />
                                            </button>
                                            {cert.status === "completed" && (
                                                <>
                                                    <button
                                                        title="Share"
                                                        onClick={() => handleShare(cert)}
                                                        className="w-[38px] h-[38px] flex items-center justify-center rounded-full border border-(--line) hover:bg-(--c-honey-wash) hover:border-transparent transition-colors group/btn"
                                                    >
                                                        <Share2 className="w-4 h-4 text-slate-700" />
                                                    </button>
                                                    <button
                                                        title="Download"
                                                        onClick={() => {
                                                            if (cert.originalId) handleDownload(cert.originalId);
                                                            else navigate(`/certificate-detail?${isPath ? 'careerPathId=' + targetId : 'courseId=' + targetId}`);
                                                        }}
                                                        className="w-[38px] h-[38px] flex items-center justify-center rounded-full border border-(--line) hover:bg-(--c-honey-wash) hover:border-transparent transition-colors group/btn"
                                                    >
                                                        <Download className="w-4 h-4 text-slate-700" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {certificates.map((cert) => {
                        const targetId = cert.courseId || cert.course?.id || cert.careerPathId;
                        const isPath = !!cert.careerPathId;
                        return (
                            <div key={cert.id} className="bg-(--paper) border border-(--line) rounded-xl overflow-hidden shadow-sm hover:-translate-y-2 hover:shadow-hover hover:border-(--c-honey-soft) transition-all duration-300 flex flex-col group cursor-pointer" onClick={() => {
                                if (cert.status === "completed") navigate(`/certificate-detail?${isPath ? 'careerPathId=' + targetId : 'courseId=' + targetId}`);
                                else navigate(`/course-details?id=${targetId}&type=${isPath ? 'career-path' : 'course'}`);
                            }}>
                                <div className="h-[200px] relative overflow-hidden bg-(--paper-2)">
                                    {cert.course?.thumbnailAsset?.fileUrl ? (
                                        <img src={cert.course.thumbnailAsset.fileUrl} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center opacity-30">
                                            <BookOpen className="w-8 h-8 text-indigo-400" />
                                        </div>
                                    )}
                                    <div className="absolute top-4 left-4">
                                        <div className="w-9 h-9 rounded-full bg-(--c-honey-wash) text-(--c-honey-text) flex items-center justify-center text-[10px] font-extrabold shadow-sm border border-white/20">
                                            {cert.course?.subjectName || (cert.careerPathId ? "CDMP" : "NX")}
                                        </div>
                                    </div>
                                    <div className="absolute top-4 right-4">
                                        <span className={`px-3 py-1 rounded-full text-[10px] tracking-widest font-extrabold leading-none uppercase shadow-sm border border-white/20 ${cert.careerPathId ? 'bg-(--c-honey-wash) text-(--c-honey-text)' : 'bg-(--c-sage-wash) text-(--c-sage-text)'}`}>
                                            {cert.careerPathId ? "PATH" : "COURSE"}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-5 flex-1 flex flex-col">
                                    <h3 className="font-extrabold text-(--ink) text-[16px] mb-1.5 line-clamp-2 leading-snug group-hover:underline">
                                        {cert.course?.title || "Unknown Course"}
                                    </h3>
                                    <p className="text-[12px] text-(--ink-mute) mb-6 line-clamp-1">
                                        {cert.course?.category?.name || "CDMP Career Path"} &bull; Nexus Academy
                                    </p>

                                    <div className="mt-auto border-t border-(--line) pt-4 flex justify-between items-center">
                                        <div className="text-[12px] text-(--ink-mute)">
                                            Completed <span className="font-extrabold text-(--ink)">
                                                {new Date(cert.sortDate).toLocaleDateString("en-GB", {
                                                    day: "numeric",
                                                    month: "short",
                                                    year: "numeric"
                                                })}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-end gap-2">
                                            <button title="View" onClick={(e) => {
                                                e.stopPropagation();
                                                if (cert.status === "completed") navigate(`/certificate-detail?${isPath ? 'careerPathId=' + targetId : 'courseId=' + targetId}`);
                                                else navigate(`/course-details?id=${targetId}&type=${isPath ? 'career-path' : 'course'}`);
                                            }} className="w-[38px] h-[38px] flex items-center justify-center rounded-full border border-(--line) hover:bg-(--c-honey-wash) hover:border-transparent transition-colors group/btn">
                                                <Eye className="w-4 h-4 text-slate-700" />
                                            </button>
                                            {cert.status === "completed" && (
                                                <>
                                                    <button title="Share" onClick={(e) => { e.stopPropagation(); handleShare(cert); }} className="w-[38px] h-[38px] flex items-center justify-center rounded-full border border-(--line) hover:bg-(--c-honey-wash) hover:border-transparent transition-colors group/btn">
                                                        <Share2 className="w-4 h-4 text-slate-700" />
                                                    </button>
                                                    <button title="Download" onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (cert.originalId) handleDownload(cert.originalId);
                                                        else navigate(`/certificate-detail?${isPath ? 'careerPathId=' + targetId : 'courseId=' + targetId}`);
                                                    }} className="w-[38px] h-[38px] flex items-center justify-center rounded-full border border-(--line) hover:bg-(--c-honey-wash) hover:border-transparent transition-colors group/btn">
                                                        <Download className="w-4 h-4 text-slate-700" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Share Modal */}
            {localShareModalOpen && shareItem && (
                <ShareModal
                    isOpen={localShareModalOpen}
                    onClose={() => {
                        setLocalShareModalOpen(false);
                        setShareItem(null);
                    }}
                    content={shareItem}
                />
            )}

            {/* </div> */}
        </>
    );
};

export default Completed;

