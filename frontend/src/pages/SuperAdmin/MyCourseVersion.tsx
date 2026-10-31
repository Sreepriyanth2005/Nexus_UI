import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { api } from "../../config/axios";
import "../../styles/tokens.css";
import { ChevronsUpDown, Trash2, ArrowRight } from "../../assets/icons";
import { useUserStore } from "../../store/user.store";
import { Skeleton } from "../../components/ui/Skeleton/Skeleton";

interface MyCourseVersionProps {
    item: any;
    onBack: () => void;
}

const MyCourseVersion: React.FC<MyCourseVersionProps> = ({ item, onBack }) => {
    const navigate = useNavigate();
    const user = useUserStore((state: any) => state.user);

    const fetchVersions = async () => {
        const id = item?.id || item?._id;
        if (!id) return [];
        const typePath = item?._originalType === "LESSON" ? "lessons" : item?._originalType === "COURSE" ? "courses" : "career-paths";
        const response = await api.get(`/${typePath}/${id}/versions`);
        return response.data;
    };

    const { data: versionsResponse, isLoading, isError, refetch } = useQuery({
        queryKey: ["versions", item?._originalType, item?.id || item?._id],
        queryFn: fetchVersions,
        enabled: !!(item?.id || item?._id),
    });

    const realVersions = Array.isArray(versionsResponse?.data)
        ? versionsResponse.data
        : (Array.isArray(versionsResponse?.data?.data)
            ? versionsResponse.data.data
            : (Array.isArray(versionsResponse) ? versionsResponse : []));

    const handleEditItem = () => {
        const id = item?.id || item?._id;
        if (item._originalType === "COURSE") {
            navigate(`/admin/courses/${id}/edit`);
        } else if (item._originalType === "CAREER_PATH") {
            navigate(`/admin/career-paths/${id}/edit`);
        } else {
            navigate(`/standalone-lesson/${id}`);
        }
    };

    const [isReverting, setIsReverting] = React.useState(false);

    const handlePublishNewVersion = async () => {
        const id = item?.id || item?._id;
        if (!id || isReverting) return;
        try {
            setIsReverting(true);
            const userId = user?.id || "";

            // 1. Create a snapshot of the current published version
            const endpointPrefix = item._originalType === "CAREER_PATH" ? "career-paths" : (item._originalType || "COURSE").toLowerCase() + "s";
            try {
                await api.post(`/${endpointPrefix}/${id}/versions`, {
                    userId: userId,
                    comment: "Auto-saving published version before starting new version"
                });
            } catch (err) {
                console.warn("Failed to create version snapshot, continuing:", err);
            }

            // 2. Revert to draft
            const reviewType = (item._originalType || "COURSE").toLowerCase();
            await api.post(`/reviews/${reviewType}/${id}/publish`, {
                publishedById: userId,
                comment: "SuperAdmin overriding published content to edit"
            });

            // 3. Navigate to edit page
            handleEditItem();
        } catch (error: any) {
            console.error("Failed to start new version", error);
            window.alert(error?.response?.data?.message || "Failed to start a new version. Please try again.");
        } finally {
            setIsReverting(false);
        }
    };

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
        <div>
            <div>
                <button
                    onClick={onBack}
                    className="hover:opacity-80 tracking-widest uppercase mb-[14px] flex items-center transition-colors text-[var(--ink-mute)] text-[length:var(--fs-label)] font-[var(--fw-bold)] font-sans"
                >
                    &larr; ALL COURSES
                </button>

                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 md:gap-4 mb-6">
                    <div className="flex flex-col w-full md:w-auto">
                        <span className="uppercase tracking-widest mb-1 cursor-default text-[var(--ink-mute)] text-[length:var(--fs-label)] font-[var(--fw-bold)] font-sans">
                            {(item?.courseType || "Course").toUpperCase()} VERSION HISTORY
                        </span>
                        <h1 className="tracking-tight mb-1 text-[var(--ink)] text-[length:var(--fs-h1)] font-[var(--fw-bold)] font-sans">
                            {item?.title || "Untitled"}
                        </h1>
                        <p className="max-w-2xl leading-relaxed text-[var(--ink-soft)] text-[length:var(--fs-meta)] font-[var(--fw-regular)] font-sans">
                            Every SME-approved publish creates a new version. Review what changed across releases and preview any past version.
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto mt-2 md:mt-0">
                        <button
                            onClick={handleEditItem}
                            className="whitespace-nowrap px-[14px] py-[8px] rounded-[var(--r-pill)] text-[length:var(--fs-meta)] font-[var(--fw-semibold)] transition-all duration-200 flex items-center justify-center hover:bg-[var(--paper-2)] hover:-translate-y-0.5 bg-[var(--paper)] text-[var(--ink)] border border-[var(--line)] shadow-[var(--shadow-xs)]"
                        >
                            Edit {item?.courseType?.toLowerCase() || 'course'}
                        </button>
                        <button
                            onClick={handlePublishNewVersion}
                            disabled={isReverting}
                            className="whitespace-nowrap px-[14px] py-[8px] rounded-[var(--r-pill)] text-[length:var(--fs-meta)] font-[var(--fw-semibold)] transition-all duration-200 flex items-center justify-center gap-2 hover:-translate-y-0.5 disabled:opacity-50 cursor-pointer bg-[var(--btn)] text-[var(--ink)] border border-[var(--c-honey)] shadow-[var(--shadow-xs)] font-sans"
                        >
                            {isReverting ? (
                                <div className="w-4 h-4 rounded-full border-2 border-[var(--ink)] border-t-transparent animate-spin mr-1"></div>
                            ) : (
                                <ArrowRight width={16} height={16} strokeWidth={1.5} className="mt-[1px]" />
                            )}
                            {isReverting ? "Processing..." : "Publish new version"}
                        </button>
                    </div>
                </div>

                <div className="border border-[var(--line)] rounded-[16px] overflow-hidden bg-[var(--paper)] mb-12">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 pt-4 pb-[14px] px-5 border-b border-[var(--line)] bg-[var(--paper)]">
                        <h2 className="text-[var(--ink)] text-[length:var(--fs-h3)] font-[var(--fw-bold)] font-sans">Published versions</h2>
                        <div className="flex items-center gap-2 px-3 py-1 rounded-[var(--r-pill)] border bg-[var(--c-sage-wash)] border-[var(--c-sage-soft)]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--c-sage)]" />
                            <span className="text-[var(--c-sage-text)] text-[length:var(--fs-label)] font-[var(--fw-bold)] font-sans">{realVersions.length} {realVersions.length === 1 ? "version" : "versions"}</span>
                        </div>
                    </div>

                    {isError ? (
                        <div className="p-12 text-center font-[family-name:var(--font-sans)]">
                            Unable to load version history.
                            <button type="button" onClick={() => refetch()} className="ml-2 underline">
                                Try again
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto w-full">
                            <table className="w-full border-collapse min-w-[800px]">
                            <thead>
                                <tr className="bg-[var(--paper)] border-b border-[var(--line)]">
                                    <th className="px-4 py-[10px] text-left w-[140px] text-[var(--ink-mute)] text-[length:var(--fs-label)] font-[var(--fw-semibold)] font-sans">
                                        <div className="flex items-center gap-1.5 cursor-pointer select-none hover:text-[var(--ink)] transition-colors">
                                            VERSION <ChevronsUpDown width={12} height={12} className="text-[var(--ink-faint)]" strokeWidth={3} />
                                        </div>
                                    </th>
                                    <th className="px-4 py-[10px] text-left w-[140px] text-[var(--ink-mute)] text-[length:var(--fs-label)] font-[var(--fw-semibold)] font-sans">
                                        <div className="flex items-center gap-1.5 cursor-pointer select-none hover:text-[var(--ink)] transition-colors">
                                            PUBLISHED <ChevronsUpDown width={12} height={12} className="text-[var(--ink-faint)]" strokeWidth={3} />
                                        </div>
                                    </th>
                                    <th className="px-4 py-[10px] text-left text-[var(--ink-mute)] text-[length:var(--fs-label)] font-[var(--fw-semibold)] font-sans">
                                        <div className="flex items-center gap-1.5 cursor-pointer select-none hover:text-[var(--ink)] transition-colors">
                                            CHANGES <ChevronsUpDown width={12} height={12} className="text-[var(--ink-faint)]" strokeWidth={3} />
                                        </div>
                                    </th>
                                    <th className="px-4 py-[10px] text-left w-[140px] text-[var(--ink-mute)] text-[length:var(--fs-label)] font-[var(--fw-semibold)] font-sans">
                                        <div className="flex items-center gap-1.5 cursor-pointer select-none hover:text-[var(--ink)] transition-colors">
                                            AUTHOR <ChevronsUpDown width={12} height={12} className="text-[var(--ink-faint)]" strokeWidth={3} />
                                        </div>
                                    </th>
                                    <th className="px-4 py-[10px] text-left w-[140px] text-[var(--ink-mute)] text-[length:var(--fs-label)] font-[var(--fw-semibold)] font-sans">
                                        <div className="flex items-center gap-1.5 cursor-pointer select-none hover:text-[var(--ink)] transition-colors">
                                            STATUS <ChevronsUpDown width={12} height={12} className="text-[var(--ink-faint)]" strokeWidth={3} />
                                        </div>
                                    </th>
                                    <th className="px-4 py-[10px] text-right w-[200px]"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {realVersions.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center font-[family-name:var(--font-sans)]">
                                            No version history available yet.
                                        </td>
                                    </tr>
                                ) : (
                                    realVersions.map((v: any, idx: number) => {
                                        const isCurrent = idx === 0;
                                        const versionNum = v.version != null ? `v${v.version}.0` : `v${realVersions.length - idx}.0`;
                                        const isPublished = (v.isActive || isCurrent) && item.status !== "ARCHIVED";

                                        const dateStr = v.publishedAt || v.createdAt || "-";
                                        const formattedDate = dateStr !== "-" && dateStr.includes("T")
                                            ? new Date(dateStr).toISOString().split('T')[0]
                                            : dateStr;

                                        return (
                                            <tr key={v.id || idx} className="border-b border-[var(--line)] bg-[var(--paper)] transition-colors">
                                                <td className="px-4 py-3">
                                                    {isCurrent ? (
                                                        <span className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-[var(--ink)] text-[var(--paper)] text-[length:var(--fs-label)] font-[var(--fw-bold)] font-sans">
                                                            {versionNum} <span className="mx-1.5" style={{ color: 'var(--ink-mute)' }}>&middot;</span> Current
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-3.5 py-1.5 rounded-full border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] text-[length:var(--fs-label)] font-[var(--fw-bold)] font-sans">
                                                            {versionNum}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="text-[var(--ink)] text-[length:var(--fs-meta)] font-[var(--fw-regular)] font-sans">
                                                        {formattedDate}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="text-[var(--ink)] text-[length:var(--fs-meta)] font-[var(--fw-regular)] font-sans">
                                                        {v.changes || v.changeSummary || "-"}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="text-[var(--ink)] text-[length:var(--fs-meta)] font-[var(--fw-regular)] font-sans">
                                                        {v.authorName || (v.changedByUser?.profile?.firstName ? `${v.changedByUser.profile.firstName} ${v.changedByUser.profile.lastName || ""}`.trim() : v.changedByUser?.email) || v.changedBy || "-"}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {isPublished ? (
                                                        <div className="flex items-center gap-2 w-fit px-3 py-1.5 rounded-[var(--r-pill)] border bg-[var(--c-sage-wash)] border-[var(--c-sage-soft)]">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--c-sage)]" />
                                                            <span className="text-[var(--c-sage-text)] text-[length:var(--fs-label)] font-[var(--fw-bold)] font-sans">Published</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2 bg-[var(--paper-2)] w-fit px-3 py-1.5 rounded-full border border-[var(--line)]">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--ink-mute)]" />
                                                            <span className="text-[var(--ink-soft)] text-[length:var(--fs-label)] font-[var(--fw-bold)] font-sans">Archived</span>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex justify-end gap-3">
                                                        <button
                                                            onClick={() => {
                                                                let typeParam = "course";
                                                                if (item?._originalType === "CAREER_PATH") typeParam = "career-path";
                                                                else if (item?._originalType === "LESSON") typeParam = "lesson";
                                                                navigate(`/course-details?id=${v.id || v._id}&type=${typeParam}`);
                                                            }}
                                                            className="px-5 py-2 rounded-full hover:bg-[var(--paper-2)] transition-colors border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] text-[length:var(--fs-meta)] font-[var(--fw-bold)] font-sans"
                                                        >
                                                            Preview
                                                        </button>
                                                        {/* {isCurrent ? (
                                                            <button
                                                                disabled
                                                                className="flex items-center px-4 py-2 rounded-full cursor-not-allowed border font-[family-name:var(--font-sans)]"
                                                            >
                                                                <Trash2 width={14} height={14} className="mr-1.5 stroke-[2.5]" /> Delete
                                                            </button>
                                                        ) : (
                                                            <button
                                                                className="flex items-center px-4 py-2 rounded-full hover:brightness-95 transition-all duration-200 border cursor-pointer font-[family-name:var(--font-sans)]"
                                                            >
                                                                <Trash2 width={14} height={14} className="mr-1.5 stroke-[2.5]" /> Delete
                                                            </button>
                                                        )} */}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MyCourseVersion;
