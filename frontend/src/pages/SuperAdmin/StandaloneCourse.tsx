import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { useSubjects } from "../../hooks/useSubjects";
import { useDifficultyLevels, useVisibilities } from "../../hooks/useEnums";
import { useQuery } from "@tanstack/react-query";
import { getTenantsApi } from "../../core/api/tenant.api";
import { useCategories } from "../../hooks/category/useCategories";
import { useSubcategories } from "../../hooks/category/useSubcategories";
import Select from "react-select";
import { useLessons } from "../../hooks/lesson/useLessons";

export interface StandaloneCourseFormData {
  visibility: string;
  corporateTenant: string[];
  assessmentRequired: boolean;

  courseTitle: string;
  courseSubtitle: string;
  tagline: string;
  fullDescription: string;

  subjectId: string;
  categoryId: string;
  subcategoryId: string;

  difficulty: string;
  duration: string;

  learningOutcomes: string;
  shortDescription: string;
  learningObjectives: string;
  targetAudience: string;
  prerequisites: string;
  existingLessonIds: string[];
  careerPathLink: string;

  language: string;
  priceTier: string;

  coursethumbnail: File | null;
  courseThumbnailAssetUrl?: string;

  tags: string[];
  skillsGain: string;
  attachment: File | null;
}

type StandaloneCourseProps = {
  formData: StandaloneCourseFormData;
  updateForm: (updates: Partial<StandaloneCourseFormData>) => void;
  onBack?: () => void;
  isEditMode?: boolean;
  hideLessons?: boolean;
};

// ─── Shared style tokens ───────────────────────────────────────────────────────
const inputCls =
  "h-10 w-full rounded-lg border border-[#dce3ea] bg-white px-3.5 text-[14px] text-[#1e2d3d] outline-none transition placeholder:text-[#9aa5b1] focus:border-[#4a90d9] focus:ring-2 focus:ring-[#dbeafe]";
const selectCls =
  "h-10 w-full appearance-none rounded-lg border border-[#dce3ea] bg-white px-3.5 pr-9 text-[14px] text-[#1e2d3d] outline-none transition focus:border-[#4a90d9] focus:ring-2 focus:ring-[#dbeafe]";
const labelCls = "block text-[13px] font-semibold text-[#1e2d3d]";
const hintCls = "mt-1 text-[11px] text-[#6b7a8d]";
const textareaCls =
  "w-full resize-y rounded-lg border border-[#dce3ea] bg-white p-3.5 text-[14px] text-[#1e2d3d] outline-none transition placeholder:text-[#9aa5b1] focus:border-[#4a90d9] focus:ring-2 focus:ring-[#dbeafe]";

const blueSectionCls =
  "rounded-xl border border-[#c9dff5] bg-[#edf5fd] px-6 py-6";
const reqStar = <span className="text-[#e53935] ml-0.5">*</span>;

// ─── Chevron icon ─────────────────────────────────────────────────────────────
function ChevronDown({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`h-4 w-4 shrink-0 text-[#6b7a8d] ${className}`}
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  );
}

// ─── SelectField helper ───────────────────────────────────────────────────────
function SelectField({
  value,
  onChange,
  children,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={
          selectCls + (disabled ? " opacity-50 cursor-not-allowed" : "")
        }
      >
        {children}
      </select>
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
        <ChevronDown />
      </span>
    </div>
  );
}



