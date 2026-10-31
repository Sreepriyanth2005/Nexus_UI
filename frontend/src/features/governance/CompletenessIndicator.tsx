import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

export interface CompletenessCheck {
  type: 'success' | 'error';
  message: string;
}

export interface CompletenessReport {
  isCourseComplete: boolean;
  courseCompleteness: CompletenessCheck[];
  lessonsCompleteness: {
    title: string;
    isComplete: boolean;
    checks: CompletenessCheck[];
  }[];
}

interface Props {
  report: CompletenessReport | null;
}

export const CompletenessIndicator: React.FC<Props> = ({ report }) => {
  if (!report) return null;

  return (
    <div className="p-4 border border-border rounded-lg bg-card text-card-foreground">
      <h3 className="text-lg font-semibold mb-2">
        Governance Completeness Score
      </h3>
      
      <span 
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mb-3 ${
          report.isCourseComplete 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}
      >
        {report.isCourseComplete ? 'Ready for Publishing' : 'Incomplete - Missing Required Fields'}
      </span>

      <h4 className="text-sm font-bold text-foreground mt-2 mb-1">Course Level Checks</h4>
      <ul className="space-y-1.5">
        {report.courseCompleteness.map((check, idx) => (
          <li key={`course-check-${idx}`} className="flex items-center gap-2 text-sm">
            {check.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            )}
            <span className="text-muted-foreground">{check.message}</span>
          </li>
        ))}
      </ul>

      {report.lessonsCompleteness.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-bold text-foreground mb-2">Lesson Level Checks</h4>
          {report.lessonsCompleteness.map((lesson, idx) => (
            <div key={`lesson-${idx}`} className="ml-3 mt-2">
              <p className="text-xs font-semibold text-foreground">{lesson.title}</p>
              <ul className="space-y-1 mt-1">
                {lesson.checks.map((check, cIdx) => (
                  <li key={`lesson-check-${idx}-${cIdx}`} className="flex items-center gap-2 text-xs">
                    {check.type === 'success' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
                    )}
                    <span className="text-muted-foreground">{check.message}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
