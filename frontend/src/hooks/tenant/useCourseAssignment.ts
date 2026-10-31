import { useQuery, useMutation } from "@tanstack/react-query";
import {
    getAvailableCareerPathsApi,
    getAvailableCoursesApi,
    getAvailableLessonsApi,
    bulkAssignCorporateLearningApi
} from "../../core/api/corporate-learning.api";
import { getTenantUsersByTenantIdApi } from "../../core/api/tenantuser.api";
import { getTenantDepartmentsApi } from "../../core/api/group.api";
import { getCategories } from "../../core/api/category/category.api";
import { getSubjects } from "../../core/api/subject.api";
import { getTagsApi } from "../../core/api/tag/tag.api";
import { getSkillsApi } from "../../core/api/skill/skill.api";
import { useCourseAssignmentStore } from "../../store/tanant/CourseAssignment.store";
import { useMemo, useEffect } from "react";

export const useCourseAssignment = (onSuccessCallback?: () => void) => {
    const store = useCourseAssignmentStore();
    const { tenantId, contentType, assigneeMode, setTenantId } = store;

    // Initialize Tenant ID on mount
    useEffect(() => {
        try {
            const storedUser = localStorage.getItem('keycloak_session_user');
            if (storedUser) {
                const parsed = JSON.parse(storedUser);
                const user = parsed?.user || parsed;
                const id = user?.tenantId || user?.tenant?.id || user?.organizationId || "";
                if (id) {
                    setTenantId(id);
                }
            }
        } catch (error) {
            console.error("Failed to parse session user", error);
        }
    }, [setTenantId]);

    // Queries
    const { data: careerPaths = [], isLoading: isLoadingCareerPaths } = useQuery({
        queryKey: ["availableCareerPaths_v2", tenantId],
        queryFn: () => getAvailableCareerPathsApi(tenantId, { limit: 100 }),
        enabled: !!tenantId
    });

    const { data: courses = [], isLoading: isLoadingCourses } = useQuery({
        queryKey: ["availableCourses_v2", tenantId],
        queryFn: () => getAvailableCoursesApi(tenantId, { limit: 100 }),
        enabled: !!tenantId
    });

    const { data: lessons = [], isLoading: isLoadingLessons } = useQuery({
        queryKey: ["availableLessons", tenantId],
        queryFn: () => getAvailableLessonsApi(tenantId, { limit: 100 }),
        enabled: !!tenantId && contentType === "LESSON"
    });

    const { data: rawUsers = [], isLoading: isLoadingUsers } = useQuery({
        queryKey: ["tenantUsers", tenantId],
        queryFn: () => getTenantUsersByTenantIdApi(tenantId),
        enabled: !!tenantId && (assigneeMode === "USER" || assigneeMode === "ALL")
    });

    const users = useMemo(() => {
        return rawUsers.filter((u: any) => {
            const roleValues = [
                u.roleCode, u.roleName, u.role?.code, u.role?.name, u.role,
                ...(Array.isArray(u.roles) ? u.roles.map((r: any) => typeof r === 'string' ? r : (r?.role?.code || r?.role?.name || r?.name || r?.code)) : []),
                ...(Array.isArray(u.realmRoles) ? u.realmRoles : [])
            ];
            // Exclude Corporate Admins and non-active users
            const isCorporateAdmin = roleValues.some(val => typeof val === 'string' && val.toUpperCase().replace(/\s/g, '_') === "CORPORATE_ADMIN");
            return !isCorporateAdmin && u.status === 'ACTIVE';
        });
    }, [rawUsers]);

    const { data: groups = [], isLoading: isLoadingGroups } = useQuery({
        queryKey: ["tenantGroups", tenantId],
        queryFn: () => getTenantDepartmentsApi(tenantId),
        enabled: !!tenantId && assigneeMode === "GROUP"
    });

    const { data: rawCategories = [] } = useQuery({
        queryKey: ["allCategories"],
        queryFn: () => getCategories().then(res => res.data || [])
    });

    const { data: rawSubjects = [] } = useQuery({
        queryKey: ["allSubjects"],
        queryFn: () => getSubjects().then(res => res.data || [])
    });

    const { data: rawTags = [] } = useQuery({
        queryKey: ["allTags"],
        queryFn: () => getTagsApi()
    });

    const { data: rawSkills = [] } = useQuery({
        queryKey: ["allSkills"],
        queryFn: () => getSkillsApi()
    });

    // Filtering Content
    const contentData = useMemo(() => {
        let opts: any[] = [
            ...courses.map((c: any) => ({ ...c, contentType: "COURSE" })),
            ...careerPaths.map((cp: any) => ({ ...cp, contentType: "CAREER_PATH" }))
        ];

        // Filter out drafts or inactive content, and strictly enforce standalone flag
        // We only show PUBLISHED courses and career paths that are standalone.
        opts = opts.filter((opt: any) => {
            if (opt.status?.toUpperCase() !== "PUBLISHED") return false;
            
            const visibility = String(opt.visibility || "PUBLIC_CATALOG").toUpperCase();
            if (visibility === "PUBLIC_CATALOG") return false;
            
            return true;
        });

        // Note: The backend APIs (getAvailableCoursesApi, getAvailableCareerPathsApi) 
        // securely handle visibility logic (PUBLIC_CATALOG, TENANT_ONLY) using 
        // the courseVisibilityWhere filter.

        // Filter Options Extract
        const allOpts = opts; // unfiltered valid options

        if (store.difficulty) {
            opts = opts.filter(opt => opt.difficulty === store.difficulty);
        }
        if (store.category) {
            opts = opts.filter(opt => (opt.category?.name || opt.category) === store.category);
        }
        if (store.subject) {
            opts = opts.filter(opt => (opt.subject?.name || opt.subject) === store.subject);
        }
        if (store.tag) {
            opts = opts.filter(opt => {
                const tags = Array.isArray(opt.tags) ? opt.tags.map((t: any) => t.name || t) : (typeof opt.tags === 'string' ? opt.tags.split(',').map((t: string) => t.trim()) : []);
                return tags.includes(store.tag);
            });
        }
        if (store.skillSearch) {
            const lowerSkill = store.skillSearch.toLowerCase();
            opts = opts.filter(opt => {
                const skills = Array.isArray(opt.skills) ? opt.skills.map((s: any) => s.name || s) : (typeof opt.skills === 'string' ? opt.skills.split(',').map((s: string) => s.trim()) : []);
                return skills.some((s: string) => s.toLowerCase().includes(lowerSkill)) || (opt.tagline || '').toLowerCase().includes(lowerSkill) || (opt.shortDescription || '').toLowerCase().includes(lowerSkill);
            });
        }

        if (store.contentSearch) {
            const lower = store.contentSearch.toLowerCase();
            opts = opts.filter(opt => opt.title?.toLowerCase().includes(lower));
        }
        return { opts };
    }, [careerPaths, courses, tenantId, store.contentSearch, store.difficulty, store.category, store.subject, store.tag, store.skillSearch]);

    const contentOptions = contentData.opts;
    const filterOptions = {
        categories: Array.from(new Set(rawCategories.map((c: any) => c.name).filter(Boolean))).sort(),
        subjects: Array.from(new Set(rawSubjects.map((s: any) => s.name).filter(Boolean))).sort(),
        tags: Array.from(new Set(rawTags.map((t: any) => t.name).filter(Boolean))).sort(),
        skills: Array.from(new Set(rawSkills.map((s: any) => s.name).filter(Boolean))).sort(),
        difficulties: ["BEGINNER", "INTERMEDIATE", "ADVANCED"]
    };

    // Filtering Assignees
    const assigneeOptions = useMemo(() => {
        let opts: any[] = [];
        if (assigneeMode === "USER") {
            opts = users;
        }
        if (assigneeMode === "GROUP") {
            opts = groups;
        }

        if (store.assigneeSearch) {
            const lower = store.assigneeSearch.toLowerCase();
            if (assigneeMode === "USER") {
                opts = opts.filter(u =>
                    u.email?.toLowerCase().includes(lower) ||
                    u.firstName?.toLowerCase().includes(lower) ||
                    u.lastName?.toLowerCase().includes(lower)
                );
            } else {
                opts = opts.filter(g => g.name?.toLowerCase().includes(lower));
            }
        }
        return opts;
    }, [assigneeMode, users, groups, tenantId, store.assigneeSearch]);

    // Mutation
    const bulkAssignMutation = useMutation({
        mutationFn: (data: any) => bulkAssignCorporateLearningApi(tenantId, data),
        onSuccess: () => {
            const prevTenantId = store.tenantId;
            store.reset();
            store.setTenantId(prevTenantId); // Restore tenantId after reset
            if (onSuccessCallback) {
                onSuccessCallback();
            }
        },
        onError: (err: any) => {
            console.error(err);
            alert("Failed to send assignments. " + (err.response?.data?.message || err.message));
        }
    });

    const handleSubmit = () => {
        if (store.selectedContents.length === 0) {
            return alert("Please select at least one content to assign (Step 1).");
        }
        if (assigneeMode !== "ALL" && store.selectedAssignees.length === 0) {
            return alert("Please select at least one assignee (Step 2).");
        }

        const scope = assigneeMode === "USER" ? "USER" : assigneeMode === "GROUP" ? "DEPARTMENT" : "GLOBAL";

        const payload: any = {
            items: store.selectedContents.map(c => {
                let validDueDate = undefined;
                if (store.requirement === "MANDATORY" && store.dueDate) {
                    const parsed = new Date(store.dueDate);
                    if (!isNaN(parsed.getTime())) {
                        validDueDate = parsed.toISOString();
                    }
                }
                return {
                    contentType: c.type,
                    contentId: c.id,
                    requirement: store.requirement,
                    dueDate: validDueDate,
                };
            }),
            scope,
            notifyUsers: store.notifyUsers,
        };

        if (assigneeMode === "USER") {
            payload.userIds = store.selectedAssignees;
        } else if (assigneeMode === "GROUP") {
            payload.departmentIds = store.selectedAssignees;
        }

        bulkAssignMutation.mutate(payload);
    };

    const isLoadingData = isLoadingCareerPaths || isLoadingCourses || isLoadingLessons || isLoadingUsers || isLoadingGroups;

    return {
        store,
        contentOptions,
        filterOptions,
        assigneeOptions,
        users,
        courses,
        careerPaths,
        bulkAssignMutation,
        handleSubmit,
        isLoadingData
    };
};
