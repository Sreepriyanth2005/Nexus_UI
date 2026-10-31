import React from "react";

interface PersonaCheckboxGroupProps {
  selectedPersonas: string[];
  onChange: (personas: string[]) => void;
}

export const PersonaCheckboxGroup: React.FC<PersonaCheckboxGroupProps> = ({
  selectedPersonas,
  onChange,
}) => {
  const personas = [
    { id: "visitor", label: "Visitor" },
    { id: "member", label: "Member" },
    { id: "unpaid", label: "Unpaid" },
    { id: "corporate", label: "Corporate user" },
  ];

  const handleToggle = (id: string) => {
    if (selectedPersonas.includes(id)) {
      onChange(selectedPersonas.filter((p) => p !== id));
    } else {
      onChange([...selectedPersonas, id]);
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
        Persona mapping <span className="text-red-500">*</span>
      </label>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 bg-slate-50 p-4 border border-slate-200 rounded-xl">
        {personas.map((persona) => {
          const checked = selectedPersonas.includes(persona.id);
          return (
            <label
              key={persona.id}
              className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none font-medium"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => handleToggle(persona.id)}
                className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
              />
              {persona.label}
            </label>
          );
        })}
      </div>
      <p className="text-[11px] text-slate-400 font-medium">
        Audience segments that can view this path
      </p>
    </div>
  );
};
