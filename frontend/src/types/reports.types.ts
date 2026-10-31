export interface ReportFilter {
  startDate?: string;
  endDate?: string;
  tenantId?: string;
  courseId?: string;
  userId?: string;
  roleId?: string;
  country?: string;
  categoryId?: string;
  subjectId?: string;
  action?: string;
  entityType?: string;
  days?: number;
  status?: string;
  page?: number;
  limit?: number;
  search?: string;
}

export interface DashboardMetrics {
  totalUsers: number;
  activeUsers: number;
  totalEnrollments: number;
  completedEnrollments: number;
  inProgressEnrollments: number;
  notStartedEnrollments: number;
  overallCompletionPercentage: number;
  totalCourses: number;
  subscribers: number;
  watchHours: number;
  totalTenants: number;
  supportTickets: number;
  monthlyEnrollments: Array<{ name: string; value: number; color?: string }>;
  courseCompletionDistribution: Array<{ name: string; value: number; color?: string }>;
  platformHealthScore: number;
  learningPublished?: number;
  inSmeReview?: number;
}

export interface LearnerProgressReport {
  id: string; // CourseProgress id or combined id
  userId: string;
  courseId: string;
  email: string;
  status: string;
  tenantId: string | null;
  firstName: string | null;
  lastName: string | null;
  courseTitle: string;
  progress: number;
  timeSpentSecs: number;
  role: string | null;
  createdAt: string;
}

export interface CourseAnalyticsReport {
  courseId: string;
  title: string;
  status: string;
  categoryId: string;
  totalEnrollments: number;
  completedEnrollments: number;
  inProgressEnrollments: number;
  notStartedEnrollments: number;
  completionRate: number;
  averageRating: number | null;
  avgScore: number;
  avgTime: number;
  createdAt: string;
  updatedAt?: string;
  thumbnailUrl?: string | null;
  isCareerPath?: boolean;
}

export interface MonthlyEnrollmentPoint {
  month: string;
  count: number;
}

export interface CourseEnrollmentAnalytics {
  courseId: string;
  totalEnrollments: number;
  selfEnrollments: number;
  corporateEnrollments: number;
  monthlyTrend: MonthlyEnrollmentPoint[];
}

export interface CourseCompletionAnalytics {
  courseId: string;
  totalLearners: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  completionRate: number;
  averageProgressPercent: number;
}

export interface CoursePerformanceAnalytics {
  courseId: string;
  totalLessons: number;
  averageTimeSpentSecs: number;
  lessonCompletionRate: number;
  averageQuizScore: number | null;
}

export interface AssessmentReport {
  quizId: string;
  courseId: string;
  quizTitle: string;
  courseTitle: string;
  totalAttempts: number;
  averageScore: number | null;
  passingScore: number;
  maxScore: number | null;
  passRate: number;
  status: string;
}

export interface WorkflowReport {
  workflowId: string;
  stage: string;
  status: string;
  pendingApprovals: number;
  rejectedItems: number;
  averageTurnaroundHours: number;
  slaBreaches: number;
}

export interface CertificateReport {
  certificateId: string;
  userId: string;
  userName: string;
  courseId: string;
  courseName: string;
  issueDate: string;
  tenantId: string | null;
  tenantName?: string | null;
  serialNumber: string | null;
  isRevoked?: boolean;
  isVerified?: boolean;
}

export interface FeedbackReport {
  id: string;
  type: "IDEA" | "ISSUE";
  userId: string;
  userName: string;
  title: string;
  description: string;
  status: string;
  submittedAt: string;
  courseAffected?: string;
  categoryId?: string;
}

export interface ActivityAuditReport {
  auditId: string;
  userId: string;
  userName: string;
  role: string;
  activityType: string;
  description: string;
  ipAddress: string;
  timestamp: string;
}

export interface AdminActivityReport {
  id: string;
  source: string;
  action: string;
  entityType: string;
  entityId: string | null;
  actorUserId: string | null;
  tenantId: string | null;
  outcome: string | null;
  createdAt: string;
}

export interface CorporateTenantReport {
  id: string;
  tenantName: string;
  activeLearners: number;
  licenseUtilization: number;
  avgCompletionRate: number;
  status: string;
}

export interface SystemHealthReport {
  platformHealth: number;
  uptime: number;
  apiLatency: number;
  storageUtilization: number;
  emailDeliveryRate: number;
  incidents: number;
}

export interface PaginatedReportResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
