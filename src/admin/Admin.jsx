import { useCallback, useEffect, useState } from 'react'
import AdminLogin from './AdminLogin.jsx'
import AdminContent from './AdminContent.jsx'
import AdminMenu from './AdminMenu.jsx'
import AdminMessages from './AdminMessages.jsx'
import { adminApi, isUnauthorized } from '../api.js'
import './admin.css'

const TOKEN_KEY = 'brown-cafe-admin-token'
const TABS = [
  { id: 'content', label: 'Page Content' },
  { id: 'menu', label: 'Menu Items' },
  { id: 'messages', label: 'Messages' },
]

export default function Admin() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [tab, setTab] = useState('content')
  const [notice, setNotice] = useState(null)
  const [checking, setChecking] = useState(() => Boolean(localStorage.getItem(TOKEN_KEY)))

  const signOut = useCallback((msg) => {
    setToken(null)
    setChecking(false)
    if (msg) setNotice(msg)
  }, [])

  const handleUnauthorized = useCallback(() => {
    signOut('Session expired. Please sign in again.')
  }, [signOut])

  useEffect(() => {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  }, [token])

  useEffect(() => {
    if (!token) return
    let live = true
    adminApi
      .getSite(token)
      .then(() => {
        if (live) {
          setNotice(null)
          setChecking(false)
        }
      })
      .catch((e) => {
        if (live) {
          setChecking(false)
          if (isUnauthorized(e)) signOut('Sign-in expired. Please sign in again.')
        }
      })
    return () => {
      live = false
    }
  }, [token, signOut])

  const onLogin = (t) => {
    setNotice(null)
    setToken(t)
  }

  if (token && checking) return <p className="loading">Checking session…</p>
  if (!token) return <AdminLogin onLogin={onLogin} notice={notice} />

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <img className="admin-logo" src="/logo.webp" alt="Rusk" />
          <div>
            <strong>Rusk</strong>
            <span className="muted small">Admin</span>
          </div>
        </div>

        <nav className="admin-tabs">
          {TABS.map((t) => (
            <button
              type="button"
              key={t.id}
              className={`admin-tab ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className="admin-side-foot">
          <a className="btn btn-outline btn-block" href="/">View site</a>
          <button type="button" className="btn btn-outline btn-block" onClick={() => setToken(null)}>
            Log out
          </button>
        </div>
      </aside>

      <main className="admin-main">
        {tab === 'content' && <AdminContent token={token} onUnauthorized={handleUnauthorized} />}
        {tab === 'menu' && <AdminMenu token={token} onUnauthorized={handleUnauthorized} />}
        {tab === 'messages' && <AdminMessages token={token} onUnauthorized={handleUnauthorized} />}
      </main>
    </div>
  )
}