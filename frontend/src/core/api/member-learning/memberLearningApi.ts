import { api } from "../../../config/axios";
import { formatMinutesToDisplay } from "../../../utils/mediaDuration";
import {
  MemberCourseDto,
  MemberCourseViewModel,
  LearningStatistics,
} from "./memberLearningApi.types";

const LOCAL_STORAGE_KEY = "member_learning_state";

interface LocalLearningState {
  enrolledIds: string[];
  progressMap: Record<string, number>;
  statusMap: Record<string, string>;
  wishlistIds: string[];
  wishlistMap: Record<string, string>;
  lastAccessedMap: Record<string, string>;
  totalTimeSpentSecs?: number;
}

const getLocalState = (): LocalLearningState => {
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!stored) {
    return {
      enrolledIds: [],
      progressMap: {},
      statusMap: {},
      wishlistIds: [],
      wishlistMap: {},
      lastAccessedMap: {},
      totalTimeSpentSecs: 0,
    };
  }
  try {
    const parsed = JSON.parse(stored);
    return {
      enrolledIds: parsed.enrolledIds || [],
      progressMap: parsed.progressMap || {},
      statusMap: parsed.statusMap || {},
      wishlistIds: parsed.wishlistIds || [],
      wishlistMap: parsed.wishlistMap || {},
      lastAccessedMap: parsed.lastAccessedMap || {},
      totalTimeSpentSecs: parsed.totalTimeSpentSecs || 0,
    };
  } catch {
    return {
      enrolledIds: [],
      progressMap: {},
      statusMap: {},
      wishlistIds: [],
      wishlistMap: {},
      lastAccessedMap: {},
      totalTimeSpentSecs: 0,
    };
  }
};

const saveLocalState = (state: LocalLearningState) => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
};

export const isLearningContentVisible = (item: any, role?: string, tenantId?: string) => {
  const rawVisibility = String(item?.visibility || "PUBLIC_CATALOG").toUpperCase();
  const normalizedRole = role?.toUpperCase().replace(/[\s-]+/g, "_");
  const isCorporateAdmin =
    normalizedRole === "CORPORATE_ADMIN" ||
    normalizedRole === "CORPORATEADMIN" ||
    normalizedRole === "ADMIN" ||
    normalizedRole === "SUPER_ADMIN" ||
    normalizedRole === "SUPERADMIN";
  const isCorporateUser =
    normalizedRole === "CORPORATE_USER" ||
    normalizedRole === "CORPORATEUSER" ||
    normalizedRole === "USER";

  const isPublic =
    rawVisibility === "PUBLIC_CATALOG" ||
    rawVisibility === "PUBLIC" ||
    rawVisibility === "ALL" ||
    !item?.visibility;
  const isBoth =
    rawVisibility === "BOTH" ||
    rawVisibility === "PUBLIC_AND_CORPORATE";
  const isTenantOnly =
    rawVisibility === "TENANT_ONLY" ||
    rawVisibility === "TENANT" ||
    rawVisibility === "CORPORATE";

  const itemTenantIds = [
    item?.tenantId,
    item?.tenant?.id,
    ...(item?.courseTenants || []).map((mapping: any) => mapping?.tenantId || mapping?.tenant?.id || (typeof mapping === "string" ? mapping : undefined)),
    ...(item?.careerPathTenants || []).map((mapping: any) => mapping?.tenantId || mapping?.tenant?.id || (typeof mapping === "string" ? mapping : undefined)),
    ...(item?.tenants || []).map((mapping: any) => mapping?.tenantId || mapping?.tenant?.id || (typeof mapping === "string" ? mapping : undefined)),
    ...(item?.tenantIds || []),
    ...(item?.courseLessons || []).map((cl: any) => cl?.course?.tenantId || (cl?.course?.courseTenants || []).map((ct: any) => ct?.tenantId)).flat(),
  ].filter(Boolean);

  const belongsToTenant = !!tenantId && itemTenantIds.some((id: any) => String(id) === String(tenantId));

  if (isCorporateAdmin) {
    if (isTenantOnly) {
      return belongsToTenant;
    }
    return true;
  }

  if (isCorporateUser) {
    return isPublic || isBoth || (isTenantOnly && belongsToTenant);
  }

  return true;
};

export const isPublishedLearningContent = (item: any) => {
  const status = item?.status;
  return (
    !status ||
    String(status).toUpperCase() === "PUBLISHED" ||
    String(status).toUpperCase() === "ACTIVE" ||
    String(status).toUpperCase() === "APPROVED"
  );
};

