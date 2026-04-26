import { forwardRef, type ButtonHTMLAttributes } from 'react'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost'
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', loading, className = '', disabled, children, ...props },
  ref,
) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:pointer-events-none disabled:opacity-50'
  const styles =
    variant === 'primary'
      ? 'bg-brand-600 text-white shadow-sm hover:bg-brand-700 active:bg-brand-800'
      : variant === 'secondary'
        ? 'bg-white text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50'
        : 'text-brand-700 hover:bg-brand-50'

  return (
    <button
      ref={ref}
      type="button"
      className={`${base} ${styles} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span
          className={`h-4 w-4 animate-spin rounded-full border-2 ${
            variant === 'primary'
              ? 'border-white/40 border-t-white'
              : 'border-slate-300 border-t-brand-600'
          }`}
          aria-hidden
        />
      ) : null}
      {children}
    </button>
  )
})
