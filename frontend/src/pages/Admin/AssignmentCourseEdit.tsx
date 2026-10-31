import React, { useState, useMemo } from "react";
import { toast } from "sonner";
import { updateCorporateLearningAssignmentApi, deleteCorporateLearningAssignmentApi } from "../../core/api/corporate-learning.api";
import { useQuery } from "@tanstack/react-query";
import { getTenantUsersByTenantIdApi } from "../../core/api/tenantuser.api";
import { getTenantDepartmentsApi } from "../../core/api/group.api";
import { Input } from "../../components/ui/Input/Input";

interface AssignmentCourseEditProps {
    group: any;
    onBack: () => void;
    onSave: (data: any) => void;
}

const getTenantId = (): string => {
    try {
        const storedUser = localStorage.getItem('keycloak_session_user');
        if (!storedUser) return "";
        const parsed = JSON.parse(storedUser);
        const user = parsed?.user || parsed;
        return user?.tenantId || user?.tenant?.id || user?.organizationId || "";
    } catch (error) {
        return "";
    }
};

const formatDateForInput = (dateString: string | null | undefined) => {
    if (!dateString) return "";
    return new Date(dateString).toISOString().split('T')[0];
};

const CustomDropdown: React.FC<{
    value: string;
    options: { label: string; value: string }[];
    onChange: (val: string) => void;
    placeholder?: string;
}> = ({ value, options, onChange, placeholder }) => {
    const [isOpen, setIsOpen] = React.useState(false);
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

    const selectedOption = options.find(o => o.value === value);

    return (
        <div className="relative w-full" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between bg-white border rounded-[8px] px-[15px] py-[9px] text-[16px] font-medium text-[#141414] transition-colors shadow-sm outline-none ${isOpen ? 'border-[#c99b2e] ring-1 ring-[#c99b2e]' : 'border-[#11111129] hover:border-[#c99b2e] focus:border-[#c99b2e] focus:ring-1 focus:ring-[#c99b2e]'}`}
            >
                <span>{selectedOption ? selectedOption.label : placeholder || "Select..."}</span>
                <div className={`transition-transform duration-200 text-[#5c5c5c] ${isOpen ? 'rotate-180' : ''}`}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"></path></svg>
                </div>
            </button>

            {isOpen && (
                <div className="absolute z-[100] w-full mt-2 bg-white border border-[#e5e7eb] rounded-[10px] shadow-lg p-1.5 flex flex-col gap-1.5">
                    {options.map((opt) => {
                        const isSelected = opt.value === value;
                        return (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => { onChange(opt.value); setIsOpen(false); }}
                                className={`w-full text-left px-4 py-2.5 rounded-[8px] text-[15px] font-medium leading-[23px] transition-colors ${isSelected ? 'bg-[#f6e8c4] text-[#141414]' : 'bg-[#f9fafb] text-[#374151] hover:bg-[#f3f4f6]'}`}
                            >
                                {opt.label}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

const AssignmentCourseEdit: React.FC<AssignmentCourseEditProps> = ({ group, onBack, onSave }) => {
    // Local state hydrated from the group object
    const [assigneeMode, setAssigneeMode] = useState<'USER' | 'GROUP' | 'ALL'>(
        group?.scope === 'DEPARTMENT' ? 'GROUP' : group?.scope === 'USER' ? 'USER' : 'ALL'
    );
    const [selectedAssignees, setSelectedAssignees] = useState<string[]>(
        group?.assigneeId ? [group.assigneeId] : []
    );
    const [assigneeSearch, setAssigneeSearch] = useState('');
    const [isAssigneeFocused, setIsAssigneeFocused] = useState(false);

    const tenantId = getTenantId();

    const { data: rawUsers = [] } = useQuery({
        queryKey: ['tenantUsers', tenantId],
        queryFn: () => getTenantUsersByTenantIdApi(tenantId),
        enabled: !!tenantId && (assigneeMode === 'USER' || assigneeMode === 'ALL')
    });

    const users = useMemo(() => {
        return rawUsers.filter((u: any) => {
            const roleValues = [
                u.roleCode, u.roleName, u.role?.code, u.role?.name, u.role,
                ...(Array.isArray(u.roles) ? u.roles.map((r: any) => typeof r === 'string' ? r : (r?.role?.code || r?.role?.name || r?.name || r?.code)) : []),
                ...(Array.isArray(u.realmRoles) ? u.realmRoles : [])
            ];
            const isCorporateAdmin = roleValues.some(val => typeof val === 'string' && val.toUpperCase().replace(/\s/g, '_') === "CORPORATE_ADMIN");
            return !isCorporateAdmin && u.status === 'ACTIVE';
        });
    }, [rawUsers]);

    const { data: departments = [] } = useQuery({
        queryKey: ['tenantGroups', tenantId],
        queryFn: () => getTenantDepartmentsApi(tenantId),
        enabled: !!tenantId && assigneeMode === 'GROUP'
    });

    const assigneeOptions = useMemo(() => {
        if (assigneeMode === 'USER') {
            if (!assigneeSearch.trim()) return users.slice(0, 50);
            const lowerSearch = assigneeSearch.toLowerCase();
            return users.filter((u: any) => {
                const searchStr = `${u.firstName || u.profile?.firstName || ''} ${u.lastName || u.profile?.lastName || ''} ${u.email || ''}`.toLowerCase();
                return searchStr.includes(lowerSearch);
            }).slice(0, 50);
        } else if (assigneeMode === 'GROUP') {
            return departments;
        }
        return [];
    }, [assigneeMode, users, departments, assigneeSearch]);

    const toggleAssignee = (id: string) => {
        if (assigneeMode === 'GROUP') {
            setSelectedAssignees([id]);
        } else {
            setSelectedAssignees(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
        }
    };
    
    // We remove startDate from UI, but we'll keep it in state just in case we need it for payload
    const [startDate] = useState(formatDateForInput(group?.assignedAt));
    const [deadline, setDeadline] = useState(formatDateForInput(group?.dueDate));
    const [mandatory, setMandatory] = useState(group?.type === "OPTIONAL" ? "Optional" : "Yes");
    
    // Notify learners: "On assignment only" or true/false
    const [notifyLearners, setNotifyLearners] = useState("On assignment only");

    // Settings (mocked state for new UI)
    const [sendReminders, setSendReminders] = useState(true);
    const [trackProgress, setTrackProgress] = useState(true);

    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // KPI Calculations from AssignmentCourseView
    const totalAssignees = group.totalCount || 0;
    const completedCount = group.completedCount || 0;
    const completionPercent = totalAssignees > 0 ? Math.round((completedCount / totalAssignees) * 100) : 0;
    const remainingCount = totalAssignees - completedCount;

    // Form submission
    const handleSave = async () => {
        setIsSaving(true);
        setError(null);

        try {
            const tenantId = getTenantId();
            if (!tenantId) throw new Error("Tenant ID not found");

            const payload = {
                dueDate: deadline ? new Date(deadline).toISOString() : null,
                requirement: mandatory === "Optional" ? "OPTIONAL" : "MANDATORY",
                notifyUsers: notifyLearners === "On assignment only",
                scope: assigneeMode === 'ALL' ? 'ALL_USERS' : assigneeMode === 'GROUP' ? 'DEPARTMENT' : 'USER',
                ...(assigneeMode === 'GROUP' && selectedAssignees[0] ? { departmentId: selectedAssignees[0] } : {}),
                ...(assigneeMode === 'USER' ? { userIds: selectedAssignees } : {})
            };

            await updateCorporateLearningAssignmentApi(tenantId, group.id, payload as any);
            
            setTimeout(() => {
                onSave({ audience: assigneeMode, startDate, deadline, mandatory, notifyLearners });
            }, 800);
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || "Failed to update assignment");
            setIsSaving(false);
        }
    };
    
    const handleDelete = async () => {
        if (!getTenantId()) return;
        const assignmentId = group.id || group.assignees?.[0]?.assignmentId;
        if (!assignmentId) return;

        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        if (!getTenantId()) return;
        const assignmentId = group.id || group.assignees?.[0]?.assignmentId;
        if (!assignmentId) return;

        try {
            setIsDeleting(true);
            await deleteCorporateLearningAssignmentApi(getTenantId(), assignmentId);
            onSave({ deleted: true } as any);
        } catch (err) {
            console.error("Failed to delete assignment", err);
            alert("Failed to unassign content. Please try again.");
            setShowDeleteConfirm(false);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-[16px] shadow-xl w-[420px] min-h-[288px] overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col justify-center">
                        <div className="p-8">
                            <h2 className="text-[#141414] mb-4" style={{ fontSize: '20px', fontWeight: 700, lineHeight: '31px', fontStyle: 'normal' }}>
                                Unassign course?
                            </h2>
                            <p className="text-[#5c5c5c] mb-8" style={{ fontSize: '16px', fontWeight: 400, lineHeight: '26px', fontStyle: 'normal' }}>
                                This will remove {group?.contentTitle} from {group?.assigneeName}. {completedCount} completion records are preserved. The {remainingCount} in-progress learners will lose access. This cannot be undone.
                            </p>
                            <div className="flex justify-end gap-3">
                                <button 
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="px-5 py-2.5 rounded-full border border-[#d1d5db] text-[#141414] hover:bg-[#f9fafb] transition-colors bg-white shadow-sm"
                                    style={{ fontSize: '14px', fontWeight: 700, lineHeight: '22px', fontStyle: 'normal' }}
                                >
                                    Keep assignment
                                </button>
                                <button 
                                    onClick={confirmDelete}
                                    disabled={isDeleting}
                                    className="px-5 py-2.5 rounded-[8px] bg-[#b91c1c] text-white hover:bg-[#991b1b] transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center"
                                    style={{ fontSize: '14px', fontWeight: 600, lineHeight: '22px', fontStyle: 'normal', backgroundColor: '#c5281c', borderRadius: '8px' }}
                                >
                                    {isDeleting ? "Unassigning..." : "Yes, unassign"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <main className="w-full pb-20 bg-[#ffffff] text-[#1f2937] font-sans">
            <div className="w-full animate-in fade-in duration-300">
                
                {/* Back button */}
                <button 
                    onClick={onBack}
                    className="flex items-center gap-1.5 text-[12px] font-semibold tracking-[0.08em] uppercase text-[#5c5c5c] mb-6 hover:text-[#141414] transition-colors"
                    aria-label="Back to Assignments"
                >
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                    Assignments
                </button>
                
                {/* Header */}
                <div className="mb-8">
                    <div className="text-[12px] font-semibold tracking-[0.14em] uppercase text-[#8c8c8c] mb-1">Course assignment</div>
                    <h1 className="text-[24px] font-bold text-[#141414] mb-2">Edit assignment</h1>
                    <p className="text-[16px] font-normal text-[#5c5c5c] flex items-center gap-1.5">
                        {group?.contentTitle || "Assignment"} 
                        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="opacity-60"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                        {group?.assigneeName || "Assigned Users"} ({totalAssignees} members)
                    </p>
                </div>
                
                {/* Error Notice */}
                {error && (
                    <div className="mb-6 rounded-xl bg-red-50 p-4 border border-red-200">
                        <p className="text-[14px] font-semibold text-red-800">{error}</p>
                    </div>
                )}
                
                {/* KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8" role="region" aria-label="Completion snapshot">
                    {/* Total Assigned */}
                    <div className="bg-white border border-[#e5e7eb] rounded-[12px] p-5 shadow-sm">
                        <div className="w-[38px] h-[38px] rounded-[10px] bg-[#f6e8c4] text-[#c99b2e] flex items-center justify-center mb-4">
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                        </div>
                        <div className="text-[12px] font-bold leading-[19px] tracking-[0.08em] uppercase text-[#8c8c8c] mb-1">TOTAL ASSIGNED</div>
                        <div className="text-[24px] font-bold text-[#141414] tracking-tight leading-none mb-1.5">{totalAssignees}</div>
                        <div className="text-[14px] font-normal text-[#5c5c5c]">{group?.assigneeName || "Assigned Users"}</div>
                    </div>
                    
                    {/* Completed */}
                    <div className="bg-white border border-[#e5e7eb] rounded-[12px] p-5 shadow-sm flex flex-col">
                        <div className="w-[38px] h-[38px] rounded-[10px] bg-[#dce5d3] text-[#446038] flex items-center justify-center mb-4">
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </div>
                        <div className="text-[12px] font-bold leading-[19px] tracking-[0.08em] uppercase text-[#8c8c8c] mb-1">COMPLETED</div>
                        <div className="text-[24px] font-bold text-[#141414] tracking-tight leading-none mb-1.5">{completedCount}</div>
                        <div className="text-[14px] font-normal text-[#5c5c5c] mb-3">{completionPercent}% completion</div>
                        <div className="w-full bg-[#f6f6f4] rounded-full h-1 overflow-hidden mt-auto">
                            <div className="bg-[#eab308] h-full rounded-full" style={{ width: `${completionPercent}%` }}></div>
                        </div>
                    </div>
                    
                    {/* Remaining */}
                    <div className="bg-white border border-[#e5e7eb] rounded-[12px] p-5 shadow-sm">
                        <div className="w-[38px] h-[38px] rounded-[10px] bg-[#f7d9d4] text-[#c12a1c] flex items-center justify-center mb-4">
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                        </div>
                        <div className="text-[12px] font-bold leading-[19px] tracking-[0.08em] uppercase text-[#8c8c8c] mb-1">REMAINING</div>
                        <div className="text-[24px] font-bold text-[#141414] tracking-tight leading-none mb-1.5">{remainingCount}</div>
                        <div className="text-[14px] font-normal text-[#5c5c5c]">Affected by changes</div>
                    </div>
                </div>
                
                {/* Notice Banner */}
                {completedCount > 0 && (
                    <div className="bg-[#fff8e6] border border-[#eab308] border-l-4 rounded-[12px] p-5 mb-8 flex gap-4 shadow-sm">
                        <div className="w-8 h-8 rounded-full bg-[#ebd59b] flex items-center justify-center shrink-0" aria-hidden="true">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#6b4c0a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                        </div>
                        <div className="text-[14px] leading-relaxed text-[#92400e]">
                            <strong>{completedCount} learners have already completed this course.</strong> Completion records will be preserved regardless of changes. Changes to deadline and mandatory flag apply to the remaining {remainingCount} learners.
                        </div>
                    </div>
                )}
                
                {/* Main Layout Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-start">
                    
                    {/* Left Column (Forms) */}
                    <div className="flex flex-col gap-6">
                        
                        {/* Assignment Details Card */}
                        <div className="bg-white border border-[#e5e7eb] rounded-[14px] shadow-sm">
                            <div className="bg-[#f6f6f4] rounded-t-[14px] px-5 py-4 flex items-center gap-3 border-b border-[#e5e7eb]">
                                <div className="w-[36px] h-[36px] bg-[#f6e8c4] text-[#8c6713] rounded-[12px] flex items-center justify-center shrink-0" aria-hidden="true">
                                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                                </div>
                                <h2 className="text-[12px] font-bold leading-[18px] tracking-[0.08em] uppercase text-[#5c5c5c]">Assignment details</h2>
                            </div>
                            
                            <div className="p-5 flex flex-col gap-5">
                                {/* Course */}
                                <div>
                                    <label className="block text-[12px] font-bold leading-[19px] tracking-[0.08em] uppercase text-[#5c5c5c] mb-2">Course (locked)</label>
                                    <input 
                                        type="text" 
                                        disabled 
                                        value={group?.contentTitle || "Unknown"}
                                        className="w-full bg-[#f6f6f4] border border-[#11111129] rounded-[8px] px-[15px] py-[9px] text-[16px] font-normal text-[#5c5c5c] cursor-not-allowed outline-none"
                                    />
                                    <p className="text-[14px] font-normal text-[#5c5c5c] mt-2">Course cannot be changed after assignment is created.</p>
                                </div>
                                
                                {/* Audience */}
                                <div>
                                    <label className="block text-[12px] font-bold leading-[19px] tracking-[0.08em] uppercase text-[#5c5c5c] mb-2">Audience</label>
                                    <div className="flex gap-4 border-b border-[#11111129] mb-4 overflow-x-auto hide-scrollbar whitespace-nowrap">
                                        <button type="button" onClick={() => { setAssigneeMode('USER'); setSelectedAssignees([]); }} className={`text-[14px] pb-2 border-b-2 transition-all shrink-0 ${assigneeMode === 'USER' ? 'font-bold text-[#111827] border-[#111827]' : 'font-semibold text-[#6b7280] border-transparent hover:text-[#374151]'}`}>By user</button>
                                        <button type="button" onClick={() => { setAssigneeMode('GROUP'); setSelectedAssignees([]); }} className={`text-[14px] pb-2 border-b-2 transition-all shrink-0 ${assigneeMode === 'GROUP' ? 'font-bold text-[#111827] border-[#111827]' : 'font-semibold text-[#6b7280] border-transparent hover:text-[#374151]'}`}>By dept</button>
                                        <button type="button" onClick={() => { setAssigneeMode('ALL'); setSelectedAssignees([]); }} className={`text-[14px] pb-2 border-b-2 transition-all shrink-0 ${assigneeMode === 'ALL' ? 'font-bold text-[#111827] border-[#111827]' : 'font-semibold text-[#6b7280] border-transparent hover:text-[#374151]'}`}>All users</button>
                                    </div>
                                    {assigneeMode === 'ALL' ? (
                                        <div className="bg-[#f9f1d0] border border-[#e6d8a7] rounded-xl p-4 flex items-start sm:items-center gap-3">
                                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-[#e6d8a7]">
                                                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#5a4d1f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                                    <circle cx="9" cy="7" r="4"></circle>
                                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                                </svg>
                                            </div>
                                            <div>
                                                <h4 className="text-[14px] font-bold text-[#111827] mb-0.5">All active corporate users</h4>
                                                <p className="text-[13px] text-[#4b5563] leading-relaxed">
                                                    This assignment will be sent to all active users across your organisation.
                                                </p>
                                            </div>
                                        </div>
                                    ) : assigneeMode === 'GROUP' ? (
                                        <div className="relative w-full">
                                            <CustomDropdown
                                                value={selectedAssignees[0] || ""}
                                                onChange={(val) => setSelectedAssignees([val])}
                                                options={departments.map((opt: any) => ({ label: opt.name, value: opt.id }))}
                                                placeholder="Select department..."
                                            />
                                            <p className="text-[13px] text-[#6b7280] mt-2">
                                                Every active user in this department will receive the assignment.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            <Input
                                                placeholder="Search users..."
                                                value={assigneeSearch}
                                                onChange={(e) => setAssigneeSearch(e.target.value)}
                                                onFocus={() => setIsAssigneeFocused(true)}
                                                onBlur={() => setTimeout(() => setIsAssigneeFocused(false), 200)}
                                                className="w-full h-10 px-3 border border-[#d1d5db] rounded-lg text-[15px] font-medium text-[#374151] outline-none focus:border-[#9ca3af] hover:border-[#9ca3af] transition-colors"
                                            />
                                            {(isAssigneeFocused || assigneeSearch) && assigneeOptions.length > 0 && (
                                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#e5e7eb] rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                                                    {assigneeOptions.map((opt: any) => {
                                                        const fName = opt.firstName || opt.profile?.firstName || opt.email || 'Unknown';
                                                        const lName = opt.lastName || opt.profile?.lastName || '';
                                                        const label = `${fName} ${lName}`.trim();
                                                        const isSelected = selectedAssignees.includes(opt.id);
                                                        return (
                                                            <div key={opt.id} onMouseDown={(e) => {
                                                                e.preventDefault();
                                                                if (!isSelected) {
                                                                    toggleAssignee(opt.id);
                                                                    setAssigneeSearch('');
                                                                }
                                                            }} className={`p-2.5 text-[15px] font-medium transition-colors flex items-center justify-between ${isSelected ? 'bg-gray-50 text-gray-500 cursor-default' : 'hover:bg-[#f3f4f6] cursor-pointer'}`}>
                                                                <span>{label}</span>
                                                                {isSelected && (
                                                                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                                )}
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            )}
                                            <div className="flex flex-wrap gap-2 mt-3">
                                                {selectedAssignees.map(aId => {
                                                    const opt = users.find((o: any) => o.id === aId);
                                                    if (!opt) return null;
                                                    const fName = opt.firstName || opt.profile?.firstName || opt.email || 'Unknown';
                                                    const lName = opt.lastName || opt.profile?.lastName || '';
                                                    const label = `${fName} ${lName}`.trim();
                                                    return (
                                                        <span key={aId} className="inline-flex items-center gap-1.5 text-[14px] font-semibold py-1 pl-2.5 pr-2 rounded-full border border-[#a2b897] bg-white text-[#55774a] hover:-translate-y-0.5 transition-transform shadow-sm">
                                                            {label}
                                                            <button onClick={(e) => { e.preventDefault(); toggleAssignee(aId); }} className="inline-flex items-center justify-center text-[#55774a] hover:text-[#395031] transition-colors ml-1">
                                                                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                                            </button>
                                                        </span>
                                                    )
                                                })}
                                            </div>
                                            <p className="text-[14px] font-medium text-[#6b7280] mt-2">
                                                {selectedAssignees.length} users selected
                                            </p>
                                        </div>
                                    )}
                                </div>
                                
                                {/* Deadline */}
                                <div>
                                    <label className="block text-[12px] font-bold leading-[19px] tracking-[0.08em] uppercase text-[#5c5c5c] mb-2">Deadline</label>
                                    <div className="relative">
                                        <input 
                                            type="date"
                                            min={new Date().toISOString().split("T")[0]}
                                            value={deadline}
                                            onChange={e => setDeadline(e.target.value)}
                                            className="w-full appearance-none bg-white border border-[#11111129] rounded-[8px] px-[15px] py-[9px] pr-10 text-[16px] font-normal text-[#141414] focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] outline-none shadow-sm [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-10 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#141414]">
                                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                                        </div>
                                    </div>
                                    <p className="text-[14px] font-normal text-[#5c5c5c] mt-2">Applies to learners who have not yet completed the course.</p>
                                </div>
                                
                                {/* Mandatory */}
                                <div>
                                    <label className="block text-[12px] font-bold leading-[19px] tracking-[0.08em] uppercase text-[#5c5c5c] mb-2">Mandatory</label>
                                    <div className="relative w-full">
                                        <CustomDropdown
                                            value={mandatory}
                                            onChange={setMandatory}
                                            options={[
                                                { label: 'Yes', value: 'Yes' },
                                                { label: 'Optional / self-learning', value: 'Optional' }
                                            ]}
                                        />
                                    </div>
                                </div>
                                
                                {/* Notify Learners */}
                                <div>
                                    <label className="block text-[12px] font-bold leading-[19px] tracking-[0.08em] uppercase text-[#5c5c5c] mb-2">Notify learners</label>
                                    <div className="relative w-full">
                                        <CustomDropdown
                                            value={notifyLearners}
                                            onChange={setNotifyLearners}
                                            options={[
                                                { label: 'On assignment only', value: 'On assignment only' },
                                                { label: 'None', value: 'None' }
                                            ]}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>


                    </div>
                    
                    {/* Right Column (Rail) */}
                    <div className="flex flex-col gap-5 sticky top-8">
                        {/* Action buttons */}
                        <div className="flex flex-col gap-3">
                            <button 
                                onClick={handleSave}
                                disabled={isSaving || (assigneeMode === 'GROUP' && !selectedAssignees.length)}
                                className="w-full bg-[#fdf3b8] hover:bg-[#fce988] text-[#111827] border border-[#f3da61] rounded-full py-3.5 px-6 text-[16px] font-bold shadow-sm hover:shadow transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSaving ? "Saving..." : "Save changes"}
                            </button>
                            <button 
                                onClick={onBack}
                                className="w-full bg-white hover:bg-[#f9fafb] text-[#111827] border border-[#d1d5db] hover:border-[#9ca3af] shadow-sm hover:shadow rounded-full py-3.5 px-6 text-[16px] font-bold transition-all duration-300"
                            >
                                Cancel
                            </button>
                        </div>
                        
                        {/* Danger Zone */}
                        <div className="bg-[#fef2f2] border border-[#fecaca] rounded-2xl overflow-hidden shadow-[0_2px_8px_-4px_rgba(0,0,0,0.02)]">
                            <div className="bg-[#fef2f2] px-4 py-3 flex items-center gap-2 border-b border-[#fecaca]">
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                                <span className="text-[12px] font-bold tracking-widest uppercase text-[#dc2626]">DANGER ZONE</span>
                            </div>
                            <div className="p-4 flex flex-col gap-3 bg-white">
                                <button
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    className="bg-[#dc2626] hover:bg-[#b91c1c] text-white rounded-lg py-2.5 px-4 text-[14px] font-bold shadow-sm transition-colors disabled:opacity-50 w-full"
                                >
                                    {isDeleting ? "Unassigning..." : "Unassign course from group"}
                                </button>
                                <p className="text-[16px] font-medium text-[#7f1d1d] leading-relaxed">
                                    Removes course from group dashboards. In-progress learners can finish (records preserved). Cannot be undone except by re-assigning.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                
            </div>
        </main>
        </>
    );
};

export default AssignmentCourseEdit;
