import React from "react";

export interface ThemeToggleSwitchProps {
  value: "video" | "document";
  onChange: (value: "video" | "document") => void;
  disabled?: boolean;
}

export const ThemeToggleSwitch: React.FC<ThemeToggleSwitchProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const isDocument = value === "document";

  const handleToggle = () => {
    if (disabled) return;
    onChange(isDocument ? "video" : "document");
  };

  return (
    <div className="flex items-center gap-2.5 select-none shrink-0">
      {/* Video Label */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange("video")}
        className={`text-xs transition-colors cursor-pointer ${
          !isDocument
            ? "font-bold text-gray-900"
            : "font-medium text-gray-400 hover:text-gray-600"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        Video
      </button>

      {/* Sliding Capsule Switch Track & Thumb */}
      <button
        type="button"
        role="switch"
        aria-checked={isDocument}
        aria-label="Switch between Video and Document lesson"
        disabled={disabled}
        onClick={handleToggle}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full p-0.5 border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#8C5319] focus:ring-offset-2 ${
          !isDocument ? "bg-[#8C5319]" : "bg-gray-300"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <span
          className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
            isDocument ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>

      {/* Document Label */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange("document")}
        className={`text-xs transition-colors cursor-pointer ${
          isDocument
            ? "font-bold text-gray-900"
            : "font-medium text-gray-400 hover:text-gray-600"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        Document
      </button>
    </div>
  );
};

export default ThemeToggleSwitch;
