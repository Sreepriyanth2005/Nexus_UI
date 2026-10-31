// src/mock/mockApiAdapter.ts
// In-browser mock adapter for Axios that intercepts all API calls
// and serves rich static mock data with client-side state persistence.

import { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from "axios";
import {
  STATIC_ACCOUNTS,
  STATIC_COURSES,
  STATIC_TENANTS,
  STATIC_TENANT_USERS,
  STATIC_CAREER_PATHS,
  STATIC_CATEGORIES,
  STATIC_SKILLS,
  STATIC_TAGS,
  STATIC_SUBJECTS,
  STATIC_INDUSTRIES,
  STATIC_FIELDS_OF_STUDY,
  STATIC_ANALYTICS,
  STATIC_REPORTS,
  STATIC_REVIEW_QUEUE,
  STATIC_CERTIFICATES,
  StaticUser
} from "./staticData";

/**
 * Resolves a user profile based on email or keywords in the email.
 */
export function resolveMockUser(email: string): StaticUser {
  const normalized = (email || "").toLowerCase().trim();
  if (STATIC_ACCOUNTS[normalized]) {
    return STATIC_ACCOUNTS[normalized];
  }

  // Fallbacks based on email keywords:
  if (normalized.includes("super")) {
    return { ...STATIC_ACCOUNTS["superadmin@nexus.org"], email: normalized };
  }
  if (normalized.includes("corp") || normalized.includes("admin")) {
    return { ...STATIC_ACCOUNTS["corporateadmin@nexus.org"], email: normalized };
  }
  if (normalized.includes("dev") || normalized.includes("content")) {
    return { ...STATIC_ACCOUNTS["developer@nexus.org"], email: normalized };
  }
  if (normalized.includes("sme") || normalized.includes("review")) {
    return { ...STATIC_ACCOUNTS["sme@nexus.org"], email: normalized };
  }
  if (normalized.includes("support")) {
    return { ...STATIC_ACCOUNTS["support@nexus.org"], email: normalized };
  }
  if (normalized.includes("user")) {
    return { ...STATIC_ACCOUNTS["corporateuser@nexus.org"], email: normalized };
  }

  // Default to Super Admin so the client has full exploratory access if an unknown email is typed
  return {
    ...STATIC_ACCOUNTS["superadmin@nexus.org"],
    email: normalized,
    firstName: "Demo",
    lastName: "User",
  };
}

/**
 * Creates an Axios-compatible response object
 */
function createMockResponse<T>(config: InternalAxiosRequestConfig, data: T, status = 200): AxiosResponse<T> {
  return {
    data,
    status,
    statusText: status === 200 ? "OK" : "Created",
    headers: { "content-type": "application/json" },
    config,
    request: {},
  };
}

/**
 * Core Mock Request Handler
 */
export async function handleMockRequest(config: InternalAxiosRequestConfig): Promise<AxiosResponse<any>> {
  const url = (config.url || "").replace(/^https?:\/\/[^\/]+/, "").replace(/^\/api\/v1/, "");
  const method = (config.method || "GET").toUpperCase();
  let body: any = {};
  
  if (typeof config.data === "string") {
    try {
      body = JSON.parse(config.data);
    } catch {
      body = {};
    }
  } else if (config.data && typeof config.data === "object") {
    body = config.data;
  }

  // Simulate ultra-fast local latency for a snappy UI feel
  await new Promise((resolve) => setTimeout(resolve, 60));

  console.debug(`[MockAPI] ${method} ${url}`, { body, params: config.params });

  // -------------------------------------------------------------
  // 1. AUTHENTICATION & LOGIN FLOWS
  // -------------------------------------------------------------

  // Send OTP (Member login)
  if (url.includes("/auth/login/send-otp") || url === "/auth/send-otp") {
    return createMockResponse(config, {
      success: true,
      message: "Static Demo OTP sent. Use 123456 to verify.",
      otp: {
        otpExpirySeconds: 600,
        resendCooldownSeconds: 30,
        maxOtpVerifyAttempts: 5,
        remainingVerifyAttempts: 5,
        expiresAt: new Date(Date.now() + 600000).toISOString(),
        resendAvailableAt: new Date(Date.now() + 30000).toISOString(),
      },
    });
  }

  // Admin Login (Password + OTP step)
  if (url.includes("/auth/admin/login") && !url.includes("verify-otp")) {
    return createMockResponse(config, {
      success: true,
      message: "Static Demo OTP sent. Use 123456 to verify.",
      otp: {
        otpExpirySeconds: 600,
        resendCooldownSeconds: 30,
        maxOtpVerifyAttempts: 5,
        remainingVerifyAttempts: 5,
        expiresAt: new Date(Date.now() + 600000).toISOString(),
        resendAvailableAt: new Date(Date.now() + 30000).toISOString(),
      },
    });
  }

  // Verify OTP (Login or Admin Login)
  if (url.includes("/auth/login/verify-otp") || url.includes("/auth/admin/login/verify-otp") || url.includes("/auth/verify-otp")) {
    const userEmail = body.email || localStorage.getItem("demo_temp_email") || "superadmin@nexus.org";
    const user = resolveMockUser(userEmail);

    const mockAccessToken = `mock-token-${user.role.toLowerCase()}-${Date.now()}`;
    const mockRefreshToken = `mock-refresh-${user.role.toLowerCase()}-${Date.now()}`;

    // Store current static user for profile queries
    localStorage.setItem("static_current_user", JSON.stringify(user));

    return createMockResponse(config, {
      success: true,
      message: "Authenticated successfully (Static Wireframe Mode)",
      user: {
        ...user,
        permissions: [
          "SUPER_ADMIN",
          "VIEW_COURSES", "MANAGE_COURSES", "CREATE_COURSES", "DELETE_COURSES",
          "VIEW_USERS", "MANAGE_USERS", "VIEW_TENANTS", "MANAGE_TENANTS",
          "VIEW_REPORTS", "EXPORT_REPORTS", "MANAGE_SETTINGS", "APPROVE_COURSES"
        ],
      },
      auth: {
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
        idToken: `mock-id-token-${user.id}`,
        role: user.role,
      },
    });
  }

  // Public OTP & Session Config
  if (url.includes("/auth/otp-config/public")) {
    return createMockResponse(config, {
      success: true,
      data: {
        userSessionTimeoutMinutes: 10080,
        adminSessionTimeoutMinutes: 60,
      },
    });
  }

  // Direct password login (if triggered)
  if (url.includes("/auth/login") && method === "POST" && !url.includes("otp") && !url.includes("revoke")) {
    const user = resolveMockUser(body.email || "superadmin@nexus.org");
    return createMockResponse(config, {
      success: true,
      user,
      auth: {
        accessToken: `mock-token-${user.role.toLowerCase()}`,
        refreshToken: `mock-refresh-${user.role.toLowerCase()}`,
        role: user.role,
      },
    });
  }

  // Resend OTP
  if (url.includes("/auth/login/resend-otp") || url.includes("/auth/register/resend-otp")) {
    return createMockResponse(config, {
      success: true,
      message: "Static Demo OTP resent. Use 123456 to verify.",
      otp: {
        otpExpirySeconds: 600,
        resendCooldownSeconds: 30,
        remainingVerifyAttempts: 5,
        expiresAt: new Date(Date.now() + 600000).toISOString(),
      },
    });
  }

  // Registration flows
  if (url.includes("/auth/register")) {
    return createMockResponse(config, {
      success: true,
      message: "Registration step completed (Demo Mode)",
      otp: {
        otpExpirySeconds: 600,
        resendCooldownSeconds: 30,
        remainingVerifyAttempts: 5,
      },
      verificationToken: "mock-verification-token",
    });
  }

  // Active Sessions
  if (url.includes("/auth/sessions")) {
    return createMockResponse(config, {
      success: true,
      data: [
        {
          id: "sess-1",
          deviceId: "dev-curr",
          deviceName: "Current Browser (Demo Session)",
          browser: "Chrome",
          os: "Windows",
          ipAddress: "127.0.0.1",
          lastActive: "Just now",
          isCurrent: true,
        }
      ],
    });
  }

  // Logout
  if (url.includes("/auth/logout")) {
    localStorage.removeItem("static_current_user");
    return createMockResponse(config, { success: true, message: "Logged out" });
  }

  // Refresh token
  if (url.includes("/auth/refresh-token")) {
    return createMockResponse(config, {
      accessToken: `mock-token-refreshed-${Date.now()}`,
      refreshToken: `mock-refresh-refreshed-${Date.now()}`,
    });
  }

  // -------------------------------------------------------------
  // 2. COURSES & LEARNING CATALOG
  // -------------------------------------------------------------

  // Enrolled courses for current user
  if (url.includes("/courses/me/enrolled") || url.includes("/enrollments")) {
    const enrolledList = STATIC_COURSES.map((c, i) => ({
      id: `enr-${c.id}`,
      courseId: c.id,
      course: c,
      enrolledAt: "2026-02-01T10:00:00Z",
      type: "course",
      progress: {
        userId: "usr-member-003",
        courseId: c.id,
        progress: i === 0 ? 65 : i === 1 ? 40 : i === 2 ? 100 : 0,
        completed: i === 2,
        completedLessons: i === 0 ? 6 : i === 1 ? 4 : i === 2 ? 10 : 0,
        totalLessons: 10,
        status: i === 2 ? "COMPLETED" : i < 2 ? "IN_PROGRESS" : "NOT_STARTED",
      }
    }));

    return createMockResponse(config, {
      success: true,
      data: enrolledList,
    });
  }

  // Single Course Lessons
  if (url.match(/\/courses\/[a-zA-Z0-9_-]+\/lessons/) && method === "GET") {
    const parts = url.split("?")[0].split("/");
    const courseId = parts[parts.indexOf("courses") + 1];
    const found = STATIC_COURSES.find((c) => c.id === courseId || c.courseId === courseId) || STATIC_COURSES[0];
    const lessons = (found?.modules || []).flatMap((m) => m.lessons || []).map((l, i) => ({
      id: l.id || `cl-${i}`,
      courseId: found.id,
      lessonId: l.id,
      sequenceOrder: i + 1,
      order: i + 1,
      lesson: {
        ...l,
        courseId: found.id,
      },
      ...l,
    }));
    return createMockResponse(config, {
      success: true,
      data: lessons,
      lessons,
      courseLessons: lessons,
      total: lessons.length,
    });
  }

  // Single Course by ID
  const courseMatch = url.match(/\/courses\/([a-zA-Z0-9_-]+)/);
  if (courseMatch && method === "GET" && !url.includes("/all") && !url.includes("/me") && !url.includes("/lessons") && !url.includes("/enroll")) {
    const courseId = courseMatch[1];
    if (courseId !== "me" && courseId !== "all") {
      const found = STATIC_COURSES.find((c) => c.id === courseId || c.courseId === courseId) || STATIC_COURSES[0];
      return createMockResponse(config, { success: true, data: found, course: found });
    }
  }

  // All courses (for admin & statistics)
  if (url.includes("/courses/all")) {
    return createMockResponse(config, {
      success: true,
      data: STATIC_COURSES,
      count: STATIC_COURSES.length,
    });
  }

  // Courses list
  if (url.startsWith("/courses") || url.startsWith("/admin-courses")) {
    if (method === "GET") {
      return createMockResponse(config, {
        success: true,
        data: STATIC_COURSES,
        courses: STATIC_COURSES,
        total: STATIC_COURSES.length,
        totalCourses: STATIC_COURSES.length,
        totalPages: 1,
        page: 1,
        limit: 10,
        statistics: {
          total: STATIC_COURSES.length,
          published: STATIC_COURSES.filter((c) => c.status === "PUBLISHED").length,
          draft: STATIC_COURSES.filter((c) => c.status === "DRAFT").length,
          inReview: 1,
          archived: 0,
        }
      });
    }

    // Creating or Updating course
    if (method === "POST" || method === "PUT" || method === "PATCH") {
      const newCourse = {
        ...STATIC_COURSES[0],
        ...body,
        id: body.id || `crs-new-${Date.now()}`,
        status: body.status || "DRAFT",
        updatedAt: new Date().toISOString(),
      };
      return createMockResponse(config, { success: true, data: newCourse, message: "Course saved successfully" });
    }

    // Deleting course
    if (method === "DELETE") {
      return createMockResponse(config, { success: true, message: "Course deleted successfully" });
    }
  }

  // Standalone and course lessons
  if (url.startsWith("/lessons") || url.startsWith("/lesson")) {
    const mockLessons = STATIC_COURSES.flatMap((c) => c.modules || []).flatMap((m) => m.lessons || []).map((l, i) => ({
      ...l,
      id: l.id || `les-${i}`,
      title: l.title,
      type: l.type || "VIDEO",
      duration: l.duration || 20,
      status: "PUBLISHED",
      updatedAt: new Date().toISOString(),
    }));

    return createMockResponse(config, {
      success: true,
      data: mockLessons,
      lessons: mockLessons,
      total: mockLessons.length,
    });
  }

  // Member Learning / Enrolled Courses
  if (url.includes("/member-learning") || url.includes("/learning/enrolled") || url.includes("/my-learning")) {
    return createMockResponse(config, {
      success: true,
      data: STATIC_COURSES,
      enrolledCourses: STATIC_COURSES,
      completedCourses: [STATIC_COURSES[2], STATIC_COURSES[4]],
      inProgressCourses: [STATIC_COURSES[0], STATIC_COURSES[1]],
      totalEnrolled: STATIC_COURSES.length,
    });
  }

  // Course Progress & Continuity
  if (url.includes("/progress") || url.includes("/continuity")) {
    return createMockResponse(config, {
      success: true,
      data: {
        courseId: "crs-ai-101",
        percentage: 65,
        completedLessons: ["les-101", "les-102", "les-103", "les-201"],
        currentLessonId: "les-202",
        lastAccessedAt: new Date().toISOString(),
      }
    });
  }

  // Career Paths / Learning Paths
  if (url.includes("/career-path") || url.includes("/learning-path")) {
    if (method === "GET") {
      return createMockResponse(config, {
        success: true,
        data: STATIC_CAREER_PATHS,
        total: STATIC_CAREER_PATHS.length,
      });
    }
    return createMockResponse(config, { success: true, message: "Learning path updated successfully" });
  }

  // -------------------------------------------------------------
  // 3. TENANTS & CORPORATE MANAGEMENT
  // -------------------------------------------------------------

  if (url.includes("/reporting/tenant-dashboard-stats") || (url.includes("/tenants/") && url.includes("/dashboard"))) {
    const tenantStats = {
      tenant: STATIC_TENANTS[0],
      users: {
        totalUsers: 1840,
        activeUsers: 1620,
        inactiveUsers: 220,
      },
      overview: {
        totalUsers: 1840,
        activeUsers: 1620,
        totalEnrollments: 4890,
        completionRate: 86,
        inProgressRate: 10,
        notStartedRate: 4,
        mandatoryComplianceRate: 98,
        learningHours: 14200,
      },
      monthlyTrends: [
        { month: "Jan", enrollments: 820, completions: 710 },
        { month: "Feb", enrollments: 950, completions: 840 },
        { month: "Mar", enrollments: 1120, completions: 990 },
      ],
      departmentStats: [
        { department: "Engineering", usersCount: 650, completionRate: 92 },
        { department: "Product Operations", usersCount: 320, completionRate: 88 },
        { department: "Cybersecurity", usersCount: 240, completionRate: 95 },
        { department: "Finance & Accounting", usersCount: 410, completionRate: 84 },
      ],
      licenseUtilization: {
        totalLicenses: 2500,
        assignedLicenses: 1840,
        utilizationPercentage: 73.6,
      }
    };

    return createMockResponse(config, {
      success: true,
      data: tenantStats,
      ...tenantStats,
    });
  }

  // Assigned Content for Corporate Learning
  if (url.includes("/assigned-content") || (url.includes("/corporate-learning") && (url.includes("/assigned") || url.includes("/available-courses")))) {
    const assignedCourses = STATIC_COURSES.map((c) => ({
      id: c.id,
      courseId: c.id,
      contentId: c.id,
      course: c,
      requirement: "MANDATORY",
      status: "IN_PROGRESS",
    }));
    return createMockResponse(config, {
      success: true,
      data: {
        courses: assignedCourses,
        careerPaths: [],
        lessons: [],
        items: assignedCourses,
      },
      courses: assignedCourses,
      careerPaths: [],
      lessons: [],
      items: assignedCourses,
    });
  }

  // Course / Career Path Enrollment
  if (url.includes("/enroll") && method === "POST") {
    return createMockResponse(config, {
      success: true,
      message: "Successfully enrolled in the course",
      data: { enrolled: true, enrolledAt: new Date().toISOString() },
    });
  }

  if (url.includes("/tenants") || url.includes("/corporate")) {
    if (method === "GET") {
      if (url.includes("/users")) {
        return createMockResponse(config, {
          success: true,
          data: STATIC_TENANT_USERS,
          users: STATIC_TENANT_USERS,
          total: STATIC_TENANT_USERS.length,
        });
      }
      return createMockResponse(config, {
        success: true,
        data: STATIC_TENANTS,
        tenants: STATIC_TENANTS,
        total: STATIC_TENANTS.length,
      });
    }

    return createMockResponse(config, {
      success: true,
      message: "Tenant action saved successfully",
      data: STATIC_TENANTS[0],
    });
  }

  // Tenant Users
  if (url.includes("/tenantuser") || url.includes("/tenant-user")) {
    if (method === "GET") {
      return createMockResponse(config, {
        success: true,
        data: STATIC_TENANT_USERS,
        users: STATIC_TENANT_USERS,
        total: STATIC_TENANT_USERS.length,
      });
    }
    return createMockResponse(config, { success: true, message: "User saved successfully" });
  }

  // -------------------------------------------------------------
  // 4. USERS & ROLES MANAGEMENT
  // -------------------------------------------------------------

  if (url.startsWith("/users") || url.includes("/internal-user") || url.includes("/user-management")) {
    if (method === "GET") {
      const allUsers = Object.values(STATIC_ACCOUNTS).concat(STATIC_TENANT_USERS as any);
      return createMockResponse(config, {
        success: true,
        data: allUsers,
        users: allUsers,
        total: allUsers.length,
      });
    }
    return createMockResponse(config, { success: true, message: "User updated successfully" });
  }

  // Roles & Permissions & RBAC
  if (url.includes("/rbac/roles/system") || url.includes("/roles/system")) {
    return createMockResponse(config, {
      success: true,
      data: ["SUPER_ADMIN", "CONTENT_DEVELOPER", "SME", "MEMBER"],
    });
  }

  if (url.includes("/roles") || url.includes("/permission") || url.includes("/rbac")) {
    return createMockResponse(config, {
      success: true,
      data: [
        { id: "rol-super", name: "SUPER_ADMIN", code: "SUPER_ADMIN", displayName: "Super Administrator", userCount: 1, isSystemRole: true },
        { id: "rol-dev", name: "CONTENT_DEVELOPER", code: "CONTENT_DEVELOPER", displayName: "Content Developer", userCount: 6, isSystemRole: true },
        { id: "rol-sme", name: "SME", code: "SME", displayName: "Subject Matter Expert (SME)", userCount: 3, isSystemRole: true },
        { id: "rol-mem", name: "MEMBER", code: "MEMBER", displayName: "Member (Learner)", userCount: 1420, isSystemRole: false },
      ],
    });
  }

  // -------------------------------------------------------------
  // 5. TAXONOMIES: CATEGORIES, SKILLS, TAGS, SUBJECTS
  // -------------------------------------------------------------

  if (url.includes("/category") || url.includes("/categories")) {
    return createMockResponse(config, { success: true, data: STATIC_CATEGORIES, categories: STATIC_CATEGORIES });
  }
  if (url.includes("/skill") || url.includes("/skills")) {
    return createMockResponse(config, { success: true, data: STATIC_SKILLS, skills: STATIC_SKILLS });
  }
  if (url.includes("/tag") || url.includes("/tags")) {
    return createMockResponse(config, { success: true, data: STATIC_TAGS, tags: STATIC_TAGS });
  }
  if (url.includes("/subject") || url.includes("/subjects")) {
    return createMockResponse(config, { success: true, data: STATIC_SUBJECTS, subjects: STATIC_SUBJECTS });
  }
  if (url.includes("/industry") || url.includes("/industries")) {
    return createMockResponse(config, { success: true, data: STATIC_INDUSTRIES, industries: STATIC_INDUSTRIES });
  }
  if (url.includes("/fieldofstudy") || url.includes("/field-of-study")) {
    return createMockResponse(config, { success: true, data: STATIC_FIELDS_OF_STUDY, fieldsOfStudy: STATIC_FIELDS_OF_STUDY });
  }

  // -------------------------------------------------------------
  // 6. DASHBOARDS, ANALYTICS & REPORTS
  // -------------------------------------------------------------

  if (url.includes("/reporting/admin/summary") || url.includes("/admin/summary")) {
    const summaryData = {
      totalUsers: 14250,
      totalUsersTrend: 12,
      activeUsers: 8920,
      activeUsersTrend: 8,
      totalEnrollments: 24800,
      totalEnrollmentsTrend: 15,
      overallCompletionPercentage: 84,
      completionTrend: 4,
      attentionItems: {
        coursesAwaitingReview: 2,
        corporateInvitesPending: 5,
        credentialsExpiring30Days: 12,
        inactiveSMEs: 1,
        lowUtilizationTenantsCount: 1,
      },
      enrollmentsOverTime: [
        { date: "2026-03-01", count: 120 },
        { date: "2026-03-05", count: 180 },
        { date: "2026-03-10", count: 240 },
        { date: "2026-03-15", count: 310 },
        { date: "2026-03-20", count: 390 },
        { date: "2026-03-25", count: 420 },
        { date: "2026-03-30", count: 480 },
      ],
      topLearning: [
        { id: "crs-ai-101", title: "Commercial Office Cleaning & Sanitization Standards", type: "Course", enrollments: 1420, completions: 1108, completionRate: 78 },
        { id: "crs-cloud-201", title: "Office Pantry Room Operations & Beverage Station Care", type: "Course", enrollments: 980, completions: 823, completionRate: 84 },
        { id: "crs-lead-301", title: "Food Safety, Kitchenette Hygiene & Cross-Contamination Prevention", type: "Course", enrollments: 450, completions: 410, completionRate: 91 },
      ],
      systemHealth: {
        emailDelivery: 99.4,
        apiLatency: 42,
        database: "Operational",
        storage: "Operational",
      },
      recentActivity: [
        { id: "act-1", title: "Sarah Vance published Cleaning & Sanitization Standards", time: "10 mins ago", type: "COURSE" },
        { id: "act-2", title: "Acme Corp assigned Pantry Operations to 150 learners", time: "1 hour ago", type: "ASSIGNMENT" },
        { id: "act-3", title: "Dr. Evelyn Reed approved Food Safety Module 1", time: "3 hours ago", type: "REVIEW" },
      ]
    };

    return createMockResponse(config, {
      success: true,
      data: summaryData,
      ...summaryData,
    });
  }

  if (url.includes("/analytics") || url.includes("/dashboard") || url.includes("/statistics")) {
    return createMockResponse(config, {
      success: true,
      data: STATIC_ANALYTICS,
      analytics: STATIC_ANALYTICS,
      overview: {
        totalUsers: 14250,
        activeUsers: 8920,
        totalEnrollments: 24800,
        completionRate: 84,
        inProgressRate: 12,
        notStartedRate: 4,
        mandatoryComplianceRate: 96,
        learningHours: 48200,
      }
    });
  }

  if (url.includes("/reports") || url.includes("/report") || url.includes("/reporting")) {
    return createMockResponse(config, {
      success: true,
      data: STATIC_REPORTS,
      courseCompletion: STATIC_REPORTS.courseCompletion,
      userActivity: STATIC_REPORTS.userActivity,
    });
  }

  // -------------------------------------------------------------
  // 7. REVIEW QUEUE (Content Dev / SME)
  // -------------------------------------------------------------

  if (url.includes("/review-queue") || url.includes("/review")) {
    if (method === "GET") {
      return createMockResponse(config, {
        success: true,
        data: STATIC_REVIEW_QUEUE,
        items: STATIC_REVIEW_QUEUE,
        statistics: {
          pending: 1,
          approved: 1,
          rejected: 0,
          total: 2,
        }
      });
    }
    return createMockResponse(config, { success: true, message: "Review action submitted successfully" });
  }

  // -------------------------------------------------------------
  // 8. CERTIFICATES
  // -------------------------------------------------------------

  if (url.includes("/certificate") || url.includes("/certificates")) {
    return createMockResponse(config, {
      success: true,
      data: STATIC_CERTIFICATES,
      certificates: STATIC_CERTIFICATES,
    });
  }

  // -------------------------------------------------------------
  // 9. NOTIFICATIONS & HELP CENTER
  // -------------------------------------------------------------

  if (url.includes("/notification")) {
    return createMockResponse(config, {
      success: true,
      data: [
        { id: "notif-1", title: "New Course Enrolled", message: "You have been enrolled in Commercial Office Cleaning & Sanitization Standards.", read: false, createdAt: "2 hours ago" },
        { id: "notif-2", title: "Certificate Ready", message: "Your certificate for Office Pantry Room Operations is ready to view.", read: true, createdAt: "1 day ago" },
      ],
      unreadCount: 1,
    });
  }

  if (url.includes("/help") || url.includes("/faq")) {
    return createMockResponse(config, {
      success: true,
      data: [
        { question: "How do I start a course?", answer: "Browse the catalog, click on any course, and click 'Start Learning'." },
        { question: "How do I switch roles in this demo?", answer: "Log in with any of the static emails provided on the login page." },
      ]
    });
  }

  // Profile data
  if (url.includes("/profile") || url.includes("/user/profile")) {
    let currentUser: any = null;
    try {
      const stored = localStorage.getItem("static_current_user");
      if (stored) currentUser = JSON.parse(stored);
    } catch {}

    const profile = currentUser || STATIC_ACCOUNTS["superadmin@nexus.org"];
    return createMockResponse(config, {
      success: true,
      data: profile,
      profile,
      user: profile,
    });
  }

  // -------------------------------------------------------------
  // 10. DEFAULT CATCH-ALL SAFE MOCK
  // -------------------------------------------------------------
  return createMockResponse(config, {
    success: true,
    message: "Operation completed (Static Wireframe Mode)",
    data: [],
  });
}

/**
 * Attaches the static mock interceptor to any Axios instance.
 */
export function attachMockAdapter(axiosInstance: AxiosInstance): void {
  // Override adapter to handle all requests directly in-memory without network socket
  axiosInstance.defaults.adapter = async (config) => {
    return handleMockRequest(config);
  };
}
