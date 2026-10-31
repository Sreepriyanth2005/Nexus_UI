import React, { useState } from "react";
import { useAdminLearningPathUiStore } from "../../store/adminLearningPath.store";
import { useCourses } from "../../hooks/admin-learning-path/useAdminLearningPath";
import { CourseListItem } from "./CourseListItem";
import { Search } from "lucide-react";

export const CourseList: React.FC = () => {
  const {
    selectedCourses,
    searchCourse,
    addCourse,
    removeCourse,
    reorderCourses,
    setSearchCourse,
  } = useAdminLearningPathUiStore();

  const { data: availableCourses = [], isLoading } = useCourses();
  const [showDropdown, setShowDropdown] = useState(false);

  // Filter courses that are not already added to the learning path
  const unselectedCourses = availableCourses.filter(
    (c) =>
      !selectedCourses.some((sc) => sc.id === c.id) &&
      c.title.toLowerCase().includes(searchCourse.toLowerCase())
  );

  const handleSelectCourse = (course: { id: string; title: string }) => {
    addCourse(course);
    setSearchCourse("");
    setShowDropdown(false);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-5 md:p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 mb-4 gap-3 relative">
        <h3 className="text-sm md:text-base font-bold text-slate-800">
          Courses in this path
        </h3>

        <div className="flex items-center gap-2 relative w-full sm:w-auto">
          {/* Add Course trigger */}
          <button
            type="button"
            onClick={() => setShowDropdown(!showDropdown)}
            className="h-9 px-4 bg-slate-900 text-white hover:bg-black text-xs font-semibold rounded-xl transition whitespace-nowrap"
          >
            + Add course
          </button>

          {/* Add Course search dropdown */}
          {showDropdown && (
            <div className="absolute right-0 top-11 z-[100] w-72 bg-white border border-slate-200 rounded-2xl shadow-xl p-3 space-y-2 animate-in fade-in duration-100">
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Search available courses..."
                  value={searchCourse}
                  onChange={(e) => setSearchCourse(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 border border-slate-300 rounded-lg text-xs outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 transition"
                  autoFocus
                />
              </div>

              <div className="max-h-48 overflow-y-auto divide-y divide-slate-50">
                {isLoading ? (
                  <div className="py-4 text-center text-xs text-slate-400">Loading courses...</div>
                ) : unselectedCourses.length === 0 ? (
                  <div className="py-4 text-center text-xs text-slate-400">No courses available</div>
                ) : (
                  unselectedCourses.map((course) => (
                    <button
                      key={course.id}
                      type="button"
                      onClick={() => handleSelectCourse(course)}
                      className="w-full text-left py-2 px-3 hover:bg-slate-50 text-xs text-slate-700 font-medium rounded-lg transition"
                    >
                      {course.title}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {selectedCourses.map((course, index) => (
          <CourseListItem
            key={course.id}
            id={course.id}
            index={index + 1}
            title={course.title}
            onRemove={removeCourse}
            onMoveUp={() => reorderCourses(index, index - 1)}
            onMoveDown={() => reorderCourses(index, index + 1)}
            isFirst={index === 0}
            isLast={index === selectedCourses.length - 1}
          />
        ))}

        {selectedCourses.length === 0 && (
          <div className="text-center py-8 text-xs text-slate-400 font-medium">
            No courses in this learning path yet. Click "+ Add course" to add.
          </div>
        )}
      </div>
    </div>
  );
};
