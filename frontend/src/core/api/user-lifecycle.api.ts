import { api } from '../../config/axios';

export interface UserAccountStatus {
    userId: string;
    email: string;
    status: string;
    deletedAt: string | null;
    purgeScheduledAt: string | null;
}

export interface ReactivateAccountPayload {
    email?: string;
    userId?: string;
}

export const UserLifecycleAPI = {
    /**
     * Get live user status and deletedAt timestamp from the database
     * GET /api/v1/user-lifecycle/status?email=...
     */
    getAccountStatus: async (params: { email?: string; userId?: string }): Promise<UserAccountStatus> => {
        const { data } = await api.get('/user-lifecycle/status', { params });
        return data.data;
    },

    /**
     * Reactivate an account during the 30-day grace period
     * POST /api/v1/user-lifecycle/reactivate (or fallback to /me/reactivate)
     */
    reactivateAccount: async (payload: ReactivateAccountPayload) => {
        try {
            const { data } = await api.post('/user-lifecycle/reactivate', payload);
            return data;
        } catch {
            const { data } = await api.post('/user-lifecycle/me/reactivate', payload);
            return data;
        }
    },

    initiateDeactivateOtp: async () => {
        return api.post('/user-lifecycle/me/deactivate/initiate-otp');
    },

    selfDeactivate: async (data: { leavingReason?: string; additionalFeedback?: string; otp: string }) => {
        return api.post('/user-lifecycle/me/deactivate', data);
    },

    adminChangeStatus: async (userId: string, status: string, reason?: string, internalNotes?: string, suspendDurationDays?: number, notifyUser?: boolean) => {
        return api.post(`/user-lifecycle/admin/users/${userId}/status`, { status, reason, internalNotes, suspendDurationDays, notifyUser });
    },

    adminHardPurge: async (userId: string) => {
        return api.post(`/user-lifecycle/admin/users/${userId}/hard-purge`);
    }
};
