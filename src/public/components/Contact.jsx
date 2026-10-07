import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { submitMessage } from '../../api.js'
import { Reveal } from '../Reveal.jsx'

const SOCIALS = [
  { key: 'instagram', label: 'Instagram', get: (s) => s.social_instagram },
  { key: 'tiktok', label: 'TikTok', get: (s) => s.social_tiktok },
  { key: 'linktree', label: 'Linktree', get: (s) => s.social_linktree },
  { key: 'talabat', label: 'Order', get: (s) => s.social_talabat },
  { key: 'snoonu', label: 'Snoonu', get: (s) => s.snoonu },
]

const SOCIAL_ICONS = {
  instagram: (
    <>
      <rect x="2.4" y="2.4" width="11.2" height="11.2" rx="3.4" />
      <circle cx="8" cy="8" r="2.7" />
      <circle cx="11.5" cy="4.5" r="0.7" fill="currentColor" stroke="none" />
    </>
  ),
  tiktok: (
    <>
      <path d="M9.4 2.4v7.4a2.6 2.6 0 1 1-2.2-2.6" />
      <path d="M9.4 4.2c.6 1.2 1.7 2 3 2.1" />
    </>
  ),
  linktree: (
    <>
      <circle cx="8" cy="3.4" r="1.9" />
      <circle cx="4" cy="12.2" r="1.9" />
      <circle cx="12" cy="12.2" r="1.9" />
      <path d="M7 5 4.8 10.4M9 5l2.2 5.4" />
    </>
  ),
  talabat: (
    <>
      <path d="M3.4 5.4h9.2l-.8 8.2H4.2z" />
      <path d="M6 5.4a2 2 0 0 1 4 0" />
    </>
  ),
  snoonu: (
    <>
      <path d="M13.6 2.6 2.4 7.1l4.4 1.7 1.7 4.4z" />
      <path d="M13.6 2.6 6.8 8.8" />
    </>
  ),
}

function InfoRow({ label, value, href }) {
  if (!value) return null
  return (
    <div className="info-row">
      <span className="info-dot" aria-hidden="true" />
      <span className="info-label">{label}</span>
      {href ? (
        <a
          className="info-value"
          href={href}
          target={href.startsWith('http') ? '_blank' : undefined}
          rel="noreferrer"
        >
          {value}
        </a>
      ) : (
        <span className="info-value">{value}</span>
      )}
    </div>
  )
}

export default function Contact({ site }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' })
  const [status, setStatus] = useState(null)
  const [error, setError] = useState(null)

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const onSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setStatus(null)
    try {
      await submitMessage(form)
      setStatus('Thanks! Your message is in — we’ll get back to you soon.')
      setForm({ name: '', email: '', phone: '', message: '' })
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <section id="contact" className="contact-section">
      <div className="container">
        <div className="section-head">
          <Reveal>
            <span className="eyebrow">Say Hello</span>
            <h2>
              Come <em>Say Hi</em>
            </h2>
            <p>Come by for coffee, a fresh bake and a sweet treat — or drop us a line first.</p>
          </Reveal>
        </div>

        <div className="contact-grid">
          <Reveal className="contact-panel">
            <h3 className="contact-title">{site.site_name || 'Brown Cafe'}</h3>
            <div className="info-list">
              <InfoRow label="Address" value={site.contact_address} />
              <InfoRow
                label="Phone"
                value={site.contact_phone}
                href={site.contact_phone ? `tel:${site.contact_phone.replace(/[^+\d]/g, '')}` : undefined}
              />
              <InfoRow label="Email" value={site.contact_email} href={site.contact_email ? `mailto:${site.contact_email}` : undefined} />
              <InfoRow label="Opening hours" value={site.contact_hours} />
            </div>

            {SOCIALS.filter((s) => s.get(site)).length > 0 && (
              <div className="social-row">
                {SOCIALS.filter((s) => s.get(site)).map((s) => (
                  <a
                    className="social-link"
                    key={s.key}
                    href={s.get(site)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <svg
                      className="social-icon"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      {SOCIAL_ICONS[s.key]}
                    </svg>
                    {s.label}
                  </a>
                ))}
              </div>
            )}

            {site.contact_map && (
              <div className="map-wrap">
                <iframe
                  title="Brown Cafe location"
                  src={site.contact_map}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>
            )}
          </Reveal>

          <Reveal className="contact-panel form">
            <form className="contact-form" onSubmit={onSubmit}>
              <h3>Send us a message</h3>
              <label>
                <span>Name*</span>
                <input name="name" required value={form.name} onChange={onChange} placeholder="Your name" />
              </label>
              <label>
                <span>Email</span>
                <input name="email" type="email" value={form.email} onChange={onChange} placeholder="you@example.com" />
              </label>
              <label>
                <span>Phone</span>
                <input name="phone" value={form.phone} onChange={onChange} placeholder="+974 …" />
              </label>
              <label>
                <span>Message*</span>
                <textarea name="message" required rows={4} value={form.message} onChange={onChange} placeholder="How can we help?" />
              </label>

              <AnimatePresence>
                {status && (
                  <motion.p
                    className="form-status ok"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    {status}
                  </motion.p>
                )}
                {error && (
                  <motion.p
                    className="form-status err"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              <motion.button
                type="submit"
                className="btn btn-primary form-submit"
                whileHover={{ y: -2 }}
                whileTap={{ y: 0 }}
              >
                Send Message
                <span className="btn-arrow" aria-hidden="true">
                  →
                </span>
              </motion.button>
            </form>
          </Reveal>
        </div>
      </div>
    </section>
  )
}