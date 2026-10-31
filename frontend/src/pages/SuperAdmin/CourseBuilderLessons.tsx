
// src/components/course-builder/CourseBuilderLessons.tsx
import React from "react";
import { useNavigate } from "react-router";
import Select from "react-select";
import { useLesson, useDeleteLesson, useUpdateLesson, useLessons } from "../../hooks/lesson/useLessons";
import { useCourses } from "../../hooks/course/useCourses";
import { getCareerPathCoursesApi, deleteCareerPathCourseApi, createCareerPathCourseApi } from "../../core/api/career-path/careerpath-course.api";
import { useCourseLessons, useAssignLessonToCourse, useReorderLessons, useDeleteLessonFromCourse } from "../../hooks/Reorder/useReorderLesson";
import { useReorderCourses } from "../../hooks/Reorder/useReorderCourse";
import { useQuery, useQueries, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCourseLessonsApi } from "../../core/api/Reorder/ReorderLessons.api";
import { courseApi } from "../../core/api/course/course.api";
import { ChevronDown, ChevronUp, Inbox, ArrowUp, ArrowDown, Trash2, Video, CheckSquare } from "lucide-react";
import { Modal, Button, Input, notification } from "antd";
import StandaloneCourse, { StandaloneCourseFormData } from "./StandaloneCourse";
import { useUserStore } from "../../store/user.store";
export type PublishType = "career-path" | "standalone-course" | "standalone-lesson";

export interface CourseLesson {
  id: string;
  title: string;
  lessonType: string;
  duration?: number;
  shortDescription?: string;
  status?: string;
  lessonContents?: any[];
  ownerId?: string;
}

interface Props {
  publishType: PublishType;
  courseId?: string | null;
  lessonId?: string | null;
  careerPathId?: string | null;
  inlineCourseTitle?: string | null;
  lessons: CourseLesson[];
  careerPathCourseIds?: string[];
  constituentLessonIds?: string[];
  onAdd: (lessonType: string, courseId?: string) => void;
  onEdit: (lesson: CourseLesson, courseId?: string) => void;
  onDelete: (lessonId: string) => void;
  onUpdateCourses?: (courseIds: string[]) => void;
  previewLessonIds?: string[];
  setPreviewLessonIds?: (ids: string[]) => void;
  courseOptions?: { value: string; label: string }[];
  onUpdateLesson?: (updatedLesson: CourseLesson) => void;
  onMapExistingLessons?: (lessons: any[], courseId?: string) => void;
  subjects?: any[];
  categories?: any[];
}

// Badge helper
const getLessonTypeBadge = (type?: string) => {
  const styles: Record<string, string> = {
    VIDEO: "bg-blue-100 text-blue-700",
    PDF: "bg-red-100 text-red-700",
    TEXT: "bg-amber-100 text-amber-700",
    SCORM: "bg-indigo-100 text-indigo-700",
    AUDIO: "bg-green-100 text-green-700",
    LIVE: "bg-purple-100 text-purple-700",
  };
  return styles[(type || "").toUpperCase()] || "bg-gray-100 text-gray-700";
};

// DB-backed Unique Supporting Materials Helper
export const getUniqueLessonMaterials = (lesson: any): any[] => {
  if (!lesson) return [];

  const candidates: any[] = [];

  // 1. From attachments / lessonAttachments (junction rows)
  const attachments = Array.isArray(lesson.attachments)
    ? lesson.attachments
    : Array.isArray(lesson.lessonAttachments)
    ? lesson.lessonAttachments
    : [];

  for (const att of attachments) {
    if (!att) continue;
    const canonicalId = att.assetId || att.asset?.id || att.id;
    candidates.push({
      assetId: canonicalId,
      url: att.url || att.asset?.url || att.signedUrl || att.asset?.signedUrl || "",
      name: att.name || att.fileName || att.originalFileName || att.originalFilename || att.asset?.originalFileName || att.asset?.name || "",
    });
  }

  // 2. From assetsStorage (storage assets associated with this lesson)
  if (Array.isArray(lesson.assetsStorage)) {
    for (const a of lesson.assetsStorage) {
      if (!a) continue;
      const sPath = String(a.storagePath || "").toLowerCase();
      const aContext = String(a.assetContext || "").toUpperCase();
      const aRole = String(a.assetRole || "").toUpperCase();
      const aType = String(a.assetType || "").toUpperCase();

      const isMaterial =
        sPath === "attachments" ||
        sPath === "resources" ||
        aContext === "LESSON_ATTACHMENT" ||
        aContext === "SUPPORTING_MATERIAL" ||
        aContext === "LESSON_RESOURCE" ||
        aRole === "ATTACHMENT" ||
        aRole === "SUPPORTING_MATERIAL" ||
        aRole === "RESOURCE" ||
        (aType === "DOCUMENT" && sPath !== "transcripts" && aRole !== "TRANSCRIPT" && aContext !== "LESSON_TRANSCRIPT");

      if (isMaterial) {
        candidates.push({
          assetId: a.id || a.assetId,
          url: a.url || a.signedUrl || "",
          name: a.originalFileName || a.originalFilename || a.name || a.fileName || a.assetName || "",
        });
      }
    }
  }

  // 3. Direct supporting material fields
  if (lesson.supportingMaterialAssetId || lesson.supportingMaterialUrl || lesson.supportingMaterialFile) {
    candidates.push({
      assetId: lesson.supportingMaterialAssetId,
      url: lesson.supportingMaterialUrl || "",
      name: lesson.supportingMaterialName || (lesson.supportingMaterialFile ? lesson.supportingMaterialFile.name : "") || "Supporting Material",
    });
  }

  // Deduplicate strictly by canonical asset identity, normalized URL, and display file name
  const seenIds = new Set<string>();
  const seenUrls = new Set<string>();
  const seenNames = new Set<string>();
  const uniqueMaterials: any[] = [];

  for (const item of candidates) {
    const id = item.assetId ? String(item.assetId).trim() : "";
    let cleanUrl = "";
    if (item.url) {
      try {
        cleanUrl = item.url.split("?")[0].trim().toLowerCase();
      } catch {
        cleanUrl = String(item.url).trim().toLowerCase();
      }
    }
    const cleanName = item.name ? String(item.name).trim().toLowerCase() : "";

    if (id && seenIds.has(id)) continue;
    if (cleanUrl && seenUrls.has(cleanUrl)) continue;
    if (cleanName && seenNames.has(cleanName)) continue;

    if (id) seenIds.add(id);
    if (cleanUrl) seenUrls.add(cleanUrl);
    if (cleanName) seenNames.add(cleanName);
    uniqueMaterials.push(item);
  }

  return uniqueMaterials;
};

export const getLessonMaterialsCount = (lesson: any): number => {
  return getUniqueLessonMaterials(lesson).length;
};

