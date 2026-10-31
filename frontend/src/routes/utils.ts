export const getDashboardPath = (normalizedRole: string) => {
    if (!normalizedRole) return "/member-dashboard";

    const dashboardMap: Record<string, string> = {
        VISITOR: "/visitor-dashboard",
        MEMBER: "/member-dashboard",
        CONTENT_DEVELOPER: "/studio",
        SME: "/sme-dashboard",
        SYSTEM_SUPPORT_ENGINEER: "/support",
        SYSTEM_ENGINEER: "/support",
        SUPER_ADMIN: "/super-admin-dashboard",
        CORPORATE_ADMIN: "/member-dashboard",
        CORPORATEADMIN: "/member-dashboard",
        ADMIN: "/member-dashboard",
        CORPORATE_USER: "/member-dashboard",
        CORPORATEUSER: "/member-dashboard",
        USER: "/member-dashboard",
    };

    return dashboardMap[normalizedRole] || "/member-dashboard";
};

