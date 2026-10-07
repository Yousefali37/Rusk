import { useEffect, useState } from 'react'
import { adminApi, isUnauthorized } from '../api.js'

export default function AdminMessages({ token, onUnauthorized }) {
  const [messages, setMessages] = useState(null)
  const [error, setError] = useState(null)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let live = true
    adminApi.getMessages(token)
      .then((m) => {
        if (live) setMessages(m)
      })
      .catch((e) => {
        if (live) {
          if (isUnauthorized(e)) onUnauthorized?.()
          else setError(e.message)
        }
      })
    return () => {
      live = false
    }
  }, [token, version, onUnauthorized])

  if (error) return <p className="form-status err">{error}</p>
  if (!messages) return <p className="loading">Loading messages…</p>

  const remove = async (id) => {
    if (!window.confirm('Delete this message?')) return
    try {
      await adminApi.deleteMessage(token, id)
      setVersion((v) => v + 1)
    } catch (e) {
      if (isUnauthorized(e)) onUnauthorized?.()
      else setError(e.message)
    }
  }

  return (
    <div className="admin-pane">
      <div className="pane-head">
        <h2>Messages</h2>
        <span className="muted">{messages.length} total</span>
      </div>

      {messages.length === 0 ? (
        <p className="muted">No messages yet. Submissions from the contact form will appear here.</p>
      ) : (
        <div className="msg-list">
          {messages.map((m) => (
            <div className="msg-card" key={m.id}>
              <div className="msg-head">
                <strong>{m.name}</strong>
                <span className="msg-date">{m.created_at}</span>
                <button type="button" className="btn btn-xs btn-danger" onClick={() => remove(m.id)}>Delete</button>
              </div>
              <div className="msg-contact">
                {m.email && <a href={`mailto:${m.email}`}>{m.email}</a>}
                {m.phone && <span>{m.phone}</span>}
              </div>
              {m.message && <p className="msg-body">{m.message}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}