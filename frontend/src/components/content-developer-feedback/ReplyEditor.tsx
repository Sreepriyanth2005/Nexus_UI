import React from "react";

interface ReplyEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

export const ReplyEditor: React.FC<ReplyEditorProps> = ({
  value,
  onChange,
  placeholder = "Write a reply...",
}) => {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={2}
      className="w-full border border-slate-200 hover:border-slate-350 focus:border-slate-800 rounded-xl p-3 text-sm outline-none transition resize-none font-medium placeholder-slate-400 bg-slate-50/50"
    />
  );
};
export default ReplyEditor;
