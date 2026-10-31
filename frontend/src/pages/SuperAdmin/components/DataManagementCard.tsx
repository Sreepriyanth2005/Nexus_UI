import React, { useState } from 'react';
import { useDataManagement } from '../../../hooks/useDataManagement';
import { Plus, Edit, Trash2, Check, X } from "../../../assets/icons";


interface DataManagementCardProps {
  title: string;
  description: string;
  type: string;
  readOnly?: boolean;
}

export const DataManagementCard: React.FC<DataManagementCardProps> = ({ title, description, type, readOnly = false }) => {
  const {
    items,
    isLoading,
    error,
    handleCreate,
    handleUpdate,
    handleDelete
  } = useDataManagement(type);

  const [isAdding, setIsAdding] = useState(false);
  const [addValue, setAddValue] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const onAdd = async () => {
    if (!addValue.trim()) return;
    await handleCreate({ name: addValue.trim() });
    setAddValue("");
    setIsAdding(false);
  };

  const onUpdate = async (id: string) => {
    if (!editValue.trim()) return;
    await handleUpdate(id, { name: editValue.trim() });
    setEditingId(null);
    setEditValue("");
  };

  const onDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    await handleDelete(id);
  };

  return (
    <div className="bg-[var(--paper)] rounded-2xl shadow-[var(--shadow-sm)] border border-[var(--line)] hover:border-[var(--line-strong)] overflow-hidden flex flex-col pt-[18px] px-[18px] pb-[14px] transition-all duration-300 hover:-translate-y-2 hover:shadow-lg cursor-pointer">
      <div className="shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-[16px] font-[800] leading-[25px] text-[var(--ink)]">{title}</h3>
            <span className="flex items-center justify-center min-w-[20px] h-[20px] px-1 rounded-full bg-[var(--c-sage-wash)] text-[var(--c-sage-text)] text-[12px] font-[700] leading-[19px]">
              {items.length}
            </span>
          </div>
          {!isAdding && !readOnly && (
            <button
              onClick={() => setIsAdding(true)}
              className="nexus-btn ghost flex items-center justify-center gap-1.5 rounded-full border-2 border-[var(--line)] text-[14px] text-[var(--ink)] font-[700] leading-[21px] h-[38px] px-[14px]"
            >
              <Plus width={14} height={14} /> Add
            </button>
          )}
        </div>
        <p className="text-[12px] font-[600] leading-[19px] text-[var(--ink-mute)] mt-1">{description}</p>
      </div>

      <div className="flex-1 mt-4">
        {error && (
          <div className="mb-4 text-[length:var(--fs-label)] text-[var(--c-danger-deep)] bg-[var(--c-danger-wash)] p-2 rounded">
            {error}
          </div>
        )}

        <div className="flex flex-col">
          {isAdding && (
            <div className="adm-edit-row flex items-center gap-1.5 py-[6px] px-[4px] -mx-[4px]">
              <input
                autoFocus
                type="text"
                placeholder={`New ${title.toLowerCase()}`}
                value={addValue}
                onChange={(e) => setAddValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onAdd();
                  if (e.key === 'Escape') {
                    setIsAdding(false);
                    setAddValue("");
                  }
                }}
                className="flex-1 min-w-0 h-[34px] px-[14px] text-[length:var(--fs-meta)] border border-[var(--line)] rounded-xl focus:outline-none focus:border-[var(--c-honey)] focus:ring-[3px] focus:ring-[var(--c-honey-wash)] transition-shadow"
              />
              <button
                onClick={onAdd}
                disabled={isLoading || !addValue.trim()}
                className="flex items-center justify-center w-[34px] h-[34px] shrink-0 text-[var(--ink)] bg-[var(--c-honey-wash)] border border-[var(--c-honey)] hover:bg-[var(--c-honey-soft)] rounded-full transition-all hover:-translate-y-[1px] hover:shadow-[var(--shadow-sm)] disabled:text-[var(--ink-mute)] disabled:hover:bg-[var(--c-honey-wash)] disabled:hover:translate-y-0 disabled:hover:shadow-none disabled:cursor-not-allowed"
              >
                <Check width={15} height={15} />
              </button>
              <button
                onClick={() => {
                  setIsAdding(false);
                  setAddValue("");
                }}
                className="flex items-center justify-center w-[34px] h-[34px] shrink-0 text-[var(--ink)] bg-[var(--paper)] border border-[var(--line)] hover:bg-[var(--paper-2)] hover:border-[var(--ink-soft)] rounded-full transition-all hover:-translate-y-[1px] hover:shadow-[var(--shadow-sm)]"
              >
                <X width={15} height={15} />
              </button>
            </div>
          )}

          {items.length === 0 && !isAdding && !isLoading && (
            <div className="text-center py-8 text-[length:var(--fs-meta)] text-[var(--ink-faint)]">
              No items found.
            </div>
          )}

          {isLoading && items.length === 0 && (
            <div className="text-center py-8 text-[length:var(--fs-meta)] text-[var(--ink-faint)]">
              Loading...
            </div>
          )}

          {items.map(item => (
            <div
              key={item.id}
              className="group flex items-center justify-between py-[9px] hover:bg-[var(--paper-2)] transition-colors"
            >
              {editingId === item.id ? (
                <div className="adm-edit-row flex items-center gap-1.5 flex-1 py-[6px] px-[4px] -mx-[4px]">
                  <input
                    autoFocus
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') onUpdate(item.id);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    className="flex-1 min-w-0 h-[34px] px-[14px] text-[length:var(--fs-meta)] border border-[var(--line)] rounded-xl focus:outline-none focus:border-[var(--c-honey)] focus:ring-[3px] focus:ring-[var(--c-honey-wash)] transition-shadow"
                  />
                  <button
                    onClick={() => onUpdate(item.id)}
                    disabled={isLoading || !editValue.trim()}
                    className="flex items-center justify-center w-[34px] h-[34px] shrink-0 text-[var(--ink)] bg-[var(--c-honey-wash)] border border-[var(--c-honey)] hover:bg-[var(--c-honey-soft)] rounded-full transition-all hover:-translate-y-[1px] hover:shadow-[var(--shadow-sm)] disabled:text-[var(--ink-mute)] disabled:hover:bg-[var(--c-honey-wash)] disabled:hover:translate-y-0 disabled:hover:shadow-none disabled:cursor-not-allowed"
                  >
                    <Check width={15} height={15} />
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="flex items-center justify-center w-[34px] h-[34px] shrink-0 text-[var(--ink)] bg-[var(--paper)] border border-[var(--line)] hover:bg-[var(--paper-2)] hover:border-[var(--ink-soft)] rounded-full transition-all hover:-translate-y-[1px] hover:shadow-[var(--shadow-sm)]"
                  >
                    <X width={15} height={15} />
                  </button>
                </div>
              ) : (
                <>
                  <span className="text-[length:var(--fs-body)] text-[var(--ink)] truncate min-w-0 mr-2">{item.name}</span>
                  {!readOnly && (
                    <div className="flex items-center gap-1 opacity-100 transition-opacity shrink-0">
                      <button
                        onClick={() => {
                          setEditingId(item.id);
                          setEditValue(item.name);
                        }}
                        className="flex items-center justify-center w-[28px] h-[28px] text-[var(--ink-faint)] hover:text-[var(--ink)] hover:bg-[var(--paper-2)] rounded-[var(--r-md)] transition-colors"
                      >
                        <Edit width={15} height={15} />
                      </button>
                      <button
                        onClick={() => onDelete(item.id, item.name)}
                        className="flex items-center justify-center w-[28px] h-[28px] text-[var(--ink-faint)] hover:text-[var(--c-danger-deep)] hover:bg-[var(--c-danger-wash)] rounded-[var(--r-md)] transition-colors"
                      >
                        <Trash2 width={15} height={15} />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
