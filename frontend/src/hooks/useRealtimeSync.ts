import { useEffect } from 'react';
import { doc, onSnapshot, collection, query, where, limit, orderBy, QuerySnapshot, DocumentData } from 'firebase/firestore';
import { useQueryClient } from '@tanstack/react-query';
import { db } from '../core/integrations/firebase';
import { useUserStore } from '../store/user.store';
import { useProfileStore } from '../store/profile.store';
import { useRolesPermissionsStore } from '../store/rolesPermissions.store';

export const REALTIME_EVENTS = {
  USER_UPDATED: 'realtime-user-updated',
  ROLES_UPDATED: 'realtime-roles-updated',
  ASSIGNMENTS_UPDATED: 'realtime-assignments-updated',
  PROGRESS_UPDATED: 'realtime-progress-updated',
  COURSES_UPDATED: 'realtime-courses-updated',
  LESSONS_UPDATED: 'realtime-lessons-updated',
  CAREER_PATHS_UPDATED: 'realtime-career-paths-updated',
} as const;

export const useRealtimeSync = () => {
  // In static wireframe mode, realtime backend listeners are bypassed for snappy local performance
  return;
  const { user, updateUser } = useUserStore();
  const setProfile = useProfileStore((state) => state.setProfile);
  // Roles UI state can be accessed here if needed, but not used directly.
  useRolesPermissionsStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user?.id) return;

    // 1. User & Profile Synchronization (Modules 1 & 2)
    const userDocRef = doc(db, 'users', user.id);
    const unsubscribeUser = onSnapshot(userDocRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();

        // Update User Store
        const updatePayload: any = {};
        if (data.status !== undefined) updatePayload.status = data.status;
        if (data.roles !== undefined) updatePayload.roles = data.roles;

        if (Object.keys(updatePayload).length > 0) {
          updateUser(updatePayload);
        }

        // Update Profile Store with enriched data if available
        if (data.profile) {
          setProfile(data.profile);
        }

        window.dispatchEvent(new CustomEvent(REALTIME_EVENTS.USER_UPDATED, { detail: data }));
        queryClient.invalidateQueries({ queryKey: ['profile'] });
        queryClient.invalidateQueries({ queryKey: ['userProfile'] });
        queryClient.invalidateQueries({ queryKey: ['user', user.id] });
      }
    }, (error) => {
      console.warn('[useRealtimeSync] Firestore user listener error:', error);
    });

    // 2. Roles & Admin Permissions (Module 13)
    const rolesDocRef = doc(db, 'user_roles', user.id);
    const unsubscribeRoles = onSnapshot(rolesDocRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        window.dispatchEvent(new CustomEvent(REALTIME_EVENTS.ROLES_UPDATED, { detail: data }));
        queryClient.invalidateQueries({ queryKey: ['rolesPermissions'] });
        queryClient.invalidateQueries({ queryKey: ['roles'] });
        queryClient.invalidateQueries({ queryKey: ['user-roles'] });
        queryClient.invalidateQueries({ queryKey: ['permission-matrix'] });
      }
    }, (error) => {
      console.warn('[useRealtimeSync] Firestore roles listener error:', error);
    });

    // 3. Corporate Course Assignments (Module 19)
    const assignmentsQuery = query(collection(db, 'assignments'), where('userId', '==', user.id));
    const unsubscribeAssignments = onSnapshot(assignmentsQuery, (snapshot: QuerySnapshot<DocumentData>) => {
      const data = snapshot.docs.map((d) => d.data());
      window.dispatchEvent(new CustomEvent(REALTIME_EVENTS.ASSIGNMENTS_UPDATED, { detail: data }));
      queryClient.invalidateQueries({ queryKey: ['memberLearning'] });
      queryClient.invalidateQueries({ queryKey: ['enrolledCourses'] });
      queryClient.invalidateQueries({ queryKey: ['enrolled-career-paths'] });
      queryClient.invalidateQueries({ queryKey: ['availableCourses'] });
      queryClient.invalidateQueries({ queryKey: ['availableCareerPaths'] });
      queryClient.invalidateQueries({ queryKey: ['availableLessons'] });
      queryClient.invalidateQueries({ queryKey: ['corporate-learning'] });
      queryClient.invalidateQueries({ queryKey: ['tenantUsers'] });
    }, (error) => {
      console.warn('[useRealtimeSync] Firestore assignments listener error:', error);
    });

    // 4. Progress & Continuity (Module 4, 9, 10)
    const progressQuery = query(collection(db, 'progress'), where('userId', '==', user.id));
    const unsubscribeProgress = onSnapshot(progressQuery, (snapshot: QuerySnapshot<DocumentData>) => {
      const data = snapshot.docs.map((d) => d.data());
      window.dispatchEvent(new CustomEvent(REALTIME_EVENTS.PROGRESS_UPDATED, { detail: data }));
      queryClient.invalidateQueries({ queryKey: ['memberLearning'] });
      queryClient.invalidateQueries({ queryKey: ['completedCourses'] });
      queryClient.invalidateQueries({ queryKey: ['courseDetails'] });
      queryClient.invalidateQueries({ queryKey: ['progress'] });
      queryClient.invalidateQueries({ queryKey: ['unified-lessons'] });
    }, (error) => {
      console.warn('[useRealtimeSync] Firestore progress listener error:', error);
    });

    // 5. System Sync (Prisma Middleware Events)
    const handleSystemSyncEvent = (snapshot: QuerySnapshot<DocumentData>) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const event = change.doc.data();
          const { table, action, entityId, tenantId, userId: eventUserId } = event;
          
          switch (table) {
            case 'Course':
              queryClient.invalidateQueries({ queryKey: ['courses'] });
              queryClient.invalidateQueries({ queryKey: ['courseDetails'] });
              queryClient.invalidateQueries({ queryKey: ['availableCourses'] });
              queryClient.invalidateQueries({ queryKey: ['adminCourses'] });
              queryClient.invalidateQueries({ queryKey: ['developerDashboard'] });
              window.dispatchEvent(new CustomEvent(REALTIME_EVENTS.COURSES_UPDATED, { detail: event }));
              break;
            case 'Lesson':
              queryClient.invalidateQueries({ queryKey: ['lessons'] });
              queryClient.invalidateQueries({ queryKey: ['unified-lessons'] });
              queryClient.invalidateQueries({ queryKey: ['availableLessons'] });
              queryClient.invalidateQueries({ queryKey: ['developerDashboard'] });
              window.dispatchEvent(new CustomEvent(REALTIME_EVENTS.LESSONS_UPDATED, { detail: event }));
              break;
            case 'CareerPath':
              queryClient.invalidateQueries({ queryKey: ['careerPaths'] });
              queryClient.invalidateQueries({ queryKey: ['enrolled-career-paths'] });
              queryClient.invalidateQueries({ queryKey: ['availableCareerPaths'] });
              queryClient.invalidateQueries({ queryKey: ['admin-learning-paths'] });
              queryClient.invalidateQueries({ queryKey: ['developerDashboard'] });
              window.dispatchEvent(new CustomEvent(REALTIME_EVENTS.CAREER_PATHS_UPDATED, { detail: event }));
              break;
            case 'User':
            case 'InternalUser':
              queryClient.invalidateQueries({ queryKey: ['users'] });
              queryClient.invalidateQueries({ queryKey: ['internal-users'] });
              break;
            case 'Tenant':
              queryClient.invalidateQueries({ queryKey: ['tenant'] });
              queryClient.invalidateQueries({ queryKey: ['tenants'] });
              break;
            case 'Role':
              queryClient.invalidateQueries({ queryKey: ['roles'] });
              queryClient.invalidateQueries({ queryKey: ['rolesPermissions'] });
              break;
            case 'CourseProgress':
            case 'LessonProgress':
            case 'CareerPathProgress':
              queryClient.invalidateQueries({ queryKey: ['progress'] });
              queryClient.invalidateQueries({ queryKey: ['memberLearning'] });
              queryClient.invalidateQueries({ queryKey: ['enrolledCourses'] });
              queryClient.invalidateQueries({ queryKey: ['enrolled-career-paths-player'] });
              queryClient.invalidateQueries({ queryKey: ['lesson-player'] });
              queryClient.invalidateQueries({ queryKey: ['course'] });
              break;
            case 'ContentReview':
              queryClient.invalidateQueries({ queryKey: ['review-queue'] });
              queryClient.invalidateQueries({ queryKey: ['review-queue-pending'] });
              queryClient.invalidateQueries({ queryKey: ['review-queue-approved'] });
              queryClient.invalidateQueries({ queryKey: ['review-queue-rejected'] });
              queryClient.invalidateQueries({ queryKey: ['review-queue-statistics'] });
              queryClient.invalidateQueries({ queryKey: ['sme-review-queue'] });
              queryClient.invalidateQueries({ queryKey: ['sme-review-queue-statistics'] });
              queryClient.invalidateQueries({ queryKey: ['smeDashboard'] });
              queryClient.invalidateQueries({ queryKey: ['developerDashboard'] });
              break;
            case 'ContentWorkflowLog':
              queryClient.invalidateQueries({ queryKey: ['version-history'] });
              queryClient.invalidateQueries({ queryKey: ['developerDashboard'] });
              break;
          }
        }
      });
    };

    const unsubscribes: (() => void)[] = [];

    // Global events
    const globalSyncQuery = query(collection(db, 'system_sync/global/events'), orderBy('createdAt', 'desc'), limit(10));
    unsubscribes.push(onSnapshot(globalSyncQuery, handleSystemSyncEvent, (error) => {
      console.warn('[useRealtimeSync] Global system_sync error:', error);
    }));

    // User-specific events
    const userSyncQuery = query(collection(db, `system_sync/users/${user.id}/events/log`), orderBy('createdAt', 'desc'), limit(10));
    unsubscribes.push(onSnapshot(userSyncQuery, handleSystemSyncEvent, (error) => {
      console.warn('[useRealtimeSync] User system_sync error:', error);
    }));

    // Tenant-specific events (if applicable, using user.tenantId if present on user model)
    const tenantId = (user as any).tenantId;
    if (tenantId) {
      const tenantSyncQuery = query(collection(db, `system_sync/tenants/${tenantId}/events/log`), orderBy('createdAt', 'desc'), limit(10));
      unsubscribes.push(onSnapshot(tenantSyncQuery, handleSystemSyncEvent, (error) => {
        console.warn('[useRealtimeSync] Tenant system_sync error:', error);
      }));
    }

    return () => {
      unsubscribeUser();
      unsubscribeRoles();
      unsubscribeAssignments();
      unsubscribeProgress();
      unsubscribes.forEach(unsub => unsub());
    };
  }, [user?.id, updateUser, setProfile, queryClient]);
};

