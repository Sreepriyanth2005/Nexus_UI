import React from "react";
import { useNavigate } from "react-router";
import { Loader2 } from "lucide-react";

interface FormActionsProps {
  isPending: boolean;
  onSaveAsDraft: () => void;
  isValid: boolean;
}

export const FormActions: React.FC<FormActionsProps> = ({
  isPending,
  onSaveAsDraft,
  isValid,
}) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-slate-200">
      <button
        type="button"
        onClick={() => navigate("/admin/learning-paths")}
        disabled={isPending}
        className="flex-1 sm:flex-none h-11 px-6 border border-slate-300 rounded-xl text-sm font-semibold hover:bg-slate-50 transition disabled:opacity-50"
      >
        Cancel
      </button>

      <button
        type="button"
        disabled={isPending}
        onClick={() => alert("Preview is not implemented.")}
        className="flex-1 sm:flex-none h-11 px-6 border border-slate-300 rounded-xl text-sm font-semibold hover:bg-slate-50 transition disabled:opacity-50"
      >
        Preview
      </button>

      <button
        type="button"
        onClick={onSaveAsDraft}
        disabled={isPending}
        className="flex-1 sm:flex-none h-11 px-6 border border-slate-300 rounded-xl text-sm font-semibold hover:bg-slate-50 transition sm:ml-auto disabled:opacity-50"
      >
        Save as Draft
      </button>

      <button
        type="submit"
        disabled={isPending || !isValid}
        className="flex-1 sm:flex-none h-11 px-6 bg-slate-900 hover:bg-black text-white rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 disabled:bg-slate-300 disabled:text-slate-400 disabled:cursor-not-allowed"
      >
        {isPending ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Saving...
          </>
        ) : (
          "Save and submit for review →"
        )}
      </button>
    </div>
  );
};
