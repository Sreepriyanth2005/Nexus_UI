import { useState, useEffect, useCallback, useRef } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, writeBatch, orderBy, QuerySnapshot, QueryDocumentSnapshot, DocumentData, deleteDoc } from 'firebase/firestore';
import { db } from '../core/integrations/firebase';
import { NotificationAPI } from '../core/api/notification.api';
import { useUserStore } from '../store/user.store';

export interface AppNotification {
  id: string;
  postgresId?: string;
  tenantId?: string;
  userId?: string;
  title: string;
  message: string;
  type: string;
  priority?: string;
  icon?: string;
  actionUrl?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  isRead: boolean;
  timeGroup?: 'TODAY' | 'EARLIER THIS WEEK' | 'EARLIER';
  timeAgo?: string;
  createdAt?: any;
}

const DEFAULT_NOTIFICATIONS: AppNotification[] = [
  {
    id: "notif-1",
    postgresId: "notif-1",
    title: "New device login detected",
    message: "Chrome 124 · Windows 11 · Muscat, Oman signed in just now. If this wasn't you, review active sessions.",
    type: "SECURITY_ALERT",
    priority: "HIGH",
    isRead: false,
    timeGroup: "TODAY",
    timeAgo: "Just now",
    createdAt: new Date()
  },
  {
    id: "notif-2",
    postgresId: "notif-2",
    title: "Course Completed proof ready · Data Quality Foundations",
    message: "Your course learning credential is now downloadable from your profile.",
    type: "COURSE_COMPLETED",
    priority: "NORMAL",
    isRead: false,
    timeGroup: "TODAY",
    timeAgo: "2h ago",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
  },
  {
    id: "notif-3",
    postgresId: "notif-3",
    title: "CDMP Practitioner renewal opens in 90 days",
    message: "Your CDMP Practitioner credential is due for renewal. Review the renewal requirements in your certificate.",
    type: "DEADLINE_REMINDER",
    priority: "NORMAL",
    isRead: false,
    timeGroup: "EARLIER THIS WEEK",
    timeAgo: "1d ago",
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
  },
  {
    id: "notif-4",
    postgresId: "notif-4",
    title: "New course in your path · Knowledge Mapping",
    message: "Released by Dr. Faris Al-Maamari. Aligned with KMP path.",
    type: "CONTENT_UPDATE",
    priority: "NORMAL",
    isRead: true,
    timeGroup: "EARLIER THIS WEEK",
    timeAgo: "3d ago",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
  },
  {
    id: "notif-5",
    postgresId: "notif-5",
    title: "Profile 72% complete",
    message: "Add phone number and work history to reach 100% and unlock proofs.",
    type: "PROFILE_REMINDER",
    priority: "LOW",
    isRead: true,
    timeGroup: "EARLIER",
    timeAgo: "5d ago",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
  },
  {
    id: "notif-6",
    postgresId: "notif-6",
    title: "Quiz passed · 82%",
    message: "You passed the CDMP Practitioner assessment.",
    type: "ASSESSMENT_ALERT",
    priority: "LOW",
    isRead: true,
    timeGroup: "EARLIER",
    timeAgo: "1w ago",
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  }
];