/**
 * Reusable custom hook for subscribing to real-time custom events.
 */
export function useRealtimeListener<T = any>(
  eventName: string,
  callback: (detail: T) => void,
  deps: React.DependencyList = []
) {
  useEffect(() => {
    const handleEvent = (event: Event) => {
      const customEvent = event as CustomEvent<T>;
      callback(customEvent.detail);
    };

    window.addEventListener(eventName, handleEvent);
    return () => {
      window.removeEventListener(eventName, handleEvent);
    };
  }, [eventName, ...deps]);
}

/**
 * Reusable hooks for specific real-time topics
 */
export function useRealtimeRolesSync(callback: (rolesDetail: any) => void, deps: React.DependencyList = []) {
  useRealtimeListener(REALTIME_EVENTS.ROLES_UPDATED, callback, deps);
}

export function useRealtimeAssignmentsSync(callback: (assignments: any[]) => void, deps: React.DependencyList = []) {
  useRealtimeListener(REALTIME_EVENTS.ASSIGNMENTS_UPDATED, callback, deps);
}

export function useRealtimeProgressSync(callback: (progressData: any[]) => void, deps: React.DependencyList = []) {
  useRealtimeListener(REALTIME_EVENTS.PROGRESS_UPDATED, callback, deps);
}

export function useRealtimeUserSync(callback: (userData: any) => void, deps: React.DependencyList = []) {
  useRealtimeListener(REALTIME_EVENTS.USER_UPDATED, callback, deps);
}

export function useRealtimeCoursesSync(callback: (courses: any[]) => void, deps: React.DependencyList = []) {
  useRealtimeListener(REALTIME_EVENTS.COURSES_UPDATED, callback, deps);
}

export function useRealtimeLessonsSync(callback: (lessons: any[]) => void, deps: React.DependencyList = []) {
  useRealtimeListener(REALTIME_EVENTS.LESSONS_UPDATED, callback, deps);
}

export function useRealtimeCareerPathsSync(callback: (careerPaths: any[]) => void, deps: React.DependencyList = []) {
  useRealtimeListener(REALTIME_EVENTS.CAREER_PATHS_UPDATED, callback, deps);
}
