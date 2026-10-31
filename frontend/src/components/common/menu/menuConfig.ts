// Defines which navigation items are available per role.
// Each item links to a route path used in React Router.

export type MenuItem = {
  label: string;
  path?: string;
  icon?: string; // SVG path or simple emoji fallback
  sectionHeader?: boolean;
  isLogout?: boolean;
  children?: MenuItem[];
  badge?: number; // Optional badge count
  requiredPermission?: string | string[]; // Added for Action-Level Auth
  group?: string;
  actionButton?: boolean;
};

export type RoleMenuMap = {
  [role: string]: MenuItem[];
};

export const roleMenuConfig: RoleMenuMap = {
  LEARNER: [
    { label: 'Home', path: '/learner-dashboard', icon: 'home' },
    { label: 'My Learning', path: '/my-learning', icon: 'courses', badge: 5 },
    { label: 'Assigned learning', path: '/assigned-learning', icon: 'briefcase', badge: 4 },
    { label: 'Browse', path: '/browse-courses', icon: 'database' },
    { label: 'Wishlist', path: '/wishlist', icon: 'heart', badge: 12 },
    { label: 'Completed', path: '/course-completed', icon: 'completed', badge: 5 },

    { label: 'ACCOUNT', sectionHeader: true },
    { label: 'Settings', path: '/learner-settings', icon: 'settings' },
    // Temporarily disabled - Submit an idea
    // { label: 'Submit an idea', path: '/submit-idea', icon: 'idea' },
    { label: 'Help', path: '/help', icon: 'help' },
    { label: 'Logout', path: '/login', icon: 'logout' },
  ],
  VISITOR: [
    { label: 'Dashboard', path: '/visitor-dashboard', icon: 'dashboard' },

    { label: 'ACCOUNT', sectionHeader: true },
    { label: 'Report an Issue', path: '/issue-reporting', icon: 'help' },
    { label: 'Help Center', path: '/help', icon: 'help' },
    { label: 'Logout', path: '/login', icon: 'logout' },
  ],
  MEMBER: [
    { label: 'Dashboard', path: '/member-dashboard', icon: 'dashboard' },
    { label: 'Assigned Courses', path: '/my-learning', icon: 'courses' },
    { label: 'Course Catalog', path: '/member-learning', icon: 'database' },
    { label: 'Certificates', path: '/course-completed', icon: 'completed' },
    { label: 'Training Feedback', path: '/issue-reporting', icon: 'help' },
    { label: 'Wishlist', path: '/wishlist', icon: 'heart' },
    { label: 'Profile', path: '/profile', icon: 'profile' },

    { label: 'ACCOUNT', sectionHeader: true },
    {label:"Setting",path:"/settings",icon:"settings"},
    { label: 'Session History', path: '/session-history', icon: 'settings' },
    // Temporarily disabled - Submit an idea
    // { label: 'Submit an Idea', path: '/submit-idea', icon: 'idea' },
    // { label: 'Report an Issue', path: '/issue-reporting', icon: 'help' },
    { label: 'Help Center', path: '/help', icon: 'help' },
    { label: 'Logout', path: '/login', icon: 'logout' },
  ],
  CORPORATE_USER: [],
  CONTENT_DEVELOPER: [
    { label: 'Home', path: '/studio', icon: 'dashboard' },
    { label: 'My Content', path: '/studio/content', icon: 'courses' },
    { label: 'Drafts', path: '/studio/drafts', icon: 'builder' },
    { label: 'Published', path: '/studio/published', icon: 'completed' },

    { label: 'FEEDBACK', sectionHeader: true },
    { label: 'SME Reviews', path: '/studio/feedback', icon: 'review' },

    { label: 'INSIGHTS', sectionHeader: true },
    { label: 'Analytics', path: '/studio/reports', icon: 'reports' },

    { label: 'ACCOUNT', sectionHeader: true },
    { label: 'Settings', path: '/settings', icon: 'settings' },
    // Temporarily disabled - Submit an idea
    // { label: 'Submit an idea', path: '/submit-idea', icon: 'idea' },
    { label: 'Help', path: '/help', icon: 'help' },
    { label: 'Logout', path: '/login', icon: 'logout' },

  ],
  SME: [
    // { label: 'MAIN', sectionHeader: true },
    { label: 'Home', path: '/sme-dashboard', icon: 'dashboard' },
    { label: 'Queue', path: '/sme/queue', icon: 'review' },
    { label: 'In progress', path: '/sme/queue?tab=in_progress', icon: 'clock' },
    { label: 'Reviewed', path: '/sme/queue?tab=reviewed', icon: 'check' },

    { label: 'INSIGHTS', sectionHeader: true },
    { label: 'Reports', path: '/sme/reports', icon: 'reports' },

    { label: 'ACCOUNT', sectionHeader: true },
    { label: 'Settings', path: '/settings', icon: 'settings' },
    // Temporarily disabled - Submit an idea
    // { label: 'Submit an idea', path: '/submit-idea', icon: 'idea' },
    { label: 'Help', path: '/help', icon: 'helpcircle' },
    { label: 'Logout', path: '/login', icon: 'logout' },
  ],
  SYSTEM_SUPPORT_ENGINEER: [
    // { label: 'Tickets', path: '/support', icon: 'ticket' },
    // { label: 'Resolved', path: '/support/resolved', icon: 'check' },

    { label: 'LOOKUP', sectionHeader: true },
    { label: 'Users', path: '/support/users', icon: 'users' },
    { label: 'Audit Log', path: '/support/audit', icon: 'audit' },
    // { label: 'Certificates', path: '/support/certificates', icon: 'certificates' },

    { label: 'SYSTEM', sectionHeader: true },
    { label: 'Platform status', path: '/support/platform', icon: 'platform' },

    { label: 'ACCOUNT', sectionHeader: true },
    { label: 'Settings', path: '/settings', icon: 'settings' },
    // Temporarily disabled - Submit an idea
    // { label: 'Submit an idea', path: '/submit-idea', icon: 'idea' },
    { label: 'Help', path: '/help', icon: 'helpcircle' },
    { label: 'Logout', path: '/login', icon: 'logout' },
  ],
  SYSTEM_ENGINEER: [
    // { label: 'Tickets', path: '/support', icon: 'ticket' },
    // { label: 'Resolved', path: '/support/resolved', icon: 'check' },

    { label: 'LOOKUP', sectionHeader: true },
    { label: 'Users', path: '/support/users', icon: 'users' },
    { label: 'Audit Log', path: '/support/audit', icon: 'audit' },
    // { label: 'Certificates', path: '/support/certificates', icon: 'certificates' },

    { label: 'SYSTEM', sectionHeader: true },
    { label: 'Platform status', path: '/support/platform', icon: 'platform' },

    { label: 'ACCOUNT', sectionHeader: true },
    { label: 'Settings', path: '/settings', icon: 'settings' },
    // Temporarily disabled - Submit an idea
    // { label: 'Submit an idea', path: '/submit-idea', icon: 'idea' },
    { label: 'Help', path: '/help', icon: 'helpcircle' },
    { label: 'Logout', path: '/login', icon: 'logout' },
  ],
  CORPORATE_ADMIN: [],
  SUPER_ADMIN: [
    // 1. OPERATIONS & ANALYTICS
    { label: 'OPERATIONS', sectionHeader: true },
    {
      label: "Operations Command",
      path: "/super-admin-dashboard",
      icon: "dashboard",
    },
    {
      label: "Intelligence Reports",
      path: "/admin/reports",
      icon: "reports",
      requiredPermission: ["REPORT.VIEW"]
    },

    // 2. DIRECTORY & ACCESS
    { label: 'DIRECTORY & ACCESS', sectionHeader: true },
    {
      label: "Learner Directory",
      path: "/user-management-dashboard",
      icon: "users",
      requiredPermission: ["USER.VIEW"]
    },
    {
      label: "Staff Administrators",
      path: "/admin-user-management",
      icon: "users",
    },
    {
      label: "Access & Permissions",
      path: "/roles-permissions",
      icon: "roles",
      requiredPermission: ["ROLE.VIEW"]
    },
    {
      label: "Compliance Purge",
      path: "/super-admin/deletion-queue",
      icon: "users",
    },

    // 3. CURRICULUM ECOSYSTEM
    { label: 'CURRICULUM', sectionHeader: true },
    {
      label: "Course Catalog",
      path: "/admin/courses",
      icon: "courses",
    },
    {
      label: "Curriculum Studio",
      path: "/create-course",
      icon: "builder",
    },
    {
      label: "SME Review Queue",
      path: "/review-queue",
      icon: "review",
    },

    // 4. SECURITY & INFRASTRUCTURE
    { label: 'SECURITY & INFRA', sectionHeader: true },
    {
      label: "Security Audit Ledger",
      path: "/audit-logs",
      icon: "ticket",
      requiredPermission: ["AUDIT.VIEW"]
    },
    {
      label: "System Telemetry",
      icon: "database",
      path: "/data-management",
    },
    {
      label: "Credential Security",
      path: "/admin-reset-password",
      icon: "lock",
    },

    // 5. ACCOUNT
    { label: 'PLATFORM ACCOUNT', sectionHeader: true },
    { label: 'Platform Settings', path: "/admin/system-settings", icon: "settings" },
    {
      label: "Session Logs",
      path: "/session-history",
      icon: "clock",
    },
    { label: 'Help & Docs', path: '/help', icon: 'helpcircle' },
    { label: 'Sign Out', path: '/login', icon: 'logout' },
  ]
};

roleMenuConfig["CORPORATEUSER"] = roleMenuConfig.MEMBER;
roleMenuConfig["CORPORATE USER"] = roleMenuConfig.MEMBER;
roleMenuConfig["USER"] = roleMenuConfig.MEMBER;