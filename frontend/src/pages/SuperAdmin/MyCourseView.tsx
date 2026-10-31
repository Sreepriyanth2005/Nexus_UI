import React from "react";
import { useAdminCourseById } from "../../hooks/admin-courses/useAdminCourses";
import { useNavigate } from "react-router";

interface MyCourseViewProps {
    item: any;
    onBack: () => void;
    onViewItem?: (item: any) => void;
}

const MyCourseView: React.FC<MyCourseViewProps> = ({ item, onBack, onViewItem }) => {
    const navigate = useNavigate();

    const isCourse = item._originalType === "COURSE" || item._originalType === "STANDALONE_COURSE";
    const isPath = item._originalType === "CAREER_PATH";

    const { data: courseDetails, isLoading } = useAdminCourseById(
        item.id,
        isCourse
    );

    let displayItems: any[] = [];
    if (isCourse) {
        displayItems = courseDetails?.data?.courseLessons?.map((cl: any) => ({ ...cl.lesson, _originalType: "LESSON" })) || item.lessons?.map((l: any) => ({ ...l, _originalType: "LESSON" })) || [];
    } else if (isPath) {
        displayItems = item.courses?.map((c: any) => ({ ...c, _originalType: "COURSE" })) || [];
    }

    const titleSuffix = isCourse ? "Mapped Lessons" : (isPath ? "Mapped Courses" : "Details");

    const getStatusDotColor = (status: string) => {
        const s = (status || "").toUpperCase();
        switch (s) {
            case "PUBLISHED":
            case "LIVE":
                return "bg-[#16A34A]";
            case "DRAFT":
                return "bg-[#A8A8A8]";
            case "ARCHIVED":
                return "bg-[#9ca3af]";
            default:
                return "bg-gray-400";
        }
    };

    const formatStatus = (status: string) => {
        const s = (status || "").toUpperCase();
        switch (s) {
            case "PUBLISHED":
            case "LIVE":
                return "Live";
            case "DRAFT":
                return "Draft";
            case "ARCHIVED":
                return "Archived";
            default:
                return s || "Unknown";
        }
    };

    return (
        <div className="w-full min-w-0 pb-12">
            <div>
                <button
                    onClick={onBack}
                    className="text-[#8c8c8c] hover:text-[#141414] text-[12px] font-bold tracking-widest uppercase mb-6 flex items-center transition-colors"
                >
                    &larr; ALL {isPath ? "CAREER PATHS" : "COURSES"}
                </button>

                <div className="flex items-start justify-between mb-8">
                    <div className="flex flex-col">
                        <span className="text-[12px] font-bold text-[#8c8c8c] uppercase tracking-widest mb-2 cursor-default">
                            {isCourse ? "COURSE DETAILS" : "CAREER PATH DETAILS"}
                        </span>
                        <h1 className="text-[28px] font-bold text-[#141414] tracking-tight mb-2">
                            {item?.title || "Untitled"} <span className="text-[#8c8c8c] mx-1">&middot;</span> {titleSuffix}
                        </h1>
                    </div>
                </div>

                <div className="border border-[#1111111a] rounded-[16px] overflow-hidden bg-white mb-12 shadow-sm">
                    {isLoading ? (
                        <div className="p-12 text-center text-[#5c5c5c] text-[14px]">
                            Loading data...
                        </div>
                    ) : (
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-white border-b border-[#1111111a]">
                                    <th className="px-6 py-4 text-left text-[12px] font-semibold text-[#8c8c8c]">
                                        TITLE
                                    </th>
                                    <th className="px-6 py-4 text-left text-[12px] font-semibold text-[#8c8c8c] w-[140px]">
                                        TYPE
                                    </th>
                                    <th className="px-6 py-4 text-left text-[12px] font-semibold text-[#8c8c8c] w-[160px]">
                                        UPDATED
                                    </th>
                                    <th className="px-6 py-4 text-left text-[12px] font-semibold text-[#8c8c8c] w-[200px]">
                                        AUTHOR
                                    </th>
                                    <th className="px-6 py-4 text-left text-[12px] font-semibold text-[#8c8c8c] w-[140px]">
                                        STATUS
                                    </th>
                                    <th className="px-6 py-4 text-right w-[240px]">
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-[#5c5c5c] text-[14px]">
                                            No {isCourse ? "lessons" : "courses"} mapped yet.
                                        </td>
                                    </tr>
                                ) : (
                                    displayItems.map((mappedItem: any, idx: number) => {
                                        const dateStr = mappedItem.updatedAt || mappedItem.createdAt || "-";
                                        const formattedDate = dateStr !== "-" && dateStr.includes("T") 
                                            ? new Date(dateStr).toISOString().split('T')[0] 
                                            : dateStr;
                                            
                                        const isPublished = (mappedItem.status || "LIVE").toUpperCase() === "PUBLISHED" || (mappedItem.status || "LIVE").toUpperCase() === "LIVE";

                                        return (
                                            <tr key={mappedItem.id || idx} className="border-b border-[#1111111a] hover:bg-[#f6f6f4] transition-colors bg-white group cursor-default">
                                                <td className="px-6 py-5 align-top">
                                                    <span className="text-[14px] font-bold text-[#141414] group-hover:text-black transition-colors">
                                                        {mappedItem.title || "Untitled"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5 align-top">
                                                    <span className="text-[13px] text-[#5c5c5c] font-medium">
                                                        {(mappedItem.lessonType || mappedItem.courseType || "-").replace(/_/g, ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5 align-top">
                                                    <span className="text-[13px] text-[#141414]">
                                                        {formattedDate}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5 align-top">
                                                    <span className="text-[13px] text-[#141414]">
                                                        {mappedItem.authorName || item.authorName || "-"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5 align-top">
                                                    {isPublished ? (
                                                        <div className="flex items-center gap-2 bg-[#f0f4ec] w-fit px-3 py-1.5 rounded-full border border-[#dce5d3]">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-[#446038]" />
                                                            <span className="text-[12px] font-bold text-[#446038]">Published</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2 bg-[#f6f6f4] w-fit px-3 py-1.5 rounded-full border border-[#1111111a]">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-[#8c8c8c]" />
                                                            <span className="text-[12px] font-bold text-[#5c5c5c]">{formatStatus(mappedItem.status || "LIVE")}</span>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-5 align-top text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            className="px-4 py-2 bg-white border border-[#1111111a] rounded-full text-[13px] font-bold text-[#141414] hover:bg-[#f6f6f4] transition-colors shadow-sm"
                                                            onClick={() => {
                                                                if (onViewItem) onViewItem(mappedItem);
                                                            }}
                                                        >
                                                            View
                                                        </button>
                                                        <button
                                                            className="px-4 py-2 bg-white border border-[#1111111a] rounded-full text-[13px] font-bold text-[#141414] hover:bg-[#f6f6f4] transition-colors shadow-sm"
                                                            onClick={() => {
                                                                if (mappedItem._originalType === "COURSE") {
                                                                    navigate(`/admin/courses/${mappedItem.id}/edit`);
                                                                } else {
                                                                    navigate(`/standalone-lesson/${mappedItem.id}`);
                                                                }
                                                            }}
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            className="px-4 py-2 bg-[#fef5b5] border border-[#f5d547] rounded-full text-[13px] font-bold text-[#141414] hover:bg-[#fde68a] transition-colors shadow-sm"
                                                            onClick={() => {
                                                                if (onViewItem) onViewItem({ ...mappedItem, _forceVersionView: true });
                                                            }}
                                                        >
                                                            Version
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MyCourseView;