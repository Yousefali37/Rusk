import { useState } from 'react'
import { adminLogin } from '../api.js'

export default function AdminLogin({ onLogin, notice }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const { token } = await adminLogin(password)
      onLogin(token)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login-screen">
      <form className="login-card" onSubmit={submit}>
        <span className="login-mark">B</span>
        <h1>Rusk</h1>
        <p>Admin dashboard — sign in to manage your site.</p>
        {notice && <p className="form-status err">{notice}</p>}
        <input
          type="password"
          placeholder="Admin password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
        />
        {error && <p className="form-status err">{error}</p>}
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
        <a className="login-back" href="/">← Back to site</a>
      </form>
    </div>
  )
}