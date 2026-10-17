import { useState, type FormEvent } from 'react'
import { Link, useLocation } from 'react-router'

import { useAuth } from '../auth/useAuth.ts'
import { Button, ErrorText, TextField } from '../components/ui.tsx'
import { useI18n } from '../i18n/useI18n.ts'

export function LoginPage() {
  const { login } = useAuth()
  const { t, formatError } = useI18n()
  const location = useLocation()
  const justRegistered = (location.state as { registered?: string } | null)?.registered
  const [username, setUsername] = useState(justRegistered ?? '')
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setPending(true)
    setError(null)
    try {
      await login({ username: username.trim(), password })
    } catch (caught) {
      setError(formatError(caught))
      setPending(false)
    }
  }

  return (
    <div className="center-page">
      <form className="card auth-card" onSubmit={handleSubmit}>
        <h1>{t.auth.loginTitle}</h1>
        {justRegistered ? <p className="success-text">{t.auth.accountCreated}</p> : null}
        <TextField label={t.auth.username} value={username} onChange={setUsername} autoComplete="username" required autoFocus />
        <TextField
          label={t.auth.password}
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
          required
        />
        <ErrorText error={error} />
        <Button type="submit" disabled={pending}>
          {pending ? t.auth.loggingIn : t.auth.loginSubmit}
        </Button>
        <p className="muted auth-switch">
          {t.auth.newHere} <Link to="/register">{t.auth.createAccountLink}</Link>
        </p>
      </form>
    </div>
  )
}
