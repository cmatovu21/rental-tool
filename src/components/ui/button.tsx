import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  variant?: 'primary' | 'secondary';
  fullWidth?: boolean;
}

export function Button({
  loading,
  variant = 'primary',
  fullWidth = true,
  children,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  const base = `rounded-md px-4 py-2.5 font-medium text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${fullWidth ? 'w-full' : ''}`;
  const styles =
    variant === 'primary'
      ? 'bg-forest text-white hover:bg-forest-deep'
      : 'bg-transparent text-forest border border-forest hover:bg-forest-50';
  return (
    <button className={`${base} ${styles} ${className}`} disabled={disabled || loading} {...props}>
      {loading ? 'Please wait…' : children}
    </button>
  );
}