// Reusable Lesson Card
function LessonCard({
  lesson,
  index,
  onEdit,
  onDelete,
  deleteDisabled = false,
  badge,
  onDragStart,
  onDragOver,
  onDrop,
  onRemoveStudyContent,
  canEdit = true,
}: {
  lesson: CourseLesson;
  index: number;
  onEdit?: (l: CourseLesson) => void;
  onDelete?: (id: string) => void;
  deleteDisabled?: boolean;
  badge?: string;
  onDragStart?: (e: React.DragEvent, index: number) => void;
  onDragOver?: (e: React.DragEvent, index: number) => void;
  onDrop?: (e: React.DragEvent, index: number) => void;
  onRemoveStudyContent?: (lesson: CourseLesson) => void;
  canEdit?: boolean;
}) {
  const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);

  const blockCount = lesson.lessonContents?.reduce(
    (sum, content) => sum + (content.blocks?.length || 0),
    0
  ) ?? 0;

  return (
    <div
      className={`rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow transition-shadow ${onDragStart ? 'cursor-move' : ''}`}
      draggable={!!onDragStart}
      onDragStart={(e) => onDragStart && onDragStart(e, index)}
      onDragOver={(e) => {
        if (onDragOver) onDragOver(e, index);
        else e.preventDefault();
      }}
      onDrop={(e) => onDrop && onDrop(e, index)}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div className="cursor-move text-gray-400 text-lg">⋮⋮</div>

          <div className="rounded bg-gray-100 px-2 py-1 text-xs font-bold text-gray-500">
            L{index + 1}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded px-2 py-1 text-[10px] font-bold ${getLessonTypeBadge(lesson.lessonType)}`}>
                {lesson.lessonType}
              </span>

              {lesson.status && (
                <span className={`rounded px-2 py-1 text-[10px] font-semibold ${lesson.status === "PUBLISHED" ? "bg-green-100 text-green-700" :
                  lesson.status === "DRAFT" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-600"
                  }`}>
                  {lesson.status}
                </span>
              )}

              {(() => {
                const count = getLessonMaterialsCount(lesson);
                return count > 0 ? (
                  <span className="inline-flex items-center gap-1 bg-[#ebf7f0] text-[#2d9d68] text-xs font-semibold px-2 py-0.5 rounded-full border border-[#c4ebdb]">
                    📄 {count} Material{count > 1 ? "s" : ""}
                  </span>
                ) : null;
              })()}
            </div>

            <h3 className="mt-2 flex items-center gap-2 text-base font-semibold text-gray-900">
              <span className="truncate">{lesson.title}</span>
              {badge && (
                <span className="shrink-0 rounded bg-gray-200 px-2 py-0.5 text-[10px] font-bold text-gray-700">
                  {badge}
                </span>
              )}
            </h3>

            {lesson.shortDescription && (
              <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                {lesson.shortDescription}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-3">
          <div className="text-right text-sm">
            <p className="font-medium text-gray-700">
              {lesson.duration != null ? `${lesson.duration} min` : "0 min"}
            </p>
            <p className="text-xs text-emerald-600">
              {blockCount} block{blockCount !== 1 && "s"}
            </p>
            {blockCount > 0 && (
              <div className="flex gap-1.5 mt-1 text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(true)}
                  className="text-indigo-600 hover:text-indigo-800"
                >
                  Preview
                </button>
                <span className="text-gray-300">|</span>
                <button
                  type="button"
                  onClick={() => onRemoveStudyContent?.(lesson)}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove Content
                </button>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            {onEdit && canEdit && (
              <button
                type="button"
                onClick={() => onEdit(lesson)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
              >
                Edit
              </button>
            )}

            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(lesson.id)}
                disabled={deleteDisabled}
                className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modal for previewing study content */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-900 text-lg">Study Content Preview</h3>
              <button onClick={() => setIsPreviewOpen(false)} className="text-gray-500 hover:text-gray-700 text-xl font-bold">×</button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {lesson.lessonContents?.map((content: any) => (
                <div key={content.id} className="space-y-4">
                  <h4 className="font-bold text-gray-800 text-base">{content.title}</h4>
                  {content.blocks?.map((block: any) => {
                    if (block.blockType === "IMAGE" || block.type === "IMAGE") {
                      return (
                        <div key={block.id} className="space-y-1">
                          <img src={block.previewUrl || block.assetUrl || block.asset?.url} alt="Preview" className="max-h-[300px] w-full object-contain rounded-lg border" />
                          {block.caption && <p className="text-xs text-gray-500 text-center">{block.caption}</p>}
                        </div>
                      );
                    }
                    return (
                      <div key={block.id} className="space-y-1">
                        {(block.title || block.heading) && <h5 className="font-semibold text-gray-800 text-sm">{block.title || block.heading}</h5>}
                        <p className="text-sm text-gray-600 whitespace-pre-wrap">{block.textContent || block.content}</p>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
              <button onClick={() => setIsPreviewOpen(false)} className="bg-black hover:bg-gray-800 text-white font-semibold text-xs px-4 py-2 rounded-lg">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



// Standalone Lesson View
function StandaloneLessonView({
  lessonId,
  onEdit,
  onDelete,
  onRemoveStudyContent,
}: {
  lessonId?: string | null;
  onEdit: (l: CourseLesson) => void;
  onDelete: (id: string) => void;
  onRemoveStudyContent?: (lesson: CourseLesson) => void;
}) {
  const { data, isLoading, isError } = useLesson(lessonId || undefined);
  const lesson = ((data as any)?.data?.data || (data as any)?.data || data) as CourseLesson | undefined;
  const deleteLessonMutation = useDeleteLesson();

  return (
    <div className="mx-auto mt-8 px-4 sm:px-6 lg:px-8 relative">
      {deleteLessonMutation.isPending && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="flex flex-col items-center bg-white p-6 rounded-xl shadow-xl">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mb-4"></div>
            <p className="font-semibold text-gray-800 text-sm">Removing Lesson...</p>
          </div>
        </div>
      )}
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Standalone Lesson</h2>
        {lessonId && (
          <span className="rounded-full bg-purple-50 border border-purple-200 px-2.5 py-0.5 text-[11px] font-mono text-purple-700">
            ID: {lessonId}
          </span>
        )}
      </div>

      {!lessonId ? (
        <div className="rounded-xl border border-dashed border-gray-300 py-16 text-center">
          <p className="text-sm font-semibold text-gray-700">No lesson yet</p>
        </div>
      ) : isLoading ? (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mb-4"></div>
          <p className="text-gray-800 font-semibold text-sm">Loading lesson...</p>
        </div>
      ) : lesson ? (
        <LessonCard
          lesson={lesson}
          index={0}
          onDelete={(id) => {
            deleteLessonMutation.mutate(id, {
              onSuccess: () => onDelete(id)
            });
          }}
          deleteDisabled={deleteLessonMutation.isPending}
          onRemoveStudyContent={onRemoveStudyContent}
        />
      ) : (
        <div className="text-red-500 text-center py-16">Lesson not found</div>
      )}
    </div>
  );
}

// Course Lessons View
function CourseLessonsView({
  publishType,
  courseId,
  localLessons,
  constituentLessonIds,
  onAdd,
  onEdit,
  onDelete,
  onRemoveStudyContent,
  onMapExistingLessons,
  previewLessonIds,
  setPreviewLessonIds,
}: {
  publishType: PublishType;
  courseId?: string | null;
  localLessons: CourseLesson[];
  constituentLessonIds: string[];
  onAdd: (type: string, courseId?: string) => void;
  onEdit: (l: CourseLesson, courseId?: string) => void;
  onDelete: (id: string) => void;
  onRemoveStudyContent?: (lesson: CourseLesson) => void;
  onMapExistingLessons?: (lessons: any[], courseId?: string) => void;
  previewLessonIds?: string[];
  setPreviewLessonIds?: (ids: string[]) => void;
}) {
  const { data: queryData, isLoading } = useCourseLessons(courseId || "");
  const currentUser = useUserStore((state) => state.user);
  const currentUserId = currentUser?.id || "";
  const isSuperAdmin = currentUser?.roles?.some((role: any) =>
    String(typeof role === "string" ? role : role?.name || role?.code).toUpperCase() === "SUPER_ADMIN"
  ) || false;
  const queryClient = useQueryClient();
  const createMutation = useAssignLessonToCourse();
  const deleteMutation = useDeleteLessonFromCourse();
  const reorderMutation = useReorderLessons();
  const [removedLessonIds, setRemovedLessonIds] = React.useState<Set<string>>(new Set());

  const handleRemoveLesson = (actualLessonId: string) => {
    // 1. Instantly record in removed set so effectiveLessons filters it out immediately in 0ms
    setRemovedLessonIds((prev) => new Set(prev).add(actualLessonId));

    // 2. Immediately remove from local activeLessons so drag order is updated
    setActiveLessons((prev) =>
      prev.filter((l: any) => (l.lesson?.id || l.lessonId || l.id) !== actualLessonId)
    );

    // 3. Immediately notify parent component
    onDelete(actualLessonId);

    // 4. Optimistically update TanStack Query cache for this course's lessons
    if (courseId) {
      queryClient.setQueryData(["course-lessons", courseId], (old: any) => {
        if (!old) return [];
        if (Array.isArray(old)) {
          return old.filter((item: any) => (item.lesson?.id || item.lessonId || item.id) !== actualLessonId);
        }
        if (Array.isArray(old?.data)) {
          return {
            ...old,
            data: old.data.filter((item: any) => (item.lesson?.id || item.lessonId || item.id) !== actualLessonId),
          };
        }
        return old;
      });

      // 5. Trigger backend removal
      deleteMutation.mutate(
        { courseId, lessonId: actualLessonId },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["course-lessons", courseId] });
            queryClient.invalidateQueries({ queryKey: ["course-lessons"] });
            queryClient.invalidateQueries({ queryKey: ["courses"] });
          },
          onError: (err: any) => {
            console.error("Failed to delete lesson from course:", err);
            setRemovedLessonIds((prev) => {
              const next = new Set(prev);
              next.delete(actualLessonId);
              return next;
            });
            notification.error({
              message: "Failed to remove lesson",
              description: err?.response?.data?.message || err?.message || "Could not remove lesson from course.",
            });
            // Revert by invalidating on failure
            queryClient.invalidateQueries({ queryKey: ["course-lessons", courseId] });
          },
        }
      );
    }
  };

  const lessonsToShow = React.useMemo(() => {
    const rawFetched = queryData as any;
    const fetchedLessons = Array.isArray(rawFetched)
      ? rawFetched
      : (Array.isArray(rawFetched?.data) ? rawFetched.data : (Array.isArray(rawFetched?.lessons) ? rawFetched.lessons : []));
    const fetchedIds = new Set(fetchedLessons.map((l: any) => (l.lesson?.id || l.lessonId || l.id)));
    const mappedFetched = fetchedLessons.map((l: any) => l.lesson || l);
    const newLocalLessons = (localLessons || []).filter((l: any) => {
      const id = l.lesson?.id || l.lessonId || l.id;
      return id && !fetchedIds.has(id);
    });

    return courseId && fetchedLessons.length > 0
      ? [...mappedFetched, ...newLocalLessons]
      : (localLessons || []);
  }, [queryData, localLessons, courseId]);

  const [activeLessons, setActiveLessons] = React.useState<CourseLesson[]>([]);
  const [draggedItem, setDraggedItem] = React.useState<{ index: number } | null>(null);

  // Map existing published courses & lessons state
  const [isLessonModalOpen, setIsLessonModalOpen] = React.useState(false);
  const [librarySourceTab, setLibrarySourceTab] = React.useState<"courses" | "lessons">("courses");
  const [selectedLibraryCourseId, setSelectedLibraryCourseId] = React.useState<string | null>(null);
  const [selectedCourseLessonIds, setSelectedCourseLessonIds] = React.useState<string[]>([]);
  const [tempSelectedLessonIds, setTempSelectedLessonIds] = React.useState<string[]>([]);

  // Fetch real published courses
  const { courses: publishedCoursesQuery } = useCourses({ status: "PUBLISHED", limit: 100, isStandalone: "all" } as any);
  const publishedCoursesList = React.useMemo(() => {
    const raw: any = publishedCoursesQuery.data;
    const items = Array.isArray(raw?.data?.data) ? raw.data.data : (Array.isArray(raw?.data) ? raw.data : (Array.isArray(raw) ? raw : []));
    return items.filter((c: any) => c && c.id !== courseId && c.status === "PUBLISHED");
  }, [publishedCoursesQuery.data, courseId]);

  // Fetch lessons for the selected published course
  const { data: libraryCourseLessonsData, isLoading: isLoadingCourseLessons } = useQuery({
    queryKey: ["library-course-lessons", selectedLibraryCourseId],
    queryFn: () => getCourseLessonsApi(selectedLibraryCourseId!),
    enabled: !!selectedLibraryCourseId,
  });

  const libraryCourseLessons = React.useMemo(() => {
    const raw: any = libraryCourseLessonsData;
    const items = Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : (Array.isArray(raw?.lessons) ? raw.lessons : []));
    return items.map((cl: any) => cl?.lesson || cl).filter(Boolean);
  }, [libraryCourseLessonsData]);

  // Fetch standalone lessons from library (only PUBLISHED eligible for mapping)
  const { data: allLessonsRes, isLoading: isLoadingAllLessons } = useLessons({ limit: 100, status: "PUBLISHED", isStandalone: true } as any);

  // Fetch the parent course's visibility/tenant so we can filter the picker correctly
  const { data: parentCourseData } = useQuery({
    queryKey: ["course-visibility-check", courseId],
    queryFn: () => courseApi.getById(courseId!),
    enabled: !!courseId,
    staleTime: 60_000,
  });
  const parentCourse = React.useMemo(() => {
    const raw: any = parentCourseData;
    return raw?.data?.data ?? raw?.data ?? raw ?? null;
  }, [parentCourseData]);
  const parentCourseVisibility: string = parentCourse?.visibility ?? "PUBLIC_CATALOG";
  const parentCourseTenantId: string | null = parentCourse?.tenantId ?? null;

  const lessonsList = React.useMemo(() => {
    const res = allLessonsRes as any;
    return Array.isArray(res) ? res : (Array.isArray(res?.data?.data) ? res.data.data : (Array.isArray(res?.data) ? res.data : []));
  }, [allLessonsRes]);

  // ---------------------------------------------------------------------------
  // Standalone lessons — filtered by visibility compatibility with the parent course.
  // Rule: A TENANT_ONLY lesson must NOT appear for selection when the parent course
  //       is PUBLIC_CATALOG or BOTH (incompatible scopes).
  //       A TENANT_ONLY lesson scoped to a different tenant is also excluded.
  // ---------------------------------------------------------------------------
  const standaloneLessons = React.useMemo(() => {
    return lessonsList.filter((l: any) => {
      if (!l || !l.id) return false;
      if (l.status !== "PUBLISHED" || l.isStandalone !== true) return false;
      const isAlreadyInCourse = lessonsToShow.some((mapped: any) => (mapped.lesson?.id || mapped.id) === l.id);
      if (isAlreadyInCourse) return false;

      // Visibility compatibility check
      if (l.visibility === "TENANT_ONLY") {
        // Cannot add a TENANT_ONLY lesson to a PUBLIC_CATALOG or BOTH course
        if (parentCourseVisibility === "PUBLIC_CATALOG" || parentCourseVisibility === "BOTH") {
          return false;
        }
        // Both are TENANT_ONLY — lesson tenant must match parent course tenant
        if (parentCourseVisibility === "TENANT_ONLY" && parentCourseTenantId) {
          const lessonTenantId: string | null = l.tenantId ?? null;
          const lessonExtraTenantIds: string[] = (l.tenants ?? []).map((t: any) => t.tenantId);
          const lessonAllTenants = [lessonTenantId, ...lessonExtraTenantIds].filter(Boolean);
          if (!lessonAllTenants.includes(parentCourseTenantId)) return false;
        }
      }

      return true;
    });
  }, [lessonsList, lessonsToShow, parentCourseVisibility, parentCourseTenantId]);

  const lessonOptions = React.useMemo(() => {
    return standaloneLessons.map((l: any) => ({
      value: l.id,
      label: `${l.title} (${l.lessonType || "VIDEO"}${l.status ? ` · ${l.status}` : ""})`,
    }));
  }, [standaloneLessons]);

  const lessonsKey = React.useMemo(() => {
    return lessonsToShow
      .filter((l: any) => !removedLessonIds.has(l.lesson?.id || l.lessonId || l.id))
      .map((l: any) => {
        const id = l.lesson?.id || l.lessonId || l.id;
        const atts = (l.attachments || l.lessonAttachments || []).map((a: any) => a.assetId || a.asset?.id || a.id).join("-");
        const count = l.attachments?.length || 0;
        const updatedAt = l.updatedAt || "";
        return `${id}:${count}:${atts}:${updatedAt}`;
      })
      .join("|");
  }, [lessonsToShow, removedLessonIds]);

  React.useEffect(() => {
    setActiveLessons((prev) => {
      const availableToShow = lessonsToShow.filter((l: any) => !removedLessonIds.has(l.lesson?.id || l.lessonId || l.id));
      if (!prev || prev.length === 0) return availableToShow;
      const freshMap = new Map(availableToShow.map((l: any) => [l.lesson?.id || l.lessonId || l.id, l]));
      // Keep existing ordering from prev, but ONLY for lessons that still exist in freshMap and not removed:
      const preserved = prev
        .filter((oldL: any) => {
          const id = oldL.lesson?.id || oldL.lessonId || oldL.id;
          return freshMap.has(id) && !removedLessonIds.has(id);
        })
        .map((oldL: any) => freshMap.get(oldL.lesson?.id || oldL.lessonId || oldL.id)!);
      // Append any newly added lessons from freshMap that weren't in prev
      const prevIds = new Set(prev.map((oldL: any) => oldL.lesson?.id || oldL.lessonId || oldL.id));
      const newlyAdded = availableToShow.filter((l: any) => !prevIds.has(l.lesson?.id || l.lessonId || l.id));
      return [...preserved, ...newlyAdded];
    });
  }, [lessonsKey, removedLessonIds]);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedItem({ index });
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.index === dropIndex) return;

    const newOrder = [...activeLessons];
    const [removed] = newOrder.splice(draggedItem.index, 1);
    newOrder.splice(dropIndex, 0, removed);

    setActiveLessons(newOrder);

    if (courseId) {
      reorderMutation.mutate({
        courseId,
        data: {
          lessons: newOrder.map((l: any, idx: number) => ({
            lessonId: l.lesson?.id || l.lessonId || l.id,
            sequenceOrder: idx + 1
          }))
        }
      });
    }
    setDraggedItem(null);
  };

  const navigate = useNavigate();
  const baseLessons = activeLessons.length > 0 ? activeLessons : lessonsToShow;
  const effectiveLessons = React.useMemo(() => {
    return (baseLessons || []).filter((l: any) => {
      const id = l.lesson?.id || l.lessonId || l.id;
      return id && !removedLessonIds.has(id);
    });
  }, [baseLessons, removedLessonIds]);

  const totalCount = effectiveLessons.length;
  const materialsCount = effectiveLessons.reduce((acc: number, lesson: any) => {
    return acc + getLessonMaterialsCount(lesson);
  }, 0);
  const totalMinutes = effectiveLessons.reduce((acc: number, l: any) => acc + (Number(l.duration) || 0), 0);

  const [isNavigating, setIsNavigating] = React.useState(false);

  return (
    <div className="w-full min-w-0 mt-6 relative space-y-6 pb-24">
      {isLoading && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mb-4"></div>
          <p className="text-gray-800 font-semibold text-sm">Loading lessons...</p>
        </div>
      )}
      {(reorderMutation.isPending || createMutation.isPending || isNavigating) && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="flex flex-col items-center bg-white p-6 rounded-xl shadow-xl">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mb-4"></div>
            <p className="font-semibold text-gray-800 text-sm">
              {reorderMutation.isPending
                ? "Reordering Lessons..."
                : createMutation.isPending
                ? "Adding Lesson..."
                : "Opening Lesson Builder..."}
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* LESSONS */}
        <div className="bg-white border border-gray-200/90 rounded-2xl p-6 shadow-2xs transition-all duration-300 hover:shadow-md hover:border-gray-300">
          <div className="w-10 h-10 rounded-xl bg-[#f6e8c4] flex items-center justify-center mb-3">
            <Video className="w-5 h-5 text-[#e06d3b]" strokeWidth={1.8} />
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#5C5C5C] mb-1.5">LESSONS</p>
          <p className="text-2xl font-extrabold text-[#141414] leading-tight">{totalCount}</p>
        </div>

        {/* SUPPORTING MATERIALS */}
        <div className="bg-white border border-gray-200/90 rounded-2xl p-6 shadow-2xs transition-all duration-300 hover:shadow-md hover:border-gray-300">
          <div className="w-10 h-10 rounded-xl bg-[#dce5d3] flex items-center justify-center mb-3">
            <CheckSquare className="w-5 h-5 text-[#2d9d68]" strokeWidth={1.8} />
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#5C5C5C] mb-1.5">SUPPORTING MATERIALS</p>
          <p className="text-2xl font-extrabold text-[#141414] leading-tight">{materialsCount}</p>
        </div>

        {/* TOTAL RUNTIME */}
        <div className="bg-white border border-gray-200/90 rounded-2xl p-6 shadow-2xs transition-all duration-300 hover:shadow-md hover:border-gray-300">
          <div className="w-10 h-10 rounded-xl bg-[#efd3c7] flex items-center justify-center mb-3">
            <svg className="w-5 h-5 text-[#e04f5f]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
              <circle cx="12" cy="12" r="10"/>
              <path strokeLinecap="round" d="M12 6v6l4 2"/>
            </svg>
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#5C5C5C] mb-1.5">TOTAL RUNTIME</p>
          <p className="text-2xl font-extrabold text-[#141414] leading-tight">
            {Math.floor(totalMinutes / 60) > 0 ? (
              <><span>{Math.floor(totalMinutes / 60)}</span><span className="text-base font-semibold text-[#5C5C5C] ml-0.5">h </span><span>{totalMinutes % 60}</span><span className="text-base font-semibold text-[#5C5C5C] ml-0.5">m</span></>
            ) : (
              <><span>{totalMinutes}</span><span className="text-base font-semibold text-[#5C5C5C] ml-0.5">m</span></>
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <h2 className="text-base font-bold text-[#141414]">
          Lessons ({effectiveLessons.length})
        </h2>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setLibrarySourceTab("courses");
              setSelectedLibraryCourseId(null);
              setSelectedCourseLessonIds([]);
              setTempSelectedLessonIds([]);
              setIsLessonModalOpen(true);
            }}
            className="bg-white border border-gray-300 text-[#141414] text-sm font-semibold px-4 py-2 rounded-full hover:bg-gray-50 transition-colors shadow-2xs cursor-pointer flex items-center gap-2"
          >
            <Inbox className="w-4 h-4 text-[#141414]" />
            Add from library
          </button>
          <button
            type="button"
            onClick={() => {
              const targetCId = courseId || "";
              navigate(`/studio/builder/1?type=lesson${targetCId ? `&courseId=${targetCId}` : ""}`, {
                state: {
                  publishType: "standalone-lesson",
                  courseId: targetCId,
                  returnToCourseId: targetCId,
                  isNewLesson: true,
                },
              });
            }}
            className="bg-[#FCF7AE] hover:bg-[#FDF9C4] border border-[#e5df8a] text-[#141414] text-sm font-bold px-4 py-2 rounded-full shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5 active:scale-95"
          >
            + Create new lesson
          </button>
        </div>
      </div>

      {/* DUAL-SOURCE LIBRARY MODAL */}
      <Modal
        title="Add Lessons from Library"
        open={isLessonModalOpen}
        onCancel={() => {
          setIsLessonModalOpen(false);
          setSelectedLibraryCourseId(null);
          setSelectedCourseLessonIds([]);
          setTempSelectedLessonIds([]);
        }}
        footer={null}
        width={700}
      >
        <div className="flex border-b border-gray-200 mb-5 mt-2">
          <button
            type="button"
            onClick={() => setLibrarySourceTab("courses")}
            className={`flex-1 pb-2.5 text-sm font-semibold border-b-2 cursor-pointer transition-colors ${
              librarySourceTab === "courses"
                ? "border-black text-black"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            From Published Courses
          </button>
          <button
            type="button"
            onClick={() => setLibrarySourceTab("lessons")}
            className={`flex-1 pb-2.5 text-sm font-semibold border-b-2 cursor-pointer transition-colors ${
              librarySourceTab === "lessons"
                ? "border-black text-black"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            From Standalone Lessons
          </button>
        </div>

        {librarySourceTab === "courses" ? (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                Select Published Course
              </label>
              <select
                value={selectedLibraryCourseId || ""}
                onChange={(e) => {
                  setSelectedLibraryCourseId(e.target.value || null);
                  setSelectedCourseLessonIds([]);
                }}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-800 focus:outline-none cursor-pointer"
              >
                <option value="">-- Choose a published course --</option>
                {publishedCoursesList.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.title} ({c.difficulty || "All Levels"})
                  </option>
                ))}
              </select>
            </div>

            {selectedLibraryCourseId && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    Available Lessons ({libraryCourseLessons.length})
                  </span>
                  {libraryCourseLessons.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const selectable = libraryCourseLessons
                          .filter((l: any) => !lessonsToShow.some((m: any) => (m.lesson?.id || m.id) === l.id))
                          .map((l: any) => l.id);
                        if (selectedCourseLessonIds.length === selectable.length) {
                          setSelectedCourseLessonIds([]);
                        } else {
                          setSelectedCourseLessonIds(selectable);
                        }
                      }}
                      className="text-xs text-blue-600 font-semibold hover:underline cursor-pointer"
                    >
                      {selectedCourseLessonIds.length > 0 ? "Deselect All" : "Select All"}
                    </button>
                  )}
                </div>

                {isLoadingCourseLessons ? (
                  <p className="text-xs text-gray-400 py-4 text-center">Loading course lessons...</p>
                ) : libraryCourseLessons.length === 0 ? (
                  <p className="text-xs text-gray-400 py-4 text-center">No lessons found in this course.</p>
                ) : (
                  <div className="max-h-60 overflow-y-auto space-y-1.5 border border-gray-100 rounded-xl p-2">
                    {libraryCourseLessons.map((l: any) => {
                      const isAlreadyAdded = lessonsToShow.some((m: any) => (m.lesson?.id || m.id) === l.id);
                      const isChecked = selectedCourseLessonIds.includes(l.id);

                      return (
                        <label
                          key={l.id}
                          className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                            isAlreadyAdded
                              ? "bg-gray-50 opacity-50 cursor-not-allowed"
                              : isChecked
                              ? "bg-amber-50/60 border border-amber-200"
                              : "hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <input
                              type="checkbox"
                              disabled={isAlreadyAdded}
                              checked={isChecked || isAlreadyAdded}
                              onChange={() => {
                                if (isAlreadyAdded) return;
                                setSelectedCourseLessonIds((prev) =>
                                  prev.includes(l.id) ? prev.filter((id) => id !== l.id) : [...prev, l.id]
                                );
                              }}
                              className="rounded border-gray-300 text-black focus:ring-black cursor-pointer"
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-gray-900 truncate">{l.title}</p>
                              <span className="text-[10px] text-gray-400 font-medium">
                                {l.lessonType || "VIDEO"} · {l.duration ? `${l.duration} min` : "0 min"}
                              </span>
                            </div>
                          </div>
                          {isAlreadyAdded && (
                            <span className="text-[10px] font-bold text-gray-400 shrink-0">Added</span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 my-2">
            <p className="text-xs text-gray-500">
              Select eligible published standalone lessons to map into this course.
            </p>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                Available Standalone Lessons ({standaloneLessons.length})
              </label>
              <Select
                isMulti
                options={lessonOptions}
                isLoading={isLoadingAllLessons}
                value={lessonOptions.filter((opt: any) => tempSelectedLessonIds.includes(opt.value))}
                onChange={(selected) => setTempSelectedLessonIds(selected.map((s: any) => s.value))}
                className="text-sm font-medium"
                placeholder="Search and select published standalone lessons..."
              />
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
          <Button
            onClick={() => {
              setIsLessonModalOpen(false);
              setSelectedLibraryCourseId(null);
              setSelectedCourseLessonIds([]);
              setTempSelectedLessonIds([]);
            }}
          >
            Cancel
          </Button>
          <Button
            type="primary"
            style={{ backgroundColor: "black", borderColor: "black", color: "white" }}
            disabled={
              librarySourceTab === "courses"
                ? selectedCourseLessonIds.length === 0
                : tempSelectedLessonIds.length === 0
            }
            onClick={async () => {
              const lessonsToAdd =
                librarySourceTab === "courses"
                  ? libraryCourseLessons.filter((l: any) => selectedCourseLessonIds.includes(l.id))
                  : standaloneLessons.filter((l: any) => tempSelectedLessonIds.includes(l.id));

              if (courseId) {
                for (const lesson of lessonsToAdd) {
                  await createMutation.mutateAsync({
                    courseId,
                    data: {
                      lessonId: lesson.id,
                      title: lesson.title,
                      ownerId: lesson.ownerId || "",
                      lessonType: lesson.lessonType || "VIDEO",
                    } as any,
                  });
                }
              }

              onMapExistingLessons?.(
                lessonsToAdd.map((l: any) => ({
                  id: l.id,
                  title: l.title,
                  type: l.lessonType || "VIDEO",
                  duration: l.duration ? String(l.duration) : "0",
                  status: l.status || "PUBLISHED",
                })),
                courseId || undefined
              );

              setIsLessonModalOpen(false);
              setSelectedLibraryCourseId(null);
              setSelectedCourseLessonIds([]);
              setTempSelectedLessonIds([]);
            }}
          >
            Add Selected Lessons
          </Button>
        </div>
      </Modal>

      {/* Individual Lesson Cards */}
      <div className="space-y-3">
        {effectiveLessons.length > 0 ? (
          effectiveLessons.map((lesson: any, index: number) => {
            const actualLessonId = lesson.lesson?.id || lesson.id;
            return (
              <div
                key={lesson.id || index}
                className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-2xs hover:shadow-md hover:border-gray-300 transition-all duration-200 flex items-center justify-between gap-4 group"
                draggable={true}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
              >
                {/* Up/Down arrows */}
                <div className="flex flex-col items-center gap-0.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      if (index === 0) return;
                      const newArr = [...activeLessons];
                      [newArr[index - 1], newArr[index]] = [newArr[index], newArr[index - 1]];
                      setActiveLessons(newArr);
                    }}
                    disabled={index === 0}
                    className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors cursor-pointer text-xs ${
                      index === 0
                        ? "border-gray-100 text-gray-300 cursor-not-allowed"
                        : "border-gray-200 text-[#5C5C5C] hover:bg-gray-100 hover:text-[#141414]"
                    }`}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (index === activeLessons.length - 1) return;
                      const newArr = [...activeLessons];
                      [newArr[index], newArr[index + 1]] = [newArr[index + 1], newArr[index]];
                      setActiveLessons(newArr);
                    }}
                    disabled={index === activeLessons.length - 1}
                    className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors cursor-pointer text-xs ${
                      index === activeLessons.length - 1
                        ? "border-gray-100 text-gray-300 cursor-not-allowed"
                        : "border-gray-200 text-[#5C5C5C] hover:bg-gray-100 hover:text-[#141414]"
                    }`}
                  >
                    ↓
                  </button>
                </div>

                {/* L-number */}
                <span className="text-xs font-bold text-[#5C5C5C] shrink-0 w-6">L{index + 1}</span>

                {/* Title + badges */}
                <div className="flex-1 min-w-0">
                  <p className="text-base font-bold text-[#141414] truncate">
                    {lesson.title || `Lesson ${index + 1}`}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="inline-flex items-center gap-1.5 bg-[#f6f6f4] text-[#5c5c5c] text-xs font-semibold px-2.5 py-0.5 rounded-full border border-gray-200">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M10 8l6 4-6 4V8z" fill="currentColor" stroke="none"/></svg>
                      Video
                    </span>
                    <span className="inline-flex items-center gap-1.5 bg-[#dce5d3] text-[#446038] text-xs font-semibold px-2.5 py-0.5 rounded-full border border-[#bfcfb4]">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                      Text
                    </span>
                    {constituentLessonIds.includes(actualLessonId) && (
                      <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-bold text-[#5C5C5C]">Mapped</span>
                    )}
                    {(() => {
                      const count = getLessonMaterialsCount(lesson);
                      return count > 0 ? (
                        <span className="inline-flex items-center gap-1 bg-[#ebf7f0] text-[#2d9d68] text-xs font-semibold px-2.5 py-0.5 rounded-full border border-[#c4ebdb]">
                          📄 {count} Material{count > 1 ? "s" : ""}
                        </span>
                      ) : null;
                    })()}
                  </div>
                </div>

                {/* Duration */}
                <span className="text-sm font-normal text-[#5C5C5C] shrink-0 mr-2">
                  {lesson.duration != null ? `${lesson.duration} min` : ``}
                </span>

                {/* Actions: Edit & Remove */}
                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      const targetCId = courseId || "";
                      navigate(`/studio/builder/1?type=lesson&lessonId=${actualLessonId}${targetCId ? `&courseId=${targetCId}` : ""}`, {
                        state: {
                          publishType: "standalone-lesson",
                          lessonId: actualLessonId,
                          courseId: targetCId,
                          returnToCourseId: targetCId,
                        },
                      });
                    }}
                    className="border border-gray-300 text-[#141414] text-sm font-semibold px-4 py-1.5 rounded-full hover:bg-gray-50 transition-colors cursor-pointer shadow-2xs"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRemoveLesson(actualLessonId)}
                    className="border border-[#fecaca] text-[#c12a1c] hover:bg-red-50 text-sm font-semibold px-4 py-1.5 rounded-full transition-colors cursor-pointer shadow-2xs"
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white border border-gray-200/90 rounded-2xl p-10 text-center shadow-2xs">
            <p className="text-base font-semibold text-gray-700">No lessons added yet</p>
            <p className="mt-1 text-sm text-[#5C5C5C]">
              Create a lesson or{" "}
              <button
                type="button"
                onClick={() => {
                  setLibrarySourceTab("courses");
                  setSelectedLibraryCourseId(null);
                  setSelectedCourseLessonIds([]);
                  setTempSelectedLessonIds([]);
                  setIsLessonModalOpen(true);
                }}
                className="text-blue-600 font-semibold hover:underline cursor-pointer"
              >
                add one from the published lesson library
              </button>
              .
            </p>
          </div>
        )}
      </div>

      {/* Preview Lesson Selection */}
      <div className="pt-4 mt-2 border-t border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-[#5C5C5C]">
            PREVIEW LESSONS
          </label>
          <span className="bg-[#F6E8C4] text-[#755A12] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
            OPTIONAL
          </span>
        </div>
        {effectiveLessons.length > 0 ? (
          <>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {effectiveLessons.map((l: any) => {
                const actualLessonId = l.lesson?.id || l.id;
                const isSelected = (previewLessonIds || []).includes(actualLessonId);
                return (
                  <label key={actualLessonId} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${isSelected ? 'bg-blue-50/50 border-blue-200' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}>
                    <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-300'}`}>
                      {isSelected && <span className="text-[10px] font-bold">✓</span>}
                    </div>
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={isSelected}
                      onChange={(e) => {
                        if (!setPreviewLessonIds) return;
                        if (e.target.checked) {
                          setPreviewLessonIds([...(previewLessonIds || []), actualLessonId]);
                        } else {
                          setPreviewLessonIds((previewLessonIds || []).filter(id => id !== actualLessonId));
                        }
                      }}
                    />
                    <span className={`text-sm font-semibold truncate ${isSelected ? 'text-blue-900' : 'text-gray-700'}`}>
                      {l.lesson?.title || l.title}
                    </span>
                  </label>
                );
              })}
            </div>
            <p className="text-sm text-[#5C5C5C] font-normal pt-2">
              Select one or more lessons to act as a preview for this course.
            </p>
          </>
        ) : (
          <div className="p-4 rounded-xl border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center">
            <p className="text-xs text-gray-500 font-medium">Please map at least one lesson to enable preview selection.</p>
          </div>
        )}
      </div>

      {/* ADD ANOTHER LESSON — separate section below the card, always visible */}
      <div className="rounded-2xl border border-dashed border-gray-300 bg-[#FAFAFA]/50 py-6 flex flex-col items-center gap-2 hover:border-gray-400 transition-colors shadow-2xs">
        <p className="text-xs font-bold uppercase tracking-wider text-[#5C5C5C]">ADD ANOTHER LESSON</p>
        <button
          type="button"
          onClick={() => {
            const targetCId = courseId || "";
            navigate(`/studio/builder/1?type=lesson${targetCId ? `&courseId=${targetCId}` : ""}`, {
              state: {
                publishType: "standalone-lesson",
                courseId: targetCId,
                returnToCourseId: targetCId,
                isNewLesson: true,
              },
            });
          }}
          className="bg-white border border-gray-300 text-[#141414] text-sm font-bold px-5 py-2 rounded-full hover:bg-gray-50 transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
        >
          + Add lesson
        </button>
      </div>
    </div>
  );
}

