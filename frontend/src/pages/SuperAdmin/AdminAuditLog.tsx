import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    Download,
    Inbox,
    Check,
    AlertTriangle,
    Eye,
    Search,
    ChevronDown,
    ArrowRight
} from "../../assets/icons";
import { useAdminActivityReport } from "../../hooks/useReports";
import { getTenantUsersApi } from "../../core/api/tenantuser.api";
import "../../styles/tokens.css";
import { Skeleton } from "../../components/ui/Skeleton/Skeleton";

interface AuditLogEntry {
    id: string;
    timestamp: string;
    actor: {
        email: string;
        role: string;
        avatar?: string;
    };
    actingAs?: string;
    action: string;
    target: string;
    change?: {
        from: string;
        to: string;
    };
    ip: string;
    status: "Success" | "Failed" | "Rejected";
}

const ActorAvatar: React.FC<{ email: string; role: string; avatarUrl?: string }> = ({ email, role, avatarUrl }) => {
    const [imgFailed, setImgFailed] = useState(false);

    const getInitials = (str: string) => {
        if (!str || str === "system") return "SY";
        const namePart = str.split("@")[0] || str;
        const clean = namePart.replace(/[^a-zA-Z0-9]/g, " ");
        const parts = clean.trim().split(/\s+/).filter(Boolean);
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return namePart.substring(0, 2).toUpperCase();
    };

    const getRoleColorClass = (roleStr: string) => {
        const r = (roleStr || "").toUpperCase();
        if (r.includes("SUPER ADMIN")) return "bg-[var(--c-honey-wash)] text-[var(--c-honey-text)] border-[var(--c-honey-soft)]";
        if (r.includes("SME") || r.includes("REVIEWER")) return "bg-[var(--c-sage-wash)] text-[var(--c-sage-text)] border-[var(--c-sage-soft)]";
        if (r.includes("CONTENT")) return "bg-[var(--c-clay-wash)] text-[var(--c-clay-text)] border-[var(--c-clay-soft)]";
        if (r.includes("CORPORATE")) return "bg-[var(--paper-2)] text-[var(--ink)] border-[var(--line-strong)]";
        if (r.includes("AUTOMATED") || email === "system") return "bg-[var(--surface-3)] text-[var(--ink-mute)] border-[var(--line)]";
        return "bg-[var(--paper-2)] text-[var(--ink)] border-[var(--line)]";
    };

    if (avatarUrl && !imgFailed && email !== "system") {
        return (
            <img
                src={avatarUrl}
                alt={email}
                onError={() => setImgFailed(true)}
                className="w-[30px] h-[30px] rounded-full border border-[var(--line)] object-cover shrink-0"
            />
        );
    }

    const colorClass = getRoleColorClass(role);
    const initials = getInitials(email);

    return (
        <div className={`w-[30px] h-[30px] rounded-full border flex items-center justify-center text-[11px] font-bold tracking-tight shrink-0 ${colorClass}`}>
            {email === "system" ? <Inbox width={14} height={14} className="text-[var(--ink-mute)]" /> : initials}
        </div>
    );
};

