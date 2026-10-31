import { Loader2 } from "lucide-react";
import { Routes, Route, Navigate, useLocation } from "react-router";
import { useAuthStore } from "../core/auth/auth.store";
import { useUserStore } from "../store/user.store";
import { RoleRoute } from "./role.route";
import { PermissionRoute } from "./permission.route";
import { ProtectedRoute } from "./protected.route";
import React, { lazy, Suspense } from "react";

// Auth Pages
const LoginPage = lazy(() => import("../components/common/login/Loginpage"));
const AdminLoginPage = lazy(() => import("../components/common/login/AdminLoginPage"));
const Register = lazy(() => import("../components/common/registration/Register"));
const OtpVerify = lazy(() => import("../components/common/otp/OtpVerify"));
const RegisterVerifyOtp = lazy(() => import("../components/common/otp/RegisterVerifyOtp"));

// Profile & Common
const ProfileData = lazy(() => import("../components/common/profile/ProfileData"));
const DeleteYourAccount = lazy(() => import("../components/common/delete/Deleteyouraccount"));
const ProfileDeleteOtpVerify = lazy(() => import("../components/common/delete/ProfileDeleteOtpVerify"));
const CertificateNameVerifyOtp = lazy(() => import("../components/common/otp/CertificateNameVerifyOtp"));
const SessionHistory = lazy(() => import("../components/common/sessionhistory"));
const Notifications = lazy(() => import("../pages/Notification/Notification"));
const Setting = lazy(() => import("../pages/Member/Setting"));

// Layouts
const VisitorLayout = lazy(() => import("../layouts/VisitorLayout").then(m => ({ default: m.VisitorLayout })));
const MemberLayout = lazy(() => import("../layouts/MemberLayout").then(m => ({ default: m.MemberLayout })));
const ContentDeveloperLayout = lazy(() => import("../layouts/ContentDeveloperLayout").then(m => ({ default: m.ContentDeveloperLayout })));
const SubjectMatterLayout = lazy(() => import("../layouts/SubjectMatterLayout").then(m => ({ default: m.SubjectMatterLayout })));
const SystemEngineerLayout = lazy(() => import("../layouts/SystemEngineerLayout").then(m => ({ default: m.SystemEngineerLayout })));
const SuperAdminLayout = lazy(() => import("../layouts/SuperAdminLayout").then(m => ({ default: m.SuperAdminLayout })));
const AdminLayout = lazy(() => import("../layouts/AdminLayout").then(m => ({ default: m.AdminLayout })));

// Dashboards
const VisitorDashboard = lazy(() => import("../pages/Visitor/VisitorDashboard"));
const MemberDashboard = lazy(() => import("../pages/Member/MemberDashboard"));
const UserDashboard = lazy(() => import("../pages/User/UserDashboard"));
const ContentDeveloperDashboard = lazy(() => import("../pages/ContentDeveloper/ContentDeveloperDashboard"));
const SubjectMatterDashboard = lazy(() => import("../pages/SubjectMatter/SubjectMatterDashboard"));
const SubjectMatterReviewQueue = lazy(() => import("../pages/SubjectMatter/SubjectMatterReviewQueue"));
const SuperAdminDashboard = lazy(() => import("../pages/SuperAdmin/SuperAdminDashboard"));
const NotificationSchedules = lazy(() => import("../pages/SuperAdmin/NotificationSchedules"));
const BroadcastNotification = lazy(() => import("../pages/SuperAdmin/BroadcastNotification"));
const AdminDashboard = lazy(() => import("../pages/Admin/AdminDashboard"));
const SupportAuditLog = lazy(() => import("../pages/Support/SupportAuditLog"));
const SupportUser = lazy(() => import("../pages/Support/supportUser"));
const SupportDashboard = lazy(() => import("../pages/Support/supportDashboard"));
const SupportPlatform = lazy(() => import("../pages/Support/SupportPlatform"));
const SupportSetting = lazy(() => import("../pages/Support/SupportSetting"));

// Super Admin Pages
const AdminCreate = lazy(() => import("../pages/SuperAdmin/AdminCreate"));
const CreateTenant = lazy(() => import("../pages/SuperAdmin/Tenant/CreateTenant"));
const CorporateManagement = lazy(() => import("../pages/SuperAdmin/Tenant/CorporateManagement"));
const CorporateTenantDetails = lazy(() => import("../pages/SuperAdmin/Tenant/CorporateTenantDetails"));
const RoleCreate = lazy(() => import("../pages/SuperAdmin/roleCreate"));
const RolesPermissions = lazy(() => import("../pages/SuperAdmin/RolesPermissions"));
const CreateTags = lazy(() => import("../pages/SuperAdmin/CreateTags"));
const CreateSubjects = lazy(() => import("../pages/SuperAdmin/CreateSubjects"));
const CreateSkills = lazy(() => import("../pages/SuperAdmin/CreateSkills"));
const CreateCategories = lazy(() => import("../pages/SuperAdmin/CreateCategories"));
const FieldOfStudy = lazy(() => import("../pages/SuperAdmin/FieldOfStudy"));
const CreateCourse = lazy(() => import("../pages/SuperAdmin/CreateCourse"));
const MyCourse = lazy(() => import("../pages/SuperAdmin/MyCourse"));
const AdminCourses = lazy(() => import("../pages/SuperAdmin/AdminCourses"));
const AdminUserManagement = lazy(() => import("../pages/SuperAdmin/AdminUserManagement"));
const AdminDetailView = lazy(() => import("../pages/SuperAdmin/AdminDetailView"));
const UserDetailView = lazy(() => import("../pages/SuperAdmin/UserDetailView"));
const DeletionQueue = lazy(() => import("../pages/SuperAdmin/DeletionQueue"));
const AdminResetPassword = lazy(() => import("../pages/SuperAdmin/AdminResetPassword"));
const AdminCareerPathEdit = lazy(() => import("../pages/Admin/AdminCareerPathEdit"));
const AdminCourseVersionHistory = lazy(() => import("../pages/Admin/AdminCourseVersionHistory"));
const Industry = lazy(() => import("../pages/SuperAdmin/Industry"));
const StandaloneCourseLessonAdded = lazy(() => import("../pages/SuperAdmin/StandaloneCourseLessonAdded"));
const StandaloneLesson = lazy(() => import("../pages/SuperAdmin/StandaloneLesson"));
const CourseBuilderLessons = lazy(() => import("../pages/SuperAdmin/CourseBuilderLessons"));
const UserManagementDashboard = lazy(() => import("../pages/SuperAdmin/UserManagementDashboard"));
const DataManagementDashboard = lazy(() => import("../pages/SuperAdmin/DataManagementDashboard"));
const LearningCredentials = lazy(() => import("../pages/SuperAdmin/LearningCredentials"));
const CertificateDesign = lazy(() => import("../pages/SuperAdmin/CertificateDesign"));
const SuperadminSetting = lazy(() => import("../pages/SuperAdmin/superadminSetting"));
const AdminAuditLog = lazy(() => import("../pages/SuperAdmin/AdminAuditLog"));

