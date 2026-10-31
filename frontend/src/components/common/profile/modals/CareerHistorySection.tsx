import React from "react";
import type { CareerHistory } from "../../../../types/profile.type";
import { X } from "lucide-react";

interface Props {
  value: CareerHistory[];
  onChange: (value: CareerHistory[]) => void;
  currentEmployer?: string;
}

const emptyCareer: CareerHistory = {
  id: "",
  jobTitle: "",
  employer: "",
  jobDescription: "",
  startDate: "",
  endDate: "",
  isCurrentJob: true,
};

const CareerHistorySection: React.FC<Props> = ({
  value,
  onChange,
  currentEmployer,
}) => {
  const addExperience = () => {
    onChange([
      ...value,
      { ...emptyCareer, id: crypto.randomUUID() },
    ]);
  };

  const updateExperience = (id: string, field: keyof CareerHistory, newValue: any) => {
    onChange(
      value.map((item) => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: newValue };
          
          if (field === "isCurrentJob" && newValue === true && currentEmployer && !item.employer) {
            updatedItem.employer = currentEmployer;
          }
          if (field === "isCurrentJob" && newValue === true) {
            updatedItem.endDate = "";
          }
          
          return updatedItem;
        }
        return item;
      })
    );
  };

  const removeExperience = (id: string) => {
    onChange(value.filter((item) => item.id !== id));
  };

  return (
    <div className="flex flex-col w-full">
      <h3 className="text-[11px] font-bold text-[#5c5c5c] uppercase tracking-widest mb-6">
        EMPLOYMENT / EXPERIENCE
      </h3>

      {value.length === 0 && (
        <div className="text-[13px] text-[#8c8c8c] mb-6 italic">
          No experience added yet.
        </div>
      )}

      {value.map((career, index) => (
        <div
          key={career.id || index}
          className="bg-[#fafafa] rounded-xl border border-[#e5e5e5] p-6 mb-6 relative group"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-6">
            <div>
              <label className="block text-[12px] font-bold text-[#141414] mb-2">
                Employer <span className="text-[#d92d20]">*</span>
              </label>
              <input
                className="w-full h-11 border border-[#e5e5e5] rounded-md bg-white px-3.5 text-[#141414] text-[14px] focus:outline-none focus:border-[#c99b2e] focus:ring-1 focus:ring-[#c99b2e] transition-all"
                placeholder="Organisation name"
                value={career.employer}
                onChange={(e) =>
                  updateExperience(career.id || "", "employer", e.target.value)
                }
              />
            </div>
            <div>
              <label className="block text-[12px] font-bold text-[#141414] mb-2">
                Role / Title <span className="text-[#d92d20]">*</span>
              </label>
              <input
                className="w-full h-11 border border-[#e5e5e5] rounded-md bg-white px-3.5 text-[#141414] text-[14px] focus:outline-none focus:border-[#c99b2e] focus:ring-1 focus:ring-[#c99b2e] transition-all"
                placeholder="e.g. Records Manager"
                value={career.jobTitle}
                onChange={(e) =>
                  updateExperience(career.id || "", "jobTitle", e.target.value)
                }
              />
            </div>
            <div>
              <label className="block text-[12px] font-bold text-[#141414] mb-2">
                Start date <span className="text-[#d92d20]">*</span>
              </label>
              <input
                type="date"
                className="w-full h-11 border border-[#e5e5e5] rounded-md bg-white px-3.5 text-[#141414] text-[14px] focus:outline-none focus:border-[#c99b2e] focus:ring-1 focus:ring-[#c99b2e] transition-all"
                value={career.startDate}
                onChange={(e) =>
                  updateExperience(career.id || "", "startDate", e.target.value)
                }
              />
            </div>
            <div>
              <label className="flex text-[12px] font-bold text-[#141414] mb-2 items-center justify-between">
                <span>End date</span>
                <label className="flex items-center gap-1.5 font-medium text-[#5c5c5c] cursor-pointer normal-case">
                  <input
                    type="checkbox"
                    checked={career.isCurrentJob}
                    onChange={(e) => {
                      updateExperience(career.id || "", "isCurrentJob", e.target.checked);
                    }}
                    className="accent-[#141414] w-3.5 h-3.5 cursor-pointer rounded-sm"
                  />
                  <span className="text-[11px]">I currently work here</span>
                </label>
              </label>
              <input
                type={career.isCurrentJob ? "text" : "date"}
                className="w-full h-11 border border-[#e5e5e5] rounded-md bg-white px-3.5 text-[#141414] text-[14px] focus:outline-none focus:border-[#c99b2e] focus:ring-1 focus:ring-[#c99b2e] transition-all disabled:bg-[#fafafa] disabled:text-[#8c8c8c] disabled:cursor-not-allowed"
                value={career.isCurrentJob ? new Date().toISOString().split('T')[0] : (career.endDate || "")}
                onChange={(e) =>
                  updateExperience(career.id || "", "endDate", e.target.value)
                }
                disabled={career.isCurrentJob}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[12px] font-bold text-[#141414] mb-2">
                Description
              </label>
              <textarea
                rows={5}
                className="w-full border border-[#e5e5e5] rounded-md bg-white p-3.5 text-[#141414] text-[14px] focus:outline-none focus:border-[#c99b2e] focus:ring-1 focus:ring-[#c99b2e] transition-all resize-y"
                placeholder="Brief description of your responsibilities"
                value={career.jobDescription}
                onChange={(e) =>
                  updateExperience(career.id || "", "jobDescription", e.target.value)
                }
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => removeExperience(career.id || "")}
            className="absolute top-4 right-4 text-[#8c8c8c] hover:text-[#d92d20] bg-transparent border-0 cursor-pointer transition-colors p-1"
            title="Remove experience"
          >
            <X size={16} />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addExperience}
        className="text-[#141414] font-bold text-[13px] self-start flex items-center hover:underline"
      >
        + Add experience
      </button>
    </div>
  );
};

export default CareerHistorySection;