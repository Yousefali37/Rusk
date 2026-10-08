import { useEffect, useRef, useState } from 'react'
import { adminApi, isUnauthorized, uploadImage } from '../api.js'
import ImageInput from './ImageInput.jsx'
import {
  DEFAULT_INSTA_EYEBROW,
  DEFAULT_INSTA_HEADING,
  DEFAULT_INSTA_SUBTITLE,
  DEFAULT_INSTA_POSTS,
} from '../instagramDefaults.js'

function PostImageRow({ token, value, onChange, onUnauthorized }) {
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
      {error && <p className="form-status err">{error}</p>}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label className="field">
      <span className="span-label">{label}</span>
      {children}
    </label>
  )
}

export default function AdminContent({ token, onUnauthorized }) {
  const [site, setSite] = useState(null)
  const [menu, setMenu] = useState([])
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let live = true
    Promise.all([adminApi.getSite(token), adminApi.getMenu(token)])
      .then(([s, m]) => {
        if (live) {
          setSite({
            ...s,
            insta_eyebrow: s.insta_eyebrow || DEFAULT_INSTA_EYEBROW,
            insta_heading: s.insta_heading || DEFAULT_INSTA_HEADING,
            insta_subtitle: s.insta_subtitle || DEFAULT_INSTA_SUBTITLE,
            insta_posts:
              Array.isArray(s.insta_posts) && s.insta_posts.length
                ? s.insta_posts
                : DEFAULT_INSTA_POSTS.map((p) => ({ ...p })),
          })
          setMenu(m)
        }
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
  }, [token, onUnauthorized])

  if (error) return <p className="form-status err">{error}</p>
  if (!site) return <p className="loading">Loading content…</p>

  const foods = []
  for (const top of menu) {
    for (const sub of top.subcategories || []) {
      for (const p of sub.products) foods.push({ ...p, group: `${top.name} · ${sub.name}` })
    }
    for (const p of top.products || []) foods.push({ ...p, group: top.name })
  }

  const set = (key, value) => setSite((s) => ({ ...s, [key]: value }))

  // instagram helpers
  const updateInstaPost = (i, patch) =>
    set('insta_posts', site.insta_posts.map((p, idx) => (idx === i ? { ...p, ...patch } : p)))
  const moveInstaPost = (i, dir) => {
    const next = [...site.insta_posts]
    const [item] = next.splice(i, 1)
    next.splice(i + dir, 0, item)
    set('insta_posts', next)
  }
  const removeInstaPost = (i) => set('insta_posts', site.insta_posts.filter((_, idx) => idx !== i))
  const addInstaPost = () => set('insta_posts', [...site.insta_posts, { src: '', url: '' }])

  const save = async () => {
    setSaved(false)
    try {
      await adminApi.saveSite(token, site)
      setSaved(true)
      setTimeout(() => setSaved(false), 2200)
    } catch (err) {
      if (isUnauthorized(err)) onUnauthorized?.()
      else setError(err.message)
    }
  }

  return (
    <div className="admin-pane">
      <div className="pane-head">
        <h2>Page content</h2>
      </div>

      <h3 className="block-title">Hero section</h3>
      <div className="grid-2">
        <Field label="Site name">
          <input value={site.site_name || ''} onChange={(e) => set('site_name', e.target.value)} />
        </Field>
        <ImageInput
          label="Logo"
          token={token}
          value={site.logo}
          onChange={(v) => set('logo', v)}
          onUnauthorized={onUnauthorized}
        />
        <Field label="Hero title">
          <input value={site.hero_title || ''} onChange={(e) => set('hero_title', e.target.value)} />
        </Field>
        <Field label="Hero subtitle">
          <textarea rows={2} value={site.hero_subtitle || ''} onChange={(e) => set('hero_subtitle', e.target.value)} />
        </Field>
      </div>
      <ImageInput label="Hero background image" token={token} value={site.hero_image} onChange={(v) => set('hero_image', v)} onUnauthorized={onUnauthorized} />

      <h3 className="block-title">Today's special</h3>
      <div className="grid-2">
        <Field label="Badge text">
          <input value={site.today_badge || ''} onChange={(e) => set('today_badge', e.target.value)} />
        </Field>
        <Field label="Product to feature">
          <select
            value={site.today_product_id || ''}
            onChange={(e) => set('today_product_id', e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">— select a product —</option>
            {foods.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} ({f.group})
              </option>
            ))}
          </select>
        </Field>
      </div>

      <h3 className="block-title">Instagram section</h3>
      <div className="grid-2">
        <Field label="Eyebrow">
          <input
            placeholder={DEFAULT_INSTA_EYEBROW}
            value={site.insta_eyebrow || ''}
            onChange={(e) => set('insta_eyebrow', e.target.value)}
          />
        </Field>
        <Field label="Heading (*text* becomes italic)">
          <input
            placeholder={DEFAULT_INSTA_HEADING}
            value={site.insta_heading || ''}
            onChange={(e) => set('insta_heading', e.target.value)}
          />
        </Field>
      </div>
      <Field label="Subtitle">
        <textarea
          rows={2}
          placeholder={DEFAULT_INSTA_SUBTITLE}
          value={site.insta_subtitle || ''}
          onChange={(e) => set('insta_subtitle', e.target.value)}
        />
      </Field>
      {site.insta_posts.length === 0 ? (
        <p className="muted">No Instagram posts yet.</p>
      ) : (
        <div className="gallery-admin">
          {site.insta_posts.map((p, i) => (
            <div className="gallery-admin-item" key={i}>
              <div className="gallery-admin-img">
                {p.src ? (
                  <img
                    src={p.src}
                    alt=""
                    style={{ objectFit: p.fit || 'cover', objectPosition: p.pos || 'center' }}
                  />
                ) : (
                  <span>No image</span>
                )}
              </div>
              <PostImageRow
                token={token}
                value={p.src}
                onChange={(v) => updateInstaPost(i, { src: v })}
                onUnauthorized={onUnauthorized}
              />
              <input
                placeholder="Post URL (instagram.com/p/…)"
                value={p.url || ''}
                onChange={(e) => updateInstaPost(i, { url: e.target.value })}
              />
              <Field label="Image fit">
                <select
                  value={p.fit || 'cover'}
                  onChange={(e) => updateInstaPost(i, { fit: e.target.value })}
                >
                  <option value="cover">Cover — fill &amp; crop</option>
                  <option value="contain">Contain — show full image</option>
                </select>
              </Field>
              <Field label="Image position">
                <select
                  value={p.pos || 'center'}
                  onChange={(e) => updateInstaPost(i, { pos: e.target.value })}
                >
                  <option value="center">Center</option>
                  <option value="top">Top</option>
                  <option value="bottom">Bottom</option>
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                  <option value="top left">Top left</option>
                  <option value="top right">Top right</option>
                  <option value="bottom left">Bottom left</option>
                  <option value="bottom right">Bottom right</option>
                </select>
              </Field>
              <div className="row-actions">
                <button type="button" className="btn btn-xs" onClick={() => moveInstaPost(i, -1)} disabled={i === 0}>↑</button>
                <button type="button" className="btn btn-xs" onClick={() => moveInstaPost(i, 1)} disabled={i === site.insta_posts.length - 1}>↓</button>
                <button type="button" className="btn btn-xs btn-danger" onClick={() => removeInstaPost(i)}>Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}
      <button type="button" className="btn btn-outline" onClick={addInstaPost}>+ Add Instagram post</button>

      <h3 className="block-title">Contact</h3>
      <div className="grid-2">
        <Field label="Address">
          <input value={site.contact_address || ''} onChange={(e) => set('contact_address', e.target.value)} />
        </Field>
        <Field label="Phone">
          <input value={site.contact_phone || ''} onChange={(e) => set('contact_phone', e.target.value)} />
        </Field>
        <Field label="Email">
          <input value={site.contact_email || ''} onChange={(e) => set('contact_email', e.target.value)} />
        </Field>
        <Field label="Opening hours">
          <input value={site.contact_hours || ''} onChange={(e) => set('contact_hours', e.target.value)} />
        </Field>
        <Field label="Google Maps embed URL">
          <input placeholder="https://www.google.com/maps?q=…&output=embed" value={site.contact_map || ''} onChange={(e) => set('contact_map', e.target.value)} />
        </Field>
        <Field label="Instagram URL">
          <input value={site.social_instagram || ''} onChange={(e) => set('social_instagram', e.target.value)} />
        </Field>
        <Field label="TikTok URL">
          <input value={site.social_tiktok || ''} onChange={(e) => set('social_tiktok', e.target.value)} />
        </Field>
        <Field label="Linktree URL">
          <input value={site.social_linktree || ''} onChange={(e) => set('social_linktree', e.target.value)} />
        </Field>
        <Field label="Talabat URL">
          <input value={site.social_talabat || ''} onChange={(e) => set('social_talabat', e.target.value)} />
        </Field>
        <Field label="Snoonu URL">
          <input value={site.snoonu || ''} onChange={(e) => set('snoonu', e.target.value)} />
        </Field>
        <Field label="Rafeeq URL">
          <input value={site.rafeeq || ''} onChange={(e) => set('rafeeq', e.target.value)} />
        </Field>
      </div>

      <h3 className="block-title">Footer</h3>
      <div className="grid-2">
        <Field label="Footer text">
          <input value={site.footer_text || ''} onChange={(e) => set('footer_text', e.target.value)} />
        </Field>
      </div>
      <ImageInput label="Footer background" token={token} value={site.footer_background} onChange={(v) => set('footer_background', v)} onUnauthorized={onUnauthorized} />

      <button type="button" className="btn btn-primary admin-save-fab" onClick={save}>
        {saved ? 'Saved ✓' : 'Save changes'}
      </button>
    </div>
  )
}