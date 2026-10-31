import { api } from "../../../config/axios";
import { getSubjectById, getSubjects } from "../subject.api";
import { courseApi } from "../course/course.api";
import {
  getCareerPathApi,
  updateCareerPathApi,
  CareerPath,
} from "../career-path/career-path.api";
import {
  getCareerPathCoursesApi,
  createCareerPathCourseApi,
  deleteCareerPathCourseApi,
  reorderCareerPathCourseApi,
} from "../career-path/careerpath-course.api";
import {
  AdminLearningPathDto,
  LearningPathUpdateDto,
  LearningPathFormModel,
  SubjectDto,
  CourseSelectionDto,
} from "./adminLearningPath.types";

export const mapLearningPathToViewModel = async (
  path: CareerPath
): Promise<AdminLearningPathDto> => {
  const p: any = path;

  // Fetch courses assigned to this learning path
  let pathCourses: any[] = [];
  if (Array.isArray(p.courses) && p.courses.length > 0) {
    pathCourses = p.courses;
  } else {
    try {
      pathCourses = await getCareerPathCoursesApi(p.id);
    } catch (error) {
      console.error(`Failed to fetch courses for career path ${p.id}:`, error);
    }
  }

  const rawTags = p.careerPathTags && Array.isArray(p.careerPathTags)
    ? p.careerPathTags.map((ct: any) => ct.tag?.name || ct.name).filter(Boolean)
    : Array.isArray(p.tags) ? p.tags : [];

  const rawSkills = p.skillTags && Array.isArray(p.skillTags)
    ? p.skillTags.map((st: any) => st.skill?.name || st.name).filter(Boolean)
    : Array.isArray(p.skills) ? p.skills : [];

  const instructorName = p.instructor?.profile?.firstName
    ? `${p.instructor.profile.firstName} ${p.instructor.profile.lastName || ""}`.trim()
    : p.instructor?.name || (p.createdBy?.profile?.firstName ? `${p.createdBy.profile.firstName} ${p.createdBy.profile.lastName || ""}`.trim() : (p.authorName || p.instructor || "Nexus Academy"));

  // Parse details
  return {
    ...p,
    id: p.id,
    title: p.title,
    subtitle: p.subtitle || "",
    description: p.description || p.fullDescription || "",
    fullDescription: p.fullDescription || p.description || "",
    categoryId: p.categoryId || p.category?.id || "",
    subjectId: p.subjectId || p.subject?.id || "",
    difficulty: p.difficulty || "BEGINNER",
    visibility: p.visibility || "PUBLIC_CATALOG",
    status: p.status || "DRAFT",
    personaIds: p.personaIds || (p.careerPathPersonas?.map((cp: any) => cp.personaId || cp.id)) || [],
    tenantIds: p.tenantIds || (p.careerPathTenants?.map((ct: any) => ct.tenantId || ct.id)) || [],
    duration: p.estimatedDuration || p.duration || 0,
    estimatedDuration: p.estimatedDuration || p.duration || 0,
    instructor: instructorName,
    authorName: instructorName,
    pricing: p.priceTier === "PAID" ? "Paid" : (p.pricing || ""),
    priceTier: p.priceTier || "FREE",
    whatIsIncluded: typeof p.whatIsIncluded === "object" ? (Array.isArray(p.whatIsIncluded) ? p.whatIsIncluded.join("\n") : JSON.stringify(p.whatIsIncluded)) : (p.whatIsIncluded || ""),
    learningOutcome: typeof p.learningOutcomes === "object" ? (Array.isArray(p.learningOutcomes) ? p.learningOutcomes.join("\n") : JSON.stringify(p.learningOutcomes)) : (p.learningOutcome || ""),
    learningOutcomes: p.learningOutcomes,
    tags: rawTags,
    careerPathTags: p.careerPathTags || [],
    skills: rawSkills,
    skillTags: p.skillTags || [],
    coverImageUrl: p.coverImageUrl || p.coverImageAsset?.fileUrl || "",
    coverImageAsset: p.coverImageAsset,
    previewUrl: p.previewUrl || p.previewAsset?.fileUrl || "",
    previewAsset: p.previewAsset,
    careerPathTenants: p.careerPathTenants || [],
    careerPathPersonas: p.careerPathPersonas || [],
    assessmentRequired: Boolean(p.assessmentRequired),
    courses: pathCourses.map((pc: any, idx: number) => ({
      id: pc.courseId || pc.course?.id || pc.id,
      title: pc.course?.title || pc.title || `Course ${idx + 1}`,
      instructor: pc.course?.instructor || pc.instructor || "Nexus Instructor",
      duration: pc.course?.duration ? `${pc.course.duration} hrs` : (pc.duration ? `${pc.duration} hrs` : "4 hrs"),
      isMandatory: pc.isMandatory !== undefined ? pc.isMandatory : true,
      sequence: pc.sequenceOrder ?? pc.sequence ?? idx + 1,
      sequenceOrder: pc.sequenceOrder ?? pc.sequence ?? idx + 1,
    })),
  };
};

