import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

/** Use `variant="onBlue"` when the toggle sits on a blue gradient (dashboard header in light mode). */
export default function ThemeToggle({ className = '', variant = 'default' }) {
  const { mode, toggle } = useTheme()
  const isDark = mode === 'dark'
  const onBlue = variant === 'onBlue'

  const base =
    onBlue && !isDark
      ? 'border-white/30 bg-white/15 text-white shadow-sm backdrop-blur-sm hover:bg-white/25'
      : 'border-blue-200 bg-white text-blue-900 shadow-sm hover:bg-blue-50 dark:border-white/15 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700'

  return (
    <button
      type="button"
      onClick={() => toggle()}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border transition ${base} ${className}`}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
    >
      {isDark ? (
        <Sun className="h-5 w-5 text-amber-300" />
      ) : (
        <Moon className={`h-5 w-5 ${onBlue ? 'text-white' : 'text-blue-700'}`} />
      )}
    </button>
  )
}
