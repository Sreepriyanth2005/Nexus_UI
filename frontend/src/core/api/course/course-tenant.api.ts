// src/core/api/course/course-tenant.api.ts

import { api } from "../../../config/axios";

export const getCourseTenantsApi =
  async (
    courseId: string
  ) => {
    const res = await api.get(
      `/courses/${courseId}/tenants`
    );

    return (
      res.data?.tenants ||
      res.data?.data ||
      []
    );
  };

export const getCourseTenantByIdApi =
  async (
    courseId: string,
    tenantId: string
  ) => {
    const res = await api.get(
      `/courses/${courseId}/tenants/${tenantId}`
    );

    return (
      res.data?.tenant ||
      res.data?.data ||
      res.data
    );
  };

export const createCourseTenantApi =
  async (
    courseId: string,
    data: any
  ) => {
    const res = await api.post(
      `/courses/${courseId}/tenants`,
      data
    );

    return (
      res.data?.tenant ||
      res.data?.data ||
      res.data
    );
  };

export const updateCourseTenantApi =
  async (
    courseId: string,
    tenantId: string,
    data: any
  ) => {
    const res = await api.put(
      `/courses/${courseId}/tenants/${tenantId}`,
      data
    );

    return (
      res.data?.tenant ||
      res.data?.data ||
      res.data
    );
  };

export const deleteCourseTenantApi =
  async (
    courseId: string,
    tenantId: string
  ) => {
    const res = await api.delete(
      `/courses/${courseId}/tenants/${tenantId}`
    );

    return res.data;
  };