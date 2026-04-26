import type { HTMLAttributes } from 'react'

type SpinnerProps = HTMLAttributes<HTMLDivElement> & {
  label?: string
}

export function Spinner({ label = 'Loading', className = '', ...props }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label={label}
      className={`inline-flex items-center justify-center ${className}`}
      {...props}
    >
      <span
        className="h-9 w-9 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600"
        aria-hidden
      />
    </div>
  )
}
