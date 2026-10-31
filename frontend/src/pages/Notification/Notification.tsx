import React, { useState } from "react";
import { 
  Bell, 
  Shield, 
  CheckSquare, 
  Clock, 
  BookOpen, 
  User, 
  Trash2, 
  AlertTriangle,
  Award,
  Sparkles
} from "lucide-react";
import { useNotifications, AppNotification } from "../../hooks/useNotifications";

export const Notification: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification, 
    deleteAllNotifications 
  } = useNotifications();

  // Filter based on active tab
  const filteredNotifications = notifications.filter(n => {
    if (activeTab === "unread") return !n.isRead;
    return true;
  });

  // Categorize by time section
  const categorizeNotification = (notif: AppNotification): 'TODAY' | 'EARLIER THIS WEEK' | 'EARLIER' => {
    if (notif.timeGroup) return notif.timeGroup;
    const now = Date.now();
    const itemDate = notif.createdAt?.toDate ? notif.createdAt.toDate().getTime() : new Date(notif.createdAt || now).getTime();
    const diffHours = (now - itemDate) / (1000 * 60 * 60);

    if (diffHours < 24) return 'TODAY';
    if (diffHours < 24 * 7) return 'EARLIER THIS WEEK';
    return 'EARLIER';
  };

  const sections = [
    {
      title: 'TODAY' as const,
      items: filteredNotifications.filter(n => categorizeNotification(n) === 'TODAY')
    },
    {
      title: 'EARLIER THIS WEEK' as const,
      items: filteredNotifications.filter(n => categorizeNotification(n) === 'EARLIER THIS WEEK')
    },
    {
      title: 'EARLIER' as const,
      items: filteredNotifications.filter(n => categorizeNotification(n) === 'EARLIER')
    }
  ].filter(s => s.items.length > 0);

  const getStyleForType = (type: string, title?: string, isRead?: boolean) => {
    const lowerTitle = (title || "").toLowerCase();
    const upperType = (type || "").toUpperCase();

    if (upperType === "SECURITY_ALERT" || upperType === "SYSTEM_ALERT" || lowerTitle.includes("device login")) {
      return {
        bg: isRead ? "bg-white" : "bg-[#fdf0f0]",
        border: isRead ? "" : "border-l-4 border-l-[#e15241]",
        titleColor: isRead ? "text-gray-900" : "text-[#c2410c]",
        descColor: isRead ? "text-gray-500" : "text-[#c2410c]/80",
        iconBg: "bg-[#f8d7d7]",
        icon: <Shield className="w-4 h-4 text-[#e15241]" />
      };
    }

    if (upperType === "COURSE_COMPLETED" || lowerTitle.includes("proof ready") || lowerTitle.includes("completed") || upperType === "ASSESSMENT_ALERT" || lowerTitle.includes("quiz passed")) {
      return {
        bg: isRead ? "bg-white" : "bg-[#f0fdf4]",
        border: isRead ? "" : "border-l-4 border-l-[#22c55e]",
        titleColor: isRead ? "text-gray-900" : "text-[#15803d]",
        descColor: isRead ? "text-gray-500" : "text-[#15803d]/80",
        iconBg: "bg-[#dcfce7]",
        icon: <CheckSquare className="w-4 h-4 text-[#16a34a]" />
      };
    }

    if (upperType === "DEADLINE_REMINDER" || lowerTitle.includes("renewal") || lowerTitle.includes("due")) {
      return {
        bg: isRead ? "bg-white" : "bg-[#fdf8eb]",
        border: isRead ? "" : "border-l-4 border-l-[#f59e0b]",
        titleColor: isRead ? "text-gray-900" : "text-[#b45309]",
        descColor: isRead ? "text-gray-500" : "text-[#b45309]/80",
        iconBg: "bg-[#fef3c7]",
        icon: <Clock className="w-4 h-4 text-[#d97706]" />
      };
    }

    if (upperType === "CONTENT_UPDATE" || lowerTitle.includes("new course")) {
      return {
        bg: isRead ? "bg-white" : "bg-[#fdf8eb]",
        border: isRead ? "" : "border-l-4 border-l-[#f59e0b]",
        titleColor: isRead ? "text-gray-900" : "text-[#b45309]",
        descColor: isRead ? "text-gray-500" : "text-[#b45309]/80",
        iconBg: "bg-[#fef3c7]",
        icon: <BookOpen className="w-4 h-4 text-[#d97706]" />
      };
    }

    if (upperType === "PROFILE_REMINDER" || lowerTitle.includes("profile")) {
      return {
        bg: isRead ? "bg-white" : "bg-[#f8fafc]",
        border: isRead ? "" : "border-l-4 border-l-[#cbd5e1]",
        titleColor: isRead ? "text-gray-900" : "text-[#334155]",
        descColor: isRead ? "text-gray-500" : "text-[#334155]/80",
        iconBg: "bg-[#f1f5f9]",
        icon: <User className="w-4 h-4 text-[#64748b]" />
      };
    }

    return {
      bg: isRead ? "bg-white" : "bg-[#f8fafc]",
      border: isRead ? "" : "border-l-4 border-l-gray-300",
      titleColor: "text-gray-900",
      descColor: "text-gray-600",
      iconBg: "bg-gray-200",
      icon: <Bell className="w-4 h-4 text-gray-500" />
    };
  };

  return (
    <div className="w-full mx-auto px-4font-sans">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 mt-2">
        <div>
          <span className="text-[10px] font-bold text-gray-500 tracking-[0.1em] uppercase block mb-1.5">
            USER PORTAL
          </span>
          <h1 className="text-[24px] sm:text-[28px] font-bold text-gray-900 tracking-tight leading-none mb-2">
            Notifications centre
          </h1>
          <p className="text-[14px] text-gray-500">
            All your activity, in one place.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            className="px-4 py-2 rounded-full border border-gray-300 bg-white text-[13px] font-semibold text-gray-900 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-none"
          >
            {activeTab === "unread" ? "All read" : "Mark all as read"}
          </button>
          
          <button
            type="button"
            onClick={deleteAllNotifications}
            disabled={notifications.length === 0}
            className="px-4 py-2 rounded-full border border-red-200 bg-white text-[13px] font-semibold text-[#dc2626] hover:bg-red-50 hover:border-red-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-none"
          >
            Delete all
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-8 border-b border-gray-200 mb-6">
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={`pb-3 text-[13px] font-medium transition-all relative ${
            activeTab === "all"
              ? "text-gray-900 border-b-2 border-[#d4a017]"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          All ({notifications.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("unread")}
          className={`pb-3 text-[13px] font-medium transition-all relative ${
            activeTab === "unread"
              ? "text-gray-900 border-b-2 border-[#d4a017]"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Notification Content */}
      {sections.length > 0 ? (
        <div className="space-y-6">
          {sections.map((section) => (
            <div key={section.title} className="space-y-3">
              <h2 className="text-[11px] font-bold tracking-wider text-gray-400 uppercase">
                {section.title}
              </h2>

              <div className="flex flex-col border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                {section.items.map((notif, index) => {
                  const style = getStyleForType(notif.type, notif.title, notif.isRead);
                  const isLast = index === section.items.length - 1;
                  return (
                    <div
                      key={notif.id}
                      onClick={() => !notif.isRead && markAsRead(notif.id)}
                      className={`group relative p-4 transition-all flex items-start justify-between gap-4 ${style.bg} ${style.border} ${!isLast ? 'border-b border-b-gray-200' : ''} ${!notif.isRead ? 'cursor-pointer' : ''}`}
                    >
                      <div className="flex items-start gap-4 min-w-0">
                        {/* Icon Container */}
                        <div className={`mt-0.5 flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${style.iconBg}`}>
                          {style.icon}
                        </div>

                        {/* Title & Description */}
                        <div className="min-w-0 pr-4 mt-1">
                          <h3 className={`text-sm font-semibold leading-tight ${style.titleColor}`}>
                            {notif.title}
                          </h3>
                          <p className={`text-[13px] mt-1 leading-relaxed ${style.descColor}`}>
                            {notif.message}
                          </p>
                        </div>
                      </div>

                      {/* Right Meta (Timestamp & Trash) */}
                      <div className="flex items-center gap-3 flex-shrink-0 pt-0.5 mt-1">
                        <span className="text-xs text-gray-400 font-normal whitespace-nowrap">
                          {notif.timeAgo || "Just now"}
                        </span>
                        
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notif.id);
                          }}
                          className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                          title="Delete notification"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white border border-gray-100 rounded-2xl p-16 sm:p-24 text-center shadow-sm">
          <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4 border border-gray-100">
            <Bell className="w-7 h-7 text-gray-300 stroke-[1.5]" />
          </div>
          <p className="text-sm font-medium text-gray-400">
            {activeTab === "unread" ? "No unread notifications." : "No notifications."}
          </p>
        </div>
      )}
    </div>
  );
};

export default Notification;