// Career Path Multi-Course Lessons View
function CareerPathLessonsView({
  careerPathId,
  courseId,
  courseIds,
  inlineCourseTitle,
  localLessons,
  onAdd,
  onEdit,
  onDelete,
  courseOptions,
  onUpdateCourses,
  onRemoveStudyContent,
  onMapExistingLessons,
  subjects = [],
  categories = [],
}: {
  careerPathId?: string | null;
  courseId?: string | null;
  courseIds: string[];
  inlineCourseTitle?: string | null;
  localLessons: CourseLesson[];
  onAdd: (type: string, courseId?: string) => void;
  onEdit: (l: CourseLesson, courseId?: string) => void;
  onDelete: (id: string) => void;
  courseOptions?: { value: string; label: string }[];
  onUpdateCourses?: (courseIds: string[]) => void;
  onRemoveStudyContent?: (lesson: CourseLesson) => void;
  onMapExistingLessons?: (lessons: any[], courseId?: string) => void;
  subjects?: any[];
  categories?: any[];
}) {
  const navigate = useNavigate();
  const currentUser = useUserStore((state) => state.user);
  const isSuperAdmin = currentUser?.roles?.some((role: any) =>
    String(typeof role === "string" ? role : role?.name || role?.code).toUpperCase() === "SUPER_ADMIN"
  ) || false;

  const ownerId = React.useMemo(() => {
    try {
      const stored = localStorage.getItem('keycloak_session_user');
      if (!stored) return currentUser?.id || "";
      const parsed = JSON.parse(stored);
      const user = parsed?.user || parsed;
      return user?.id || user?.userId || user?.sub || user?.keycloakId || currentUser?.id || "";
    } catch {
      return currentUser?.id || "";
    }
  }, [currentUser?.id]);
  const currentUserId = currentUser?.id || ownerId || "";

  const [expandedCourseId, setExpandedCourseId] = React.useState<string | null>(null);
  const [deletedCourseIds, setDeletedCourseIds] = React.useState<string[]>([]);
  const [isCourseModalOpen, setIsCourseModalOpen] = React.useState(false);
  const [tempSelectedCourseIds, setTempSelectedCourseIds] = React.useState<string[]>([]);

  const qc = useQueryClient();
  const deleteCourseMutation = useMutation({
    mutationFn: (cid: string) => deleteCareerPathCourseApi(careerPathId!, cid),
    onSuccess: (_, cid) => {
      setDeletedCourseIds((prev) => [...prev, cid]);
      qc.invalidateQueries({ queryKey: ['career-path-courses', careerPathId] });
    }
  });

  const deleteLessonMutation = useDeleteLessonFromCourse();

  const handleRemoveCourse = (cid: string) => {
    if (careerPathId && cid && cid !== "INLINE_COURSE_PENDING") {
      deleteCourseMutation.mutate(cid);
    }
    if (onUpdateCourses) {
      onUpdateCourses(courseIds.filter(id => id !== cid));
    }
  };

  const { data: apiCareerPathCourses } = useQuery({
    queryKey: ['career-path-courses', careerPathId],
    queryFn: () => getCareerPathCoursesApi(careerPathId!),
    enabled: !!careerPathId,
  });

  const mappedCourseIds = new Set(apiCareerPathCourses?.map((c: any) => c.courseId) || []);
  const newCourseIds = new Set(courseIds.filter(id => !mappedCourseIds.has(id)));

  const INLINE_COURSE_ID = courseId || "INLINE_COURSE_PENDING";
  const allCourseIds = React.useMemo(() => {
    const ids = new Set<string>();

    // If there is an inline course being created (has title), already created (courseId exists), or lessons have been added
    if (courseId || inlineCourseTitle || localLessons.length > 0) {
      ids.add(INLINE_COURSE_ID);
    }

    courseIds.forEach(id => {
      if (!deletedCourseIds.includes(id)) {
        ids.add(id);
      }
    });

    const apiCourseIds = apiCareerPathCourses?.map((c: any) => c.courseId) || [];
    apiCourseIds.forEach((id: string) => {
      if (!deletedCourseIds.includes(id)) {
        ids.add(id);
      }
    });

    return Array.from(ids);
  }, [INLINE_COURSE_ID, courseId, courseIds, inlineCourseTitle, apiCareerPathCourses, localLessons.length, deletedCourseIds]);

  const courseQueries = useQueries({
    queries: allCourseIds.map(cid => ({
      queryKey: ['course-lessons', cid],
      queryFn: () => getCourseLessonsApi(cid),
      enabled: !!cid && cid !== "INLINE_COURSE_PENDING",
    })),
  });

  const courseDetailsQueries = useQueries({
    queries: allCourseIds.map((cid) => ({
      queryKey: ["course-details", cid],
      queryFn: () => courseApi.getById(cid).then(res => res.data).catch(() => ({ data: { title: `Unknown Course` } })),
      enabled: !!cid && cid !== INLINE_COURSE_ID,
      retry: false,
    })),
  });

  const isLoading = courseQueries.some((q) => q.isLoading) || courseDetailsQueries.some((q) => q.isLoading);


  // Group lessons by courseId
  const courseLessonsMap: Record<string, CourseLesson[]> = {};
  const fetchedIds = new Set<string>();

  courseQueries.forEach((q, index) => {
    const cid = allCourseIds[index];
    if (cid === INLINE_COURSE_ID) {
      const fetchedLessons = q.data ? (Array.isArray(q.data) ? q.data.map((cl: any) => cl.lesson || cl) : []) : [];
      fetchedLessons.forEach((l: any) => { if (l.id) fetchedIds.add(l.id); });

      // All localLessons belong to the inline course in Career Path flow
      const newLocals = localLessons.filter((l) => l.id && !fetchedIds.has(l.id));
      courseLessonsMap[cid] = [...fetchedLessons, ...newLocals];
    } else if (q.data) {
      const lessonsArray = Array.isArray(q.data) ? q.data.map((cl: any) => cl.lesson || cl) : [];
      courseLessonsMap[cid] = lessonsArray;
      lessonsArray.forEach((l: any) => {
        if (l.id) fetchedIds.add(l.id);
      });
    } else {
      courseLessonsMap[cid] = [];
    }
  });

  const reorderMutation = useReorderLessons();
  const reorderCoursesMutation = useReorderCourses();

  const [draggedItem, setDraggedItem] = React.useState<{ cid: string; index: number } | null>(null);
  const [localOrderOverrides, setLocalOrderOverrides] = React.useState<Record<string, CourseLesson[]>>({});

  const [activeCourseIds, setActiveCourseIds] = React.useState<string[]>([]);
  const [draggedCourseIndex, setDraggedCourseIndex] = React.useState<number | null>(null);

  // Map existing lesson states
  const [isLessonModalOpen, setIsLessonModalOpen] = React.useState(false);
  const [tempSelectedLessonIds, setTempSelectedLessonIds] = React.useState<string[]>([]);
  const [targetCidForMapLesson, setTargetCidForMapLesson] = React.useState<string | null>(null);
  const { data: allLessonsRes, isLoading: isLoadingAllLessons } = useLessons({ limit: 100 });

  const lessonsList = React.useMemo(() => {
    const res = allLessonsRes as any;
    return Array.isArray(res) ? res : (Array.isArray(res?.data?.data) ? res.data.data : (Array.isArray(res?.data) ? res.data : []));
  }, [allLessonsRes]);

  const standaloneLessons = React.useMemo(() => {
    return lessonsList.filter((l: any) => {
      if (!l || !l.id) return false;

      if (targetCidForMapLesson) {
        const alreadyMapped = courseLessonsMap[targetCidForMapLesson] || [];
        if (alreadyMapped.some((mapped: any) => (mapped.lesson?.id || mapped.id) === l.id)) {
          return false;
        }
      }
      return true;
    });
  }, [lessonsList, targetCidForMapLesson, courseLessonsMap]);

  const lessonOptions = React.useMemo(() => {
    return standaloneLessons.map((l: any) => ({
      value: l.id,
      label: `${l.title} (${l.lessonType || "VIDEO"}${l.status ? ` · ${l.status}` : ""})`,
    }));
  }, [standaloneLessons]);

  const assignLessonMutation = useAssignLessonToCourse();

  // Create course inline states
  const [showCreateCourseForm, setShowCreateCourseForm] = React.useState(false);
  const [newCourseTitle, setNewCourseTitle] = React.useState("");
  const [newCourseDesc, setNewCourseDesc] = React.useState("");
  const [newCourseSubj, setNewCourseSubj] = React.useState("");
  const [newCourseCat, setNewCourseCat] = React.useState("");
  const [creatingCourse, setCreatingCourse] = React.useState(false);

  const initialCourseFormState: StandaloneCourseFormData = {
    visibility: "PUBLIC_CATALOG",
    corporateTenant: [],
    assessmentRequired: false,
    courseTitle: "",
    courseSubtitle: "",
    tagline: "",
    fullDescription: "",
    subjectId: "",
    categoryId: "",
    subcategoryId: "",
    difficulty: "BEGINNER",
    duration: "",
    learningOutcomes: "",
    shortDescription: "",
    learningObjectives: "",
    targetAudience: "",
    prerequisites: "",
    existingLessonIds: [],
    careerPathLink: "",
    language: "english",
    priceTier: "FREE",
    coursethumbnail: null,
    courseThumbnailAssetUrl: "",
    tags: [],
    skillsGain: "",
    attachment: null,
  };

  const [editingCourseId, setEditingCourseId] = React.useState<string | null>(null);
  const [courseFormData, setCourseFormData] = React.useState<StandaloneCourseFormData>(initialCourseFormState);

  const updateCourseForm = (updates: Partial<StandaloneCourseFormData>) => {
    setCourseFormData((prev) => ({ ...prev, ...updates }));
  };



  const handleCreateNewCourse = async () => {
    if (!courseFormData.courseTitle.trim()) {
      notification.warning({ title: "Validation Error", description: "Please enter the course title." });
      return;
    }
    if (!courseFormData.categoryId) {
      notification.warning({ title: "Validation Error", description: "Please select a category." });
      return;
    }
    if (!courseFormData.subjectId) {
      notification.warning({ title: "Validation Error", description: "Please select a subject." });
      return;
    }
    if (!courseFormData.shortDescription?.trim()) {
      notification.warning({ title: "Validation Error", description: "Please enter a short description." });
      return;
    }
    setCreatingCourse(true);
    try {
      const fd = new FormData();
      fd.append("title", courseFormData.courseTitle.trim());
      if (courseFormData.courseSubtitle) fd.append("subtitle", courseFormData.courseSubtitle);
      if (courseFormData.tagline) fd.append("tagline", courseFormData.tagline);
      if (courseFormData.shortDescription) fd.append("shortDescription", courseFormData.shortDescription);
      fd.append("fullDescription", courseFormData.fullDescription || courseFormData.courseTitle.trim());
      fd.append("categoryId", courseFormData.categoryId || (categories?.[0]?.id || ""));
      if (courseFormData.subcategoryId) fd.append("subcategoryId", courseFormData.subcategoryId);
      fd.append("subjectId", courseFormData.subjectId || (subjects?.[0]?.id || ""));
      fd.append("difficulty", courseFormData.difficulty || "BEGINNER");
      fd.append("language", courseFormData.language || "english");
      fd.append("isStandalone", "false");
      fd.append("publishType", "CAREER_PATH_COURSE");
      fd.append("status", "DRAFT");
      fd.append("ownerId", ownerId || "d890f231-3221-44c2-ab2c-f56fb2398af0");
      if (courseFormData.visibility) fd.append("visibility", courseFormData.visibility);
      if (courseFormData.priceTier) fd.append("priceTier", courseFormData.priceTier);
      if (courseFormData.learningObjectives) fd.append("learningObjectives", courseFormData.learningObjectives);
      if (courseFormData.targetAudience) fd.append("targetAudience", courseFormData.targetAudience);
      if (courseFormData.prerequisites) fd.append("prerequisites", courseFormData.prerequisites);

      if (courseFormData.coursethumbnail) {
        fd.append("courseThumbnail", courseFormData.coursethumbnail);
      }

      if (editingCourseId) {
        await courseApi.update(editingCourseId, fd as any);
        qc.invalidateQueries({ queryKey: ["course-details", editingCourseId] });
      } else {
        const res = await courseApi.create(fd as any);
        const newCourse = res.data?.data || res.data;
        if (newCourse && newCourse.id) {
          if (careerPathId) {
            await createCareerPathCourseApi(careerPathId, { courseId: newCourse.id });
          }
          const updatedCourseIds = [...courseIds, newCourse.id];
          onUpdateCourses?.(updatedCourseIds);
        }
      }
      qc.invalidateQueries({ queryKey: ["courses"] });
      if (careerPathId) {
        qc.invalidateQueries({ queryKey: ["career-path-courses", careerPathId] });
      }
      setCourseFormData(initialCourseFormState);
      setEditingCourseId(null);
      setShowCreateCourseForm(false);
      setIsCourseModalOpen(false);
    } catch (error) {
      console.error("Failed to save course", error);
    } finally {
      setCreatingCourse(false);
    }
  };

  const handleSaveMappedLessons = async () => {
    if (!targetCidForMapLesson) return;
    const selectedLessons = standaloneLessons.filter((l: any) => tempSelectedLessonIds.includes(l.id));
    if (targetCidForMapLesson !== "INLINE_COURSE_PENDING") {
      for (const lesson of selectedLessons) {
        await assignLessonMutation.mutateAsync({
          courseId: targetCidForMapLesson,
          data: {
            lessonId: lesson.id,
            title: lesson.title,
            ownerId: lesson.ownerId || "",
            lessonType: lesson.lessonType || "VIDEO",
          } as any
        });
      }
    }
    onMapExistingLessons?.(selectedLessons.map((l: any) => ({
      id: l.id,
      title: l.title,
      type: l.lessonType || "VIDEO",
      duration: l.duration ? String(l.duration) : "0",
      status: l.status || "DRAFT",
    })), targetCidForMapLesson === "INLINE_COURSE_PENDING" ? undefined : targetCidForMapLesson);
    setIsLessonModalOpen(false);
  };

  React.useEffect(() => {
    setActiveCourseIds(prev => {
      const prevSet = new Set(prev);
      const newSet = new Set(allCourseIds);
      // Check if the sets are identical (same IDs, regardless of order)
      const added = allCourseIds.filter(id => !prevSet.has(id));
      const removed = prev.filter(id => !newSet.has(id));
      if (added.length === 0 && removed.length === 0) return prev; // preserve user drag order
      // Apply additions/removals while keeping the rest of the user's order
      const kept = prev.filter(id => newSet.has(id));
      return [...kept, ...added];
    });
  }, [allCourseIds.join(",")]);

  const stateStr = JSON.stringify(Object.fromEntries(Object.entries(courseLessonsMap).map(([k, v]) => [k, v.map((l: any) => l.lesson?.id || l.id).join(",")])));
  React.useEffect(() => {
    const newOverrides: Record<string, CourseLesson[]> = {};
    allCourseIds.forEach(cid => {
      newOverrides[cid] = courseLessonsMap[cid] || [];
    });
    setLocalOrderOverrides(newOverrides);
  }, [stateStr, allCourseIds.join(",")]);

  const handleCourseDragStart = (e: React.DragEvent, index: number) => {
    e.stopPropagation();
    setDraggedCourseIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleCourseDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleCourseDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedCourseIndex === null || draggedCourseIndex === dropIndex) return;

    const newOrder = [...activeCourseIds];
    const [removed] = newOrder.splice(draggedCourseIndex, 1);
    newOrder.splice(dropIndex, 0, removed);

    setActiveCourseIds(newOrder);

    if (careerPathId) {
      const payloadCourses = newOrder
        .filter(cid => cid !== INLINE_COURSE_ID)
        .map((cid, idx) => ({
          courseId: cid,
          sequenceOrder: idx + 1
        }));

      if (payloadCourses.length > 0) {
        reorderCoursesMutation.mutate({
          careerPathId,
          data: { courses: payloadCourses }
        });
      }
    }
    setDraggedCourseIndex(null);
  };

  const handleDragStart = (e: React.DragEvent, cid: string, index: number) => {
    e.stopPropagation();
    setDraggedItem({ cid, index });
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent, cid: string, dropIndex: number) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.cid !== cid || draggedItem.index === dropIndex) return;

    const currentLessons = localOrderOverrides[cid] || courseLessonsMap[cid] || [];
    const newOrder = [...currentLessons];
    const [removed] = newOrder.splice(draggedItem.index, 1);
    newOrder.splice(dropIndex, 0, removed);

    setLocalOrderOverrides(prev => ({ ...prev, [cid]: newOrder }));

    if (cid && cid !== "INLINE_COURSE_PENDING") {
      reorderMutation.mutate({
        courseId: cid,
        data: {
          lessons: newOrder.map((l: any, idx: number) => ({
            lessonId: l.lesson?.id || l.id,
            sequenceOrder: idx + 1
          }))
        }
      });
    }
    setDraggedItem(null);
  };

  const totalLessons = Object.values(courseLessonsMap).reduce((sum, lessons) => sum + lessons.length, 0);
  return (
    <div className="w-full min-w-0 mt-8 relative">
      {isLoading && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mb-4"></div>
          <p className="text-gray-800 font-semibold text-sm">Loading courses and lessons...</p>
        </div>
      )}
      {(deleteCourseMutation.isPending || deleteLessonMutation.isPending || reorderMutation.isPending || reorderCoursesMutation.isPending || assignLessonMutation.isPending || creatingCourse) && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="flex flex-col items-center bg-white p-6 rounded-xl shadow-xl">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mb-4"></div>
            <p className="font-semibold text-gray-800 text-sm">
              {creatingCourse ? "Creating Course..." : reorderCoursesMutation.isPending ? "Reordering Courses..." : reorderMutation.isPending ? "Reordering Lessons..." : deleteCourseMutation.isPending ? "Removing Course..." : "Removing Lesson..."}
            </p>
          </div>
        </div>
      )}
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          Lessons ({totalLessons})
          {allCourseIds.length > 0 && (
            <span className="ml-2 text-xs text-gray-400 font-normal">
              from {allCourseIds.length} course{allCourseIds.length !== 1 ? 's' : ''}
            </span>
          )}
        </h2>
        <button
          type="button"
          onClick={() => {
            setTempSelectedCourseIds(allCourseIds);
            setEditingCourseId(null);
            setCourseFormData(initialCourseFormState);
            setShowCreateCourseForm(false);
            setIsCourseModalOpen(true);
          }}
          className="rounded-lg bg-black px-5 py-2 text-sm font-semibold text-white hover:bg-gray-800 transition-colors"
        >
          + Add Course
        </button>
      </div>

      <Modal
        title={editingCourseId ? "Edit Course" : "Add Course"}
        open={isCourseModalOpen}
        onCancel={() => setIsCourseModalOpen(false)}
        footer={null}
        width={800}
      >
        {!editingCourseId && (
          <div className="flex border-b border-gray-200 mb-6 mt-4">
            <button
              onClick={() => setShowCreateCourseForm(false)}
              className={`flex-1 pb-2.5 text-sm font-semibold border-b-2 ${!showCreateCourseForm ? 'border-black text-black' : 'border-transparent text-gray-400'}`}
            >
              Map Existing Course
            </button>
            <button
              onClick={() => setShowCreateCourseForm(true)}
              className={`flex-1 pb-2.5 text-sm font-semibold border-b-2 ${showCreateCourseForm ? 'border-black text-black' : 'border-transparent text-gray-400'}`}
            >
              Create New Course
            </button>
          </div>
        )}

        {!showCreateCourseForm ? (
          <>
            <div className="mb-6">
              <label className="mb-1 block text-sm font-medium text-gray-700">Select Courses</label>
              <Select
                isMulti
                options={courseOptions || []}
                value={(courseOptions || []).filter((opt) =>
                  tempSelectedCourseIds.includes(opt.value)
                )}
                onChange={(selected) => {
                  setTempSelectedCourseIds(selected.map((s: any) => s.value));
                }}
                className="text-sm font-medium"
                placeholder="Search and select courses..."
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button onClick={() => setIsCourseModalOpen(false)}>Cancel</Button>
              <Button
                type="primary"
                style={{ backgroundColor: 'black', borderColor: 'black' }}
                onClick={() => {
                  onUpdateCourses?.(tempSelectedCourseIds);
                  setIsCourseModalOpen(false);
                }}
              >
                Save
              </Button>
            </div>
          </>
        ) : (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto overflow-x-hidden p-2">
            <StandaloneCourse
              formData={courseFormData}
              updateForm={updateCourseForm}
              isEditMode={!!editingCourseId}
              hideLessons={true}
            />
            <div className="flex justify-end gap-3 pt-4 sticky bottom-0 bg-white border-t border-gray-100 p-4 mt-4 z-10">
              <Button onClick={() => {
                setShowCreateCourseForm(false);
                setIsCourseModalOpen(false);
                setEditingCourseId(null);
                setCourseFormData(initialCourseFormState);
              }}>
                Cancel
              </Button>
              <Button
                type="primary"
                style={{ backgroundColor: 'black', borderColor: 'black' }}
                onClick={handleCreateNewCourse}
                disabled={creatingCourse || !courseFormData.courseTitle.trim()}
                loading={creatingCourse}
              >
                {editingCourseId ? 'Save Changes' : 'Create & Add'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title="Map Existing Standalone Lessons"
        open={isLessonModalOpen}
        onCancel={() => setIsLessonModalOpen(false)}
        footer={null}
        width={600}
      >
        <div className="mb-6 mt-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">Select Lessons</label>
          <Select
            isMulti
            options={lessonOptions}
            value={lessonOptions.filter((opt: any) =>
              tempSelectedLessonIds.includes(opt.value)
            )}
            onChange={(selected) => {
              setTempSelectedLessonIds(selected.map((s: any) => s.value));
            }}
            className="text-sm font-medium"
            placeholder="Search and select lessons..."
          />
        </div>
        <div className="flex justify-end gap-3 mt-4">
          <Button onClick={() => setIsLessonModalOpen(false)}>Cancel</Button>
          <Button
            type="primary"
            style={{ backgroundColor: 'black', borderColor: 'black' }}
            onClick={handleSaveMappedLessons}
            loading={assignLessonMutation.isPending}
            disabled={assignLessonMutation.isPending}
          >
            Save
          </Button>
        </div>
      </Modal>

      {isLoading ? (
        <div className="animate-pulse text-center py-16 text-gray-500">Loading courses and lessons...</div>
      ) : allCourseIds.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 py-16 text-center">
          <p className="text-sm font-semibold text-gray-700">
            No courses selected — select courses in the Info step first.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Pre-compute C1, C2... numbers (excluding inline placeholder) */}
          {(() => {
            const courseNumberMap: Record<string, number> = {};
            let n = 0;
            activeCourseIds.forEach((id) => { if (id !== "INLINE_COURSE_PENDING") courseNumberMap[id] = ++n; });
            return activeCourseIds.map((cid, index) => {
              const isExpanded = expandedCourseId === cid;
              const queryIndex = allCourseIds.indexOf(cid);
              const courseDetails = queryIndex >= 0 ? courseDetailsQueries[queryIndex]?.data as any : null;
              const isInlineCourse = cid === INLINE_COURSE_ID;
              const apiCourse = apiCareerPathCourses?.find((c: any) => c.courseId === cid);
              const title = (isInlineCourse && inlineCourseTitle)
                ? inlineCourseTitle
                : (isInlineCourse ? "Additional Course Information" : (apiCourse?.course?.title || courseDetails?.title || courseDetails?.data?.title || `Course ID: ${cid}`));
              const lessonsForCourse = localOrderOverrides[cid] && localOrderOverrides[cid].length > 0 ? localOrderOverrides[cid] : (courseLessonsMap[cid] || []);

              // Don't render the inline course placeholder
              if (isInlineCourse && cid === "INLINE_COURSE_PENDING") return null;

              return (
                <div
                  key={cid}
                  className={`rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm transition-all duration-200 ${draggedCourseIndex === index ? 'opacity-50' : ''}`}
                  draggable
                  onDragStart={(e) => handleCourseDragStart(e, index)}
                  onDragOver={handleCourseDragOver}
                  onDrop={(e) => handleCourseDrop(e, index)}
                >
                  <div
                    className="flex cursor-pointer items-center justify-between bg-gray-50 px-5 py-4 hover:bg-gray-100 transition-colors"
                    onClick={() => setExpandedCourseId(isExpanded ? null : cid)}
                  >
                    {/* Left side: drag handle + C{n} badge + title */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="cursor-move text-gray-400 text-lg flex-shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >⋮⋮</div>
                      <div className="rounded bg-gray-100 px-2 py-1 text-xs font-bold text-gray-500 flex-shrink-0">
                        C{courseNumberMap[cid]}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                          {title}
                          {courseIds.includes(cid) && (
                            <span className="rounded bg-gray-200 px-2 py-0.5 text-[10px] font-bold text-gray-700">Mapped</span>
                          )}
                        </h3>
                        <p className="text-sm text-gray-500 mt-0.5">{lessonsForCourse.length} lesson{lessonsForCourse.length !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {courseIds.includes(cid) && careerPathId && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();

                              const apiCourse = apiCareerPathCourses?.find((c: any) => c.courseId === cid);
                              const details = courseDetails?.data || courseDetails || apiCourse?.course;

                              setEditingCourseId(cid);
                              setCourseFormData({
                                ...initialCourseFormState,
                                courseTitle: details?.title || "",
                                courseSubtitle: details?.subtitle || "",
                                tagline: details?.tagline || "",
                                fullDescription: details?.fullDescription || details?.description || "",
                                categoryId: details?.categoryId || "",
                                subcategoryId: details?.subcategoryId || "",
                                subjectId: details?.subjectId || "",
                                difficulty: details?.difficulty || "BEGINNER",
                                language: details?.language || "english",
                                visibility: details?.visibility || "PUBLIC_CATALOG",
                                priceTier: details?.priceTier || "FREE",
                                learningObjectives: Array.isArray(details?.learningObjectives) ? details.learningObjectives.join('\n') : (details?.learningObjectives || ""),
                                targetAudience: details?.targetAudience || "",
                                prerequisites: details?.prerequisites || "",
                                shortDescription: details?.shortDescription || "",
                                courseThumbnailAssetUrl: details?.thumbnailUrl || details?.thumbnailAsset?.fileUrl || "",
                              });
                              setShowCreateCourseForm(true);
                              setIsCourseModalOpen(true);
                            }}
                            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                          >
                            Edit Course
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveCourse(cid);
                            }}
                            disabled={deleteCourseMutation.isPending}
                            className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            Remove Course
                          </button>
                        </div>
                      )}
                      <div className="text-gray-400 bg-white p-1 rounded-full shadow-sm border border-gray-100">
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-gray-200 p-5 bg-white">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-sm font-semibold text-gray-700">Course Lessons</h4>
                        {cid !== "INLINE_COURSE_PENDING" && (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setTargetCidForMapLesson(cid);
                                setTempSelectedLessonIds([]);
                                setIsLessonModalOpen(true);
                              }}
                              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              + Map Existing Lesson
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const targetCId = cid || "";
                                navigate(`/studio/builder/1?type=lesson${targetCId ? `&courseId=${targetCId}` : ""}`, {
                                  state: {
                                    publishType: "standalone-lesson",
                                    courseId: targetCId,
                                    returnToCourseId: targetCId,
                                    pathId: careerPathId,
                                    isNewLesson: true,
                                  },
                                });
                              }}
                              className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-200 transition-colors"
                            >
                              + Add Lesson to Course
                            </button>
                          </div>
                        )}
                      </div>
                      {lessonsForCourse.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-6 border border-dashed border-gray-200 rounded-lg">No lessons found for this course.</p>
                      ) : (
                        <div className="space-y-4">
                          {lessonsForCourse.map((lesson, lessonIndex) => (
                            <LessonCard
                              key={lesson.id}
                              lesson={lesson}
                              index={lessonIndex}
                              canEdit={cid === "INLINE_COURSE_PENDING" || isSuperAdmin || Boolean(currentUserId && lesson.ownerId === currentUserId)}
                              onEdit={(l) => {
                                const targetCId = cid || "";
                                navigate(`/studio/builder/1?type=lesson&lessonId=${l.id}${targetCId ? `&courseId=${targetCId}` : ""}`, {
                                  state: {
                                    publishType: "standalone-lesson",
                                    lessonId: l.id,
                                    courseId: targetCId,
                                    returnToCourseId: targetCId,
                                    pathId: careerPathId,
                                  },
                                });
                              }}
                              onDelete={(id) => {
                                if (cid && cid !== "INLINE_COURSE_PENDING") {
                                  deleteLessonMutation.mutate(
                                    { courseId: cid, lessonId: id },
                                    { onSuccess: () => onDelete(id) }
                                  );
                                } else {
                                  onDelete(id);
                                }
                              }}
                              deleteDisabled={cid !== "INLINE_COURSE_PENDING" && deleteLessonMutation.isPending}
                              onDragStart={(e, idx) => handleDragStart(e, cid, idx)}
                              onDragOver={(e, idx) => handleDragOver(e, idx)}
                              onDrop={(e, idx) => handleDrop(e, cid, idx)}
                              onRemoveStudyContent={onRemoveStudyContent}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            });
          })()}
        </div>
      )}
    </div>
  );
}

