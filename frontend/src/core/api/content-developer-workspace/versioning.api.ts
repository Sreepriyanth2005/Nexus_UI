// src/core/api/content-developer-workspace/versioning.api.ts
// Provides the CD-facing versioning API calls:
//   1. unlockContentForEditingApi — POST /reviews/:entityType/:entityId/unlock
//   2. getVersionHistoryApi       — GET  /reviews/:entityType/:entityId/history  (reuses existing endpoint)

import { api } from "../../../config/axios";

export type VersionEntityType = "course" | "career-path" | "lesson";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface VersionSnapshot {
  id: string;
  version: number;
  isActive: boolean;
  changeSummary: string | null;
  changedBy: string;
  createdAt: string;
  changedByUser?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  } | null;
}

export interface UnlockContentResult {
  id: string;
  status: string;
}

// ---------------------------------------------------------------------------
// API Calls
// ---------------------------------------------------------------------------

/**
 * Unlocks a PUBLISHED entity for editing by a Content Developer.
 * Transitions the entity from PUBLISHED to DRAFT and persists the
 * change summary to the DB version record.
 *
 * POST /api/v1/reviews/:entityType/:entityId/unlock
 */
export const unlockContentForEditingApi = async (
  entityType: VersionEntityType,
  entityId: string,
  payload: {
    unlockedById: string;
    changeSummary: string;
  }
): Promise<UnlockContentResult> => {
  const res = await api.post(`/reviews/${entityType}/${entityId}/unlock`, payload);
  // Normalise envelope: backend returns { success, message, data: { id, status } }
  const data = res.data?.data ?? res.data;
  return data as UnlockContentResult;
};

/**
 * Returns the version history snapshots for a given entity.
 * Reuses the existing GET /reviews/:entityType/:entityId/history endpoint
 * which already includes a versionSnapshots array.
 */
export const getVersionHistoryApi = async (
  entityType: VersionEntityType,
  entityId: string
): Promise<VersionSnapshot[]> => {
  const res = await api.get(`/reviews/${entityType}/${entityId}/history`);
  const historyData = res.data?.data ?? res.data;
  const snapshots: VersionSnapshot[] = historyData?.versionSnapshots ?? [];
  // Sort ascending by version number for a chronological view
  return [...snapshots].sort((a, b) => a.version - b.version);
};

/**
 * Saves or updates the change summary in the DB for an in-progress version edit.
 *
 * POST /api/v1/reviews/:entityType/:entityId/change-summary
 */
export const saveChangeSummaryApi = async (
  entityType: VersionEntityType,
  entityId: string,
  changeSummary: string
): Promise<{ success: boolean; changeSummary: string }> => {
  const res = await api.post(`/reviews/${entityType}/${entityId}/change-summary`, { changeSummary });
  const data = res.data?.data ?? res.data;
  return data;
};