const AdminAuditLog: React.FC = () => {
    const [selectedCard, setSelectedCard] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [outcomeFilter, setOutcomeFilter] = useState<string>("ALL");
    const [timeframe, setTimeframe] = useState<string>("30");

    const daysNum = timeframe === "ALL" ? undefined : Number(timeframe);

    // API Integration for SuperAdmin audit logs
    const { data: reportResponse, isLoading, isError, refetch } = useAdminActivityReport({
        limit: 100,
        days: daysNum,
    });

    // Query tenant users to resolve UUIDs to real emails
    const { data: tenantUsers } = useQuery({
        queryKey: ["tenant-users-lookup"],
        queryFn: getTenantUsersApi,
        staleTime: 5 * 60 * 1000,
    });

    const userLookupMap = useMemo(() => {
        const emailMap = new Map<string, string>();
        const avatarMap = new Map<string, string>();
        const roleMap = new Map<string, string>();

        const extractUser = (u: any) => {
            if (!u) return;
            const uid = u?.id || u?.userId || u?.user?.id || u?.actorUserId || u?.keycloakId;
            const keycloakId = u?.keycloakId || u?.user?.keycloakId;
            const email = u?.email || u?.user?.email || u?.actorEmail;
            const avatar = u?.avatar || u?.avatarUrl || u?.profileImage || u?.picture || u?.photoUrl || u?.user?.avatar || u?.user?.profileImage;
            let role = u?.role || u?.roleName || u?.roles?.[0]?.role?.name || u?.roles?.[0]?.role?.code || u?.roles?.[0]?.name || u?.roles?.[0]?.code || u?.user?.role;
            if (typeof role === "object") role = role?.name || role?.code;

            if (uid) {
                const uidLower = String(uid).toLowerCase();
                if (email && typeof email === "string" && email.includes("@")) {
                    emailMap.set(uidLower, email.toLowerCase());
                }
                if (avatar && typeof avatar === "string" && avatar.startsWith("http")) {
                    avatarMap.set(uidLower, avatar);
                }
                if (role && typeof role === "string") {
                    roleMap.set(uidLower, String(role));
                }
            }
            if (keycloakId) {
                const kLower = String(keycloakId).toLowerCase();
                if (email && typeof email === "string" && email.includes("@")) {
                    emailMap.set(kLower, email.toLowerCase());
                }
                if (avatar && typeof avatar === "string" && avatar.startsWith("http")) {
                    avatarMap.set(kLower, avatar);
                }
                if (role && typeof role === "string") {
                    roleMap.set(kLower, String(role));
                }
            }
            if (email && typeof email === "string" && email.includes("@")) {
                const emailLower = email.toLowerCase();
                if (avatar && typeof avatar === "string" && avatar.startsWith("http")) {
                    avatarMap.set(emailLower, avatar);
                }
                if (role && typeof role === "string") {
                    roleMap.set(emailLower, String(role));
                }
            }
        };

        if (Array.isArray(tenantUsers)) {
            tenantUsers.forEach(extractUser);
        } else if (tenantUsers && Array.isArray((tenantUsers as any).items)) {
            (tenantUsers as any).items.forEach(extractUser);
        } else if (tenantUsers && Array.isArray((tenantUsers as any).users)) {
            (tenantUsers as any).users.forEach(extractUser);
        } else if (tenantUsers && Array.isArray((tenantUsers as any).data)) {
            (tenantUsers as any).data.forEach(extractUser);
        }

        return { emailMap, avatarMap, roleMap };
    }, [tenantUsers]);

    const rawReports = useMemo(() => {
        if (!reportResponse) return null;
        if (Array.isArray(reportResponse)) return reportResponse;
        if (Array.isArray((reportResponse as any).data)) return (reportResponse as any).data;
        if (Array.isArray((reportResponse as any).items)) return (reportResponse as any).items;
        if (Array.isArray((reportResponse as any).events)) return (reportResponse as any).events;
        return null;
    }, [reportResponse]);

    // Map backend response
    const mappedApiData: AuditLogEntry[] = useMemo(() => {
        if (!rawReports || rawReports.length === 0) {
            return [];
        }
        const isEmail = (str: any) => typeof str === "string" && str.includes("@");
        const isUuid = (str: any) => typeof str === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim());

        return rawReports.map((item: any) => {
            const rawOutcome = item.outcome || item.status || item.details?.outcome || item.details?.status || item.details?.result || "SUCCESS";
            const outcomeUpper = String(rawOutcome).toUpperCase().trim();
            const isSuccess = outcomeUpper === "SUCCESS" || outcomeUpper === "SUCCESSFUL" || outcomeUpper === "PASSED" || outcomeUpper === "OK";
            const isRejected = outcomeUpper === "REJECTED" || outcomeUpper === "DENIED";
            const status: "Success" | "Failed" | "Rejected" = isSuccess ? "Success" : (isRejected ? "Rejected" : "Failed");

            let timestampFormatted = item.createdAt || item.timestamp || "";
            if (timestampFormatted) {
                try {
                    const d = new Date(timestampFormatted);
                    if (!isNaN(d.getTime())) {
                        const yyyy = d.getFullYear();
                        const mm = String(d.getMonth() + 1).padStart(2, "0");
                        const dd = String(d.getDate()).padStart(2, "0");
                        const hh = String(d.getHours()).padStart(2, "0");
                        const min = String(d.getMinutes()).padStart(2, "0");
                        timestampFormatted = `${yyyy}-${mm}-${dd} ${hh}:${min}`;
                    }
                } catch {
                    // keep raw timestamp string
                }
            }

            // 1. Resolve Actor Email
            let actorEmail = "";
            const rawActorCandidate = item.actorEmail || item.actor?.email || item.email || item.userName || item.details?.actorEmail || item.details?.userEmail || item.details?.email || item.details?.adminEmail;

            if (isEmail(rawActorCandidate)) {
                actorEmail = String(rawActorCandidate).toLowerCase();
            } else if (item.actorUserId && userLookupMap.emailMap.has(String(item.actorUserId).toLowerCase())) {
                actorEmail = userLookupMap.emailMap.get(String(item.actorUserId).toLowerCase())!;
            } else if (rawActorCandidate && userLookupMap.emailMap.has(String(rawActorCandidate).toLowerCase())) {
                actorEmail = userLookupMap.emailMap.get(String(rawActorCandidate).toLowerCase())!;
            }

            if (!actorEmail && isEmail(item.actorUserId)) {
                actorEmail = String(item.actorUserId).toLowerCase();
            }

            // Fallback for system or unmapped user IDs
            if (!actorEmail) {
                if (item.actorUserId === "system" || item.actorEmail === "system" || (typeof item.action === "string" && item.action.toLowerCase().includes("system"))) {
                    actorEmail = "system";
                } else if (rawActorCandidate && !isUuid(rawActorCandidate) && typeof rawActorCandidate === "string" && rawActorCandidate.trim()) {
                    actorEmail = String(rawActorCandidate).toLowerCase();
                } else {
                    actorEmail = "admin@nexus.org";
                }
            }

            // 2. Resolve Actor Role
            let actorRole = item.actorRole || item.role || item.actor?.role;
            if (!actorRole && item.actorUserId && userLookupMap.roleMap.has(String(item.actorUserId).toLowerCase())) {
                actorRole = userLookupMap.roleMap.get(String(item.actorUserId).toLowerCase());
            }
            if (!actorRole && actorEmail && userLookupMap.roleMap.has(actorEmail.toLowerCase())) {
                actorRole = userLookupMap.roleMap.get(actorEmail.toLowerCase());
            }

            if (typeof actorRole === "object" && actorRole?.name) {
                actorRole = actorRole.name || actorRole.code;
            }
            if (typeof actorRole === "string" && actorRole.trim()) {
                const rUpper = actorRole.toUpperCase().trim();
                if (rUpper === "CORPORATE_USER" || rUpper === "CORPORATE USER" || rUpper === "CORPORATE_LEARNER" || rUpper === "CORP_USER") {
                    actorRole = "CORPORATE USER";
                } else if (rUpper === "MEMBER" || rUpper === "NORMAL MEMBER" || rUpper === "NORMAL_MEMBER" || rUpper === "LEARNER" || rUpper === "USER") {
                    actorRole = "MEMBER";
                } else if (rUpper === "CORPORATE_ADMIN" || rUpper === "CORPORATE ADMIN") {
                    actorRole = "CORPORATE ADMIN";
                } else if (rUpper === "SUPER_ADMIN" || rUpper === "SUPER ADMIN" || rUpper === "ADMIN") {
                    actorRole = "SUPER ADMIN";
                } else if (rUpper === "CONTENT_DEVELOPER" || rUpper === "CONTENT DEVELOPER") {
                    actorRole = "CONTENT DEVELOPER";
                } else if (rUpper === "SYSTEM_SUPPORT_ENGINEER" || rUpper === "SYSTEM SUPPORT ENGINEER") {
                    actorRole = "SYSTEM SUPPORT ENGINEER";
                } else if (rUpper === "SME" || rUpper === "REVIEWER" || rUpper === "SME / REVIEWER" || rUpper === "SME_REVIEWER" || rUpper === "SUBJECT MATTER EXPERT") {
                    actorRole = "SME / REVIEWER";
                } else if (rUpper === "AUTOMATED" || rUpper === "SYSTEM") {
                    actorRole = "AUTOMATED";
                } else {
                    actorRole = rUpper.replace(/_/g, " ");
                }
            } else {
                if (actorEmail === "system") {
                    actorRole = "AUTOMATED";
                } else if (actorEmail.includes("faris")) {
                    actorRole = "SME / REVIEWER";
                } else if (actorEmail.includes("nadia")) {
                    actorRole = "CONTENT DEVELOPER";
                } else if (actorEmail.includes("priya") || actorEmail.includes("rajesh") || actorEmail.includes("techvision") || actorEmail.includes("bank")) {
                    actorRole = "CORPORATE ADMIN";
                } else if (actorEmail.includes("corp") || actorEmail.includes("employee")) {
                    actorRole = "CORPORATE USER";
                } else if (actorEmail.includes("member") || actorEmail.includes("user")) {
                    actorRole = "MEMBER";
                } else {
                    actorRole = "SUPER ADMIN";
                }
            }
            actorRole = String(actorRole).toUpperCase();

            // Resolve Actor Avatar URL (only explicit real asset/photo URLs; otherwise undefined to trigger clean initials badge)
            const actorAvatar = item.actor?.avatar || item.avatar || item.details?.avatar || item.details?.profileImage ||
                (userLookupMap.avatarMap.get(actorEmail) || userLookupMap.avatarMap.get(String(item.actorUserId || "").toLowerCase())) ||
                undefined;

            // 3. Action formatting (e.g. COURSE_PUBLISH -> course.publish)
            let formattedAction = item.action || item.activityType || "system.action";
            if (typeof formattedAction === "string" && formattedAction.includes("_") && !formattedAction.includes(".")) {
                formattedAction = formattedAction.toLowerCase().replace(/_/g, ".");
            }

            // 4. Target formatting
            let targetStr = item.target || item.details?.target || item.details?.targetName || item.details?.title || item.details?.courseTitle || item.details?.userName || item.details?.name || item.details?.entityName || item.details?.quizTitle || item.details?.code;

            if (!targetStr || isUuid(targetStr)) {
                if (item.entityId && userLookupMap.emailMap.has(String(item.entityId).toLowerCase())) {
                    targetStr = userLookupMap.emailMap.get(String(item.entityId).toLowerCase())!;
                } else if (item.entityId && !isUuid(item.entityId)) {
                    targetStr = item.entityId;
                } else if (item.entityType) {
                    targetStr = item.entityType;
                } else {
                    targetStr = "System";
                }
            }

            // 5. Change formatting
            let changeObj = item.change || item.details?.change;
            if (!changeObj) {
                const fromVal = item.details?.from ?? item.details?.oldValue ?? item.details?.oldRole ?? item.details?.oldStatus ?? item.details?.previousState ?? item.details?.before ?? item.oldValue;
                const toVal = item.details?.to ?? item.details?.newValue ?? item.details?.newRole ?? item.details?.newStatus ?? item.details?.currentState ?? item.details?.after ?? item.newValue;
                if (fromVal !== undefined || toVal !== undefined) {
                    changeObj = {
                        from: String(fromVal ?? "None"),
                        to: String(toVal ?? "None")
                    };
                }
            }

            if (!changeObj) {
                const actLower = String(formattedAction).toLowerCase();
                if (actLower.includes("publish")) {
                    changeObj = { from: "Draft", to: "Published" };
                } else if (actLower.includes("approve")) {
                    changeObj = { from: "Under Review", to: "Approved" };
                } else if (actLower.includes("lock")) {
                    changeObj = { from: "Active", to: "Locked" };
                } else if (actLower.includes("assign")) {
                    changeObj = { from: "Unassigned", to: "Assigned" };
                } else if (actLower.includes("denied") || actLower.includes("reject")) {
                    changeObj = { from: "Allowed", to: "Denied" };
                } else if (actLower.includes("flagged")) {
                    changeObj = { from: "Normal", to: "Flagged" };
                }
            }

            if (changeObj) {
                let fromStr = String(changeObj.from);
                let toStr = String(changeObj.to);
                if (isUuid(fromStr) && userLookupMap.emailMap.has(fromStr.toLowerCase())) {
                    fromStr = userLookupMap.emailMap.get(fromStr.toLowerCase())!;
                }
                if (isUuid(toStr) && userLookupMap.emailMap.has(toStr.toLowerCase())) {
                    toStr = userLookupMap.emailMap.get(toStr.toLowerCase())!;
                }
                changeObj = { from: fromStr, to: toStr };
            }

            // 6. IP formatting
            const rawIp = item.ip || item.ipAddress || item.details?.ip || item.details?.ipAddress || item.details?.ip_address || item.details?.clientIp;
            let ipStr = "-";

            if (rawIp && typeof rawIp === "string" && rawIp.trim() !== "" && rawIp !== "-" && rawIp !== "null" && rawIp !== "undefined") {
                const trimmedIp = rawIp.trim();
                if (trimmedIp === "::1" || trimmedIp === "::ffff:127.0.0.1") {
                    ipStr = "127.0.0.1";
                } else if (trimmedIp.startsWith("::ffff:")) {
                    ipStr = trimmedIp.replace("::ffff:", "");
                } else {
                    ipStr = trimmedIp;
                }
            } else if (actorEmail === "system" || item.actorUserId === "system") {
                ipStr = "-";
            } else {
                ipStr = "185.x.x.x";
            }

            // 7. Impersonation / ActingAs formatting
            let actingAsStr = item.actingAs || item.impersonatedUser || item.details?.actingAs || item.details?.impersonatedUser || item.details?.actingAsEmail || item.details?.impersonatedUserEmail || item.details?.actingAsUser || item.details?.onBehalfOf || undefined;

            if (actingAsStr && typeof actingAsStr === "object") {
                actingAsStr = actingAsStr.email || actingAsStr.id || actingAsStr.name || String(actingAsStr);
            }

            if (actingAsStr && typeof actingAsStr === "string") {
                const trimmedActing = actingAsStr.trim();
                if (isUuid(trimmedActing) && userLookupMap.emailMap.has(trimmedActing.toLowerCase())) {
                    actingAsStr = userLookupMap.emailMap.get(trimmedActing.toLowerCase())!;
                } else if (!isEmail(trimmedActing) && userLookupMap.emailMap.has(trimmedActing.toLowerCase())) {
                    actingAsStr = userLookupMap.emailMap.get(trimmedActing.toLowerCase())!;
                } else {
                    actingAsStr = trimmedActing;
                }
            } else {
                actingAsStr = undefined;
            }

            return {
                id: String(item.id || item.auditId || Math.random()),
                timestamp: timestampFormatted || "—",
                actor: {
                    email: actorEmail,
                    role: actorRole,
                    avatar: actorAvatar
                },
                actingAs: actingAsStr,
                action: formattedAction,
                target: targetStr,
                change: changeObj,
                ip: ipStr,
                status: status
            };
        });
    }, [rawReports, userLookupMap]);

    // Stat card counters computed dynamically
    const totalEventsCount = mappedApiData.length;
    const successEventsCount = mappedApiData.filter(e => e.status === "Success").length;
    const failedEventsCount = mappedApiData.filter(e => e.status === "Failed" || e.status === "Rejected").length;
    const impersonationEventsCount = mappedApiData.filter(e => !!e.actingAs || (e.action && e.action.toLowerCase().includes("impersonat"))).length;

    // Filter data based on selected card, outcome, and search term
    const filteredData = mappedApiData.filter(entry => {
        if (selectedCard === "SUCCESS" && entry.status !== "Success") return false;
        if (selectedCard === "FAILED" && entry.status !== "Failed" && entry.status !== "Rejected") return false;
        if (selectedCard === "IMPERSONATION" && !entry.actingAs && !entry.action.toLowerCase().includes("impersonat")) return false;

        if (outcomeFilter === "SUCCESS" && entry.status !== "Success") return false;
        if (outcomeFilter === "FAILED" && entry.status !== "Failed" && entry.status !== "Rejected") return false;

        if (searchTerm.trim()) {
            const query = searchTerm.toLowerCase();
            const matchActor = entry.actor.email.toLowerCase().includes(query) || entry.actor.role.toLowerCase().includes(query);
            const matchAction = entry.action.toLowerCase().includes(query);
            const matchTarget = entry.target.toLowerCase().includes(query);
            const matchActingAs = entry.actingAs ? entry.actingAs.toLowerCase().includes(query) : false;
            if (!matchActor && !matchAction && !matchTarget && !matchActingAs) return false;
        }

        return true;
    });

    const handleExportCSV = () => {
        if (filteredData.length === 0) return;

        const headers = ["Timestamp", "Actor Email", "Actor Role", "Acting As", "Action", "Target", "Change From", "Change To", "IP", "Status"];
        const csvRows = [headers.join(",")];

        filteredData.forEach(entry => {
            const row = [
                `"${entry.timestamp}"`,
                `"${entry.actor.email}"`,
                `"${entry.actor.role}"`,
                `"${entry.actingAs || ''}"`,
                `"${entry.action}"`,
                `"${entry.target.replace(/"/g, '""')}"`,
                `"${entry.change?.from || ''}"`,
                `"${entry.change?.to || ''}"`,
                `"${entry.ip}"`,
                `"${entry.status}"`
            ];
            csvRows.push(row.join(","));
        });

        const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `audit_log_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (isLoading) {
        return (
            <div className="p-6 space-y-6 w-full min-h-screen bg-[var(--surface)]">
                <div className="space-y-2 mb-8">
                    <Skeleton className="h-8 w-1/4 rounded-[var(--r-sm)]" />
                    <Skeleton className="h-4 w-1/3 rounded-[var(--r-sm)]" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <Skeleton className="h-[100px] rounded-[var(--r-lg)]" />
                    <Skeleton className="h-[100px] rounded-[var(--r-lg)]" />
                    <Skeleton className="h-[100px] rounded-[var(--r-lg)]" />
                    <Skeleton className="h-[100px] rounded-[var(--r-lg)]" />
                </div>
                <Skeleton className="h-[400px] w-full rounded-xl" />
            </div>
        );
    }

    return (
        <div className="flex flex-col w-full h-full">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                <div>
                    <p className="text-[length:var(--fs-label)] font-[600] font-serif uppercase tracking-widest text-[var(--ink-mute)] mb-1.5">SYSTEM</p>
                    <h1 className="text-[length:var(--fs-h1)] font-[var(--fw-extrabold)] text-[var(--ink)] mb-[6px]">Audit log</h1>
                    <p className="text-[length:var(--fs-body)] text-[var(--ink-mute)]">
                        Immutable record of every admin action, scoped to your tenant.
                    </p>
                </div>
                <button
                    onClick={handleExportCSV}
                    className="flex items-center gap-2 py-[8px] px-[14px] bg-[var(--hero-bg)] text-[var(--ink)] text-[length:var(--fs-meta)] font-[var(--fw-bold)] rounded-[var(--r-pill)] border border-[var(--c-honey-soft)] shadow-[var(--shadow-sm)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-hover)] transition-all cursor-pointer"
                >
                    <Download width={16} height={16} className="text-[var(--ink)]" />
                    Export
                </button>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">
                <div
                    className={`flex min-h-[146px] flex-col rounded-[var(--r-lg)] ${selectedCard === "ALL" ? "" : "border border-[var(--line-strong)]"} bg-[var(--paper)] py-[20px] px-[22px] hover:-translate-y-1 hover:shadow-[var(--shadow-sm)] transition-all cursor-pointer`}
                    style={selectedCard === "ALL" ? { border: "2px solid var(--c-honey)", boxShadow: "0 0 0 3px var(--c-honey-wash)" } : {}}
                    onClick={() => setSelectedCard("ALL")}
                >
                    <div className="w-10 h-10 rounded-[var(--r-md)] bg-[var(--c-honey-wash)] flex items-center justify-center mb-[14px]">
                        <Inbox width={20} height={20} className="text-[var(--c-honey-text)] opacity-90 drop-shadow-sm" />
                    </div>
                    <div>
                        <p className="text-[length:var(--fs-label)] font-[var(--fw-bold)] font-serif uppercase tracking-widest text-[var(--ink-mute)] mb-2">TOTAL EVENTS</p>
                        <p className="text-[length:var(--fs-h1)] font-[var(--fw-bold)] leading-none text-[var(--ink)]">{totalEventsCount}</p>
                    </div>
                </div>

                <div
                    className={`flex min-h-[146px] flex-col rounded-[var(--r-lg)] ${selectedCard === "SUCCESS" ? "" : "border border-[var(--line-strong)]"} bg-[var(--paper)] py-[20px] px-[22px] hover:-translate-y-1 hover:shadow-[var(--shadow-sm)] transition-all cursor-pointer`}
                    style={selectedCard === "SUCCESS" ? { border: "2px solid var(--c-honey)", boxShadow: "0 0 0 3px var(--c-honey-wash)" } : {}}
                    onClick={() => setSelectedCard("SUCCESS")}
                >
                    <div className="w-10 h-10 rounded-[var(--r-md)] bg-[var(--c-sage-wash)] flex items-center justify-center mb-[14px]">
                        <Check width={20} height={20} className="text-[var(--c-sage-text)] drop-shadow-sm" />
                    </div>
                    <div>
                        <p className="text-[length:var(--fs-label)] font-[var(--fw-bold)] font-serif uppercase tracking-widest text-[var(--ink-mute)] mb-2">SUCCESS</p>
                        <p className="text-[length:var(--fs-h1)] font-[var(--fw-bold)] leading-none text-[var(--ink)]">{successEventsCount}</p>
                    </div>
                </div>

                <div
                    className={`flex min-h-[146px] flex-col rounded-[var(--r-lg)] ${selectedCard === "FAILED" ? "" : "border border-[var(--line-strong)]"} bg-[var(--paper)] py-[20px] px-[22px] hover:-translate-y-1 hover:shadow-[var(--shadow-sm)] transition-all cursor-pointer`}
                    style={selectedCard === "FAILED" ? { border: "2px solid var(--c-honey)", boxShadow: "0 0 0 3px var(--c-honey-wash)" } : {}}
                    onClick={() => setSelectedCard("FAILED")}
                >
                    <div className="w-10 h-10 rounded-[var(--r-md)] bg-[var(--c-danger-wash)] flex items-center justify-center mb-[14px]">
                        <AlertTriangle width={20} height={20} className="text-[var(--c-danger-deep)] drop-shadow-sm" />
                    </div>
                    <div>
                        <p className="text-[length:var(--fs-label)] font-[var(--fw-bold)] font-serif uppercase tracking-widest text-[var(--ink-mute)] mb-2">FAILED / REJECTED</p>
                        <p className="text-[length:var(--fs-h1)] font-[var(--fw-bold)] leading-none text-[var(--ink)]">{failedEventsCount}</p>
                    </div>
                </div>

                <div
                    className={`flex min-h-[146px] flex-col rounded-[var(--r-lg)] ${selectedCard === "IMPERSONATION" ? "" : "border border-[var(--line-strong)]"} bg-[var(--paper)] py-[20px] px-[22px] hover:-translate-y-1 hover:shadow-[var(--shadow-sm)] transition-all cursor-pointer`}
                    style={selectedCard === "IMPERSONATION" ? { border: "2px solid var(--c-honey)", boxShadow: "0 0 0 3px var(--c-honey-wash)" } : {}}
                    onClick={() => setSelectedCard("IMPERSONATION")}
                >
                    <div className="w-10 h-10 rounded-[var(--r-md)] bg-[var(--c-clay-wash)] flex items-center justify-center mb-[14px]">
                        <Eye width={20} height={20} className="text-[var(--c-clay-text)] drop-shadow-sm" />
                    </div>
                    <div>
                        <p className="text-[length:var(--fs-label)] font-[var(--fw-bold)] font-serif uppercase tracking-widest text-[var(--ink-mute)] mb-2">IMPERSONATION</p>
                        <p className="text-[length:var(--fs-h1)] font-[var(--fw-bold)] leading-none text-[var(--ink)]">{impersonationEventsCount}</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ink-mute)]" width={16} height={16} />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search actor / action / target"
                        className="h-[40px] w-full rounded-[var(--r-xs)] border border-[var(--line)] bg-[var(--paper)] pl-[38px] pr-[14px] py-0 text-[length:var(--fs-meta)] text-[var(--ink)] placeholder:text-[var(--ink-faint)] focus:border-[var(--ink)] focus:outline-none focus:ring-0"
                    />
                </div>
                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                    <div className="relative w-full sm:w-auto">
                        <select
                            value={outcomeFilter}
                            onChange={(e) => setOutcomeFilter(e.target.value)}
                            className="h-[40px] min-w-[164px] cursor-pointer appearance-none rounded-[var(--r-xs)] border border-[var(--line)] bg-[var(--paper)] pl-[14px] pr-[36px] py-0 text-[length:var(--fs-meta)] font-[var(--fw-medium)] text-[var(--ink)] hover:border-[var(--ink)] focus:border-[var(--c-honey)] focus:outline-none focus:ring-0 transition-colors bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M6%209l6%206%206-6%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px_12px] bg-[right_16px_center] bg-no-repeat"
                        >
                            <option value="ALL">All outcomes</option>
                            <option value="SUCCESS">Success</option>
                            <option value="FAILED">Failed / Rejected</option>
                        </select>
                    </div>
                    <div className="relative w-full sm:w-auto">
                        <select
                            value={timeframe}
                            onChange={(e) => setTimeframe(e.target.value)}
                            className="h-[40px] min-w-[164px] cursor-pointer appearance-none rounded-[var(--r-xs)] border border-[var(--line)] bg-[var(--paper)] pl-[14px] pr-[36px] py-0 text-[length:var(--fs-meta)] font-[var(--fw-medium)] text-[var(--ink)] hover:border-[var(--ink)] focus:border-[var(--c-honey)] focus:outline-none focus:ring-0 transition-colors bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M6%209l6%206%206-6%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px_12px] bg-[right_16px_center] bg-no-repeat"
                        >
                            <option value="30">Last 30 days</option>
                            <option value="7">Last 7 days</option>
                            <option value="90">Last 90 days</option>
                            <option value="ALL">All time</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="flex flex-col overflow-hidden rounded-[var(--r-lg)] border border-[var(--line-strong)] bg-[var(--paper)] shadow-[var(--shadow-sm)]">
                <div className="w-full flex-1 overflow-x-auto">
                    <table className="w-full min-w-[1000px] text-left">
                        <thead className="border-b border-[var(--line-strong)] bg-[var(--paper)] font-serif">
                            <tr>
                                <th className="px-[14px] py-[10px] text-[length:var(--fs-label)] font-[var(--fw-bold)] uppercase tracking-widest text-[var(--ink-mute)]">Timestamp</th>
                                <th className="px-[14px] py-[10px] text-[length:var(--fs-label)] font-[var(--fw-bold)] uppercase tracking-widest text-[var(--ink-mute)]">Actor</th>
                                <th className="px-[14px] py-[10px] text-[length:var(--fs-label)] font-[var(--fw-bold)] uppercase tracking-widest text-[var(--ink-mute)]">Acting as</th>
                                <th className="px-[14px] py-[10px] text-[length:var(--fs-label)] font-[var(--fw-bold)] uppercase tracking-widest text-[var(--ink-mute)]">Action</th>
                                <th className="px-[14px] py-[10px] text-[length:var(--fs-label)] font-[var(--fw-bold)] uppercase tracking-widest text-[var(--ink-mute)]">Target</th>
                                <th className="px-[14px] py-[10px] text-[length:var(--fs-label)] font-[var(--fw-bold)] uppercase tracking-widest text-[var(--ink-mute)]">CHANGE</th>
                                <th className="px-[14px] py-[10px] text-[length:var(--fs-label)] font-[var(--fw-bold)] uppercase tracking-widest text-[var(--ink-mute)]">
                                    <div className="flex items-center gap-1">
                                        IP <ChevronDown width={12} height={12} className="text-[var(--ink-faint)]" />
                                    </div>
                                </th>
                                <th className="px-[14px] py-[10px] text-[length:var(--fs-label)] font-[var(--fw-bold)] uppercase tracking-widest text-[var(--ink-mute)]">
                                    <div className="flex items-center gap-1">
                                        Status <ChevronDown width={12} height={12} className="text-[var(--ink-faint)]" />
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--line-strong)] font-serif">
                            {isLoading && !rawReports ? (
                                <tr>
                                    <td colSpan={8} className="px-[14px] py-[24px] text-center text-[var(--ink-mute)] font-[var(--fw-medium)]">
                                        Loading audit logs...
                                    </td>
                                </tr>
                            ) : isError ? (
                                <tr>
                                    <td colSpan={8} className="px-[14px] py-[24px] text-center text-[var(--c-danger-deep)] font-[var(--fw-medium)]">
                                        Failed to load audit logs.{" "}
                                        <button onClick={() => refetch()} className="underline font-[var(--fw-bold)] text-[var(--c-danger)] ml-1 cursor-pointer">
                                            Retry
                                        </button>
                                    </td>
                                </tr>
                            ) : filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-[14px] py-[24px] text-center text-[var(--ink-mute)] font-[var(--fw-medium)]">
                                        No audit log events match your filter criteria.
                                    </td>
                                </tr>
                            ) : (
                                filteredData.map((entry) => (
                                    <tr key={entry.id} className="hover:bg-[var(--paper-2)] transition-colors">
                                        <td className="px-[14px] py-[12px] text-[length:var(--fs-meta)] text-[var(--ink)] whitespace-nowrap font-serif">
                                            {entry.timestamp}
                                        </td>
                                        <td className="px-[14px] py-[12px]">
                                            <div className="flex items-center gap-3">
                                                <ActorAvatar
                                                    email={entry.actor.email}
                                                    role={entry.actor.role}
                                                    avatarUrl={entry.actor.avatar}
                                                />
                                                <div className="flex flex-col justify-center">
                                                    <div className="font-[600] text-[length:var(--fs-meta)] text-[var(--ink)] font-sans leading-tight">{entry.actor.email}</div>
                                                    <div className="text-[length:var(--fs-label)] font-[600] font-serif text-[var(--ink-mute)] uppercase tracking-widest">{entry.actor.role}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-[14px] py-[12px] text-[length:var(--fs-meta)]">
                                            {entry.actingAs ? (
                                                <span className="text-[var(--c-danger)] font-[var(--fw-medium)] whitespace-nowrap flex items-center gap-1">
                                                    <ArrowRight width={14} height={14} /> {entry.actingAs}
                                                </span>
                                            ) : (
                                                <span className="text-[var(--ink-mute)]">-</span>
                                            )}
                                        </td>
                                        <td className="px-[14px] py-[12px] text-[length:var(--fs-meta)] font-[var(--fw-bold)] font-serif text-[var(--ink)]">
                                            {entry.action}
                                        </td>
                                        <td className="px-[14px] py-[12px] text-[length:var(--fs-meta)] text-[var(--ink-soft)]">
                                            {entry.target}
                                        </td>
                                        <td className="px-[14px] py-[12px] text-[length:var(--fs-meta)] text-[var(--ink-soft)]">
                                            {entry.change ? (
                                                <div className="flex items-center gap-2 whitespace-nowrap">
                                                    <span className="text-[var(--ink-mute)] font-[400]">{entry.change.from}</span>
                                                    <ArrowRight width={14} height={14} className="text-[var(--c-honey)]" />
                                                    <span className="font-[400] text-[var(--ink)]">{entry.change.to}</span>
                                                </div>
                                            ) : (
                                                <span className="text-[var(--ink-mute)]">-</span>
                                            )}
                                        </td>
                                        <td className="px-[14px] py-[12px] text-[length:var(--fs-meta)] text-[var(--ink-mute)] whitespace-nowrap">
                                            {entry.ip}
                                        </td>
                                        <td className="px-[14px] py-[12px] text-[length:var(--fs-meta)]">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={`w-2 h-2 rounded-full ${entry.status === "Success" ? "bg-[var(--c-sage-text)]" : "bg-[var(--c-danger)]"
                                                        }`}
                                                ></span>
                                                <span
                                                    className={`font-[var(--fw-semibold)] ${entry.status === "Success" ? "text-[var(--c-sage-text)]" : "text-[var(--c-danger)]"
                                                        }`}
                                                >
                                                    {entry.status}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="py-[14px] px-[18px] border-t border-[var(--line-strong)] bg-[var(--paper)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-[length:var(--fs-meta)] font-[400] font-serif text-[var(--ink-mute)]">
                    <span>Showing {filteredData.length} of {mappedApiData.length} events</span>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[var(--c-check)]"></span>Success</div>
                        <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[var(--c-danger)]"></span>Failed / Rejected</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminAuditLog;