// Root Component
export default function CourseBuilderLessons(props: Props) {
  const { publishType, lessonId, courseId, careerPathId, inlineCourseTitle, lessons, careerPathCourseIds = [], constituentLessonIds = [], onAdd, onEdit, onDelete, subjects, categories, onMapExistingLessons } = props;

  const updateLessonMutation = useUpdateLesson();

  const handleRemoveStudyContent = async (lesson: CourseLesson) => {
    const updatedLesson = {
      ...lesson,
      lessonContents: [],
    };

    if (lesson.id && !lesson.id.startsWith("temp-")) {
      try {
        await updateLessonMutation.mutateAsync({
          lessonId: lesson.id,
          data: { lessonContents: [] },
        });
      } catch (err) {
        console.error("Failed to remove study content on backend", err);
      }
    }

    if (props.onUpdateLesson) {
      props.onUpdateLesson(updatedLesson);
    }
  };

  if (publishType === "standalone-lesson") {
    return <StandaloneLessonView lessonId={lessonId} onEdit={onEdit} onDelete={onDelete} onRemoveStudyContent={handleRemoveStudyContent} />;
  }

  if (publishType === "career-path") {
    return (
      <CareerPathLessonsView
        careerPathId={careerPathId}
        courseId={courseId}
        courseIds={careerPathCourseIds}
        inlineCourseTitle={inlineCourseTitle}
        localLessons={lessons}
        onAdd={onAdd}
        onEdit={onEdit}
        onDelete={onDelete}
        courseOptions={props.courseOptions}
        onUpdateCourses={props.onUpdateCourses}
        onRemoveStudyContent={handleRemoveStudyContent}
        onMapExistingLessons={onMapExistingLessons}
        subjects={subjects}
        categories={categories}
      />
    );
  }

  return (
    <CourseLessonsView
      publishType={publishType}
      courseId={courseId}
      localLessons={lessons}
      constituentLessonIds={constituentLessonIds}
      onAdd={onAdd}
      onEdit={onEdit}
      onDelete={onDelete}
      onRemoveStudyContent={handleRemoveStudyContent}
      onMapExistingLessons={onMapExistingLessons}
      previewLessonIds={props.previewLessonIds}
      setPreviewLessonIds={props.setPreviewLessonIds}
    />
  );
}

