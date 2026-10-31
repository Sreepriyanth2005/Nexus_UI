// src/components/course-builder/CourseBuilderHeader.tsx

import { CourseBuilderSection } from "./CourseBuilderStepper";
import { Button } from "../design-system";

interface CourseBuilderHeaderProps {
  activeSection: CourseBuilderSection;
  onNext: () => void;
  onSaveDraft: () => void;
  onPreview: () => void;
  onDiscard?: () => void;
  isSubmitting?: boolean;
  isDraftSaving?: boolean;
}

const CourseBuilderHeader = ({
  activeSection,
  onNext,
  onSaveDraft,
  onPreview,
  onDiscard,
  isSubmitting = false,
  isDraftSaving = false,
}: CourseBuilderHeaderProps) => {
  return (
    <header className="bg-paper border-b border-line h-14 px-6 flex items-center justify-between top-0 z-40 shadow-xs">
      {/* LEFT */}
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 bg-paper-2 border border-line rounded flex items-center justify-center font-bold text-[10px] text-ink">
          A
        </div>

        <span className="text-label font-bold text-ink tracking-tight">
          Course Builder
        </span>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-2">
        {onDiscard && (
          <Button
            type="button"
            variant="danger"
            onClick={onDiscard}
            disabled={isDraftSaving || isSubmitting}
          >
            Discard
          </Button>
        )}

        <Button
          type="button"
          variant="muted"
          onClick={onSaveDraft}
          disabled={isDraftSaving}
        >
          Save Draft
        </Button>

        <Button
          type="button"
          variant="ghost"
          onClick={onPreview}
        >
          Preview
        </Button>

        <Button
          type="button"
          variant="primary"
          onClick={onNext}
          disabled={isSubmitting}
          className="min-w-[70px] flex justify-center items-center gap-1.5"
        >
          {isSubmitting ? (
            <>
              <span className="w-3 h-3 border-2 border-ink/30 border-t-ink rounded-full animate-spin"></span>
              <span>Saving...</span>
            </>
          ) : (
            <>
              <span>
                {activeSection === "review" ? "Publish" : "Next"}
              </span>

              {activeSection !== "review" && (
                <span className="text-[10px]">➔</span>
              )}
            </>
          )}
        </Button>
      </div>
    </header>
  );
};

export default CourseBuilderHeader;