export const isStandaloneCourse = (item: any) => true;

export const DEFAULT_KM_SKILLS = ["Taxonomy", "Metadata", "Governance", "KM strategy"];

export const extractSkillsFromEntity = (item: any): string[] => {
  const skillsSet = new Set<string>();

  // 1. Direct skills array sources: skills, courseSkills, skillTags, lessonSkills, careerPathSkills
  const directSources = [
    item?.skills,
    item?.courseSkills,
    item?.skillTags,
    item?.lessonSkills,
    item?.careerPathSkills,
  ];
  for (const source of directSources) {
    if (Array.isArray(source)) {
      for (const s of source) {
        const name = s?.skill?.name || s?.name || (typeof s === "string" ? s : null);
        if (name && typeof name === "string" && name.trim()) {
          skillsSet.add(name.trim());
        }
      }
    }
  }

  // Also check direct string array on skillNames
  if (Array.isArray(item?.skillNames)) {
    for (const name of item.skillNames) {
      if (name && typeof name === "string" && name.trim()) {
        skillsSet.add(name.trim());
      }
    }
  }

  // 2. Skills from nested courseLessons (for courses)
  if (Array.isArray(item?.courseLessons)) {
    for (const cl of item.courseLessons) {
      const lesson = cl?.lesson || cl;
      const lSkills = [lesson?.skills, lesson?.lessonSkills, lesson?.skillTags];
      for (const src of lSkills) {
        if (Array.isArray(src)) {
          for (const s of src) {
            const name = s?.skill?.name || s?.name || (typeof s === "string" ? s : null);
            if (name && typeof name === "string" && name.trim()) {
              skillsSet.add(name.trim());
            }
          }
        }
      }
    }
  }

  // 3. Skills from nested careerPaths (for courses belonging to career paths)
  if (Array.isArray(item?.careerPaths)) {
    for (const cpRel of item.careerPaths) {
      const cp = cpRel?.careerPath || cpRel;
      const cpSkills = [cp?.skillTags, cp?.skills, cp?.careerPathSkills];
      for (const src of cpSkills) {
        if (Array.isArray(src)) {
          for (const s of src) {
            const name = s?.skill?.name || s?.name || (typeof s === "string" ? s : null);
            if (name && typeof name === "string" && name.trim()) {
              skillsSet.add(name.trim());
            }
          }
        }
      }
    }
  }

  // 4. Fallback to tags if no skills found
  if (skillsSet.size === 0) {
    const tagSources = [item?.tags, item?.courseTags, item?.careerPathTags, item?.lessonTags];
    for (const src of tagSources) {
      if (Array.isArray(src)) {
        for (const t of src) {
          const name = t?.tag?.name || t?.name || (typeof t === "string" ? t : null);
          if (name && typeof name === "string" && name.trim()) {
            skillsSet.add(name.trim());
          }
        }
      }
    }
  }

  // 5. Baseline fallback skills (matching the KM domain in the mockups)
  if (skillsSet.size === 0) {
    return [...DEFAULT_KM_SKILLS];
  }

  return Array.from(skillsSet);
};

