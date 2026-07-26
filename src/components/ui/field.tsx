import type { InputHTMLAttributes } from 'react';

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function Field({ label, error, id, ...inputProps }: FieldProps) {
  const fieldId = id ?? inputProps.name;
  return (
    <div className="mb-4">
      <label htmlFor={fieldId} className="block text-sm font-medium text-ink dark:text-paper mb-1.5">
        {label}
      </label>
      <input
        id={fieldId}
        className="w-full rounded-md border border-rule dark:border-white/15 bg-white dark:bg-white/5 px-3 py-2 text-ink dark:text-paper placeholder:text-ink/35 dark:placeholder:text-paper/35 focus:border-forest focus:ring-1 focus:ring-forest transition-colors"
        aria-invalid={!!error}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        {...inputProps}
      />
      {error && (
        <p id={`${fieldId}-error`} className="mt-1.5 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
