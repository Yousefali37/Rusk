import { useRef, useState } from 'react'
import { uploadImage, isUnauthorized } from '../api.js'

export default function ImageInput({ token, value, onChange, label, onUnauthorized }) {
  const fileRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const onFile = async (e) => {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    setBusy(true)
    setError(null)
    try {
      const url = await uploadImage(token, file)
      onChange(url)
      if (fileRef.current) fileRef.current.value = ''
    } catch (err) {
      if (isUnauthorized(err)) onUnauthorized?.()
      else setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="img-input">
      <span className="span-label">{label}</span>
      <div className="img-input-row">
        <input
          type="text"
          placeholder="Paste an image URL…"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
        />
        <button type="button" className="btn btn-sm btn-outline" onClick={() => fileRef.current?.click()} disabled={busy}>
          {busy ? 'Uploading…' : 'Upload'}
        </button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />
      </div>
      {value ? <img className="img-input-preview" src={value} alt="preview" /> : null}
      {error && <p className="form-status err">{error}</p>}
    </div>
  )
}