export const useNotifications = () => {
  const { user } = useUserStore();
  const tenantId = user?.tenantId || 'default';
  const userId = user?.id || '';

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const cached = localStorage.getItem('imi_notifications_cache');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        return DEFAULT_NOTIFICATIONS;
      }
    }
    return DEFAULT_NOTIFICATIONS;
  });

  // Track local mutations so Firestore re-syncs don't revert them
  const localDeletedIds = useRef<Set<string>>(new Set());
  const localReadIds = useRef<Set<string>>(new Set());

  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    localStorage.setItem('imi_notifications_cache', JSON.stringify(notifications));
  }, [notifications]);

  const isSuperAdmin = user?.roles?.some((r: any) =>
    (typeof r === "string" && r.toUpperCase().includes("SUPER_ADMIN")) ||
    (r.code && r.code.toUpperCase().includes("SUPER_ADMIN")) ||
    (r.role?.code && r.role.code.toUpperCase().includes("SUPER_ADMIN"))
  );
  
  const targetUserId = userId;

  useEffect(() => {
    if (!userId) return;

    // 1. Fetch from Backend REST API
    NotificationAPI.getNotifications({ userId: targetUserId })
      .then((res) => {
        if (res && Array.isArray(res.data)) {
          const formatted: AppNotification[] = res.data.map((item) => ({
            id: item.id,
            postgresId: item.id,
            title: item.title,
            message: item.message,
            type: item.type,
            priority: item.priority || "NORMAL",
            isRead: item.isRead,
            createdAt: item.createdAt,
            timeAgo: "Recently"
          }));
          
          setNotifications(prev => {
            const fsNotifs = prev.filter(n => !n.postgresId);
            const combined = [...formatted];
            fsNotifs.forEach(fn => {
              if (!combined.some(p => p.id === fn.id)) combined.push(fn);
            });
            return combined.sort((a, b) => {
              const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
              const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
              return dateB.getTime() - dateA.getTime();
            });
          });
        }
      })
      .catch((err) => {
        console.warn('Notifications REST fetch fallback:', err?.message);
      });

    // 2. Real-time Firestore Sync
    try {
      const notifRef = collection(db, 'users', userId, 'notifications');
      const q = query(notifRef, orderBy('createdAt', 'desc'));

      const unsubscribe = onSnapshot(q, (snapshot: QuerySnapshot<DocumentData, DocumentData>) => {
        const notifs: AppNotification[] = [];
        if (!snapshot.empty) {
          snapshot.forEach((doc: QueryDocumentSnapshot<DocumentData, DocumentData>) => {
            const data = doc.data() as Omit<AppNotification, 'id'>;
            if (localDeletedIds.current.has(doc.id)) return;
            notifs.push({
              id: doc.id,
              ...data,
              isRead: localReadIds.current.has(doc.id) ? true : (data.isRead ?? false),
            });
          });
        }
        
        setNotifications(prev => {
          const pgNotifs = prev.filter(n => n.postgresId);
          const combined = [...pgNotifs];
          notifs.forEach(fn => {
            if (!combined.some(p => p.id === fn.id)) combined.push(fn);
          });
          return combined.sort((a, b) => {
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
            return dateB.getTime() - dateA.getTime();
          });
        });
      }, (error) => {
        console.warn('[useNotifications] Firestore onSnapshot warning:', error.message);
      });

      return () => unsubscribe();
    } catch {
      // Offline fallback already in state
    }
  }, [tenantId, userId]);

  const markAsRead = useCallback(async (notificationId: string) => {
    // Track locally so Firestore re-sync does not revert
    localReadIds.current.add(notificationId);
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
    );

    try {
      await NotificationAPI.markAsRead(notificationId);
      if (userId) {
        const docRef = doc(db, 'users', userId, 'notifications', notificationId);
        await updateDoc(docRef, { isRead: true }).catch(() => {});
      }
    } catch (err) {
      console.warn('Mark as read API warning:', err);
    }
  }, [userId]);

  const markAllAsRead = useCallback(async () => {
    notifications.forEach((n) => {
      if (!n.isRead) {
        localReadIds.current.add(n.id);
      }
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));

    try {
      await NotificationAPI.markAllAsRead();
      if (userId) {
        const batch = writeBatch(db);
        notifications.filter(n => !n.isRead).forEach((notif) => {
          const docRef = doc(db, 'users', userId, 'notifications', notif.id);
          batch.update(docRef, { isRead: true });
        });
        await batch.commit().catch(() => {});
      }
    } catch (err) {
      console.warn('Mark all as read API warning:', err);
    }
  }, [userId, notifications]);

  const deleteNotification = useCallback(async (notificationId: string) => {
    // Track locally so Firestore re-sync does not bring it back
    localDeletedIds.current.add(notificationId);
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));

    try {
      await NotificationAPI.deleteNotification(notificationId);
      if (userId) {
        const docRef = doc(db, 'users', userId, 'notifications', notificationId);
        await deleteDoc(docRef).catch(() => {});
      }
    } catch (err) {
      console.warn('Delete notification API warning:', err);
    }
  }, [userId]);

  const deleteAllNotifications = useCallback(async () => {
    // Mark all current IDs as locally deleted
    notifications.forEach((n) => localDeletedIds.current.add(n.id));
    setNotifications([]);

    try {
      await NotificationAPI.deleteAllNotifications();
      if (userId) {
        const batch = writeBatch(db);
        notifications.forEach((notif) => {
          const docRef = doc(db, 'users', userId, 'notifications', notif.id);
          batch.delete(docRef);
        });
        await batch.commit().catch(() => {});
      }
    } catch (err) {
      console.warn('Delete all notifications API warning:', err);
    }
  }, [userId, notifications]);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
  };
};
