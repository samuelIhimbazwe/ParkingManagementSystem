import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '../context/AuthContext'
import { loginSchema } from '../lib/schemas/authSchemas'
import { extractApiError } from '../lib/httpErrors'
import { Card } from '../components/ui/Card'
import { TextField } from '../components/ui/TextField'
import { Button } from '../components/ui/Button'

type FormValues = {
  email: string
  password: string
}

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      await login(values.email, values.password)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setFormError(extractApiError(err))
    }
  })

  return (
    <Card>
      <div className="space-y-2 text-center sm:text-left">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-slate-900">Welcome back</h1>
        <p className="text-sm text-slate-600">Sign in to continue to your dashboard.</p>
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
        <TextField
          label="Password"
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />

        {formError ? (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {formError}
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-4 text-sm">
          <Link to="/forgot-password" className="font-medium text-brand-700 hover:text-brand-800">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" className="w-full" loading={isSubmitting}>
          Sign in
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-slate-600">
        New here?{' '}
        <Link to="/signup" className="font-semibold text-brand-700 hover:text-brand-800">
          Create an account
        </Link>
      </p>
    </Card>
  )
}
