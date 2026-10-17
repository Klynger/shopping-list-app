import { Link, Navigate, Outlet, Route, Routes, useLocation } from 'react-router'
import { useIntl } from 'react-intl'

import { useAuth } from './auth/useAuth.ts'
import { LanguageSwitcher } from './components/LanguageSwitcher.tsx'
import { Button, Loading } from './components/ui.tsx'
import { GroupPage } from './pages/GroupPage.tsx'
import { HomePage } from './pages/HomePage.tsx'
import { ListPage } from './pages/ListPage.tsx'
import { LoginPage } from './pages/LoginPage.tsx'
import { RegisterPage } from './pages/RegisterPage.tsx'

function App() {
  return (
    <Routes>
      <Route element={<AnonymousOnly />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="/groups/:groupId" element={<GroupPage />} />
          <Route path="/groups/:groupId/lists/:listId" element={<ListPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App

function AnonymousOnly() {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'checking') return <FullPageLoading />
  if (status === 'unreachable') return <Unreachable />
  if (status === 'authenticated') {
    const from = (location.state as { from?: string } | null)?.from
    return <Navigate to={from ?? '/'} replace />
  }

  return (
    <>
      <div className="auth-language">
        <LanguageSwitcher />
      </div>
      <Outlet />
    </>
  )
}

function RequireAuth() {
  const { status, sessionExpired } = useAuth()
  const location = useLocation()

  if (status === 'checking') return <FullPageLoading />
  if (status === 'unreachable') return <Unreachable />
  if (status === 'anonymous') {
    // After a deliberate logout the next person to log in may be someone else,
    // so only an expired session sends them back to where they were.
    return <Navigate to="/login" replace state={sessionExpired ? { from: location.pathname } : undefined} />
  }

  return <Outlet />
}

function AppLayout() {
  const { username, logout } = useAuth()
  const { formatMessage } = useIntl()

  return (
    <div className="app-shell">
      <header className="app-header">
        <Link to="/" className="brand">
          <CartIcon />
          <span>{formatMessage({ id: 'app.name' })}</span>
        </Link>
        <div className="app-header-actions">
          {username ? <span className="muted header-username">@{username}</span> : null}
          <LanguageSwitcher />
          <Button variant="ghost" size="sm" onClick={() => void logout()}>
            {formatMessage({ id: 'app.logout' })}
          </Button>
        </div>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}

function FullPageLoading() {
  const { formatMessage } = useIntl()

  return (
    <div className="center-page">
      <Loading label={formatMessage({ id: 'common.loading' })} />
    </div>
  )
}

function Unreachable() {
  const { recheck } = useAuth()
  const { formatMessage } = useIntl()

  return (
    <div className="center-page">
      <div className="card auth-card">
        <h1>{formatMessage({ id: 'app.unreachable.title' })}</h1>
        <p className="muted">{formatMessage({ id: 'app.unreachable.body' })}</p>
        <Button onClick={recheck}>{formatMessage({ id: 'app.tryAgain' })}</Button>
      </div>
    </div>
  )
}

function CartIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M3 4h2l2.4 10.2a1.5 1.5 0 0 0 1.5 1.1h7.9a1.5 1.5 0 0 0 1.4-1l2-6.3H6.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9.5" cy="19.5" r="1.4" fill="currentColor" />
      <circle cx="17" cy="19.5" r="1.4" fill="currentColor" />
    </svg>
  )
}
