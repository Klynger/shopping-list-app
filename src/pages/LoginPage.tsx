import { useState, type FormEvent } from 'react'
import { Link, useLocation } from 'react-router'
import { useIntl } from 'react-intl'

import { useAuth } from '../auth/useAuth.ts'
import { Button, ErrorText, TextField } from '../components/ui.tsx'
import { useFormatError } from '../i18n/useFormatError.ts'

export function LoginPage() {
  const { login } = useAuth()
  const { formatMessage } = useIntl()
  const formatError = useFormatError()
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
        <h1>{formatMessage({ id: 'auth.login.title' })}</h1>
        {justRegistered ? <p className="success-text">{formatMessage({ id: 'auth.accountCreated' })}</p> : null}
        <TextField label={formatMessage({ id: 'auth.username' })} value={username} onChange={setUsername} autoComplete="username" required autoFocus />
        <TextField
          label={formatMessage({ id: 'auth.password' })}
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
          required
        />
        <ErrorText error={error} />
        <Button type="submit" disabled={pending}>
          {pending ? formatMessage({ id: 'auth.loggingIn' }) : formatMessage({ id: 'auth.login.submit' })}
        </Button>
        <p className="muted auth-switch">
          {formatMessage({ id: 'auth.newHere' })} <Link to="/register">{formatMessage({ id: 'auth.createAccountLink' })}</Link>
        </p>
      </form>
    </div>
  )
}
