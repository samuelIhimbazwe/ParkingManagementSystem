import { Spinner } from '../ui/Spinner'

export function FullPageSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <Spinner className="scale-125" />
    </div>
  )
}