// Admin Pages
const CreateGroups = lazy(() => import("../pages/Admin/CreateGroup"));
const ManageRoles = lazy(() => import("../pages/Admin/Teams"));
const CourseAssignment = lazy(() => import("../pages/Admin/CourseAssignment"));
const CreateTenantUser = lazy(() => import("../pages/Admin/CreateTenantUser"));
const TenantConfiguration = lazy(() => import("../pages/Admin/TenantConfiguration"));
const BulkActions = lazy(() => import("../pages/Admin/BulkActions"));
const AdminSettings = lazy(() => import("../pages/Admin/AdminSettings"));
const AdminLearningPaths = lazy(() => import("../pages/SuperAdmin/AdminLearningPaths"));

// Member Pages
const MemberLearning = lazy(() => import("../pages/Member/MemberLearning"));
const MyLearning = lazy(() => import("../pages/Member/MyLearning"));
const CareerPath = lazy(() => import("../pages/Member/CareerPath"));
const Certificates = lazy(() => import("../pages/Member/Certificates"));
const Completed = lazy(() => import("../pages/Member/Completed"));
const CourseCompletedProofDetail = lazy(() => import("../pages/Member/CourseCompletedProofDetail"));
const CourseDetails = lazy(() => import("../pages/Member/CourseDetails"));
const CoursePlayer = lazy(() => import("../pages/Member/CoursePlayer"));
const CourseResources = lazy(() => import("../pages/Member/CourseResources"));
const SubmitIdea = lazy(() => import("../pages/Member/SubmitIdea"));
const HelpCenter = lazy(() => import("../pages/Member/HelpCenter"));
const IssueReporting = lazy(() => import("../pages/Member/IssueReporting"));
const StandaloneLibrary = lazy(() => import("../pages/Member/StandaloneLibrary"));
const Wishlist = lazy(() => import("../pages/Member/Wishlist"));
const QuizStartWarning = lazy(() => import("../pages/Member/QuizStartWarning"));
const Quiz = lazy(() => import("../pages/Member/Quiz"));
const QuizResult = lazy(() => import("../pages/Member/QuizResult"));
const CompleteProfile = lazy(() => import("../pages/Member/CompleteProfile"));
const ShareModal = lazy(() => import("../pages/Member/ShareModal"));

// Admin Reports & Heavy Pages
const Report = lazy(() => import("../pages/Admin/Report"));
const CourseDetail = lazy(() => import("../pages/Admin/CourseDetail"));
const LicenseUtilization = lazy(() => import("../pages/Admin/LicenseUtilization"));
const SuperAdminReport = lazy(() => import("../pages/SuperAdmin/SuperAdminReport").then(m => ({ default: m.SuperAdminReport })));
const CourseCompletionReport = lazy(() => import("../pages/SuperAdmin/Reports/CourseCompletionReport").then(m => ({ default: m.CourseCompletionReport })));
const UserReport = lazy(() => import("../pages/SuperAdmin/Reports/UserReport").then(m => ({ default: m.UserReport })));
const QuizReport = lazy(() => import("../pages/SuperAdmin/Reports/QuizReport").then(m => ({ default: m.QuizReport })));
const LearningCredentialReport = lazy(() => import("../pages/SuperAdmin/Reports/LearningCredentialReport").then(m => ({ default: m.LearningCredentialReport })));
const CorporateTenantReport = lazy(() => import("../pages/SuperAdmin/Reports/CorporateTenantReport").then(m => ({ default: m.CorporateTenantReport })));
const AdminActivityReport = lazy(() => import("../pages/SuperAdmin/Reports/AdminActivityReport").then(m => ({ default: m.AdminActivityReport })));
const FeedbackIssueReport = lazy(() => import("../pages/SuperAdmin/Reports/FeedbackIssueReport").then(m => ({ default: m.FeedbackIssueReport })));
const SystemReport = lazy(() => import("../pages/SuperAdmin/Reports/SystemReport").then(m => ({ default: m.SystemReport })));


// Content Developer Pages
const ContentDeveloperMyCertificate = lazy(() => import("../pages/ContentDeveloper/ContentDeveloverMyCertificate"));
const ContentDeveloperSetting = lazy(() => import("../pages/ContentDeveloper/ContentDeveloperSetting"));
const ContentDeveloperFeedbackResolution = lazy(() => import("../pages/ContentDeveloper/ContentDeveloperFeedbackResolution"));
const ContentDeveloperCourseOverview = lazy(() => import("../pages/ContentDeveloper/ContentDeveloperCourseOverview"));
const ContentDeveloperCoursePreview = lazy(() => import("../pages/ContentDeveloper/ContentDeveloperCoursePreview"));
const ContentDeveloperReports = lazy(() => import("../pages/ContentDeveloper/ContentDeveloperReports"));
const ContentDeveloperPathBuilder = lazy(() => import("../pages/ContentDeveloper/ContentDeveloperPathBuilder"));
const CertificateVerification = lazy(() => import("../pages/Public/CertificateVerification"));
const PublicCertificatePreview = lazy(() => import("../pages/Public/PublicCertificatePreview"));
const PublicSharePreview = lazy(() => import("../pages/Public/PublicSharePreview"));

// SME Pages
const SubjectMatterReview = lazy(() => import("../pages/SubjectMatter/SubjectMatterReview"));
const SubjectMatterReports = lazy(() => import("../pages/SubjectMatter/SubjectMatterReports"));
const SubjectMatterSetting = lazy(() => import("../pages/SubjectMatter/SubjectMatterSetting"));


import { getDashboardPath } from "./utils";
const getSettingsComponent = (role: string) => {
    switch (role) {
        case "CONTENT_DEVELOPER": return <ContentDeveloperSetting />;
        case "SME": return <SubjectMatterSetting />;
        case "SYSTEM_SUPPORT_ENGINEER":
        case "SYSTEM_ENGINEER": return <SupportSetting />;
        case "CORPORATE_ADMIN":
        case "CORPORATEADMIN":
        case "ADMIN": return <AdminSettings />;
        default: return <Setting />;
    }
};

