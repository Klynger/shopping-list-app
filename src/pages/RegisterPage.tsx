import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { useIntl } from 'react-intl'

import * as api from '../api/endpoints.ts'
import { useAuth } from '../auth/useAuth.ts'
import { Button, ErrorText, TextField } from '../components/ui.tsx'
import { useFormatError } from '../i18n/useFormatError.ts'

export function RegisterPage() {
  const { login } = useAuth()
  const { formatMessage } = useIntl()
  const formatError = useFormatError()
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
        <h1>{formatMessage({ id: 'auth.register.title' })}</h1>
        <div className="field-row">
          <TextField label={formatMessage({ id: 'auth.firstName' })} value={form.name} onChange={update('name')} autoComplete="given-name" required autoFocus />
          <TextField label={formatMessage({ id: 'auth.lastName' })} value={form.lastName} onChange={update('lastName')} autoComplete="family-name" required />
        </div>
        <TextField label={formatMessage({ id: 'auth.username' })} value={form.username} onChange={update('username')} autoComplete="username" required />
        <TextField
          label={formatMessage({ id: 'auth.password' })}
          type="password"
          value={form.password}
          onChange={update('password')}
          autoComplete="new-password"
          required
        />
        <ErrorText error={error} />
        <Button type="submit" disabled={pending}>
          {pending ? formatMessage({ id: 'auth.registering' }) : formatMessage({ id: 'auth.register.submit' })}
        </Button>
        <p className="muted auth-switch">
          {formatMessage({ id: 'auth.haveAccount' })} <Link to="/login">{formatMessage({ id: 'auth.loginLink' })}</Link>
        </p>
      </form>
    </div>
  )
}
