import React from "react";
import { Video, FileText, Headphones, BookOpen } from "lucide-react";

interface LessonTypeBadgeProps {
  type: string;
}

const typeConfig: Record<string, { icon: React.ReactNode; cls: string }> = {
  Video: {
    icon: <Video className="w-3 h-3" />,
    cls: "text-indigo-600 bg-indigo-50 border-indigo-200",
  },
  Reading: {
    icon: <FileText className="w-3 h-3" />,
    cls: "text-blue-600 bg-blue-50 border-blue-200",
  },
  Audio: {
    icon: <Headphones className="w-3 h-3" />,
    cls: "text-purple-600 bg-purple-50 border-purple-200",
  },
  Interactive: {
    icon: <BookOpen className="w-3 h-3" />,
    cls: "text-teal-600 bg-teal-50 border-teal-200",
  },
};

export const LessonTypeBadge: React.FC<LessonTypeBadgeProps> = ({ type }) => {
  const config = typeConfig[type] ?? {
    icon: <BookOpen className="w-3 h-3" />,
    cls: "text-gray-600 bg-gray-100 border-gray-200",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 border text-[10px] font-bold px-2 py-0.5 rounded select-none ${config.cls}`}
    >
      {config.icon}
      {type}
    </span>
  );
};

export default LessonTypeBadge;
