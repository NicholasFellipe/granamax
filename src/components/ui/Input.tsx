// 🎨 INPUT COMPONENT

import { InputHTMLAttributes, ReactNode } from 'react';
import { clsx } from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
  helperText?: string;
}

export function Input({
  label,
  error,
  icon,
  helperText,
  className,
  ...props
}: InputProps) {
  return (
    <div className="input-group">
      {label && (
        <label className="input-label" htmlFor={props.id}>
          {label}
        </label>
      )}
      <div className="input-wrapper">
        {icon && <span className="input-icon">{icon}</span>}
        <input
          className={clsx(
            'input',
            icon && 'input-with-icon',
            error && 'input-error',
            className
          )}
          {...props}
        />
      </div>
      {error && <span className="input-error-text">{error}</span>}
      {helperText && !error && <span className="input-helper-text">{helperText}</span>}
    </div>
  );
}
