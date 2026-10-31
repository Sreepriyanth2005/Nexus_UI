import React from 'react';
import { PlayCircle, FileText, CheckCircle2 } from 'lucide-react';

export interface LessonMenuItem {
  id: string;
  title: string;
  type: 'video' | 'document' | 'quiz';
  isCompleted: boolean;
  isActive?: boolean;
}

interface LearningNavigationProps {
  courseTitle: string;
  lessons: LessonMenuItem[];
  onSelectLesson: (lessonId: string) => void;
}

export const LearningNavigation: React.FC<LearningNavigationProps> = ({
  courseTitle,
  lessons,
  onSelectLesson,
}) => {
  const completedCount = lessons.filter(l => l.isCompleted).length;
  const progressPercentage = Math.round((completedCount / (lessons.length || 1)) * 100);

  const getIconForType = (type: string, isCompleted: boolean) => {
    if (isCompleted) {
      return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    }
    switch (type) {
      case 'video':
        return <PlayCircle className="w-5 h-5 text-gray-400" />;
      case 'document':
        return <FileText className="w-5 h-5 text-gray-400" />;
      case 'quiz':
        return <CheckCircle2 className="w-5 h-5 text-gray-400" />;
      default:
        return <PlayCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="flex flex-col w-full h-full bg-white border-r border-gray-200">
      {/* Header & Course Progress */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <h3 className="text-lg font-bold text-gray-900 mb-3">{courseTitle}</h3>
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center text-sm">
            <span className="font-medium text-gray-700">Course Progress</span>
            <span className="font-semibold text-blue-600">{progressPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {completedCount} of {lessons.length} lessons completed
          </div>
        </div>
      </div>

      {/* Lesson List */}
      <div className="flex-1 overflow-y-auto">
        <ul className="flex flex-col">
          {lessons.map((lesson, index) => (
            <li key={lesson.id}>
              <button
                onClick={() => onSelectLesson(lesson.id)}
                className={`w-full flex items-start gap-3 p-4 text-left border-b border-gray-100 transition-colors ${
                  lesson.isActive
                    ? 'bg-blue-50 border-l-4 border-l-blue-600'
                    : 'hover:bg-gray-50 border-l-4 border-l-transparent'
                }`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {getIconForType(lesson.type, lesson.isCompleted)}
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <span
                    className={`text-sm font-medium leading-snug truncate whitespace-normal line-clamp-2 ${
                      lesson.isActive ? 'text-blue-700' : 'text-gray-700'
                    }`}
                  >
                    {index + 1}. {lesson.title}
                  </span>
                  <span className="text-xs text-gray-500 mt-1 capitalize">
                    {lesson.type}
                  </span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default LearningNavigation;
