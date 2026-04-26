/**
 * Gradient surfaces for KPI tiles, tables, and insight panels across the dashboard.
 * Variants cycle blue → green → warm → rose/red for readable, varied data views.
 */

export const STAT_CARD_THEMES = [
  {
    card:
      'relative overflow-hidden rounded-2xl border border-sky-300/45 bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100 p-4 shadow-md shadow-blue-900/[0.07] dark:border-cyan-500/20 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/60 dark:shadow-none',
    label: 'text-xs uppercase tracking-wide text-blue-900/65 dark:text-slate-400',
    value: 'mt-1 text-2xl font-semibold text-blue-950 dark:text-white',
  },
  {
    card:
      'relative overflow-hidden rounded-2xl border border-emerald-300/45 bg-gradient-to-br from-emerald-100 via-teal-50 to-cyan-100 p-4 shadow-md shadow-emerald-900/[0.07] dark:border-emerald-500/20 dark:from-slate-900 dark:via-emerald-950/35 dark:to-slate-950 dark:shadow-none',
    label: 'text-xs uppercase tracking-wide text-emerald-900/70 dark:text-emerald-400/80',
    value: 'mt-1 text-2xl font-semibold text-emerald-950 dark:text-emerald-300',
  },
  {
    card:
      'relative overflow-hidden rounded-2xl border border-amber-300/50 bg-gradient-to-br from-amber-100 via-orange-50 to-yellow-100 p-4 shadow-md shadow-amber-900/[0.06] dark:border-amber-500/20 dark:from-slate-900 dark:via-amber-950/25 dark:to-slate-950 dark:shadow-none',
    label: 'text-xs uppercase tracking-wide text-amber-900/70 dark:text-amber-300/80',
    value: 'mt-1 text-2xl font-semibold text-amber-950 dark:text-amber-200',
  },
  {
    card:
      'relative overflow-hidden rounded-2xl border border-rose-300/45 bg-gradient-to-br from-rose-100 via-red-50 to-fuchsia-100 p-4 shadow-md shadow-rose-900/[0.07] dark:border-rose-500/20 dark:from-slate-900 dark:via-rose-950/30 dark:to-slate-950 dark:shadow-none',
    label: 'text-xs uppercase tracking-wide text-rose-900/70 dark:text-rose-300/80',
    value: 'mt-1 text-2xl font-semibold text-rose-950 dark:text-rose-200',
  },
]

export function statCardTheme(index) {
  const n = STAT_CARD_THEMES.length
  return STAT_CARD_THEMES[((index % n) + n) % n]
}

const CONTENT_PANELS = {
  sky: 'relative overflow-hidden rounded-2xl border border-sky-300/40 bg-gradient-to-br from-sky-50/95 via-white to-indigo-50/90 p-6 shadow-md shadow-blue-900/[0.05] dark:border-white/10 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 dark:shadow-none',
  emerald:
    'relative overflow-hidden rounded-2xl border border-emerald-300/40 bg-gradient-to-br from-emerald-50/95 via-white to-teal-50/90 p-6 shadow-md shadow-emerald-900/[0.05] dark:border-emerald-500/15 dark:from-slate-900 dark:via-emerald-950/25 dark:to-slate-950 dark:shadow-none',
  rose: 'relative overflow-hidden rounded-2xl border border-rose-300/40 bg-gradient-to-br from-rose-50/95 via-white to-orange-50/90 p-6 shadow-md shadow-rose-900/[0.05] dark:border-rose-500/15 dark:from-slate-900 dark:via-rose-950/25 dark:to-slate-950 dark:shadow-none',
  violet:
    'relative overflow-hidden rounded-2xl border border-violet-300/40 bg-gradient-to-br from-violet-50/95 via-white to-fuchsia-50/90 p-6 shadow-md shadow-violet-900/[0.05] dark:border-violet-500/15 dark:from-slate-900 dark:via-violet-950/25 dark:to-slate-950 dark:shadow-none',
  amber:
    'relative overflow-hidden rounded-2xl border border-amber-300/45 bg-gradient-to-br from-amber-50/95 via-white to-yellow-50/90 p-6 shadow-md shadow-amber-900/[0.05] dark:border-amber-500/15 dark:from-slate-900 dark:via-amber-950/20 dark:to-slate-950 dark:shadow-none',
}