export const mapCourseDtoToViewModel = (
  dto: MemberCourseDto,
  localState: LocalLearningState,
  completedCourseIds: string[]
): MemberCourseViewModel => {
  const dbStatus = localState.statusMap[dto.id];
  const isCompleted =
    completedCourseIds.includes(dto.id) || dbStatus === "COMPLETED";
  const isEnrolled = localState.enrolledIds.includes(dto.id) || isCompleted;
  const progress = isCompleted ? 100 : localState.progressMap[dto.id] ?? 0;

  const levelMap: Record<string, "Beginner" | "Intermediate" | "Advanced"> = {
    BEGINNER: "Beginner",
    INTERMEDIATE: "Intermediate",
    ADVANCED: "Advanced",
  };
  const level = levelMap[dto.difficulty] || "Beginner";

  const instructor = dto.owner?.profile
    ? [dto.owner.profile.firstName, dto.owner.profile.lastName]
      .filter(Boolean)
      .join(" ")
    : undefined;

  const lessonsCount =
    dto.courseLessons?.length ||
    (dto as any)._count?.courseLessons ||
    (dto as any).lessonsCount ||
    (dto as any).totalLessons ||
    (dto as any).total_lessons ||
    (dto as any).lessons?.length ||
    0;

  const lessonDurationSum = Array.isArray(dto.courseLessons)
    ? dto.courseLessons.reduce(
      (acc: number, curr: any) => acc + Number(curr.lesson?.duration ?? curr.duration ?? 0),
      0
    )
    : 0;

  const totalDurationMins =
    lessonDurationSum > 0
      ? lessonDurationSum
      : Number(dto.duration ?? dto.estimatedDuration ?? 0);

  const totalDurationHours = totalDurationMins / 60;
  const formattedDur = formatMinutesToDisplay(totalDurationMins);

  let durationText = "";
  if (lessonsCount > 0 && formattedDur) {
    durationText = `${lessonsCount} lesson${lessonsCount === 1 ? "" : "s"} · ${formattedDur}`;
  } else if (lessonsCount > 0) {
    durationText = `${lessonsCount} lesson${lessonsCount === 1 ? "" : "s"}`;
  } else if (formattedDur) {
    durationText = formattedDur;
  }

  if (dto.publishType === "EXPLAINER") {
    durationText = formattedDur ? `Standalone video · ${formattedDur}` : "Standalone video";
  }

  const price = dto.priceTier === "FREE" ? "Free" : "$220";

  let statusText = "Not started";
  if (isCompleted) {
    statusText = "Completed";
  } else if (progress > 0 && progress <= 100) {
    statusText = "In progress";
  }

  // Extract path info
  let pathName = (dto as any).pathName;
  let pathId = (dto as any).pathId;
  if (!pathName && Array.isArray((dto as any).careerPaths) && (dto as any).careerPaths.length > 0) {
    const cp = (dto as any).careerPaths[0]?.careerPath || (dto as any).careerPaths[0];
    if (cp) {
      pathName = cp.title || cp.name;
      pathId = cp.id;
    }
  }
  if (!pathName) {
    pathName = "Knowledge Lead";
  }

  const skillNames = extractSkillsFromEntity(dto);

  return {
    id: dto.id,
    category: dto.category?.name || "Uncategorized",
    subjectNames: dto.subjects?.map((s) => s.subject.name) || [],
    skillNames,
    pathName,
    pathId,
    language: dto.language || "English",
    title: dto.title,
    level,
    instructor,
    durationText,
    price,
    isEnrolled,
    progress: isEnrolled ? progress : undefined,
    statusText,
    isWishlisted: localState.wishlistIds.includes(dto.id),
    wishlistedAt: localState.wishlistMap[dto.id],
    isFeatured: dto.isFeatured,
    isTrending: dto.isTrending,
    isNewRelease: dto.isNewRelease,
    publishType: dto.publishType,
    lessonsCount,
    totalDurationHours,
    totalDurationMins,
    type: "course" as const,
    thumbnailUrl: (dto as any).thumbnailUrl || dto.thumbnailAsset?.fileUrl || (dto.thumbnailAsset as any)?.signedUrl || (dto.thumbnailAsset as any)?.url || (dto as any).coverImageUrl || undefined,
    subjectName: dto.subjects?.[0]?.subject?.name,
    isStandalone: dto.isStandalone,
    createdAt: dto.createdAt,
    lastAccessedAt: localState.lastAccessedMap[dto.id],
    visibility: dto.visibility,
    tenantIds: [
      dto.tenantId,
      ...((dto as any).courseTenants || []).map((mapping: any) => mapping.tenantId),
    ].filter(Boolean),
    viewCount: Number((dto as any).viewCount) || 0,
  };
};

