import React from "react";
import { useNavigate } from "react-router";

interface CareerPathHeaderProps {
  isEdit?: boolean;
}

export const CareerPathHeader: React.FC<CareerPathHeaderProps> = ({ isEdit = false }) => {
  const navigate = useNavigate();

  return (
    <div className="pb-4">
      <button
        onClick={() => navigate("/admin/learning-paths")}
        className="text-xs text-slate-500 hover:text-slate-900 transition flex items-center gap-1 font-semibold mb-2"
      >
        ← Career Paths
      </button>
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
        {isEdit ? "Edit career path" : "Create career path"}
      </h1>
    </div>
  );
};