/**
 * @param {'sky'|'emerald'|'rose'|'violet'|'amber'} variant
 */
export function contentPanel(variant = 'sky') {
  return CONTENT_PANELS[variant] ?? CONTENT_PANELS.sky
}

const TABLE_SHELLS = {
  sky: 'overflow-x-auto rounded-2xl border border-sky-300/40 bg-gradient-to-br from-sky-50/95 via-white to-indigo-50/90 shadow-md shadow-blue-900/[0.05] dark:border-white/10 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 dark:shadow-none',
  emerald:
    'overflow-x-auto rounded-2xl border border-emerald-300/40 bg-gradient-to-br from-emerald-50/95 via-white to-teal-50/90 shadow-md shadow-emerald-900/[0.05] dark:border-emerald-500/15 dark:from-slate-900 dark:via-emerald-950/20 dark:to-slate-950 dark:shadow-none',
  rose: 'overflow-x-auto rounded-2xl border border-rose-300/40 bg-gradient-to-br from-rose-50/95 via-white to-orange-50/90 shadow-md shadow-rose-900/[0.05] dark:border-rose-500/15 dark:from-slate-900 dark:via-rose-950/20 dark:to-slate-950 dark:shadow-none',
  violet:
    'overflow-x-auto rounded-2xl border border-violet-300/40 bg-gradient-to-br from-violet-50/95 via-white to-fuchsia-50/90 shadow-md shadow-violet-900/[0.05] dark:border-violet-500/15 dark:from-slate-900 dark:via-violet-950/20 dark:to-slate-950 dark:shadow-none',
}

/**
 * @param {'sky'|'emerald'|'rose'|'violet'} variant
 */
export function dataTableShell(variant = 'sky') {
  return TABLE_SHELLS[variant] ?? TABLE_SHELLS.sky
}

const TABLE_HEAD = {
  sky: 'border-b border-sky-200/90 text-blue-900/70 dark:border-white/10 dark:text-slate-400',
  emerald: 'border-b border-emerald-200/90 text-emerald-900/70 dark:border-emerald-500/20 dark:text-slate-400',
  rose: 'border-b border-rose-200/90 text-rose-900/70 dark:border-rose-500/20 dark:text-slate-400',
  violet: 'border-b border-violet-200/90 text-violet-900/70 dark:border-violet-500/20 dark:text-slate-400',
}

/**
 * @param {'sky'|'emerald'|'rose'|'violet'} variant
 */
export function tableHeadRow(variant = 'sky') {
  return TABLE_HEAD[variant] ?? TABLE_HEAD.sky
}

const TABLE_ROW = {
  sky: 'border-b border-sky-100/80 hover:bg-sky-50/60 dark:border-white/5 dark:hover:bg-white/5',
  emerald: 'border-b border-emerald-100/80 hover:bg-emerald-50/70 dark:border-white/5 dark:hover:bg-emerald-500/5',
  rose: 'border-b border-rose-100/80 hover:bg-rose-50/70 dark:border-white/5 dark:hover:bg-rose-500/5',
  violet: 'border-b border-violet-100/80 hover:bg-violet-50/70 dark:border-white/5 dark:hover:bg-violet-500/5',
}

/**
 * @param {'sky'|'emerald'|'rose'|'violet'} variant
 */
export function tableBodyRow(variant = 'sky') {
  return TABLE_ROW[variant] ?? TABLE_ROW.sky
}

/** Live map / availability card: blue + green wash, reads as “data” not plain white. */
export const mapSurface =
  'relative overflow-hidden rounded-2xl border border-sky-300/45 bg-gradient-to-br from-sky-50 via-white to-emerald-50/90 p-6 shadow-md shadow-blue-900/[0.05] dark:border-white/10 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/25 dark:shadow-none'