export const memberLearningApi = {
  getLocalState,

  // Fetch raw list of all courses
  getAllCourses: async (): Promise<MemberCourseDto[]> => {
    const { data } = await api.get<{ success: boolean; data: MemberCourseDto[] }>("/courses/all?memberView=true");
    return data.data || [];
  },

  // Fetch completed course certificates
  getCompletedCertificates: async (userId: string): Promise<any[]> => {
    if (!userId) return [];
    try {
      const { data } = await api.get<{ success: boolean; data: any[] }>(`/certificates/user/${userId}`);
      return data.data || [];
    } catch (error) {
      console.error("Failed to fetch user certificates", error);
      return [];
    }
  },

  // ---------------------------------------------------------------------------
  // MAIN AGGREGATOR FUNCTION
  // ---------------------------------------------------------------------------
  getRawLearningData: async (userId: string, role?: string, tenantId?: string): Promise<MemberCourseViewModel[]> => {
    // 1. Fetch concurrently
    const [courses, certificates, careerPathsRes, lessonsRes, wishlists, enrollmentsData] = await Promise.all([
      memberLearningApi.getAllCourses(),
      memberLearningApi.getCompletedCertificates(userId),
      api.get("/career-paths?memberView=true").catch(() => ({ data: { data: [] } })),
      tenantId && role?.toUpperCase().replace(/[\s-]+/g, "_") === "CORPORATE_USER"
        ? api.get(`/tenants/${tenantId}/corporate-learning/available-lessons`, {
          params: { status: "PUBLISHED", limit: 100 },
        }).catch(() => ({ data: { items: [] } }))
        : api.get("/lessons?memberView=true").catch(() => ({ data: { data: [] } })),
      memberLearningApi.getUserWishlists(),
      memberLearningApi.getUserEnrollments(userId),
    ]);

    const enrollmentsRes = enrollmentsData.enrollments;
    const completedCourseIds = certificates.map((cert) => cert.courseId).filter(Boolean);
    const localState = getLocalState();

    // Save total time spent
    localState.totalTimeSpentSecs = enrollmentsData.totalTimeSpentSecs;

    // Sync local state with backend
    localState.wishlistIds = wishlists.map(w => w.courseId || w.lessonId || w.careerPathId).filter(Boolean);
    localState.wishlistMap = {};
    wishlists.forEach(w => {
      const id = w.courseId || w.lessonId || w.careerPathId;
      if (id) {
        localState.wishlistMap[id] = w.createdAt;
      }
    });

    localState.enrolledIds = enrollmentsRes.map((e) => e.courseId || e.lessonId || e.careerPathId).filter(Boolean);
    enrollmentsRes.forEach((e) => {
      const id = e.courseId || e.lessonId || e.careerPathId;
      if (id) {
        const progressVal = e.progress ?? e.courseProgress ?? e.careerPathProgress ?? (e as any).progressPercent;
        localState.statusMap[id] = e.status;
        if (e.status === "COMPLETED" || Number(progressVal) === 100) {
          localState.progressMap[id] = 100;
        } else if (progressVal !== undefined && progressVal !== null) {
          localState.progressMap[id] = Number(progressVal);
        }
        if (e.lastAccessedAt || (e as any).updatedAt) {
          localState.lastAccessedMap[id] = e.lastAccessedAt || (e as any).updatedAt;
        }
      }
    });
    saveLocalState(localState);

    const careerPaths = (careerPathsRes.data?.data || []).filter((cp: any) => isPublishedLearningContent(cp));
    const lessonPayload = lessonsRes.data?.data || lessonsRes.data?.items || lessonsRes.data || [];
    const lessons = (Array.isArray(lessonPayload) ? lessonPayload : []).filter((ls: any) => isPublishedLearningContent(ls));
    const publishedCourses = courses.filter((course: any) =>
      isPublishedLearningContent(course)
    );

    // Build lookup from career paths so any course in a career path gets path info and career path skills
    const coursePathMap: Record<string, { pathName: string; pathId: string; skills: string[] }> = {};
    for (const cp of careerPaths) {
      const cpSkillList = extractSkillsFromEntity(cp);
      const cpCourses = cp.courses || cp.careerPathCourses || [];
      if (Array.isArray(cpCourses)) {
        for (const c of cpCourses) {
          const cid = c?.courseId || c?.course?.id || c?.id;
          if (cid) {
            coursePathMap[cid] = {
              pathName: cp.title || "Knowledge Lead",
              pathId: cp.id,
              skills: cpSkillList,
            };
          }
        }
      }
    }

    // 2. Map DTOs to ViewModels
    const courseViewModels = publishedCourses.map((course) => {
      const vm = mapCourseDtoToViewModel(course, localState, completedCourseIds);
      if (coursePathMap[course.id]) {
        vm.pathName = coursePathMap[course.id].pathName;
        vm.pathId = coursePathMap[course.id].pathId;
        if (
          (!vm.skillNames || vm.skillNames.length === 0 || (vm.skillNames.length === 4 && vm.skillNames[0] === "Taxonomy")) &&
          coursePathMap[course.id].skills.length > 0
        ) {
          vm.skillNames = coursePathMap[course.id].skills;
        }
      }
      return vm;
    });

    const cpViewModels: MemberCourseViewModel[] = careerPaths.map((cp: any) => {
      const totalCourses = cp.courses?.length || cp.careerPathCourses?.length || 0;
      const cpDurationSum = Array.isArray(cp.courses || cp.careerPathCourses)
        ? (cp.courses || cp.careerPathCourses).reduce((sum: number, cpc: any) => {
          const c = cpc.course || cpc;
          const cDur = Number(c?.duration || c?.estimatedDuration || 0);
          if (cDur > 0) return sum + cDur;
          const lDur = (c?.courseLessons || []).reduce((lSum: number, cl: any) => lSum + Number(cl.lesson?.duration || cl.duration || 0), 0);
          return sum + lDur;
        }, 0)
        : 0;
      const cpMins = cpDurationSum > 0 ? cpDurationSum : Number(cp.duration || cp.estimatedDuration || 0);
      const cpDurText = formatMinutesToDisplay(cpMins);

      return {
        id: cp.id,
        type: "career-path" as const,
        visibility: cp.visibility,
        category: cp.category?.name || "Uncategorized",
        subjectNames: cp.subjects?.map((s: any) => s.subject?.name).filter(Boolean) || [],
        skillNames: extractSkillsFromEntity(cp),
        pathName: cp.title || "Knowledge Lead",
        pathId: cp.id,
        language: cp.language || "English",
        title: cp.title,
        level: cp.difficulty || "Intermediate",
        instructor: undefined,
        durationText: cpDurText ? `${totalCourses} course${totalCourses === 1 ? "" : "s"} · ${cpDurText}` : `${totalCourses} course${totalCourses === 1 ? "" : "s"}`,
        price: cp.priceTier === "FREE" ? "Free" : "$220",
        isEnrolled: localState.enrolledIds.includes(cp.id) || (localState.statusMap[cp.id] === "COMPLETED"),
        progress: localState.progressMap[cp.id],
        statusText: localState.statusMap[cp.id] === "COMPLETED" ? "Completed" : (localState.progressMap[cp.id] > 0 && localState.progressMap[cp.id] <= 100) ? "In progress" : "Not started",
        isWishlisted: localState.wishlistIds.includes(cp.id),
        wishlistedAt: localState.wishlistMap[cp.id],
        isFeatured: false,
        isTrending: false,
        isNewRelease: false,
        publishType: "PUBLISHED",
        lessonsCount: totalCourses,
        totalDurationHours: cpMins / 60,
        totalDurationMins: cpMins,
        thumbnailUrl: cp.coverImageAsset?.fileUrl || cp.coverImageAsset?.signedUrl || cp.coverImageAsset?.url || cp.thumbnailAsset?.fileUrl || cp.thumbnailAsset?.signedUrl || cp.thumbnailAsset?.url || cp.thumbnailUrl || cp.coverImageUrl || undefined,
        createdAt: cp.createdAt,
        lastAccessedAt: localState.lastAccessedMap[cp.id],
        careerPathCourses: cp.careerPathCourses || cp.courses || [],
        tenantIds: [
          cp.tenantId,
          ...(cp.careerPathTenants || []).map((mapping: any) => mapping.tenantId),
        ].filter(Boolean),
        viewCount: Number(cp.viewCount) || 0,
      };
    });

    const lessonViewModels: MemberCourseViewModel[] = lessons.map((ls: any) => ({
      id: ls.id,
      type: "lesson" as const,
      visibility: ls.visibility,
      category: ls.subject?.name || ls.category?.name || "Uncategorized",
      subjectNames: ls.subject?.name ? [ls.subject.name] : [],
      skillNames: extractSkillsFromEntity(ls),
      pathName: "Knowledge Lead",
      language: ls.language || "English",
      title: ls.title,
      level: "Beginner",
      instructor: undefined,
      durationText: formatMinutesToDisplay(ls.duration ?? 0) || "0 mins",
      price: "Free",
      isEnrolled: localState.enrolledIds.includes(ls.id) || (localState.statusMap[ls.id] === "COMPLETED"),
      progress: localState.progressMap[ls.id],
      statusText: localState.statusMap[ls.id] === "COMPLETED" ? "Completed" : (localState.progressMap[ls.id] > 0 && localState.progressMap[ls.id] <= 100) ? "In progress" : "Not started",
      isWishlisted: localState.wishlistIds.includes(ls.id),
      wishlistedAt: localState.wishlistMap[ls.id],
      isFeatured: false,
      isTrending: false,
      isNewRelease: false,
      publishType: "PUBLISHED",
      lessonsCount: 1,
      totalDurationHours: (ls.duration ?? 0) / 60,
      totalDurationMins: ls.duration ?? 0,
      thumbnailUrl: (ls as any).thumbnailUrl || ls.thumbnailAsset?.fileUrl || ls.thumbnailAsset?.signedUrl || ls.thumbnailAsset?.url || (ls as any).coverImageUrl || undefined,
      createdAt: ls.createdAt,
      lastAccessedAt: localState.lastAccessedMap[ls.id],
      tenantIds: [
        ls.tenantId,
        ...(ls.tenants || []).map((mapping: any) => mapping.tenantId),
      ].filter(Boolean),
      viewCount: Number(ls.viewCount) || 0,
    }));

    return [...courseViewModels, ...cpViewModels, ...lessonViewModels];
  },

  // ---------------------------------------------------------------------------
  // FILTERING LOGIC
  // ---------------------------------------------------------------------------
  filterLearningData: (
    viewModels: MemberCourseViewModel[],
    activeTab: string,
    filters: any,
    search: string,
    sortBy: string,
    page: number = 1,
    limitParam: number = 10
  ) => {
    let filtered = [...viewModels];

    // 3. Filter by Active Tab
    if (activeTab === "Enrolled") {
      filtered = filtered.filter((vm) => vm.isEnrolled);
    } else if (activeTab === "In progress") {
      filtered = filtered.filter((vm) => vm.isEnrolled && vm.progress && vm.progress >= 5 && vm.progress <= 99);
    } else if (activeTab === "Completed") {
      filtered = filtered.filter((vm) => vm.statusText === "Completed");
    } else if (activeTab === "Wishlist") {
      filtered = filtered.filter((vm) => vm.isWishlisted);
    }

    // 4. Filter by Side Filters
    if (filters.careerPath && filters.careerPath.length > 0) {
      filtered = filtered.filter((vm) =>
        filters.careerPath?.includes(vm.category)
      );
    }
    if (filters.difficulty && filters.difficulty.length > 0) {
      filtered = filtered.filter((vm) =>
        filters.difficulty?.includes(vm.level)
      );
    }
    if (filters.duration && filters.duration.length > 0) {
      filtered = filtered.filter((vm) => {
        const hours = vm.totalDurationHours;
        return filters.duration?.some((dur: string) => {
          if (dur === "Under 2h") return hours < 2;
          if (dur === "2-5h") return hours >= 2 && hours <= 5;
          if (dur === "5h+") return hours > 5;
          return true;
        });
      });
    }
    if (filters.price && filters.price.length > 0) {
      filtered = filtered.filter((vm) =>
        filters.price?.includes(vm.price)
      );
    }

    // 5. Filter by Search Query
    if (search && search.trim() !== "") {
      const q = search.toLowerCase().trim();
      filtered = filtered.filter(
        (vm) =>
          vm.title.toLowerCase().includes(q) ||
          vm.category.toLowerCase().includes(q) ||
          (vm.instructor && vm.instructor.toLowerCase().includes(q))
      );
    }

    // 6. Sort
    if (sortBy === "Newest") {
      filtered.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
    } else if (sortBy === "Most Popular") {
      filtered.sort((a, b) => {
        const countA = Number(a.viewCount) || 0;
        const countB = Number(b.viewCount) || 0;
        if (countB !== countA) return countB - countA;
        const titleA = a.title || "";
        const titleB = b.title || "";
        return titleA.localeCompare(titleB);
      });
    } else if (sortBy === "A-Z") {
      filtered.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    } else if (sortBy === "Shortest") {
      filtered.sort((a, b) => {
        const durA = a.totalDurationMins || 0;
        const durB = b.totalDurationMins || 0;
        return durA - durB;
      });
    }

    // 7. Paginate
    const limit = typeof limitParam === "number" ? limitParam : 10;
    const total = filtered.length;
    const startIndex = (page - 1) * limit;
    const paginatedData = filtered.slice(startIndex, startIndex + limit);

    return {
      data: paginatedData,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  },

  // Enroll in course
  enrollInCourse: async (courseId: string): Promise<boolean> => {
    try {
      const { data } = await api.post<{ success: boolean; message?: string; data?: any }>(`/courses/${courseId}/enroll`);
      if (data && data.success) {
        const localState = getLocalState();
        if (!localState.enrolledIds.includes(courseId)) {
          localState.enrolledIds.push(courseId);
        }
        if (localState.progressMap[courseId] === undefined) {
          localState.progressMap[courseId] = 0;
        }
        saveLocalState(localState);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Enrollment API failed", error);
      throw error;
    }
  },

  // Update course progress
  updateCourseProgress: async (
    courseId: string,
    progress: number
  ): Promise<boolean> => {
    try {
      const localState = getLocalState();
      localState.progressMap[courseId] = progress;
      if (progress > 0 && !localState.enrolledIds.includes(courseId)) {
        localState.enrolledIds.push(courseId);
      }
      saveLocalState(localState);

      // Attempt to persist at course-progress endpoint; ignore failures (graceful fallback)
      try {
        await api.patch(`/progress/course-progress/${courseId}`, { progress });
      } catch (err) {
        // backend may restrict direct course-progress updates; swallow and keep local state
        console.debug("Course progress persist failed (non-blocking)", err);
      }

      return true;
    } catch (error) {
      console.error("Update course progress failed", error);
      return false;
    }
  },

  // Fetch user wishlists from backend
  getUserWishlists: async (): Promise<any[]> => {
    try {
      const { data } = await api.get<{ success: boolean; data: { wishlists: any[] } }>("/wishlists");
      return data?.data?.wishlists || [];
    } catch (error: any) {
      console.error("Failed to fetch wishlists", error?.response?.data || error?.message || error);
      return [];
    }
  },

  // Fetch user enrollments from backend
  getUserEnrollments: async (userId: string): Promise<{ enrollments: any[], totalTimeSpentSecs: number }> => {
    if (!userId) return { enrollments: [], totalTimeSpentSecs: 0 };
    try {
      const { data } = await api.get<{ success: boolean; data: any[]; totalTimeSpentSecs?: number }>(`/enrollments/user/${userId}`);
      return {
        enrollments: data.data || [],
        totalTimeSpentSecs: data.totalTimeSpentSecs || 0
      };
    } catch (error) {
      console.error("Failed to fetch enrollments", error);
      return { enrollments: [], totalTimeSpentSecs: 0 };
    }
  },

  // Toggle wishlist
  toggleWishlist: async (entityId: string, entityType: string = "course"): Promise<boolean> => {
    try {
      const localState = getLocalState();
      const isWishlisted = localState.wishlistIds.includes(entityId);

      if (isWishlisted) {
        // Remove
        await api.delete(`/wishlists/${entityId}?entityType=${entityType}`);
        localState.wishlistIds = localState.wishlistIds.filter(id => id !== entityId);
      } else {
        // Add
        await api.post(`/wishlists/${entityId}`, { entityId, entityType });
        localState.wishlistIds.push(entityId);
      }

      saveLocalState(localState);
      return true;
    } catch (error) {
      console.error("Failed to toggle wishlist", error);
      return false;
    }
  },

  // Fetch learning statistics
  getLearningStatistics: async (userId: string): Promise<LearningStatistics> => {
    const [courses, certificates, careerPathsRes, lessonsRes, wishlists, enrollmentsData] = await Promise.all([
      memberLearningApi.getAllCourses(),
      memberLearningApi.getCompletedCertificates(userId),
      api.get("/career-paths").catch(() => ({ data: { data: [] } })),
      api.get("/lessons").catch(() => ({ data: { data: [] } })),
      memberLearningApi.getUserWishlists(),
      memberLearningApi.getUserEnrollments(userId),
    ]);

    const enrollmentsRes = enrollmentsData.enrollments;
    const completedCourseIds = certificates.map((cert) => cert.courseId).filter(Boolean);
    const localState = getLocalState();

    // Save total time spent
    localState.totalTimeSpentSecs = enrollmentsData.totalTimeSpentSecs;

    localState.wishlistIds = wishlists.map(w => w.courseId || w.lessonId || w.careerPathId).filter(Boolean);
    localState.wishlistMap = {};
    wishlists.forEach(w => {
      const id = w.courseId || w.lessonId || w.careerPathId;
      if (id) {
        localState.wishlistMap[id] = w.createdAt;
      }
    });

    localState.enrolledIds = enrollmentsRes.map((e) => e.courseId || e.lessonId || e.careerPathId).filter(Boolean);
    enrollmentsRes.forEach((e) => {
      const id = e.courseId || e.lessonId || e.careerPathId;
      if (id) {
        const progressVal = e.progress ?? e.courseProgress ?? e.careerPathProgress;
        if (e.status === "COMPLETED" || progressVal === 100) {
          localState.progressMap[id] = 100;
        } else if (progressVal !== undefined && progressVal !== null) {
          localState.progressMap[id] = Number(progressVal);
        }
      }
    });
    saveLocalState(localState);

    const isPublishedStatus = (st: string) => !st || st.toUpperCase() === "PUBLISHED";
    const careerPaths = (careerPathsRes.data?.data || []).filter((cp: any) => isPublishedStatus(cp.status));
    const lessons = (lessonsRes.data?.data || []).filter((ls: any) => isPublishedStatus(ls.status));
    const publishedCourses = courses.filter((c: any) => isPublishedStatus(c.status));

    const courseViewModels = publishedCourses.map((course) =>
      mapCourseDtoToViewModel(course, localState, completedCourseIds)
    );

    const cpViewModels: MemberCourseViewModel[] = careerPaths.map((cp: any) => {
      const totalCourses = cp.courses?.length || cp.careerPathCourses?.length || 0;
      const cpDurationSum = Array.isArray(cp.courses || cp.careerPathCourses)
        ? (cp.courses || cp.careerPathCourses).reduce((sum: number, cpc: any) => {
          const c = cpc.course || cpc;
          const cDur = Number(c?.duration || c?.estimatedDuration || 0);
          if (cDur > 0) return sum + cDur;
          const lDur = (c?.courseLessons || []).reduce((lSum: number, cl: any) => lSum + Number(cl.lesson?.duration || cl.duration || 0), 0);
          return sum + lDur;
        }, 0)
        : 0;
      const cpMins = cpDurationSum > 0 ? cpDurationSum : Number(cp.duration || cp.estimatedDuration || 0);
      const cpDurText = formatMinutesToDisplay(cpMins);

      return {
        id: cp.id,
        type: "career-path" as const,
        category: cp.category?.name || "Career Path",
        skillNames: extractSkillsFromEntity(cp),
        pathName: cp.title || "Knowledge Lead",
        pathId: cp.id,
        title: cp.title,
        level: cp.difficulty || "Intermediate",
        instructor: undefined,
        durationText: cpDurText ? `${totalCourses} course${totalCourses === 1 ? "" : "s"} · ${cpDurText}` : `${totalCourses} course${totalCourses === 1 ? "" : "s"}`,
        price: cp.priceTier === "FREE" ? "Free" : "$220",
        isEnrolled: localState.enrolledIds.includes(cp.id) || (localState.progressMap[cp.id] === 100),
        progress: localState.progressMap[cp.id],
        statusText: localState.progressMap[cp.id] === 100 ? "Completed" : (localState.progressMap[cp.id] >= 5 && localState.progressMap[cp.id] <= 99) ? "In progress" : "Not started",
        isWishlisted: localState.wishlistIds.includes(cp.id),
        isFeatured: false,
        isTrending: false,
        isNewRelease: false,
        publishType: "PUBLISHED",
        lessonsCount: totalCourses,
        totalDurationHours: cpMins / 60,
        totalDurationMins: cpMins,
      };
    });

    const lessonViewModels: MemberCourseViewModel[] = lessons.map((ls: any) => ({
      id: ls.id,
      type: "lesson" as const,
      category: ls.category?.name || "Standalone Lesson",
      skillNames: extractSkillsFromEntity(ls),
      pathName: "Knowledge Lead",
      title: ls.title,
      level: "Beginner",
      instructor: undefined,
      durationText: formatMinutesToDisplay(ls.duration ?? 0) || "0 mins",
      price: "Free",
      isEnrolled: localState.enrolledIds.includes(ls.id) || (localState.progressMap[ls.id] === 100),
      progress: localState.progressMap[ls.id],
      statusText: localState.progressMap[ls.id] === 100 ? "Completed" : (localState.progressMap[ls.id] >= 5 && localState.progressMap[ls.id] <= 99) ? "In progress" : "Not started",
      isWishlisted: localState.wishlistIds.includes(ls.id),
      wishlistedAt: localState.wishlistMap[ls.id],
      isFeatured: false,
      isTrending: false,
      isNewRelease: false,
      publishType: "PUBLISHED",
      lessonsCount: 1,
      totalDurationHours: (ls.duration ?? 0) / 60,
      totalDurationMins: ls.duration ?? 0,
    }));

    const viewModels = [...courseViewModels, ...cpViewModels, ...lessonViewModels];

    const totalCoursesCount = viewModels.length;
    const enrolledCount = viewModels.filter((vm) => vm.isEnrolled).length;
    const inProgressCount = viewModels.filter(
      (vm) => vm.isEnrolled && vm.progress && vm.progress >= 5 && vm.progress <= 99
    ).length;
    const completedCount = viewModels.filter((vm) => vm.statusText === "Completed").length;
    const wishlistCount = viewModels.filter((vm) => vm.isWishlisted).length;

    return {
      totalCoursesCount,
      enrolledCount,
      inProgressCount,
      completedCount,
      wishlistCount,
    };
  },
};
