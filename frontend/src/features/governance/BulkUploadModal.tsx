import React, { useState } from 'react';
import { Upload, X, AlertTriangle, CheckCircle } from 'lucide-react';

interface ValidationResult {
  validCount: number;
  errorCount: number;
  errors: { row: number; data: any; errors: string[] }[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  onCommit: (validData: any[]) => void;
}

export const BulkUploadModal: React.FC<Props> = ({ open, onClose, onCommit }) => {
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

  if (!open) return null;

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setValidationResult({
        validCount: 1,
        errorCount: 2,
        errors: [
          { row: 1, data: { title: 'Missing tags course' }, errors: ['Missing tags', 'Missing categoryId'] },
          { row: 3, data: { categoryId: '123' }, errors: ['Missing title'] }
        ]
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Bulk Upload & Validation</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 cursor-pointer shadow-sm">
              <Upload className="w-4 h-4" />
              Select CSV File
              <input type="file" className="hidden" accept=".csv" onChange={handleFileUpload} />
            </label>
          </div>

          {validationResult && (
            <div className="space-y-4">
              <div className={`p-4 rounded-lg flex items-center gap-3 text-sm font-medium ${
                validationResult.errorCount > 0 
                  ? 'bg-amber-50 text-amber-900 border border-amber-200' 
                  : 'bg-green-50 text-green-900 border border-green-200'
              }`}>
                {validationResult.errorCount > 0 ? (
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                )}
                <span>
                  Found {validationResult.validCount} valid rows and {validationResult.errorCount} rows with errors.
                </span>
              </div>
              
              {validationResult.errorCount > 0 && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200 text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">Row</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">Data Context</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">Validation Errors</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {validationResult.errors.map((err, idx) => (
                        <tr key={idx}>
                          <td className="px-3 py-2 text-gray-900 font-medium">{err.row}</td>
                          <td className="px-3 py-2 text-gray-600 font-mono text-[11px]">{JSON.stringify(err.data)}</td>
                          <td className="px-3 py-2 text-red-600 font-medium">
                            {err.errors.join(", ")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button 
            type="button" 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg border border-gray-300"
          >
            Cancel
          </button>
          <button 
            type="button"
            disabled={!validationResult || validationResult.validCount === 0}
            onClick={() => onCommit([])}
            className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm"
          >
            Commit Valid Data
          </button>
        </div>
      </div>
    </div>
  );
};