export const getLearningPath = async (id: string): Promise<AdminLearningPathDto> => {
  const response = await getCareerPathApi(id);
  return mapLearningPathToViewModel(response.data);
};

export const updateLearningPath = async (
  id: string,
  payload: {
    formModel: LearningPathFormModel;
    updatedCourses: { id: string; title: string }[];
    originalCourses: { id: string; title: string }[];
  }
): Promise<any> => {
  const { formModel, updatedCourses, originalCourses } = payload;

  // 1. Update basic information
  const updatePayload: LearningPathUpdateDto = {
    title: formModel.title,
    description: formModel.description,
    fullDescription: formModel.description,
    categoryId: formModel.categoryId || undefined,
    subjectId: formModel.subjectId || undefined,
    difficulty: formModel.difficulty,
    visibility:
      formModel.visibility === "Corporate" || formModel.visibility === "TENANT_ONLY"
        ? "TENANT_ONLY"
        : "PUBLIC_CATALOG",
    status:
      formModel.status === "Published" || formModel.status === "PUBLISHED"
        ? "PUBLISHED"
        : formModel.status === "Under Review" || formModel.status === "UNDER_REVIEW" || formModel.status === "In SME Review"
        ? "UNDER_REVIEW"
        : formModel.status === "Rejected" || formModel.status === "REJECTED"
        ? "REJECTED"
        : "DRAFT",
    duration: formModel.duration ? Number(formModel.duration) : 0,
    estimatedDuration: formModel.duration ? Number(formModel.duration) : 0,
    instructor: formModel.instructor,
    authorName: formModel.instructor,
    whatIsIncluded: formModel.whatIsIncluded,
    learningOutcome: formModel.learningOutcome,
    tags: formModel.tags,
    skills: formModel.skills,
  };

  const response = await updateCareerPathApi({ id, data: updatePayload });

  // 2. Synchronize courses
  const originalIds = originalCourses.map((c) => c.id);
  const updatedIds = updatedCourses.map((c) => c.id);

  // A. Delete removed courses
  const toDelete = originalIds.filter((cid) => !updatedIds.includes(cid));
  for (const courseId of toDelete) {
    try {
      await deleteCareerPathCourseApi(id, courseId);
    } catch (e) {
      console.error(`Failed to remove course ${courseId} from path:`, e);
    }
  }

  // B. Add new courses
  const toAdd = updatedIds.filter((cid) => !originalIds.includes(cid));
  for (const courseId of toAdd) {
    try {
      await createCareerPathCourseApi(id, { courseId });
    } catch (e) {
      console.error(`Failed to add course ${courseId} to path:`, e);
    }
  }

  // C. Reorder courses if sequence has changed
  const orderChanged = JSON.stringify(originalIds.filter(id => updatedIds.includes(id))) !== JSON.stringify(updatedIds.filter(id => originalIds.includes(id)));
  if (orderChanged || toAdd.length > 0) {
    try {
      await reorderCareerPathCourseApi(id, updatedIds);
    } catch (e) {
      console.error("Failed to reorder courses on path:", e);
    }
  }

  return response;
};

export const getSubjectsList = async (): Promise<SubjectDto[]> => {
  const response = await getSubjects();
  return response.data || [];
};

export const getCoursesList = async (): Promise<CourseSelectionDto[]> => {
  const response = await courseApi.list({ limit: 100 });
  const coursesList = response.data?.data || [];
  return coursesList.map((c: any) => ({
    id: c.id,
    title: c.title,
  }));
};
