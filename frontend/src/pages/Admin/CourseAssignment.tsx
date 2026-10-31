import React, { useState, useEffect } from 'react';
import { useCourseAssignment } from '../../hooks/tenant/useCourseAssignment';
import { useGetTenantById } from '../../hooks/tenant';
import { getAssignmentReportApi } from '../../core/api/corporate-learning.api';
import { Card } from '../../components/ui/Card/Card';
import { Button } from '../../components/ui/Button/Button';
import { Input } from '../../components/ui/Input/Input';
import AssignmentCourseView from './AssignmentCourseView';
import AssignmentCourseEdit from './AssignmentCourseEdit';
import BrowseCoursesModal from './BrowseCoursesModal';

const getTenantId = (): string => {
    try {
        const storedUser = localStorage.getItem('keycloak_session_user');
        if (!storedUser) return '';
        const parsed = JSON.parse(storedUser);
        const user = parsed?.user || parsed;
        return user?.tenantId || user?.tenant?.id || user?.organizationId || '';
    } catch (error) {
        console.error('Failed to get tenantId', error);
        return '';
    }
};

const CourseAssignment: React.FC = () => {
    const loadDataRef = React.useRef<(() => void) | null>(null);
    const [showSuccessToast, setShowSuccessToast] = useState(false);
    const { store, contentOptions, filterOptions, assigneeOptions, users, courses, careerPaths, bulkAssignMutation, handleSubmit, isLoadingData } = useCourseAssignment(() => {
        if (loadDataRef.current) loadDataRef.current();
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 3000);
    });

    const [tenant, setTenant] = useState<any>(null);
    const [assignments, setAssignments] = useState<any[]>([]);
    const [groupedAssignments, setGroupedAssignments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAssigneeFocused, setIsAssigneeFocused] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedGroup, setSelectedGroup] = useState<any>(null);
    const [editingGroup, setEditingGroup] = useState<any>(null);

    // Mock States for new UI features
    const [notifyNow, setNotifyNow] = useState(true);
    const [sendEmail, setSendEmail] = useState(true);
    const [sendInApp, setSendInApp] = useState(true);
    const [reminderBefore, setReminderBefore] = useState(true);
    const [overdueReminder, setOverdueReminder] = useState(false);
    const [notifyManager, setNotifyManager] = useState(false);
    const [customMessage, setCustomMessage] = useState('');
    const [hasDueDate, setHasDueDate] = useState(true);

    // UI state for dropdown
    const [isContentDropdownOpen, setIsContentDropdownOpen] = useState(false);
    const [showViewAllAlert, setShowViewAllAlert] = useState(false);
    const [isBrowseModalOpen, setIsBrowseModalOpen] = useState(false);
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsContentDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const { mutateAsync: getTenant } = useGetTenantById();

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);
            const tenantId = getTenantId();
            if (!tenantId) {
                setError('Tenant ID not found. Please log in again.');
                return;
            }
            const tenantData = await getTenant(tenantId);
            setTenant(tenantData);

            const report = await getAssignmentReportApi(tenantId);
            const items = report?.items || report || [];

            setAssignments(items);

            const grouped = items.reduce((acc: any, item: any) => {
                const key = item.assignmentId || `${item.contentId || item.contentTitle || 'unknown'}-${item.dueDate || 'no-date'}`;
                if (!acc[key]) {
                    acc[key] = {
                        id: item.assignmentId || key,
                        assignmentId: item.assignmentId,
                        contentId: item.contentId,
                        contentTitle: item.contentTitle || 'Unknown Content',
                        type: item.requirement || 'MANDATORY',
                        contentType: item.contentType,
                        assignedAt: item.assignedAt,
                        dueDate: item.dueDate,
                        completedCount: 0,
                        progressSum: 0,
                        scope: item.scope,
                        assigneeName: item.departments && item.departments.length > 0 ? item.departments[0] : (item.userName || item.userEmail || 'Global'),
                        assigneeId: item.departmentId || item.userId || null,
                        totalCount: 0,
                        assignees: [],
                        totalCourses: item.totalCourses || 0,
                        totalLessons: item.totalLessons || 0,
                        duration: item.duration || 0,
                        difficulty: item.difficulty || null,
                    };
                }
                acc[key].totalCount++;
                acc[key].assignees.push(item);
                // Accumulate per-user progress for accurate average
                const itemProgress = typeof item.progressPercent === 'number' ? item.progressPercent : 0;
                acc[key].progressSum = (acc[key].progressSum || 0) + itemProgress;
                const isItemCompleted = item.deliveryStatus === 'COMPLETED' || item.complianceStatus === 'COMPLETED' || itemProgress >= 100;
                if (isItemCompleted) {
                    acc[key].completedCount++;
                }
                return acc;
            }, {});

            const sortedGrouped = Object.values(grouped).sort((a: any, b: any) => {
                const dateA = a.assignedAt ? new Date(a.assignedAt).getTime() : 0;
                const dateB = b.assignedAt ? new Date(b.assignedAt).getTime() : 0;
                return dateB - dateA;
            });

            if (sortedGrouped.length === 0) {
                setGroupedAssignments([]);
            } else {
                setGroupedAssignments(sortedGrouped);
            }
        } catch (err) {
            console.error(err);
            setError('Failed to load assignments data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDataRef.current = loadData;
        loadData();
    }, []);

    const selectedContentDetails = store.selectedContents.map(sc => {
        if (sc.type === 'CAREER_PATH') {
            const cp = careerPaths.find((c: any) => c.id === sc.id);
            return cp ? { ...cp, isCareerPath: true } : null;
        } else {
            const course = courses.find((c: any) => c.id === sc.id);
            return course ? { ...course, isCareerPath: false } : null;
        }
    }).filter(Boolean);
    const selectedAssigneeDetails = assigneeOptions.filter(a => store.selectedAssignees.includes(a.id));

    if (editingGroup) {
        return (
            <AssignmentCourseEdit
                group={editingGroup}
                onBack={() => setEditingGroup(null)}
                onSave={() => {
                    setEditingGroup(null);
                    loadData();
                }}
            />
        );
    }

    if (selectedGroup) {
        return (
            <AssignmentCourseView
                group={selectedGroup}
                onBack={() => {
                    setSelectedGroup(null);
                    loadData();
                }}
                onEdit={() => {
                    setEditingGroup(selectedGroup);
                    setSelectedGroup(null);
                }}
            />
        );
    }

    if (loading || isLoadingData) {
        return (
            <main className="w-full pb-24 bg-[#ffffff] text-[#1f2937] font-sans animate-pulse pt-[20px]">
                <div className="mb-6">
                    <div className="h-3 bg-gray-200 rounded w-[150px] mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded w-[300px] mb-2"></div>
                    <div className="h-5 bg-gray-200 rounded w-[450px]"></div>
                </div>

                <div className="mb-6 border border-[#e5e7eb] rounded-xl overflow-hidden bg-white shadow-sm">
                    <div className="px-5 py-4 border-b border-[#e5e7eb] flex justify-between items-center">
                        <div className="h-6 bg-gray-200 rounded w-[180px]"></div>
                        <div className="h-5 bg-gray-200 rounded w-[80px]"></div>
                    </div>
                    <div className="p-0">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="px-5 py-4 border-b border-[#e5e7eb] last:border-b-0 flex flex-row items-center justify-between gap-4">
                                <div>
                                    <div className="h-5 bg-gray-200 rounded w-[250px] mb-2"></div>
                                    <div className="h-4 bg-gray-200 rounded w-[180px]"></div>
                                </div>
                                <div className="flex gap-4 items-center">
                                    <div className="hidden sm:flex h-2 w-[100px] bg-gray-200 rounded-full"></div>
                                    <div className="h-9 w-[80px] bg-gray-200 rounded-full"></div>
                                    <div className="h-9 w-[80px] bg-gray-200 rounded-full"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
                    {[1, 2].map(i => (
                        <div key={i} className="border border-[#e5e7eb] rounded-xl bg-white shadow-sm flex flex-col h-[400px]">
                            <div className="px-5 py-4 border-b border-[#e5e7eb] flex items-center gap-3">
                                <div className="h-6 bg-gray-200 rounded-full w-[60px]"></div>
                                <div className="h-6 bg-gray-200 rounded w-[200px]"></div>
                            </div>
                            <div className="p-5 flex-1">
                                <div className="grid grid-cols-2 gap-4 mb-5">
                                    <div className="h-10 bg-gray-200 rounded-lg w-full"></div>
                                    <div className="h-10 bg-gray-200 rounded-lg w-full"></div>
                                    <div className="h-10 bg-gray-200 rounded-lg w-full"></div>
                                    <div className="h-10 bg-gray-200 rounded-lg w-full"></div>
                                </div>
                                <div className="h-10 bg-gray-200 rounded-lg w-full mb-3"></div>
                                <div className="h-[80px] bg-gray-200 rounded-lg w-full"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        );
    }

    return (
        <main className="w-full pb-24 bg-[#ffffff] text-[#1f2937] font-sans">
            <div className="mb-6">
                <div className="text-[12px] font-bold tracking-wider uppercase text-[#6b7280] mb-2">Corporate · Assignments</div>
                <h1 className="text-[32px] font-extrabold text-[#111827] tracking-tight">Assign learnings to users</h1>
                <p className="text-[16px] font-medium text-[#6b7280] max-w-[620px] leading-snug">Push learnings to individuals, groups or your whole org with due dates and tracking.</p>
            </div>

            {/* Active Assignments */}
            <Card className="!p-0 mb-6 border border-[#e5e7eb] rounded-xl shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300 cursor-default overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-[#e5e7eb] bg-white">
                    <span className="text-[16px] font-bold text-[#111827]">Active assignments</span>
                    <span className="text-[15px] font-medium text-[#6b7280]">{groupedAssignments.length} total</span>
                </div>
                <div className="p-0 bg-white max-h-[350px] overflow-y-auto">
                    {loading ? (
                        <div className="p-5 text-center text-[15px] font-medium text-[#6b7280]">Loading active assignments...</div>
                    ) : groupedAssignments.length > 0 ? (
                        groupedAssignments.map((group: any, idx) => {
                            // Use average progressPercent across all assignees in this group
                            const pct = group.totalCount > 0
                                ? Math.round((group.progressSum / group.totalCount))
                                : 0;
                            const formattedDeadline = group.dueDate ? new Date(group.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'No deadline';
                            return (
                                <div key={idx} className="flex flex-row items-center justify-between gap-4 px-5 py-4 border-b border-[#e5e7eb] last:border-b-0 hover:bg-gray-50 transition-colors">
                                    <div className="min-w-0 flex-auto">
                                        <div className="text-[16px] font-bold text-[#111827] mb-1 leading-snug">{group.contentTitle}</div>
                                        <div className="text-[14px] font-medium text-[#6b7280] leading-snug">
                                            {group.assigneeName} ({group.totalCount}) · due {formattedDeadline}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 shrink-0">
                                        <div className="hidden sm:flex items-center gap-2">
                                            <div className="h-2 w-[80px] md:w-[100px] bg-[#f3f4f6] overflow-hidden rounded-full">
                                                <div className="h-full bg-[#d29b28] rounded-full" style={{ width: `${pct}%` }}></div>
                                            </div>
                                            <span className="text-[15px] font-medium text-[#6b7280] min-w-[34px] text-right">{pct}%</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button variant="ghost" size="sm" onClick={() => setSelectedGroup(group)} className="h-9 px-4 text-[14px] font-semibold gap-2 rounded-full border border-[#d1d5db] text-[#374151] hover:-translate-y-0.5 hover:shadow-sm transition-all duration-300">
                                                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg> View
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => setEditingGroup(group)} className="h-9 px-4 text-[14px] font-semibold gap-2 rounded-full border border-[#d1d5db] text-[#374151] hover:-translate-y-0.5 hover:shadow-sm transition-all duration-300">
                                                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg> Edit
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="p-5 text-center text-[15px] font-medium text-[#6b7280]">No active assignments found.</div>
                    )}
                </div>
            </Card>

            {/* Creation Steps Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
                {/* Step 1: Content */}
                <Card className="!p-0 border border-[#e5e7eb] rounded-xl shadow-sm bg-white h-full hover:-translate-y-1 hover:shadow-md transition-all duration-300">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-[#e5e7eb] rounded-t-xl">
                        <div className="flex items-center gap-3">
                            <span className="text-[12px] font-extrabold tracking-wider uppercase text-[#8f3a20] bg-[#efd3c7] px-2.5 py-1 rounded-full shrink-0">Step 1</span>
                            <span className="text-[16px] font-bold text-[#111827]">Select courses & career paths</span>
                        </div>
                    </div>
                    <div className="p-5">

                        <div className="flex justify-between items-center mb-1.5 mt-2">
                            <span className="text-[12px] font-extrabold uppercase tracking-wider text-[#6b7280]">Filters</span>
                            {(store.subject || store.category || store.tag || store.difficulty || store.skillSearch) && (
                                <button onClick={store.clearFilters} className="text-[12px] font-bold text-[#c29c38] hover:text-[#967323] transition-colors">
                                    Clear filters
                                </button>
                            )}
                        </div>
                        {/* Filters Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4 mb-5">
                            <div>
                                <label className="block text-[12px] font-extrabold uppercase tracking-wider text-[#6b7280] mb-1.5">Subject</label>
                                <select
                                    className="w-full h-10 px-3 border border-[#d1d5db] rounded-lg text-[15px] font-medium text-[#374151] bg-white outline-none focus:border-[#9ca3af] appearance-none hover:border-[#9ca3af] transition-colors"
                                    value={store.subject}
                                    onChange={(e) => store.setSubject(e.target.value)}
                                >
                                    <option value="">All subjects</option>
                                    {filterOptions.subjects.map((sub: string) => <option key={sub} value={sub}>{sub}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[12px] font-extrabold uppercase tracking-wider text-[#6b7280] mb-1.5">Category</label>
                                <select
                                    className="w-full h-10 px-3 border border-[#d1d5db] rounded-lg text-[15px] font-medium text-[#374151] bg-white outline-none focus:border-[#9ca3af] appearance-none hover:border-[#9ca3af] transition-colors"
                                    value={store.category}
                                    onChange={(e) => store.setCategory(e.target.value)}
                                >
                                    <option value="">All categories</option>
                                    {filterOptions.categories.map((cat: string) => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[12px] font-extrabold uppercase tracking-wider text-[#6b7280] mb-1.5">Tags</label>
                                <select
                                    className="w-full h-10 px-3 border border-[#d1d5db] rounded-lg text-[15px] font-medium text-[#374151] bg-white outline-none focus:border-[#9ca3af] appearance-none hover:border-[#9ca3af] transition-colors"
                                    value={store.tag}
                                    onChange={(e) => store.setTag(e.target.value)}
                                >
                                    <option value="">All tags</option>
                                    {filterOptions.tags.map((tag: string) => <option key={tag} value={tag}>{tag}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[12px] font-extrabold uppercase tracking-wider text-[#6b7280] mb-1.5">Level</label>
                                <select
                                    className="w-full h-10 px-3 border border-[#d1d5db] rounded-lg text-[15px] font-medium text-[#374151] bg-white outline-none focus:border-[#9ca3af] appearance-none hover:border-[#9ca3af] transition-colors"
                                    value={store.difficulty}
                                    onChange={(e) => store.setDifficulty(e.target.value)}
                                >
                                    <option value="">All levels</option>
                                    {filterOptions.difficulties?.map((diff: string) => (
                                        <option key={diff} value={diff}>
                                            {diff.charAt(0) + diff.slice(1).toLowerCase()}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-span-1 sm:col-span-2">
                                <label className="block text-[12px] font-extrabold uppercase tracking-wider text-[#6b7280] mb-1.5">Search by skill</label>
                                <Input
                                    placeholder="e.g. data quality"
                                    className="w-full h-10 px-3 border border-[#d1d5db] rounded-lg text-[15px] font-medium text-[#374151] outline-none focus:border-[#9ca3af] hover:border-[#9ca3af] transition-colors"
                                    value={store.skillSearch}
                                    onChange={(e) => store.setSkillSearch(e.target.value)}
                                    list="skills-list"
                                />
                                <datalist id="skills-list">
                                    {filterOptions.skills?.map((skill: string) => (
                                        <option key={skill} value={skill} />
                                    ))}
                                </datalist>
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-[12px] font-extrabold uppercase tracking-wider text-[#6b7280]">Courses & Career Paths</label>
                                <button className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#374151] border border-[#d1d5db] rounded-full px-3 py-1 hover:bg-[#f3f4f6] hover:-translate-y-0.5 transition-all shrink-0" onClick={() => setIsBrowseModalOpen(true)}>
                                    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg> View all
                                </button>
                            </div>
                            <div className="mb-3 relative" ref={dropdownRef}>
                                <div className="relative">
                                    <Input
                                        placeholder={`Search courses & career paths...`}
                                        value={store.contentSearch}
                                        onChange={(e) => {
                                            store.setContentSearch(e.target.value);
                                            setIsContentDropdownOpen(true);
                                        }}
                                        onClick={() => setIsContentDropdownOpen(true)}
                                        className="w-full h-10 px-3 border border-[#d1d5db] rounded-lg text-[15px] font-medium text-[#374151] outline-none focus:border-[#9ca3af] hover:border-[#9ca3af] transition-colors pr-10"
                                    />
                                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-[#6b7280] transition-transform ${isContentDropdownOpen ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9"></polyline></svg>
                                    </div>
                                </div>
                                {isContentDropdownOpen && contentOptions.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#e5e7eb] rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] z-[60] max-h-64 overflow-y-auto py-1">
                                        {contentOptions.map(opt => {
                                            const isSelected = store.selectedContents.some(sc => sc.id === opt.id);
                                            return (
                                                <div
                                                    key={opt.id}
                                                    onClick={() => { store.toggleSelectedContent({ id: opt.id, type: opt.contentType, title: opt.title }); }}
                                                    className="px-4 py-2 text-[14px] flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <img src={opt.thumbnailUrl || opt.coverImage || opt.coverImageUrl || "https://placehold.co/48x32/e5e7eb/6b7280?text=No+Img"} alt={opt.title} className="w-10 h-7 rounded-[4px] object-cover bg-gray-100" />
                                                        <span className="text-[#374151] font-medium">{opt.title}</span>
                                                        {opt.contentType === 'CAREER_PATH' && (
                                                            <span className="text-[10px] font-bold tracking-wider uppercase text-[#8f3a20] bg-[#efd3c7] px-1.5 py-0.5 rounded-sm shrink-0">Career Path</span>
                                                        )}
                                                    </div>
                                                    {isSelected && (
                                                        <svg className="w-4 h-4 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {store.selectedContents.map(sc => (
                                    <span key={sc.id} className="inline-flex items-center gap-1.5 text-[14px] font-semibold py-1 pl-2.5 pr-2 rounded-full border border-[#d6c38a] bg-white text-[#967323] hover:-translate-y-0.5 transition-transform shadow-sm">
                                        {sc.title}
                                        <button onClick={() => store.toggleSelectedContent(sc)} className="inline-flex items-center justify-center text-[#967323] hover:text-[#715c2a] transition-colors ml-1">
                                            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                        </button>
                                    </span>
                                ))}
                            </div>
                            <p className="text-[14px] font-medium text-[#6b7280] mt-2">{store.selectedContents.length} selected</p>
                        </div>
                    </div>
                </Card>

                {/* Step 2: Assignees */}
                <Card className="!p-0 border border-[#e5e7eb] rounded-xl shadow-sm bg-white h-full hover:-translate-y-1 hover:shadow-md transition-all duration-300">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-[#e5e7eb] rounded-t-xl">
                        <div className="flex items-center gap-3">
                            <span className="text-[12px] font-extrabold tracking-wider uppercase text-[#8f3a20] bg-[#efd3c7] px-2.5 py-1 rounded-full">Step 2</span>
                            <span className="text-[16px] font-bold text-[#111827]">Select assignees</span>
                        </div>
                    </div>
                    <div className="p-5">
                        <div className="flex flex-wrap gap-2.5 mb-4">
                            <div className="">
                                <button
                                    onClick={() => {
                                        setShowViewAllAlert(true);
                                        setTimeout(() => setShowViewAllAlert(false), 3000);
                                    }}
                                    className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#374151] border border-[#d1d5db] rounded-full px-3 py-1.5 hover:bg-[#f3f4f6] hover:-translate-y-0.5 transition-all"
                                >
                                    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg> View all selected
                                </button>
                                {showViewAllAlert && (
                                    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-[#111827] text-white text-[15px] font-bold px-6 py-3 rounded-full whitespace-nowrap z-[100] shadow-2xl animate-fade-in pointer-events-none transition-all duration-300">
                                        {store.selectedAssignees.length} selected users
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-5 sm:gap-6 border-b border-[#e5e7eb] mb-4 -mx-5 px-5 overflow-x-auto hide-scrollbar whitespace-nowrap">
                            <button type="button" onClick={() => { store.setAssigneeMode('USER'); store.setSelectedAssignees([]); }} className={`text-[16px] pb-2 border-b-2 transition-all shrink-0 ${store.assigneeMode === 'USER' ? 'font-bold text-[#111827] border-[#111827]' : 'font-semibold text-[#6b7280] border-transparent hover:text-[#374151]'}`}>By user</button>
                            <button type="button" onClick={() => { store.setAssigneeMode('GROUP'); store.setSelectedAssignees([]); }} className={`text-[16px] pb-2 border-b-2 transition-all shrink-0 ${store.assigneeMode === 'GROUP' ? 'font-bold text-[#111827] border-[#111827]' : 'font-semibold text-[#6b7280] border-transparent hover:text-[#374151]'}`}>By dept</button>
                            <button type="button" onClick={() => { store.setAssigneeMode('ALL'); store.setSelectedAssignees([]); }} className={`text-[16px] pb-2 border-b-2 transition-all shrink-0 ${store.assigneeMode === 'ALL' ? 'font-bold text-[#111827] border-[#111827]' : 'font-semibold text-[#6b7280] border-transparent hover:text-[#374151]'}`}>All users</button>
                        </div>
                        {store.assigneeMode === 'ALL' ? (
                            <div className="bg-[#f9f1d0] border border-[#e6d8a7] rounded-xl p-5 flex items-start sm:items-center gap-4 mt-2">
                                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-[#e6d8a7]">
                                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#5a4d1f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                        <circle cx="9" cy="7" r="4"></circle>
                                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="text-[16px] font-bold text-[#111827] mb-1">All active corporate users</h4>
                                    <p className="text-[14px] text-[#4b5563] leading-relaxed">
                                        This assignment will be sent to all <strong>{users.length}</strong> active users across your organisation.
                                    </p>
                                </div>
                            </div>
                        ) : store.assigneeMode === 'GROUP' ? (
                            <div>
                                <label className="block text-[12px] font-extrabold uppercase tracking-wider text-[#6b7280] mb-1.5">
                                    Department
                                </label>
                                <div className="relative">
                                    <select
                                        className="w-full h-10 px-3 border border-[#d1d5db] rounded-lg text-[15px] font-medium text-[#374151] bg-white outline-none focus:border-[#9ca3af] appearance-none hover:border-[#9ca3af] transition-colors"
                                        value={store.selectedAssignees[0] || ""}
                                        onChange={(e) => store.setSelectedAssignees([e.target.value])}
                                    >
                                        <option value="" disabled hidden>Select department...</option>
                                        {assigneeOptions.map(opt => (
                                            <option key={opt.id} value={opt.id}>{opt.name}</option>
                                        ))}
                                    </select>
                                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#6b7280]"><polyline points="6 9 12 15 18 9"></polyline></svg>
                                    </div>
                                </div>
                                <p className="text-[14px] text-[#6b7280] mt-1.5">
                                    Every active user in this department will receive the assignment.
                                </p>
                            </div>
                        ) : (
                            <div>
                                <label className="block text-[12px] font-extrabold uppercase tracking-wider text-[#6b7280] mb-1.5">
                                    Users
                                </label>
                                <div className="mb-3 relative">
                                    <Input
                                        placeholder="Search users..."
                                        value={store.assigneeSearch}
                                        onChange={(e) => store.setAssigneeSearch(e.target.value)}
                                        onFocus={() => setIsAssigneeFocused(true)}
                                        onBlur={() => setTimeout(() => setIsAssigneeFocused(false), 200)}
                                        className="w-full h-10 px-3 border border-[#d1d5db] rounded-lg text-[15px] font-medium text-[#374151] outline-none focus:border-[#9ca3af] hover:border-[#9ca3af] transition-colors"
                                    />
                                    {(isAssigneeFocused || store.assigneeSearch) && assigneeOptions.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#e5e7eb] rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                                            {assigneeOptions.map(opt => {
                                                const fName = opt.firstName || opt.profile?.firstName || opt.email || 'Unknown';
                                                const lName = opt.lastName || opt.profile?.lastName || '';
                                                const label = store.assigneeMode === 'USER'
                                                    ? `${fName} ${lName}`.trim()
                                                    : opt.name;
                                                const isSelected = store.selectedAssignees.includes(opt.id);
                                                return (
                                                    <div key={opt.id} onMouseDown={(e) => {
                                                        e.preventDefault();
                                                        if (!isSelected) {
                                                            store.toggleAssignee(opt.id);
                                                            store.setAssigneeSearch('');
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
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {store.selectedAssignees.map(aId => {
                                        const opt = assigneeOptions.find(o => o.id === aId);
                                        if (!opt) return null;
                                        const fName = opt.firstName || opt.profile?.firstName || opt.email || 'Unknown';
                                        const lName = opt.lastName || opt.profile?.lastName || '';
                                        const label = store.assigneeMode === 'USER'
                                            ? `${fName} ${lName}`.trim()
                                            : opt.name;
                                        return (
                                            <span key={aId} className="inline-flex items-center gap-1.5 text-[14px] font-semibold py-1 pl-2.5 pr-2 rounded-full border border-[#a2b897] bg-white text-[#55774a] hover:-translate-y-0.5 transition-transform shadow-sm">
                                                {label}
                                                <button onClick={() => store.toggleAssignee(aId)} className="inline-flex items-center justify-center text-[#55774a] hover:text-[#395031] transition-colors ml-1">
                                                    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                                </button>
                                            </span>
                                        )
                                    })}
                                </div>
                                <p className="text-[14px] font-medium text-[#6b7280] mt-2">
                                    {store.selectedAssignees.length} users selected
                                </p>
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            {/* Step 3: Assignment Type & Due Date */}
            <Card className="!p-0 mt-5 border border-[#e5e7eb] rounded-xl shadow-sm bg-white hover:-translate-y-1 hover:shadow-md transition-all duration-300 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-[#e5e7eb]">
                    <div className="flex items-center gap-3">
                        <span className="text-[12px] font-extrabold tracking-wider uppercase text-[#8f3a20] bg-[#efd3c7] px-2.5 py-1 rounded-full">Step 3</span>
                        <span className="text-[16px] font-bold text-[#111827]">Assignment type &amp; due date</span>
                    </div>
                </div>
                <div className="p-5">
                    <div className="mb-5">
                        <label className="block text-[12px] font-extrabold uppercase tracking-wider text-[#6b7280] mb-2">Assignment type</label>
                        <div className="flex gap-3">
                            <label className={`flex-1 sm:flex-none flex items-center gap-3 text-[16px] font-semibold px-4 py-2.5 rounded-lg border cursor-pointer hover:-translate-y-0.5 hover:shadow-sm transition-all ${store.requirement === 'MANDATORY' ? 'border-[#c29c38] bg-[#f5e3bc] text-[#111827]' : 'border-[#e5e7eb] bg-white text-[#374151]'}`}>
                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${store.requirement === 'MANDATORY' ? 'border-[#299d5a]' : 'border-[#d1d5db]'}`}>
                                    {store.requirement === 'MANDATORY' && <div className="w-2.5 h-2.5 rounded-full bg-[#299d5a]"></div>}
                                </div>
                                <input type="radio" checked={store.requirement === 'MANDATORY'} onChange={() => store.setRequirement('MANDATORY')} className="hidden" />
                                Mandatory
                            </label>
                            <label className={`flex-1 sm:flex-none flex items-center gap-3 text-[16px] font-semibold px-4 py-2.5 rounded-lg border cursor-pointer hover:-translate-y-0.5 hover:shadow-sm transition-all ${store.requirement === 'OPTIONAL' ? 'border-[#c29c38] bg-[#f5e3bc] text-[#111827]' : 'border-[#e5e7eb] bg-white text-[#374151]'}`}>
                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${store.requirement === 'OPTIONAL' ? 'border-[#299d5a]' : 'border-[#d1d5db]'}`}>
                                    {store.requirement === 'OPTIONAL' && <div className="w-2.5 h-2.5 rounded-full bg-[#299d5a]"></div>}
                                </div>
                                <input type="radio" checked={store.requirement === 'OPTIONAL'} onChange={() => store.setRequirement('OPTIONAL')} className="hidden" />
                                Optional
                            </label>
                        </div>
                    </div>
                    <div>
                        <div className="flex items-start justify-between gap-5 mb-2">
                            <div>
                                <label className="block text-[12px] font-extrabold uppercase tracking-wider text-[#6b7280] mb-1">Due date</label>
                                <p className="text-[14px] font-medium text-[#6b7280] m-0">Turn on to set a completion deadline for this assignment.</p>
                            </div>
                            <button onClick={() => setHasDueDate(!hasDueDate)} className={`relative w-12 h-6 rounded-full shrink-0 transition-colors ${hasDueDate ? 'bg-[#7a9d74]' : 'bg-[#d1d5db]'}`}>
                                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${hasDueDate ? 'translate-x-6' : ''}`}></span>
                            </button>
                        </div>
                        {hasDueDate && (
                            <div className="relative w-full sm:max-w-[200px]">
                                <Input type="date" min={new Date().toISOString().split("T")[0]} value={store.dueDate} onChange={e => store.setDueDate(e.target.value)} className="w-full h-10 px-3 border border-[#d1d5db] rounded-lg text-[15px] font-medium text-[#374151] outline-none focus:border-[#9ca3af] hover:border-[#9ca3af] transition-colors" />
                            </div>
                        )}
                    </div>
                </div>
            </Card>



            {/* Course details preview */}
            <Card className="!p-0 !p-0 mt-5 border border-[#e5e7eb] rounded-xl bg-white hover:-translate-y-1 hover:shadow-md transition-all duration-300 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-[#e5e7eb]">
                    <span className="text-[16px] font-bold text-[#111827]">Course details preview</span>
                    <span className="text-[15px] font-medium text-[#6b7280]">
                        {selectedContentDetails.length} selected
                    </span>
                </div>
                <div className="p-0">
                    {selectedContentDetails.length > 0 ? (
                        selectedContentDetails.map(c => (
                            <div key={c.id} className="flex items-center gap-4 px-5 py-4 border-b border-[#e5e7eb] last:border-b-0 hover:bg-gray-50 transition-colors">
                                <div className="w-12 h-12 rounded-lg overflow-hidden bg-[#f3f4f6] shrink-0 border border-[#e5e7eb]">
                                    <img src={c.thumbnailUrl || c.coverImage || c.coverImageUrl || "https://placehold.co/48x32/e5e7eb/6b7280?text=No+Img"} alt={c.title} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-auto min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="text-[16px] font-bold text-[#111827] leading-snug">{c.title}</div>
                                        {c.isCareerPath && (
                                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#1e3a8a] bg-[#dbeafe] px-1.5 py-0.5 rounded">Career path</span>
                                        )}
                                    </div>
                                    <div className="text-[14px] font-medium text-[#6b7280]">{c.difficulty || 'Expert'} · {c.duration || c.estimatedDuration || '28 min'}</div>

                                </div>
                                <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold py-1 px-2.5 rounded-full border border-[#e4cac2] bg-white text-[#9d5b4a] shadow-sm shrink-0">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#9d5b4a] shrink-0"></div> {store.requirement === 'MANDATORY' ? 'Mandatory' : 'Optional'}
                                </span>
                            </div>
                        ))
                    ) : (
                        <div className="p-5 text-center text-[#6b7280] text-[15px] font-medium">Select a course or career path to see preview</div>
                    )}
                </div>
            </Card>

            {/* Summary Bar */}
            <div className="sticky bottom-4 sm:bottom-6 mt-6 bg-white border border-[#e5e7eb] rounded-xl shadow-lg z-20 p-4 sm:py-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
                <p className="text-[16px] font-normal text-[#111827] leading-relaxed">
                    <strong>{store.assigneeMode === 'ALL' ? 'All active users' : store.assigneeMode === 'GROUP' ? (store.selectedAssignees.length ? '1 department' : '0 departments') : `${store.selectedAssignees.length} users`}</strong> will receive <strong>{store.selectedContents.length} {store.selectedContents.length === 1 ? 'course' : 'courses'}</strong> {store.requirement === 'MANDATORY' && store.dueDate ? <>· due <strong>{new Date(store.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</strong></> : ''}
                </p>
                <div className="flex gap-3 shrink-0 w-full sm:w-auto">
                    <Button
                        onClick={handleSubmit}
                        disabled={bulkAssignMutation.isPending || store.selectedContents.length === 0 || (store.assigneeMode !== 'ALL' && store.selectedAssignees.length === 0)}
                        className="flex-1 sm:flex-none justify-center h-12 px-8 rounded-full text-[16px] font-bold bg-[#fef08a] hover:bg-[#fde047] text-[#111827] border border-[#fde047] inline-flex items-center gap-2 hover:-translate-y-0.5 hover:shadow-sm transition-all duration-300"
                    >
                        {bulkAssignMutation.isPending ? 'Sending...' : 'Send assignments'} <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                    </Button>
                </div>
            </div>
            <BrowseCoursesModal open={isBrowseModalOpen} onClose={() => setIsBrowseModalOpen(false)} />

            {/* Success Toast */}
            <div
                aria-live="polite"
                role="status"
                className={`fixed bottom-6 right-6 flex items-center justify-between gap-[16px] rounded-[10px] bg-[#222222] px-[20px] py-[16px] text-white shadow-2xl transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)] ${showSuccessToast
                        ? "translate-y-0 opacity-100 scale-100 pointer-events-auto"
                        : "translate-y-[20px] opacity-0 scale-95 pointer-events-none"
                    } z-50`}
            >
                <span className="font-sans text-[15px] font-medium leading-snug tracking-wide">
                    Course assigned successfully
                </span>
            </div>
        </main>
    );
};

export default CourseAssignment;