export default function StandaloneCourse({
  formData,
  updateForm,
  onBack,
  isEditMode = false,
  hideLessons = false,
}: StandaloneCourseProps) {
  // API data
  const { subjects } = useSubjects();
  const { categories } = useCategories();
  const { data: difficultyLevels = [] } = useDifficultyLevels();
  const { data: visibilities = [] } = useVisibilities();
  const { data: tenants = [] } = useQuery({ queryKey: ["tenants"], queryFn: getTenantsApi });
  const [newSubcategoryName, setNewSubcategoryName] = useState("");
  const tenantOptions = useMemo(
    () => tenants.map((t: any) => ({ label: t.name, value: t.id })),
    [tenants]
  );

  const {
    subcategories,
    loading: subcategoryLoading,
    createSubcategory,
  } = useSubcategories(
    formData.categoryId && formData.categoryId !== "new"
      ? formData.categoryId
      : undefined,
  );

  // Defaults — only set once, when the parent hasn't already populated them
  useEffect(() => {
    if (subjects?.length && !formData.subjectId) {
      updateForm({ subjectId: subjects[0].id });
    }
  }, [subjects, formData.subjectId]);

  useEffect(() => {
    if (categories?.length && !formData.categoryId) {
      updateForm({ categoryId: categories[0].id });
    }
  }, [categories, formData.categoryId]);

  // Derived
  const subtitleMax = 200;
  const shortDescMax = 160;
  const objectiveLines = formData.learningObjectives
    .split("\n")
    .map((l: string) => l.trim())
    .filter(Boolean);
  const { data: lessonsResponse, isLoading: lessonsLoading } = useLessons({ limit: 100 });
  const availableLessons = Array.isArray(lessonsResponse?.data?.data) ? lessonsResponse.data.data : (Array.isArray(lessonsResponse?.data) ? lessonsResponse.data : (Array.isArray(lessonsResponse) ? lessonsResponse : []));

  const lessonOptions = availableLessons
    .filter((lesson: any) => lesson.status === "PUBLISHED")
    .map((lesson: any) => ({
      value: lesson.id,
      label: lesson.title,
    }));



  useEffect(() => {
    if (!formData.priceTier) {
      updateForm({
        priceTier: "FREE",
      });
    }
  }, [formData.priceTier, updateForm]);

  const handleCourseThumbnailChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] || null;

      console.log("Selected file:", file);

      updateForm({
        coursethumbnail: file,
      });
    },
    [updateForm],
  );

  return (
    <>
      {/* ════════════════════════════════════════════════════════
            SECTION 1 — Additional Course Information (blue)
        ════════════════════════════════════════════════════════ */}
      <div
        className={`border border-emerald-100 rounded-3xl p-8 shadow-sm ${blueSectionCls}`}
      >
        <h2 className="mb-5 text-[15px] font-bold text-[#1a3a5c] tracking-tight">
          Additional course information
        </h2>

        {/* Row: Subtitle + Language */}
        <div className="grid gap-5 sm:grid-cols-2">
          {/* COURSE TITLE */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-gray-700">
              Course title <span className="text-red-500">*</span>
            </label>

            <input
              type="text"
              value={formData.courseTitle}
              onChange={(e) =>
                updateForm({
                  courseTitle: e.target.value,
                })
              }
              placeholder="e.g. Data Quality Foundations"
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs font-medium placeholder-gray-400 focus:outline-none focus:border-black"
            />
          </div>
          <div>
            <label className={labelCls}>Course subtitle</label>
            <input
              value={formData.courseSubtitle}
              onChange={(e) => updateForm({ courseSubtitle: e.target.value })}
              placeholder="One-line description"
              maxLength={subtitleMax}
              className={`${inputCls} mt-2`}
            />
            <p className={`${hintCls} flex justify-between`}>
              <span>Max {subtitleMax} chars · optional</span>
              <span
                className={
                  formData.courseSubtitle.length > subtitleMax * 0.85
                    ? "text-[#e53935]"
                    : ""
                }
              >
                {formData.courseSubtitle.length}/{subtitleMax}
              </span>
            </p>
          </div>
        </div>

        {/* Row: Category + Subcategory */}
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Category {reqStar}</label>
            <div className="mt-2">
              <SelectField
                value={formData.categoryId}
                onChange={(value) =>
                  updateForm({
                    categoryId: value,
                    subcategoryId: "",
                  })
                }
              >
                <option value="">
                  {categories?.length ? "Select Category" : "Loading Categories..."}
                </option>
                {(categories ?? []).map((cat: any) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </SelectField>
            </div>
          </div>

          <div>
            <label className={labelCls}>Subcategory</label>
            <div className="mt-2">
              <SelectField
                value={formData.subcategoryId}
                onChange={(value) =>
                  updateForm({
                    subcategoryId: value,
                  })
                }
                disabled={!formData.categoryId || formData.categoryId === "new"}
              >
                <option value="">
                  {!formData.categoryId
                    ? "Select Category First"
                    : subcategoryLoading
                      ? "Loading Subcategories..."
                      : "Select Subcategory (Optional)"}
                </option>

                {(subcategories ?? []).map((subcategory: any) => (
                  <option key={subcategory.id} value={subcategory.id}>
                    {subcategory.name}
                  </option>
                ))}

                <option value="new">+ Add New Subcategory</option>
              </SelectField>

              {formData.subcategoryId === "new" && formData.categoryId && (
                <div className="mt-3 flex gap-2">
                  <input
                    type="text"
                    value={newSubcategoryName}
                    onChange={(e) => setNewSubcategoryName(e.target.value)}
                    placeholder="Enter subcategory"
                    className={inputCls}
                  />

                  <button
                    type="button"
                    className="rounded-lg bg-[#1e2d3d] px-4 text-white"
                    onClick={async () => {
                      if (!newSubcategoryName.trim()) return;

                      try {
                        const created = await createSubcategory({
                          categoryId: formData.categoryId,
                          payload: {
                            name: newSubcategoryName.trim(),
                          },
                        });

                        updateForm({
                          subcategoryId: created.data.id,
                        });

                        setNewSubcategoryName("");
                      } catch (error) {
                        console.error(error);
                      }
                    }}
                  >
                    Add
                  </button>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className={labelCls}>Price / Access Tier {reqStar}</label>
            <div className="mt-2">
              <SelectField
                value={formData.priceTier || "FREE"}
                onChange={(v) =>
                  updateForm({
                    priceTier: v as "FREE" | "PAID" | "PREMIUM",
                  })
                }
              >
                <option value="FREE">Free</option>
                <option value="PAID">Paid</option>
                <option value="PREMIUM">Premium</option>
              </SelectField>
            </div>
          </div>
        </div>



        {/* Course Thumbnail */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1.5">
            Course Thumline <span className="text-red-500">*</span>
          </label>
          {(() => {
            const existingUrl = formData.courseThumbnailAssetUrl || "";

            if (!formData.coursethumbnail && !existingUrl) {
              return (
                <label className="border border-dashed border-gray-300 bg-white hover:bg-gray-50 rounded-2xl h-28 flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCourseThumbnailChange}
                    className="hidden"
                  />
                  <div className="text-center text-sm text-gray-500">
                    Optional • WCAG • captions
                  </div>
                </label>
              );
            }

            return (
              <div className="border border-gray-200 bg-gray-50 rounded-2xl p-4 flex flex-col items-center justify-center relative min-h-28">
                {formData.coursethumbnail ? (
                  <span className="text-xs font-semibold text-gray-700 block truncate max-w-[280px]">
                    {formData.coursethumbnail.name}
                  </span>
                ) : (
                  <img
                    src={existingUrl}
                    alt="Current Thumbnail"
                    className="h-16 object-contain rounded-md border border-gray-200"
                  />
                )}
                <div className="flex gap-3 mt-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      const url = formData.coursethumbnail ? URL.createObjectURL(formData.coursethumbnail) : existingUrl;
                      window.open(url, "_blank");
                    }}
                    className="bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 font-bold text-xs px-3 py-1 rounded transition-all"
                  >
                    Preview
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      updateForm({ coursethumbnail: null, courseThumbnailAssetUrl: "" });
                    }}
                    className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-bold text-xs px-3 py-1 rounded transition-all"
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Short Description */}
        <div className="mt-5">
          <label className={labelCls}>Short description {reqStar}</label>
          <textarea
            value={formData.shortDescription}
            onChange={(e) => updateForm({ shortDescription: e.target.value })}
            placeholder="Catalog card description"
            rows={3}
            className={`${textareaCls} mt-2`}
          />
          <p className={`${hintCls} flex justify-between`}>
            <span>Max {shortDescMax} chars</span>
            <span
              className={
                formData.shortDescription.length > shortDescMax
                  ? "text-[#e53935] font-semibold"
                  : ""
              }
            >
              {formData.shortDescription.length}/{shortDescMax}
            </span>
          </p>
        </div>

        {/* Learning Objectives */}
        <div className="mt-5">
          <label className={labelCls}>Learning objectives {reqStar}</label>
          <textarea
            value={formData.learningObjectives}
            onChange={(e) => updateForm({ learningObjectives: e.target.value })}
            placeholder="One objective per line · min 3"
            rows={4}
            className={`${textareaCls} mt-2`}
          />
          <p className={`${hintCls} flex items-center gap-1.5`}>
            <span
              className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold ${objectiveLines.length >= 3
                ? "bg-[#bbf7d0] text-[#166534]"
                : "bg-[#fee2e2] text-[#991b1b]"
                }`}
            >
              {objectiveLines.length >= 3 ? "✓" : objectiveLines.length}
            </span>
            Min 3 objectives · each max 150 chars
          </p>
        </div>



        {/* Row: Target Audience + Prerequisites */}
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Target audience</label>
            <textarea
              value={formData.targetAudience}
              onChange={(e) => updateForm({ targetAudience: e.target.value })}
              placeholder="Who this course is for"
              rows={3}
              className={`${textareaCls} mt-2`}
            />
          </div>

          <div>
            <label className={labelCls}>Prerequisites</label>
            <textarea
              value={formData.prerequisites}
              onChange={(e) => updateForm({ prerequisites: e.target.value })}
              placeholder="What learners need to know before starting"
              rows={3}
              className={`${textareaCls} mt-2`}
            />
          </div>
        </div>

        {!hideLessons && (
          <div className="mt-5">
            <label className={labelCls}>Constituent Lessons</label>
            <Select
              isMulti
              options={lessonOptions}
              isLoading={lessonsLoading}
              className="mt-2"
              value={lessonOptions.filter((opt: any) => formData.existingLessonIds?.includes(opt.value))}
              onChange={(selected) => {
                updateForm({ existingLessonIds: selected.map((s: any) => s.value) });
              }}
              placeholder="Select lessons..."
            />
          </div>
        )}
      </div>
    </>
  );
}