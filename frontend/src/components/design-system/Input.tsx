import React, { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  isSearch?: boolean;
  required?: boolean;
  error?: string;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, isSearch, required, error, containerClassName = '', ...props }, ref) => {
    
    let inputClass = 'input';
    if (isSearch) inputClass += ' input--search';
    
    return (
      <div className={`field ${containerClassName}`.trim()}>
        {label && (
          <label className={`field__label ${required ? 'field__label--req' : ''}`.trim()}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`${inputClass} ${className}`.trim()}
          {...props}
        />
        {error && <span className="text-danger text-label mt-1 block">{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
