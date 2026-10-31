import React, { useState } from "react";
import { useNavigate } from "react-router";
import { deleteCorporateLearningAssignmentApi } from "../../core/api/corporate-learning.api";

const getTenantId = (): string => {
  try {
    const storedUser = localStorage.getItem('keycloak_session_user');
    if (!storedUser) return "";
    const parsed = JSON.parse(storedUser);
    const user = parsed?.user || parsed;
    return user?.tenantId || user?.tenant?.id || user?.organizationId || "";
  } catch (error) {
    console.error("Failed to get tenantId", error);
    return "";
  }
};

interface AssignmentCourseViewProps {
    group: any;
    onBack: () => void;
    onEdit?: () => void;
}

const AssignmentCourseView: React.FC<AssignmentCourseViewProps> = ({ group, onBack, onEdit }) => {
    const navigate = useNavigate();
    const tenantId = getTenantId();
    const [isDeleting, setIsDeleting] = useState(false);

    if (!group) return null;

    // Safely retrieve assignees array
    const assignees: any[] = Array.isArray(group.assignees) ? group.assignees : [];

    // Calculate metrics
    const totalAssignees = group.totalCount || assignees.length || 0;
    const completedCount = group.completedCount ?? assignees.filter((a: any) => 
        a.deliveryStatus === "COMPLETED" || a.complianceStatus === "COMPLETED" || (a.progressPercent >= 100)
    ).length;
    // Average progress across all assignees (not just binary completed/total)
    const avgProgress = assignees.length > 0
        ? assignees.reduce((sum: number, a: any) => sum + (typeof a.progressPercent === 'number' ? a.progressPercent : 0), 0) / assignees.length
        : (group.progressSum && group.totalCount ? group.progressSum / group.totalCount : 0);
    const completionPercent = totalAssignees > 0 ? Math.round(avgProgress) : 0;
    
    // Calculate overdue
    const overdueCount = assignees.filter((a: any) => 
        a.deliveryStatus === "OVERDUE" || a.complianceStatus === "EXPIRED"
    ).length || 0;

    const handleDelete = async () => {
        if (!tenantId) return;
        
        const assignmentId = group.id || group.assignmentId || assignees[0]?.assignmentId;
        if (!assignmentId) return;

        if (window.confirm("Are you sure you want to unassign this content? This action cannot be undone except by re-assigning.")) {
            try {
                setIsDeleting(true);
                await deleteCorporateLearningAssignmentApi(tenantId, assignmentId);
                onBack();
            } catch (err) {
                console.error("Failed to delete assignment", err);
                alert("Failed to unassign content. Please try again.");
            } finally {
                setIsDeleting(false);
            }
        }
    };

    return (
        <div className="w-full pb-16">
            <button 
                onClick={onBack} 
                className="mb-6 flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 transition underline underline-offset-4"
            >
                ← Back to course assignments
            </button>

            <div className="mb-8">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex flex-wrap items-center gap-3 max-w-3xl">
                        <span className="break-words max-w-full">{group.contentTitle}</span>
                        <span className="text-lg md:text-xl font-normal text-gray-500 capitalize whitespace-nowrap">
                            ({(group.contentType === "CAREER_PATH" ? "career path" : (group.contentType || "COURSE").replace(/_/g, ' ').toLowerCase())})
                        </span>
                    </h1>
                    <div className="flex items-center gap-3 shrink-0">
                        {group.contentId && (
                            <button
                                onClick={() => navigate(`/corp/course-detail?id=${group.contentId}&type=${group.contentType || 'COURSE'}`)}
                                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow-sm transition flex items-center gap-2"
                            >
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                                Course details
                            </button>
                        )}
                        {onEdit && (
                            <button 
                                onClick={onEdit}
                                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow-sm transition flex items-center gap-2"
                            >
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                Edit assignment
                            </button>
                        )}
                    </div>
                </div>
                
                <div className="mt-4 flex flex-wrap gap-2">
                    {group.contentType === "CAREER_PATH" && (group.totalCourses || 0) > 0 && (
                        <span className="inline-flex rounded-full border border-gray-200 bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
                            {group.totalCourses} {group.totalCourses === 1 ? 'course' : 'courses'}
                        </span>
                    )}
                    {group.contentType === "COURSE" && (
                        <span className="inline-flex rounded-full border border-gray-200 bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
                            {group.totalLessons || 0} {(group.totalLessons || 0) === 1 ? 'lesson' : 'lessons'}
                        </span>
                    )}
                    {(group.duration || 0) > 0 && (
                        <span className="inline-flex rounded-full border border-gray-200 bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
                            {(group.duration || 0) >= 60 ? `${Math.round((group.duration || 0) / 60)} hours` : `${group.duration || 0} mins`}
                        </span>
                    )}
                    {group.difficulty && (
                        <span className="inline-flex rounded-full border border-gray-200 bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700 capitalize">
                            {String(group.difficulty).toLowerCase()}
                        </span>
                    )}
                    
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
                        <span className={`h-1.5 w-1.5 rounded-full ${group.type === "MANDATORY" ? "bg-emerald-500" : "bg-gray-400"}`}></span>
                        {group.type === "MANDATORY" ? "Mandatory" : "Optional"} for your team
                    </span>
                </div>
            </div>

            <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <p className="text-[12px] font-bold uppercase tracking-wider text-gray-400">TOTAL ASSIGNED</p>
                    <div className="mt-4">
                        <span className="text-[24px] font-bold text-gray-900">{totalAssignees}</span>
                        <p className="mt-1 text-[14px] text-gray-500">team members</p>
                    </div>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <p className="text-[12px] font-bold uppercase tracking-wider text-gray-400">COMPLETED</p>
                    <div className="mt-4">
                        <span className="text-[24px] font-bold text-gray-900">{completedCount}</span>
                        <p className="mt-1 text-[14px] text-gray-500">{completionPercent}% completion</p>
                    </div>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <p className="text-[12px] font-bold uppercase tracking-wider text-gray-400">OVERDUE</p>
                    <div className="mt-4">
                        <span className="text-[24px] font-bold text-red-600">{overdueCount}</span>
                        <p className="mt-1 text-[14px] text-gray-500">past deadline</p>
                    </div>
                </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900">Team completion status</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-max">
                        <thead className="bg-gray-50">
                            <tr className="border-b border-gray-200 text-left">
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-400">Member</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-400">Status</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-400">Progress</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-400">Completion Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {assignees.length > 0 ? (
                                assignees.map((assignment: any, index: number) => {
                                    const isCompleted = assignment.deliveryStatus === "COMPLETED" || assignment.complianceStatus === "COMPLETED" || (assignment.progressPercent >= 100);
                                    const isOverdue = assignment.deliveryStatus === "OVERDUE" || assignment.complianceStatus === "EXPIRED";
                                    
                                    let statusLabel = "In progress";
                                    let statusClass = "bg-gray-50 text-gray-700 border-gray-200";
                                    let dotClass = "bg-yellow-500";
                                    
                                    if (isCompleted) {
                                        statusLabel = "Completed";
                                        statusClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
                                        dotClass = "bg-emerald-500";
                                    } else if (isOverdue) {
                                        statusLabel = "Overdue";
                                        statusClass = "bg-red-50 text-red-700 border-red-200";
                                        dotClass = "bg-red-500";
                                    }

                                    const assigneeName = assignment.userName?.trim() || assignment.userEmail || (assignment.user ? `${assignment.user.profile?.firstName || assignment.user.firstName || ""} ${assignment.user.profile?.lastName || assignment.user.lastName || ""}`.trim() : null) || "Team Member";
                                    const progressPercent = Math.round(assignment.progressPercent || 0);

                                    // Format completion date or deadline
                                    let dateDisplay = "-";
                                    let dateClass = "text-gray-700";
                                    if (isCompleted && assignment.completedAt) {
                                        dateDisplay = new Date(assignment.completedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                                    } else if (isOverdue && group.dueDate) {
                                        dateDisplay = `Deadline: ${new Date(group.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
                                        dateClass = "text-red-500";
                                    } else if (group.dueDate) {
                                        dateDisplay = `Deadline: ${new Date(group.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
                                    }

                                    return (
                                        <tr key={assignment.deliveryId || assignment.id || index} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-gray-900">{assigneeName}</div>
                                                {assignment.userEmail && assignment.userEmail !== assigneeName && (
                                                    <div className="text-xs text-gray-500">{assignment.userEmail}</div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusClass}`}>
                                                    <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
                                                    {statusLabel}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                        <div className="h-full bg-[#d29b28] rounded-full" style={{ width: `${progressPercent}%` }} />
                                                    </div>
                                                    <span className="font-medium text-gray-700 text-xs">{progressPercent}%</span>
                                                </div>
                                            </td>
                                            <td className={`px-6 py-4 font-medium text-sm ${dateClass}`}>
                                                {dateDisplay}
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-sm font-medium text-gray-500">
                                        No team members assigned yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="mt-12 rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
                <h3 className="text-[12px] font-bold uppercase tracking-widest text-red-900">DANGER ZONE</h3>
                <div className="mt-4 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div>
                        <p className="text-[14px] font-medium text-red-800">Unassign content</p>
                        <p className="text-[16px] text-red-600 mt-1 max-w-xl">
                            Removes this content assignment. In-progress learners can finish (records preserved). 
                            This action cannot be undone except by re-assigning the content entirely.
                        </p>
                    </div>
                    <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="rounded-lg bg-red-600 px-5 py-2.5 text-[14px] font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-50"
                    >
                        {isDeleting ? "Unassigning..." : "Unassign content"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AssignmentCourseView;
