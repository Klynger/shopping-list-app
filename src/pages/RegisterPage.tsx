import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'

import * as api from '../api/endpoints.ts'
import { useAuth } from '../auth/useAuth.ts'
import { Button, ErrorText, TextField } from '../components/ui.tsx'
import { useI18n } from '../i18n/useI18n.ts'

export function RegisterPage() {
  const { login } = useAuth()
  const { t, formatError } = useI18n()
  const navigate = useNavigate()
  const [form, setForm] = useState<api.RegisterForm>({ name: '', lastName: '', username: '', password: '' })
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function update(field: keyof api.RegisterForm) {
    return (value: string) => setForm((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setPending(true)
    setError(null)

    const trimmed = { ...form, name: form.name.trim(), lastName: form.lastName.trim(), username: form.username.trim() }

    try {
      await api.register(trimmed)
    } catch (caught) {
      setError(formatError(caught))
      setPending(false)
      return
    }

    // Registration does not open a session, so log straight in. If that fails
    // (the login rate limit, say), the account still exists: send them to log in.
    try {
      await login({ username: trimmed.username, password: trimmed.password })
    } catch {
      navigate('/login', { replace: true, state: { registered: trimmed.username } })
    }
  }

  return (
    <div className="center-page">
      <form className="card auth-card" onSubmit={handleSubmit}>
        <h1>{t.auth.registerTitle}</h1>
        <div className="field-row">
          <TextField label={t.auth.firstName} value={form.name} onChange={update('name')} autoComplete="given-name" required autoFocus />
          <TextField label={t.auth.lastName} value={form.lastName} onChange={update('lastName')} autoComplete="family-name" required />
        </div>
        <TextField label={t.auth.username} value={form.username} onChange={update('username')} autoComplete="username" required />
        <TextField
          label={t.auth.password}
          type="password"
          value={form.password}
          onChange={update('password')}
          autoComplete="new-password"
          required
        />
        <ErrorText error={error} />
        <Button type="submit" disabled={pending}>
          {pending ? t.auth.registering : t.auth.registerSubmit}
        </Button>
        <p className="muted auth-switch">
          {t.auth.haveAccount} <Link to="/login">{t.auth.loginLink}</Link>
        </p>
      </form>
    </div>
  )
}
