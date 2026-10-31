import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { CareerHistory, } from "../../../../types/profile.type";

interface Props {
  open: boolean;
  initialData?: CareerHistory | null;
  onClose: () => void;
  onSave: (career: CareerHistory) => void;
  currentEmployer?: string;
}

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const years = Array.from(
  { length: 50 },
  (_, i) => `${new Date().getFullYear() - i}`
);

const emptyCareer: CareerHistory = {
  id: "",
  jobTitle: "",
  employer: "",
  jobDescription: "",
  startDate: "",
  endDate: "",
  isCurrentJob: false,
};

const CareerHistoryModal: React.FC<Props> = ({
  open,
  initialData,
  onClose,
  onSave,
  currentEmployer,
}) => {
  const [form, setForm] = useState<CareerHistory>(emptyCareer);

  useEffect(() => {
    if (initialData) {
      setForm(initialData);
    } else {
      setForm({
        ...emptyCareer,
        id: crypto.randomUUID(),
      });
    }
  }, [initialData, open]);

  if (!open) return null;

  const update =
    (field: keyof CareerHistory) =>
      (
        e: React.ChangeEvent<
          HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
        >
      ) => {
        const value =
          e.target instanceof HTMLInputElement &&
            e.target.type === "checkbox"
            ? e.target.checked
            : e.target.value;

        if (field === "isCurrentJob" && value === true && currentEmployer && !form.employer) {
          setForm((prev) => ({
            ...prev,
            [field]: value,
            employer: currentEmployer,
          }));
        } else {
          setForm((prev) => ({
            ...prev,
            [field]: value,
          }));
        }
      };

  const handleSave = () => {
    if (
      !form.jobTitle ||
      !form.employer ||
      !form.startDate ||
      (!form.isCurrentJob && !form.endDate)
    ) {
      alert("Please fill all mandatory fields.");
      return;
    }

    onSave({
      ...form,
      endDate: form.isCurrentJob ? null : (form.endDate || null),
    });
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center p-5">

      <div className="bg-white rounded-xl w-full max-w-2xl shadow-xl">

        {/* Header */}

        <div className="flex justify-between items-center border-b px-6 py-4">

          <div>
            <h2 className="text-xl font-semibold">
              {initialData ? "Edit Career History" : "Add Career History"}
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Previous employment details
            </p>
          </div>

          <button onClick={onClose}>
            <X size={22} />
          </button>
        </div>

        {/* Body */}

        <div className="p-6 space-y-5">

          <div className="grid grid-cols-2 gap-5">

            <div>
              <label className="text-sm font-medium">
                Role *
              </label>

              <input
                className="mt-1 w-full border rounded-lg p-3"
                value={form.jobTitle}
                onChange={update("jobTitle")}
              />
            </div>

            <div>
              <label className="text-sm font-medium">
                Company *
              </label>

              <input
                className="mt-1 w-full border rounded-lg p-3"
                value={form.employer}
                onChange={update("employer")}
              />
            </div>


          </div>

          {/* From */}

          <div className="grid grid-cols-2 gap-5">

            {/* Start Date */}

            <div>
              <label className="text-sm font-medium">
                From <span className="text-red-500">*</span>
              </label>

              <input
                type="date"
                className="mt-1 w-full border rounded-lg p-3"
                value={form.startDate}
                onChange={update("startDate")}
              />
            </div>

            {/* End Date */}

            <div>
              <label className="text-sm font-medium">
                To
              </label>

              <input
                type="date"
                className="mt-1 w-full border rounded-lg p-3 disabled:bg-gray-100 disabled:text-gray-400"
                disabled={form.isCurrentJob}
                value={form.isCurrentJob ? new Date().toISOString().split('T')[0] : (form.endDate ?? "")}
                onChange={update("endDate")}
              />
            </div>

          </div>

          <label className="flex items-center gap-3">

            <input
              type="checkbox"
              checked={form.isCurrentJob}
              onChange={update("isCurrentJob")}
            />

            I currently work here

          </label>

          <div>

            <label className="text-sm font-medium">
              Description
            </label>

            <textarea
              rows={5}
              className="mt-1 w-full border rounded-lg p-3"
              value={form.jobDescription}
              onChange={update("jobDescription")}
              placeholder="Describe your responsibilities..."
            />

          </div>

        </div>

        {/* Footer */}

        <div className="flex justify-end gap-3 border-t px-6 py-4">

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg border"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            Save
          </button>

        </div>

      </div>

    </div>
  );
};

export default CareerHistoryModal;