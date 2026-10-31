import React, { useEffect, useState, useMemo } from "react";
import { useSearchParams, useNavigate, useParams } from "react-router";
import { CareerPathHeader } from "../../components/admin-learning-path/CareerPathHeader";
import { CourseList } from "../../components/admin-learning-path/CourseList";
import { FormActions } from "../../components/admin-learning-path/FormActions";
import { useAdminLearningPathUiStore } from "../../store/adminLearningPath.store";
import {
  useLearningPath,
  useSubjects,
  useUpdateLearningPath,
} from "../../hooks/admin-learning-path/useAdminLearningPath";
import { useCategories } from "../../hooks/category/useCategories";
import { useDifficultyLevels } from "../../hooks/useEnums";

const AdminCareerPathEdit: React.FC = () => {
  const navigate = useNavigate();
  const { careerPathId } = useParams<{ careerPathId?: string }>();
  const [searchParams] = useSearchParams();
  const pathId = careerPathId || searchParams.get("id") || searchParams.get("careerPathId");

  const {
    selectedCourses,
    selectedDifficulty,
    selectedVisibility,
    selectedStatus,
    setCourses,
    setStatus,
    setVisibility,
    setDifficulty,
    reset,
  } = useAdminLearningPathUiStore();

  const { data: learningPath, isLoading, isError, refetch } = useLearningPath(pathId || "");
  const { data: subjects = [] } = useSubjects();
  const { categories = [] } = useCategories();
  const { data: difficultyLevels = ["BEGINNER", "INTERMEDIATE", "ADVANCED"] } = useDifficultyLevels();
  const updateMutation = useUpdateLearningPath();

  // Local state for basic fields
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [description, setDescription] = useState("");
  const [whatIsIncluded, setWhatIsIncluded] = useState("");
  const [learningOutcome, setLearningOutcome] = useState("");
  const [duration, setDuration] = useState("");
  const [instructor, setInstructor] = useState("Nexus Academy");
  const [pricing, setPricing] = useState("");

  const [originalCourses, setOriginalCourses] = useState<{ id: string; title: string }[]>([]);

  // Auto-calculate aggregate duration from selected courses
  const computedDuration = useMemo(() => {
    const totalHours = selectedCourses.reduce((sum: number, c: any) => {
      const numStr = (c.duration || c.estimatedDuration || c.course?.duration || "")
        .toString()
        .replace(/[^0-9.]/g, "");
      return sum + (parseFloat(numStr || "0") || 0);
    }, 0);
    return totalHours > 0 ? `${totalHours} hours` : "0 hours";
  }, [selectedCourses]);

  // Reset store on mount
  useEffect(() => {
    reset();
  }, [reset]);

  // Sync loaded data into form and store
  useEffect(() => {
    if (learningPath) {
      setName(learningPath.title);
      setCategoryId(learningPath.categoryId || "");
      setSubjectId(learningPath.subjectId || "");
      setDescription(learningPath.description || "");
      setWhatIsIncluded(
        Array.isArray(learningPath.whatIsIncluded)
          ? learningPath.whatIsIncluded.join("\n")
          : (learningPath.whatIsIncluded || "")
      );
      setLearningOutcome(
        Array.isArray(learningPath.learningOutcome)
          ? learningPath.learningOutcome.join("\n")
          : (learningPath.learningOutcome || "")
      );
      setDuration(String(learningPath.duration || ""));
      setInstructor(learningPath.instructor || "Nexus Academy");
      setPricing(learningPath.pricing || "");

      const pathCourses = learningPath.courses || [];
      setCourses(pathCourses);
      setOriginalCourses(pathCourses);
      setStatus(
        learningPath.status === "UNDER_REVIEW"
          ? "Under Review"
          : learningPath.status === "PUBLISHED"
          ? "Published"
          : "Draft"
      );
      if (learningPath.visibility === "TENANT_ONLY") {
        setVisibility("Corporate");
      } else if (
        (learningPath.tenantIds && learningPath.tenantIds.length > 0) ||
        ((learningPath as any).careerPathTenants && (learningPath as any).careerPathTenants.length > 0)
      ) {
        setVisibility("Public and Corporate");
      } else {
        setVisibility("Public");
      }
      setDifficulty(learningPath.difficulty || "BEGINNER");
    }
  }, [learningPath, setCourses, setStatus, setVisibility, setDifficulty]);

  // Form Validation checks
  const isNameValid = name.trim().length > 0;
  const isDescriptionValid = description.trim().length > 0;
  const isDifficultyValid = selectedDifficulty.length > 0;
  const isStatusValid = selectedStatus.length > 0;
  const isVisibilityValid = selectedVisibility.length > 0;
  const isCoursesValid = selectedCourses.length > 0;

  const isValid =
    isNameValid &&
    isDescriptionValid &&
    isDifficultyValid &&
    isStatusValid &&
    isVisibilityValid &&
    isCoursesValid;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || !pathId) return;

    updateMutation.mutate(
      {
        id: pathId,
        payload: {
          formModel: {
            title: name,
            categoryId: categoryId || undefined,
            subjectId: subjectId || "",
            description,
            personas: [],
            difficulty: selectedDifficulty,
            whatIsIncluded,
            learningOutcome,
            duration: computedDuration,
            instructor,
            status: selectedStatus,
            pricing,
            visibility: selectedVisibility,
            tags: learningPath?.tags,
            skills: learningPath?.skills,
          },
          updatedCourses: selectedCourses,
          originalCourses,
        },
      },
      {
        onSuccess: () => {
          alert("Learning path updated successfully!");
          navigate("/admin/learning-paths");
        },
        onError: (err: any) => {
          alert(`Failed to update learning path: ${err?.message || "Unknown error"}`);
        },
      }
    );
  };

  const handleSaveAsDraft = () => {
    if (!pathId) return;
    updateMutation.mutate(
      {
        id: pathId,
        payload: {
          formModel: {
            title: name,
            categoryId: categoryId || undefined,
            subjectId: subjectId || "",
            description,
            personas: [],
            difficulty: selectedDifficulty,
            whatIsIncluded,
            learningOutcome,
            duration: computedDuration,
            instructor,
            status: "DRAFT",
            pricing,
            visibility: selectedVisibility,
          },
          updatedCourses: selectedCourses,
          originalCourses,
        },
      },
      {
        onSuccess: () => {
          alert("Draft saved successfully!");
          navigate("/admin/learning-paths");
        },
      }
    );
  };

  if (isLoading && pathId) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
        <div className="animate-pulse space-y-4 w-full max-w-4xl">
          <div className="h-8 bg-slate-200 rounded w-1/4"></div>
          <div className="h-64 bg-slate-200 rounded-3xl"></div>
          <div className="h-48 bg-slate-200 rounded-3xl"></div>
        </div>
      </div>
    );
  }

  if (isError && pathId) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
        <div className="max-w-md bg-white border border-slate-200 rounded-3xl p-8 text-center shadow-sm">
          <h3 className="text-lg font-bold text-slate-900">Failed to load learning path</h3>
          <p className="text-sm text-slate-500 mt-2">
            We couldn't retrieve details for this learning path. Please try again.
          </p>
          <button
            onClick={() => refetch()}
            className="mt-6 px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-semibold rounded-xl transition"
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <CareerPathHeader isEdit={!!pathId} />

        <form onSubmit={handleFormSubmit} className="space-y-6">
          {/* Form Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 md:p-8 shadow-sm space-y-6">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              SA-3 Career Path Administrative Requirements
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Career path name */}
              <div className="md:col-span-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Career path name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. CDMP Pathway"
                  className="w-full h-11 border border-slate-300 rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-slate-900/10 transition"
                  required
                />
                {!isNameValid && (
                  <span className="text-[10px] text-red-500 mt-1 block">Name is required</span>
                )}
              </div>

              {/* Subject / Domain */}
              <div className="md:col-span-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Subject / Domain <span className="text-red-500">*</span>
                </label>
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="w-full h-11 border border-slate-300 rounded-xl px-4 text-sm outline-none bg-white focus:ring-2 focus:ring-slate-900/10 cursor-pointer transition"
                  required
                >
                  <option value="">Select subject / domain...</option>
                  {subjects.map((sub: any) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Purpose and expected learning outcome of the path"
                  rows={3}
                  className="w-full border border-slate-300 rounded-xl p-4 text-sm outline-none focus:ring-2 focus:ring-slate-900/10 transition"
                  required
                />
                {!isDescriptionValid && (
                  <span className="text-[10px] text-red-500 mt-1 block">Description is required</span>
                )}
              </div>

              {/* Difficulty level */}
              <div className="md:col-span-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Difficulty level <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full h-11 border border-slate-300 rounded-xl px-4 text-sm outline-none bg-white focus:ring-2 focus:ring-slate-900/10 cursor-pointer transition"
                >
                  {difficultyLevels.map((lvl: any) => (
                    <option key={lvl} value={lvl}>
                      {String(lvl).charAt(0).toUpperCase() + String(lvl).slice(1).toLowerCase()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Empty column */}
              <div className="hidden md:block"></div>

              {/* What is included */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  What is included <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={whatIsIncluded}
                  onChange={(e) => setWhatIsIncluded(e.target.value)}
                  placeholder="Path benefits: number of courses, lessons, downloadable resources, hands-on projects, certificates earned, support"
                  rows={2}
                  className="w-full border border-slate-300 rounded-xl p-4 text-sm outline-none focus:ring-2 focus:ring-slate-900/10 transition"
                />
              </div>

              {/* Learning outcome */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Learning outcome <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={learningOutcome}
                  onChange={(e) => setLearningOutcome(e.target.value)}
                  placeholder="Specific, measurable, learner-focused statement of what learner can do upon completion"
                  rows={2}
                  className="w-full border border-slate-300 rounded-xl p-4 text-sm outline-none focus:ring-2 focus:ring-slate-900/10 transition"
                  required
                />
              </div>

              {/* Estimated duration (auto-calculated from selected courses, read-only) */}
              <div className="md:col-span-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Estimated duration
                </label>
                <input
                  type="text"
                  value={computedDuration}
                  readOnly
                  disabled
                  className="w-full h-11 border border-slate-200 bg-slate-50 text-slate-500 rounded-xl px-4 text-sm outline-none cursor-not-allowed transition"
                />
                <span className="text-[10px] text-slate-400 font-medium mt-1.5 block">
                  Auto-calculated aggregate of constituent course durations
                </span>
              </div>

              {/* Instructor */}
              <div className="md:col-span-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Instructor <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={instructor}
                  onChange={(e) => setInstructor(e.target.value)}
                  placeholder="Nexus Academy"
                  className="w-full h-11 border border-slate-300 rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-slate-900/10 transition"
                  required
                />
                <span className="text-[10px] text-slate-400 font-medium mt-1.5 block">
                  Default is Nexus Academy; replace per PATH-14
                </span>
              </div>

              {/* Status */}
              <div className="md:col-span-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full h-11 border border-slate-300 rounded-xl px-4 text-sm outline-none bg-white focus:ring-2 focus:ring-slate-900/10 cursor-pointer transition"
                >
                  <option value="Draft">Draft</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Published">Published</option>
                </select>
              </div>

              {/* Pricing */}
              <div className="md:col-span-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Pricing <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={pricing}
                  onChange={(e) => setPricing(e.target.value)}
                  placeholder="e.g. OMR 80 (path-level) or Free"
                  className="w-full h-11 border border-slate-300 rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-slate-900/10 transition"
                  required
                />
                <span className="text-[10px] text-slate-400 font-medium mt-1.5 block">
                  Set at path level; courses can also have individual pricing
                </span>
              </div>

              {/* Visibility */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Visibility
                </label>
                <select
                  value={selectedVisibility}
                  onChange={(e) => setVisibility(e.target.value)}
                  className="w-full h-11 border border-slate-300 rounded-xl px-4 text-sm outline-none bg-white focus:ring-2 focus:ring-slate-900/10 cursor-pointer transition"
                >
                  <option value="Public">Public</option>
                  <option value="Corporate">Corporate</option>
                  <option value="Public and Corporate">Public and Corporate</option>
                </select>
              </div>
            </div>
          </div>

          {/* Courses Section */}
          <CourseList />
          {!isCoursesValid && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs text-red-700">
              Learning path must contain at least one course.
            </div>
          )}

          {/* Actions Bottom Bar */}
          <FormActions
            isPending={updateMutation.isPending}
            onSaveAsDraft={handleSaveAsDraft}
            isValid={isValid}
          />
        </form>
      </div>
    </div>
  );
};

export default AdminCareerPathEdit;