export const AppRoutes = () => {
    const { status, role } = useAuthStore();
    const { user } = useUserStore();
    const normalizedRole = role?.toUpperCase() || "";
    const location = useLocation();
    const needsProfileCompletion = user?.isFirstLogin === true;

    const skipProfileCompletion = localStorage.getItem(`skip_complete_profile_${user?.id}`) === "true" || localStorage.getItem("skip_complete_profile") === "true";

    const lastRole = localStorage.getItem('last_role') || "";
    const isLastRoleAdmin = ["CONTENT_DEVELOPER", "SME", "SYSTEM_SUPPORT_ENGINEER", "CORPORATE_ADMIN", "SUPER_ADMIN"].includes(lastRole.toUpperCase());
    const fallbackAuthPath = isLastRoleAdmin ? "/admin/login" : "/login";

    const dashboardPath = getDashboardPath(normalizedRole);

    React.useEffect(() => {
        if (status && normalizedRole) {
            const preventBack = () => {
                window.history.pushState(null, "", window.location.href);
            };

            window.addEventListener("popstate", preventBack);
            window.history.pushState(null, "", window.location.href);

            return () => window.removeEventListener("popstate", preventBack);
        }
    }, [status, normalizedRole]);

    if (status && needsProfileCompletion && !skipProfileCompletion && (normalizedRole === "MEMBER" || normalizedRole === "CORPORATE_USER") && location.pathname !== "/complete-profile") {
        return <Navigate to="/complete-profile" replace />;
    }

    return (
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-[var(--paper)]"><Loader2 className="h-10 w-10 animate-spin text-[var(--ink-mute)]" /></div>}>
        <Routes>
            {/* Always-accessible Public Share & Verification Routes */}
            <Route path="/courses/share/:token" element={<PublicSharePreview type="course" />} />
            <Route path="/lessons/share/:token" element={<PublicSharePreview type="lesson" />} />
            <Route path="/career-paths/share/:token" element={<PublicSharePreview type="career-path" />} />
            <Route path="/certificate/public/:token" element={<PublicCertificatePreview />} />
            <Route path="/verify" element={<CertificateVerification />} />
            <Route path="/verify/:serialNumber" element={<CertificateVerification />} />

            {status ? (
                <>
                    {/* Common Protected Routes Wrapper with Role Layout */}
                    <Route path="/profile" element={<ProtectedRoute><RoleRoute>{getLayout(normalizedRole, <ProfileData />)}</RoleRoute></ProtectedRoute>} />
                    <Route path="/profile/delete" element={<ProtectedRoute><RoleRoute>{getLayout(normalizedRole, <DeleteYourAccount />)}</RoleRoute></ProtectedRoute>} />
                    <Route path="/profile/delete/verify" element={<ProtectedRoute><RoleRoute>{getLayout(normalizedRole, <ProfileDeleteOtpVerify />)}</RoleRoute></ProtectedRoute>} />
                    <Route path="/certificate-name-verify-otp" element={<ProtectedRoute><RoleRoute>{getLayout(normalizedRole, <CertificateNameVerifyOtp />)}</RoleRoute></ProtectedRoute>} />
                    <Route path="/session-history" element={<ProtectedRoute><RoleRoute>{getLayout(normalizedRole, <SessionHistory />)}</RoleRoute></ProtectedRoute>} />
                    <Route path="/notifications" element={<ProtectedRoute><RoleRoute>{getLayout(normalizedRole, <Notifications />)}</RoleRoute></ProtectedRoute>} />
                    <Route path="/settings" element={<ProtectedRoute><RoleRoute>{getLayout(normalizedRole, getSettingsComponent(normalizedRole))}</RoleRoute></ProtectedRoute>} />
                    {/* Temporarily disabled - Submit an idea (uncomment to restore)
                    <Route path="/submit-idea" element={<ProtectedRoute><RoleRoute>{getLayout(normalizedRole, <SubmitIdea />)}</RoleRoute></ProtectedRoute>} />
                    */}
                    <Route path="/help" element={<ProtectedRoute><RoleRoute>{getLayout(normalizedRole, <HelpCenter />)}</RoleRoute></ProtectedRoute>} />
                    <Route path="/issue-reporting" element={<ProtectedRoute><RoleRoute>{getLayout(normalizedRole, <IssueReporting />)}</RoleRoute></ProtectedRoute>} />
                    <Route path="/complete-profile" element={<ProtectedRoute><RoleRoute><CompleteProfile /></RoleRoute></ProtectedRoute>} />
                    <Route path="/certificate" element={<ProtectedRoute><RoleRoute>{getLayout(normalizedRole, <Completed />)}</RoleRoute></ProtectedRoute>} />
                    <Route path="/certificate-detail" element={<ProtectedRoute><RoleRoute>{getLayout(normalizedRole, <Certificates />)}</RoleRoute></ProtectedRoute>} />
                    <Route path="/catalog" element={<ProtectedRoute><RoleRoute>{getLayout(normalizedRole, <MemberLearning />)}</RoleRoute></ProtectedRoute>} />
                    <Route path="/browse" element={<ProtectedRoute><RoleRoute>{getLayout(normalizedRole, <MemberLearning />)}</RoleRoute></ProtectedRoute>} />
                    <Route path="/admin/system-settings" element={<ProtectedRoute><RoleRoute>{getLayout(normalizedRole || "SUPER_ADMIN", <SuperadminSetting />)}</RoleRoute></ProtectedRoute>} />
                    <Route path="/share-modal" element={<ProtectedRoute><RoleRoute>{getLayout(normalizedRole, <ShareModal />)}</RoleRoute></ProtectedRoute>} />

                    <Route path="/" element={<Navigate to={dashboardPath} replace />} />

                    {/* Redirect logged-in users away from auth pages */}
                    <Route path="/login" element={<Navigate to={dashboardPath} replace />} />
                    <Route path="/admin/login" element={<Navigate to={dashboardPath} replace />} />
                    <Route path="/register" element={<Navigate to={dashboardPath} replace />} />
                    <Route path="/otp-verify" element={<Navigate to={dashboardPath} replace />} />
                    <Route path="/register-verify-otp" element={<Navigate to={dashboardPath} replace />} />


                    {/* Dashboards */}
                    <Route path="/visitor-dashboard" element={<ProtectedRoute><RoleRoute>{getLayout("VISITOR", <VisitorDashboard />)}</RoleRoute></ProtectedRoute>} />
                    <Route path="/member-dashboard" element={<ProtectedRoute><RoleRoute>{(normalizedRole === "CORPORATE_USER" || normalizedRole === "CORPORATEUSER" || normalizedRole === "USER") ? getLayout("CORPORATE_USER", <UserDashboard />) : getLayout("MEMBER", <MemberDashboard />)}</RoleRoute></ProtectedRoute>} />
                    <Route path="/content-developer-dashboard" element={<ProtectedRoute><RoleRoute>{getLayout("CONTENT_DEVELOPER", <ContentDeveloperDashboard />)}</RoleRoute></ProtectedRoute>} />
                    <Route path="/sme-dashboard" element={<ProtectedRoute><RoleRoute>{getLayout("SME", <SubjectMatterDashboard />)}</RoleRoute></ProtectedRoute>} />
                    <Route path="/super-admin-dashboard" element={<ProtectedRoute><RoleRoute>{getLayout("SUPER_ADMIN", <SuperAdminDashboard />)}</RoleRoute></ProtectedRoute>} />
                    <Route path="/super-admin-dashboard/notification-schedules" element={<ProtectedRoute><RoleRoute>{getLayout("SUPER_ADMIN", <NotificationSchedules />)}</RoleRoute></ProtectedRoute>} />
                    <Route path="/super-admin-dashboard/broadcast-notification" element={<ProtectedRoute><RoleRoute>{getLayout("SUPER_ADMIN", <BroadcastNotification />)}</RoleRoute></ProtectedRoute>} />
                    <Route path="/corporate-user-dashboard" element={<Navigate to="/member-dashboard" replace />} />
                    <Route path="/user-dashboard" element={<Navigate to="/member-dashboard" replace />} />
                    <Route path="/corporate-admin-dashboard" element={<Navigate to="/super-admin-dashboard" replace />} />
                    <Route path="/support" element={<ProtectedRoute><RoleRoute>{getLayout("SYSTEM_SUPPORT_ENGINEER", <SupportDashboard />)}</RoleRoute></ProtectedRoute>} />
                    <Route path="/support-dashboard" element={<ProtectedRoute><RoleRoute>{getLayout("SYSTEM_SUPPORT_ENGINEER", <SupportDashboard />)}</RoleRoute></ProtectedRoute>} />
                    <Route path="/support/resolved" element={<ProtectedRoute><RoleRoute>{getLayout("SYSTEM_SUPPORT_ENGINEER", <SupportDashboard />)}</RoleRoute></ProtectedRoute>} />
                    <Route path="/support/users" element={<ProtectedRoute><RoleRoute>{getLayout("SYSTEM_SUPPORT_ENGINEER", <SupportUser />)}</RoleRoute></ProtectedRoute>} />
                    <Route path="/support/audit" element={<ProtectedRoute><RoleRoute>{getLayout("SYSTEM_SUPPORT_ENGINEER", <SupportAuditLog />)}</RoleRoute></ProtectedRoute>} />
                    <Route path="/support/audit-log" element={<ProtectedRoute><RoleRoute>{getLayout("SYSTEM_SUPPORT_ENGINEER", <SupportAuditLog />)}</RoleRoute></ProtectedRoute>} />
                    <Route path="/support/certificates" element={<ProtectedRoute><RoleRoute>{getLayout("SYSTEM_SUPPORT_ENGINEER", <SupportDashboard />)}</RoleRoute></ProtectedRoute>} />
                    <Route path="/support/platform" element={<ProtectedRoute><RoleRoute>{getLayout("SYSTEM_SUPPORT_ENGINEER", <SupportPlatform />)}</RoleRoute></ProtectedRoute>} />
                    <Route path="/support/platform-status" element={<ProtectedRoute><RoleRoute>{getLayout("SYSTEM_SUPPORT_ENGINEER", <SupportPlatform />)}</RoleRoute></ProtectedRoute>} />

                    <Route path="/roles-permissions" element={<ProtectedRoute><PermissionRoute requiredPermission="ROLE.VIEW">{getLayout(normalizedRole, <RolesPermissions />)}</PermissionRoute></ProtectedRoute>} />
                    <Route path="/admin/roles-permissions" element={<ProtectedRoute><PermissionRoute requiredPermission="ROLE.VIEW">{getLayout(normalizedRole, <RolesPermissions />)}</PermissionRoute></ProtectedRoute>} />
                    <Route path="/create-course" element={<ProtectedRoute><PermissionRoute requiredPermission="COURSE.CREATE">{getLayout(normalizedRole, <CreateCourse />)}</PermissionRoute></ProtectedRoute>} />

                    {/* Super Admin Extra Routes */}
                    {normalizedRole === "SUPER_ADMIN" && (
                        <>
                            <Route path="/admin-create" element={<ProtectedRoute><RoleRoute>{getLayout("SUPER_ADMIN", <AdminCreate />)}</RoleRoute></ProtectedRoute>} />
                            <Route path="/create-tenant" element={<ProtectedRoute><RoleRoute>{getLayout("SUPER_ADMIN", <CreateTenant />)}</RoleRoute></ProtectedRoute>} />
                            <Route path="/role-create" element={<ProtectedRoute><RoleRoute>{getLayout("SUPER_ADMIN", <RoleCreate />)}</RoleRoute></ProtectedRoute>} />
                            <Route path="/create-tags" element={<ProtectedRoute><RoleRoute>{getLayout("SUPER_ADMIN", <CreateTags />)}</RoleRoute></ProtectedRoute>} />
                            <Route path="/create-subjects" element={<ProtectedRoute><RoleRoute>{getLayout("SUPER_ADMIN", <CreateSubjects />)}</RoleRoute></ProtectedRoute>} />
                            <Route path="/create-skills" element={<ProtectedRoute><RoleRoute>{getLayout("SUPER_ADMIN", <CreateSkills />)}</RoleRoute></ProtectedRoute>} />
                            <Route path="/create-categories" element={<ProtectedRoute><RoleRoute>{getLayout("SUPER_ADMIN", <CreateCategories />)}</RoleRoute></ProtectedRoute>} />
                            <Route path="/create-field-of-study" element={<ProtectedRoute><RoleRoute>{getLayout("SUPER_ADMIN", <FieldOfStudy />)}</RoleRoute></ProtectedRoute>} />
                            <Route path="/corporate-management" element={<Navigate to="/super-admin-dashboard" replace />} />
                            <Route path="/corporate-tenant-details/:id" element={<Navigate to="/super-admin-dashboard" replace />} />
                            <Route path="/admin/courses" element={<ProtectedRoute><RoleRoute>{getLayout("SUPER_ADMIN", <AdminCourses><MyCourse /></AdminCourses>)}</RoleRoute></ProtectedRoute>} />
                            <Route path="/admin/courses/:courseId/edit" element={<ProtectedRoute><RoleRoute>{getLayout("SUPER_ADMIN", <CreateCourse />)}</RoleRoute></ProtectedRoute>} />
                            <Route path="/my-course" element={<ProtectedRoute><RoleRoute>{getLayout("SUPER_ADMIN", <MyCourse />)}</RoleRoute></ProtectedRoute>} />
                            <Route path="/admin-user-management" element={<ProtectedRoute><RoleRoute>{getLayout("SUPER_ADMIN", <AdminUserManagement />)}</RoleRoute></ProtectedRoute>} />
                            <Route path="/admin-user-details/:id" element={<ProtectedRoute><RoleRoute>{getLayout("SUPER_ADMIN", <AdminDetailView />)}</RoleRoute></ProtectedRoute>} />
                            <Route path="/admin-reset-password" element={<ProtectedRoute><RoleRoute>{getLayout("SUPER_ADMIN", <AdminResetPassword />)}</RoleRoute></ProtectedRoute>} />
                            <Route path="/super-admin/deletion-queue" element={<ProtectedRoute><RoleRoute>{getLayout("SUPER_ADMIN", <DeletionQueue />)}</RoleRoute></ProtectedRoute>} />
                            <Route path="/industry" element={<ProtectedRoute><RoleRoute>{getLayout("SUPER_ADMIN", <Industry />)}</RoleRoute></ProtectedRoute>} />
                            <Route path="/standalone-lesson" element={<ProtectedRoute><RoleRoute>{getLayout("SUPER_ADMIN", <CreateCourse />)}</RoleRoute></ProtectedRoute>} />
                            <Route path="/standalone-lesson/:lessonId" element={<ProtectedRoute><RoleRoute>{getLayout("SUPER_ADMIN", <CreateCourse />)}</RoleRoute></ProtectedRoute>} />
                            <Route path="/studio/builder/1" element={<ProtectedRoute><RoleRoute>{getLayout("SUPER_ADMIN", <CreateCourse />)}</RoleRoute></ProtectedRoute>} />
                            <Route path="/studio/builder/2" element={<ProtectedRoute><RoleRoute>{getLayout("SUPER_ADMIN", <CreateCourse />)}</RoleRoute></ProtectedRoute>} />
                            <Route path="/studio/builder/3" element={<ProtectedRoute><RoleRoute>{getLayout("SUPER_ADMIN", <CreateCourse />)}</RoleRoute></ProtectedRoute>} />
                            <Route path="/studio/builder/4" element={<ProtectedRoute><RoleRoute>{getLayout("SUPER_ADMIN", <CreateCourse />)}</RoleRoute></ProtectedRoute>} />
                            <Route path="/content-developer/course-preview/:entityType/:id" element={<ProtectedRoute><RoleRoute>{getLayout("SUPER_ADMIN", <ContentDeveloperCoursePreview />)}</RoleRoute></ProtectedRoute>} />
                            <Route path="/studio/content" element={<ProtectedRoute><RoleRoute>{getLayout("SUPER_ADMIN", <ContentDeveloperCourseOverview />)}</RoleRoute></ProtectedRoute>} />
                            <Route path="/user-management-dashboard" element={<ProtectedRoute><RoleRoute>{getLayout("SUPER_ADMIN", <UserManagementDashboard />)}</RoleRoute></ProtectedRoute>} />
                            <Route path="/review-queue" element={<ProtectedRoute><RoleRoute>{getLayout("SUPER_ADMIN", <SubjectMatterReviewQueue />)}</RoleRoute></ProtectedRoute>} />
                            <Route path="/data-management" element={<ProtectedRoute><RoleRoute>{getLayout("SUPER_ADMIN", <DataManagementDashboard />)}</RoleRoute></ProtectedRoute>} />
                            <Route path="/audit-logs" element={<ProtectedRoute><RoleRoute>{getLayout("SUPER_ADMIN", <AdminAuditLog />)}</RoleRoute></ProtectedRoute>} />
                            <Route path="/sme-review" element={<ProtectedRoute><RoleRoute>{getLayout("SUPER_ADMIN", <SubjectMatterReview />)}</RoleRoute></ProtectedRoute>} />
                            <Route path="/sme/review" element={<ProtectedRoute><RoleRoute>{getLayout("SUPER_ADMIN", <SubjectMatterReview />)}</RoleRoute></ProtectedRoute>} />

                            <Route path="/standalone-course-lesson-added" element={<ProtectedRoute><RoleRoute>{getLayout("SUPER_ADMIN", <StandaloneCourseLessonAdded />)}</RoleRoute></ProtectedRoute>} />
                            <Route path="/Course-Builder-Lessons" element={<ProtectedRoute><RoleRoute>{getLayout("SUPER_ADMIN", <CourseBuilderLessons publishType="standalone-course" lessons={[]} onAdd={(lessonType) => { console.log("Add:", lessonType); }} onEdit={(lesson) => {
                                console.log("Edit:", lesson);
                            }}
                                onDelete={(lessonId) => {
                                    console.log("Delete:", lessonId);
                                }}
                            />
                            )}
                            </RoleRoute>
                            </ProtectedRoute>
                            }
                            />

                            <Route path="/admin/learning-paths" element={<ProtectedRoute><RoleRoute>{getLayout("SUPER_ADMIN", <AdminCourses><AdminLearningPaths /></AdminCourses>)}</RoleRoute></ProtectedRoute>} />
                            <Route path="/admin/certificates" element={<ProtectedRoute><RoleRoute>{getLayout("SUPER_ADMIN", <AdminCourses><LearningCredentials /></AdminCourses>)}</RoleRoute></ProtectedRoute>} />
                            <Route path="/admin/certificate-settings" element={<ProtectedRoute><RoleRoute>{getLayout("SUPER_ADMIN", <AdminCourses><CertificateDesign /></AdminCourses>)}</RoleRoute></ProtectedRoute>} />
                            <Route path="/admin/learning-paths/create" element={<ProtectedRoute><RoleRoute>{getLayout("SUPER_ADMIN", <ContentDeveloperPathBuilder />)}</RoleRoute></ProtectedRoute>} />
                            <Route path="/studio/path-builder" element={<ProtectedRoute><RoleRoute>{getLayout("SUPER_ADMIN", <ContentDeveloperPathBuilder />)}</RoleRoute></ProtectedRoute>} />
                            <Route path="/studio/path-builder/:pathId" element={<ProtectedRoute><RoleRoute>{getLayout("SUPER_ADMIN", <ContentDeveloperPathBuilder />)}</RoleRoute></ProtectedRoute>} />
                            <Route path="/admin/career-paths/:pathId/edit" element={<ProtectedRoute><RoleRoute>{getLayout("SUPER_ADMIN", <ContentDeveloperPathBuilder />)}</RoleRoute></ProtectedRoute>} />
                            <Route path="/admin/course-version-history" element={<ProtectedRoute><RoleRoute>{getLayout("SUPER_ADMIN", <AdminCourseVersionHistory />)}</RoleRoute></ProtectedRoute>} />
                            <Route path="/admin/reports" element={<ProtectedRoute><RoleRoute>{getLayout("SUPER_ADMIN", <SuperAdminReport />)}</RoleRoute></ProtectedRoute>} />
                            <Route path="/admin/reports/course-completion" element={<ProtectedRoute><RoleRoute>{getLayout("SUPER_ADMIN", <CourseCompletionReport />)}</RoleRoute></ProtectedRoute>} />
                            <Route path="/admin/reports/user-report" element={<ProtectedRoute><RoleRoute>{getLayout("SUPER_ADMIN", <UserReport />)}</RoleRoute></ProtectedRoute>} />
                            <Route path="/admin/reports/quiz-report" element={<ProtectedRoute><RoleRoute>{getLayout("SUPER_ADMIN", <QuizReport />)}</RoleRoute></ProtectedRoute>} />
                            <Route path="/admin/reports/learning-credentials" element={<ProtectedRoute><RoleRoute>{getLayout("SUPER_ADMIN", <LearningCredentialReport />)}</RoleRoute></ProtectedRoute>} />
                            <Route path="/admin/reports/corporate-tenants" element={<Navigate to="/admin/reports" replace />} />
                            <Route path="/admin/reports/admin-activity" element={<ProtectedRoute><RoleRoute>{getLayout("SUPER_ADMIN", <AdminActivityReport />)}</RoleRoute></ProtectedRoute>} />
                            <Route path="/admin/reports/feedback-issues" element={<ProtectedRoute><RoleRoute>{getLayout("SUPER_ADMIN", <FeedbackIssueReport />)}</RoleRoute></ProtectedRoute>} />
                            <Route path="/admin/reports/system" element={<ProtectedRoute><RoleRoute>{getLayout("SUPER_ADMIN", <SystemReport />)}</RoleRoute></ProtectedRoute>} />
                            <Route path="/admin/system-settings" element={<ProtectedRoute><RoleRoute>{getLayout("SUPER_ADMIN", <SuperadminSetting />)}</RoleRoute></ProtectedRoute>} />
                        </>
                    )}

                    {/* Member Routes */}
                    {normalizedRole === "MEMBER" && (
                        <>
                            <Route path="/member-learning" element={<ProtectedRoute><RoleRoute>{getLayout("MEMBER", <MemberLearning />)}</RoleRoute></ProtectedRoute>} />
                            <Route path="/my-learning" element={<ProtectedRoute><RoleRoute>{getLayout("MEMBER", <MyLearning />)}</RoleRoute></ProtectedRoute>} />
                            <Route path="/member-library" element={<ProtectedRoute><RoleRoute>{getLayout("MEMBER", <StandaloneLibrary />)}</RoleRoute></ProtectedRoute>} />
                            <Route path="/career-path" element={<MemberLayout><CareerPath /></MemberLayout>} />
                            <Route path="/course-completed" element={<MemberLayout><Completed /></MemberLayout>} />
                            <Route path="/certificate-detail" element={<MemberLayout><Certificates /></MemberLayout>} />
                            <Route path="/course-completed-proof-detail" element={<MemberLayout><CourseCompletedProofDetail /></MemberLayout>} />
                            <Route path="/course-details" element={<ProtectedRoute><RoleRoute>{getLayout("MEMBER", <CourseDetails />)}</RoleRoute></ProtectedRoute>} />
                            <Route path="/course-player" element={<ProtectedRoute><RoleRoute>{getLayout("MEMBER", <CoursePlayer />)}</RoleRoute></ProtectedRoute>} />
                            <Route path="/course-resources" element={<ProtectedRoute><RoleRoute>{getLayout("MEMBER", <CourseResources />)}</RoleRoute></ProtectedRoute>} />
                            <Route path="/wishlist" element={<ProtectedRoute><RoleRoute>{getLayout("MEMBER", <Wishlist />)}</RoleRoute></ProtectedRoute>} />
                            <Route path="/settings" element={<ProtectedRoute><RoleRoute>{getLayout("MEMBER", <Setting />)}</RoleRoute></ProtectedRoute>} />

                        </>
                    )}

                    {/* Content Developer Routes */}
                    {normalizedRole === "CONTENT_DEVELOPER" && (
                        <>
                            <Route path="/studio" element={<ProtectedRoute><RoleRoute>{getLayout("CONTENT_DEVELOPER", <ContentDeveloperDashboard />)}</RoleRoute></ProtectedRoute>} />
                            {/* Backward-compat redirect: old dashboard URL → /studio */}
                            <Route path="/content-developer-dashboard" element={<Navigate to="/studio" replace />} />
                            <Route path="/studio/content" element={<ProtectedRoute><RoleRoute>{getLayout("CONTENT_DEVELOPER", <ContentDeveloperCourseOverview />)}</RoleRoute></ProtectedRoute>} />
                            <Route path="/studio/content/:entityType/:id" element={<ProtectedRoute><RoleRoute>{getLayout("CONTENT_DEVELOPER", <ContentDeveloperCourseOverview />)}</RoleRoute></ProtectedRoute>} />
                            <Route path="/studio/content/:id" element={<ProtectedRoute><RoleRoute>{getLayout("CONTENT_DEVELOPER", <ContentDeveloperCourseOverview />)}</RoleRoute></ProtectedRoute>} />
                            {/* Drafts and Published routes: render ContentDeveloperDashboard with active filter */}
                            <Route path="/studio/drafts" element={<ProtectedRoute><RoleRoute>{getLayout("CONTENT_DEVELOPER", <ContentDeveloperDashboard />)}</RoleRoute></ProtectedRoute>} />
                            <Route path="/studio/published" element={<ProtectedRoute><RoleRoute>{getLayout("CONTENT_DEVELOPER", <ContentDeveloperDashboard />)}</RoleRoute></ProtectedRoute>} />
                            <Route path="/studio/feedback" element={<ProtectedRoute><RoleRoute>{getLayout("CONTENT_DEVELOPER", <ContentDeveloperFeedbackResolution />)}</RoleRoute></ProtectedRoute>} />
                            <Route path="/studio/feedback/:entityType/:id" element={<ProtectedRoute><RoleRoute>{getLayout("CONTENT_DEVELOPER", <ContentDeveloperFeedbackResolution />)}</RoleRoute></ProtectedRoute>} />
                            <Route path="/studio/feedback/:id" element={<ProtectedRoute><RoleRoute>{getLayout("CONTENT_DEVELOPER", <ContentDeveloperFeedbackResolution />)}</RoleRoute></ProtectedRoute>} />
                            {/* Learner Q&A: reuse FeedbackResolution page with ?tab=learner */}
                            <Route path="/studio/qa" element={<ProtectedRoute><RoleRoute>{getLayout("CONTENT_DEVELOPER", <ContentDeveloperFeedbackResolution />)}</RoleRoute></ProtectedRoute>} />
                            {/* Alias: sidebar links to /studio/settings but the real settings route is /settings */}
                            <Route path="/content-developer-settings" element={<Navigate to="/settings" replace />} />
                            <Route path="/studio/settings" element={<ProtectedRoute><RoleRoute>{getLayout("CONTENT_DEVELOPER", <ContentDeveloperSetting />)}</RoleRoute></ProtectedRoute>} />
                            <Route path="/my-course" element={<ProtectedRoute><RoleRoute>{getLayout("CONTENT_DEVELOPER", <MyCourse />)}</RoleRoute></ProtectedRoute>} />
                            <Route path="/create-course" element={<ProtectedRoute><RoleRoute>{getLayout("CONTENT_DEVELOPER", <CreateCourse />)}</RoleRoute></ProtectedRoute>} />
                            <Route path="/create-course/:courseId" element={<ProtectedRoute><RoleRoute>{getLayout("CONTENT_DEVELOPER", <CreateCourse />)}</RoleRoute></ProtectedRoute>} />
                            <Route path="/studio/builder/1" element={<ProtectedRoute><RoleRoute>{getLayout("CONTENT_DEVELOPER", <CreateCourse />)}</RoleRoute></ProtectedRoute>} />
                            <Route path="/studio/builder/2" element={<ProtectedRoute><RoleRoute>{getLayout("CONTENT_DEVELOPER", <CreateCourse />)}</RoleRoute></ProtectedRoute>} />
                            <Route path="/studio/builder/3" element={<ProtectedRoute><RoleRoute>{getLayout("CONTENT_DEVELOPER", <CreateCourse />)}</RoleRoute></ProtectedRoute>} />
                            <Route path="/studio/builder/4" element={<ProtectedRoute><RoleRoute>{getLayout("CONTENT_DEVELOPER", <CreateCourse />)}</RoleRoute></ProtectedRoute>} />
                            <Route path="/studio/path-builder" element={<ProtectedRoute><RoleRoute>{getLayout("CONTENT_DEVELOPER", <ContentDeveloperPathBuilder />)}</RoleRoute></ProtectedRoute>} />
                            <Route path="/studio/path-builder/:pathId" element={<ProtectedRoute><RoleRoute>{getLayout("CONTENT_DEVELOPER", <ContentDeveloperPathBuilder />)}</RoleRoute></ProtectedRoute>} />
                            <Route path="/admin/courses/:courseId/edit" element={<ProtectedRoute><RoleRoute>{getLayout("CONTENT_DEVELOPER", <CreateCourse />)}</RoleRoute></ProtectedRoute>} />
                            <Route path="/admin/career-paths/:pathId/edit" element={<ProtectedRoute><RoleRoute>{getLayout("CONTENT_DEVELOPER", <ContentDeveloperPathBuilder />)}</RoleRoute></ProtectedRoute>} />
                            <Route path="/standalone-lesson" element={<ProtectedRoute><RoleRoute>{getLayout("CONTENT_DEVELOPER", <CreateCourse />)}</RoleRoute></ProtectedRoute>} />
                            <Route path="/standalone-lesson/:lessonId" element={<ProtectedRoute><RoleRoute>{getLayout("CONTENT_DEVELOPER", <CreateCourse />)}</RoleRoute></ProtectedRoute>} />
                            <Route path="/admin/learning-paths/edit/:careerPathId" element={<ProtectedRoute><RoleRoute>{getLayout("CONTENT_DEVELOPER", <AdminCareerPathEdit />)}</RoleRoute></ProtectedRoute>} />
                            <Route path="/cd-feedback/:courseId" element={<ProtectedRoute><RoleRoute>{getLayout("CONTENT_DEVELOPER", <ContentDeveloperFeedbackResolution />)}</RoleRoute></ProtectedRoute>} />
                            <Route path="/content-developer/feedback-resolution/:entityType/:id" element={<ProtectedRoute><RoleRoute>{getLayout("CONTENT_DEVELOPER", <ContentDeveloperFeedbackResolution />)}</RoleRoute></ProtectedRoute>} />
                            <Route path="/content-developer/feedback-resolution/:id" element={<ProtectedRoute><RoleRoute>{getLayout("CONTENT_DEVELOPER", <ContentDeveloperFeedbackResolution />)}</RoleRoute></ProtectedRoute>} />

                            <Route
                                path="/content-developer/course-overview/:entityType/:id"
                                element={
                                    <ProtectedRoute>
                                        <RoleRoute>
                                            {getLayout(
                                                "CONTENT_DEVELOPER",
                                                <ContentDeveloperCourseOverview />
                                            )}
                                        </RoleRoute>
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/content-developer/course-overview/:id"
                                element={
                                    <ProtectedRoute>
                                        <RoleRoute>
                                            {getLayout(
                                                "CONTENT_DEVELOPER",
                                                <ContentDeveloperCourseOverview />
                                            )}
                                        </RoleRoute>
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/studio/course-preview"
                                element={
                                    <ProtectedRoute>
                                        <RoleRoute>
                                            {getLayout(
                                                "CONTENT_DEVELOPER",
                                                <ContentDeveloperCoursePreview />
                                            )}
                                        </RoleRoute>
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/studio/preview"
                                element={
                                    <ProtectedRoute>
                                        <RoleRoute>
                                            {getLayout(
                                                "CONTENT_DEVELOPER",
                                                <ContentDeveloperCoursePreview />
                                            )}
                                        </RoleRoute>
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/content-developer/course-preview/:entityType/:id"
                                element={
                                    <ProtectedRoute>
                                        <RoleRoute>
                                            {getLayout(
                                                "CONTENT_DEVELOPER",
                                                <ContentDeveloperCoursePreview />
                                            )}
                                        </RoleRoute>
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/content-developer/analytics"
                                element={
                                    <ProtectedRoute>
                                        <RoleRoute>
                                            {getLayout(
                                                "CONTENT_DEVELOPER",
                                                <ContentDeveloperReports />
                                            )}
                                        </RoleRoute>
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/studio/reports"
                                element={
                                    <ProtectedRoute>
                                        <RoleRoute>
                                            {getLayout(
                                                "CONTENT_DEVELOPER",
                                                <ContentDeveloperReports />
                                            )}
                                        </RoleRoute>
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/studio/analytics"
                                element={
                                    <ProtectedRoute>
                                        <RoleRoute>
                                            {getLayout(
                                                "CONTENT_DEVELOPER",
                                                <ContentDeveloperReports />
                                            )}
                                        </RoleRoute>
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/studio/certificates"
                                element={
                                    <ProtectedRoute>
                                        <RoleRoute>
                                            {getLayout(
                                                "CONTENT_DEVELOPER",
                                                <ContentDeveloperMyCertificate />
                                            )}
                                        </RoleRoute>
                                    </ProtectedRoute>
                                }
                            />
                        </>
                    )}
                    {normalizedRole === "SME" && (
                        <>
                            <Route path="/sme-review" element={<ProtectedRoute><RoleRoute>{getLayout("SME", <SubjectMatterReview />)}</RoleRoute></ProtectedRoute>} />
                            <Route path="/sme/review" element={<ProtectedRoute><RoleRoute>{getLayout("SME", <SubjectMatterReview />)}</RoleRoute></ProtectedRoute>} />
                            <Route path="/sme/queue" element={<ProtectedRoute><RoleRoute>{getLayout("SME", <SubjectMatterReviewQueue />)}</RoleRoute></ProtectedRoute>} />
                            <Route path="/sme/review-queue" element={<ProtectedRoute><RoleRoute>{getLayout("SME", <SubjectMatterReviewQueue />)}</RoleRoute></ProtectedRoute>} />
                            <Route path="/sme/reports" element={<ProtectedRoute><RoleRoute>{getLayout("SME", <SubjectMatterReports />)}</RoleRoute></ProtectedRoute>} />
                        </>
                    )}

                    {/* Corporate User Routes */}
                    {normalizedRole === "CORPORATE_USER" && (
                        <>
                            <Route path="/course-completed" element={<MemberLayout><Certificates /></MemberLayout>} />
                            <Route path="/member-learning" element={<ProtectedRoute><RoleRoute>{getLayout("CORPORATE_USER", <MemberLearning />)}</RoleRoute></ProtectedRoute>} />
                            <Route path="/my-learning" element={<ProtectedRoute><RoleRoute>{getLayout("CORPORATE_USER", <MyLearning />)}</RoleRoute></ProtectedRoute>} />
                            <Route path="/member-library" element={<ProtectedRoute><RoleRoute>{getLayout("CORPORATE_USER", <StandaloneLibrary />)}</RoleRoute></ProtectedRoute>} />
                            <Route path="/career-path" element={<MemberLayout><CareerPath /></MemberLayout>} />
                            <Route path="/course-details" element={<ProtectedRoute><RoleRoute>{getLayout("CORPORATE_USER", <CourseDetails />)}</RoleRoute></ProtectedRoute>} />
                            <Route path="/course-player" element={<ProtectedRoute><RoleRoute>{getLayout("CORPORATE_USER", <CoursePlayer />)}</RoleRoute></ProtectedRoute>} />
                            <Route path="/wishlist" element={<ProtectedRoute><RoleRoute>{getLayout("CORPORATE_USER", <Wishlist />)}</RoleRoute></ProtectedRoute>} />

                        </>
                    )}

                    {/* Assessment & Quiz Routes */}
                    <Route path="/quiz-start-warning" element={<ProtectedRoute><RoleRoute>{getLayout(normalizedRole, <QuizStartWarning />)}</RoleRoute></ProtectedRoute>} />
                    <Route path="/quiz" element={<ProtectedRoute><RoleRoute>{getLayout(normalizedRole, <Quiz />)}</RoleRoute></ProtectedRoute>} />
                    <Route path="/quiz-result" element={<ProtectedRoute><RoleRoute>{getLayout(normalizedRole, <QuizResult />)}</RoleRoute></ProtectedRoute>} />

                    <Route path="/courses/share/:token" element={getLayout(normalizedRole, <CourseDetails />)} />

                    <Route path="*" element={<Navigate to={dashboardPath} replace />} />
                    <Route path="/content-developer-certificates" element={<ContentDeveloperLayout><ContentDeveloperMyCertificate /></ContentDeveloperLayout>} />
                    {/* <Route path="/content-developer-standalone-lesson" element={<ContentDeveloperLayout><ContentDeveloperStandardLesson /></ContentDeveloperLayout>} /> */}
                    <Route path="/content-developer/feedback-resolution" element={<ContentDeveloperLayout><ContentDeveloperFeedbackResolution /></ContentDeveloperLayout>} />
                    <Route path="/content-developer/feedback-resolution/:courseId" element={<ContentDeveloperLayout><ContentDeveloperFeedbackResolution /></ContentDeveloperLayout>} />
                    <Route path="/content-developer/feedback-resolution/:entityType/:id" element={<ContentDeveloperLayout><ContentDeveloperFeedbackResolution /></ContentDeveloperLayout>} />


                </>
            ) : (
                <>
                    {/* Unauthenticated Routes */}
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/admin/login" element={<AdminLoginPage />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/otp-verify" element={<OtpVerify />} />
                    <Route path="/register-verify-otp" element={<RegisterVerifyOtp />} />
                    <Route path="/verify" element={<CertificateVerification />} />
                    <Route path="/verify/:serialNumber" element={<CertificateVerification />} />
                    <Route path="/certificate/public/:token" element={<PublicCertificatePreview />} />
                    <Route path="/certificates/public/:token" element={<PublicCertificatePreview />} />
                    <Route path="/courses/share/:token" element={<CourseDetails />} />
                    <Route path="/course-details" element={<CourseDetails />} />
                    <Route path="/help" element={<HelpCenter />} />
                    <Route path="/admin/system-settings" element={<SuperAdminLayout><SuperadminSetting /></SuperAdminLayout>} />

                    <Route path="*" element={<Navigate to={fallbackAuthPath} replace />} />
                </>
            )}
        </Routes>
        </Suspense>
    );
};

// Layout Helper
const getLayout = (role: string, children: React.ReactNode) => {
    switch (role) {
        case "VISITOR": return <VisitorLayout>{children}</VisitorLayout>;
        case "MEMBER": return <MemberLayout>{children}</MemberLayout>;
        case "CONTENT_DEVELOPER": return <ContentDeveloperLayout>{children}</ContentDeveloperLayout>;
        case "SME": return <SubjectMatterLayout>{children}</SubjectMatterLayout>;
        case "SYSTEM_SUPPORT_ENGINEER": return <SystemEngineerLayout>{children}</SystemEngineerLayout>;
        case "SUPER_ADMIN": return <SuperAdminLayout>{children}</SuperAdminLayout>;
        case "CORPORATE_ADMIN": return <AdminLayout>{children}</AdminLayout>;
        case "CORPORATE_USER": return <MemberLayout>{children}</MemberLayout>;
        default: return <div>Role not recognized: {role}</div>;
    }
};