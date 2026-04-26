import type { HTMLAttributes } from 'react'

type CardProps = HTMLAttributes<HTMLDivElement>

export function Card({ className = '', ...props }: CardProps) {
  return (
    <div
      className={`rounded-2xl bg-white/90 p-8 shadow-card ring-1 ring-slate-200/80 backdrop-blur ${className}`}
      {...props}
    />
  )
}
