// src/core/api/lesson/lesson-tenant.api.ts

import { api } from "../../../config/axios";

export interface LessonTenant {
  id?: string;
  lessonId?: string;
  tenantId?: string;
  [key: string]: any;
}

export const getLessonTenantsApi =
  async (
    lessonId: string
  ): Promise<LessonTenant[]> => {
    const res = await api.get(
      `/lessons/${lessonId}/tenants`
    );

    return (
      res.data?.tenants ||
      res.data?.data ||
      []
    );
  };

export const getLessonTenantByIdApi =
  async (
    lessonId: string,
    tenantId: string
  ): Promise<LessonTenant> => {
    const res = await api.get(
      `/lessons/${lessonId}/tenants/${tenantId}`
    );

    return (
      res.data?.tenant ||
      res.data?.data ||
      res.data
    );
  };

export const createLessonTenantApi =
  async (
    lessonId: string,
    payload: Partial<LessonTenant>
  ): Promise<LessonTenant> => {
    const res = await api.post(
      `/lessons/${lessonId}/tenants`,
      payload
    );

    return (
      res.data?.tenant ||
      res.data?.data ||
      res.data
    );
  };

export const updateLessonTenantApi =
  async (
    lessonId: string,
    tenantId: string,
    payload: Partial<LessonTenant>
  ): Promise<LessonTenant> => {
    const res = await api.put(
      `/lessons/${lessonId}/tenants/${tenantId}`,
      payload
    );

    return (
      res.data?.tenant ||
      res.data?.data ||
      res.data
    );
  };

export const deleteLessonTenantApi =
  async (
    lessonId: string,
    tenantId: string
  ) => {
    const res = await api.delete(
      `/lessons/${lessonId}/tenants/${tenantId}`
    );

    return res.data;
  };