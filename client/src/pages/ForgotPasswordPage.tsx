import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '../context/AuthContext'
import { forgotSchema } from '../lib/schemas/authSchemas'
import { extractApiError } from '../lib/httpErrors'
import { Card } from '../components/ui/Card'
import { TextField } from '../components/ui/TextField'
import { Button } from '../components/ui/Button'

type FormValues = {
  email: string
}

export function ForgotPasswordPage() {
  const { forgotPassword } = useAuth()
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    setSuccessMessage(null)
    try {
      const result = await forgotPassword(values.email)
      setSuccessMessage(result.message)
    } catch (err) {
      setFormError(extractApiError(err))
    }
  })

  return (
    <Card>
      <div className="space-y-2 text-center sm:text-left">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-slate-900">Forgot password</h1>
        <p className="text-sm text-slate-600">
          Enter your email and we&apos;ll send reset instructions if an account exists.
        </p>
      </div>

      <form className="mt-8 space-y-5" onSubmit={onSubmit} noValidate>
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          inputMode="email"
          error={errors.email?.message}
          {...register('email')}
        />

        {formError ? (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {formError}
          </div>
        ) : null}

        {successMessage ? (
          <div
            role="status"
            className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
          >
            {successMessage}
          </div>
        ) : null}

        <Button type="submit" className="w-full" loading={isSubmitting}>
          Send reset link
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-slate-600">
        Remembered it?{' '}
        <Link to="/login" className="font-semibold text-brand-700 hover:text-brand-800">
          Back to sign in
        </Link>
      </p>
    </Card>
  )
}
