import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '../context/AuthContext'
import { signupSchema } from '../lib/schemas/authSchemas'
import { extractApiError } from '../lib/httpErrors'
import { Card } from '../components/ui/Card'
import { TextField } from '../components/ui/TextField'
import { Button } from '../components/ui/Button'

type FormValues = {
  fullName: string
  email: string
  password: string
  confirmPassword: string
}

export function SignupPage() {
  const navigate = useNavigate()
  const { register: registerUser } = useAuth()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      await registerUser({
        email: values.email,
        password: values.password,
        fullName: values.fullName.trim() || undefined,
      })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setFormError(extractApiError(err))
    }
  })

  return (
    <Card>
      <div className="space-y-2 text-center sm:text-left">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-slate-900">Create your account</h1>
        <p className="text-sm text-slate-600">Start managing parking operations in minutes.</p>
      </div>

      <form className="mt-8 space-y-5" onSubmit={onSubmit} noValidate>
        <TextField
          label="Full name (optional)"
          autoComplete="name"
          error={errors.fullName?.message}
          {...register('fullName')}
        />
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
          autoComplete="new-password"
          hint="At least 8 characters with upper, lower, number, and symbol."
          error={errors.password?.message}
          {...register('password')}
        />
        <TextField
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        {formError ? (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {formError}
          </div>
        ) : null}

        <Button type="submit" className="w-full" loading={isSubmitting}>
          Create account
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-slate-600">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-brand-700 hover:text-brand-800">
          Sign in
        </Link>
      </p>
    </Card>
  )
}
