import { motion } from 'framer-motion'

const SOCIALS = [
  { key: 'instagram', label: 'Instagram', get: (s) => s.social_instagram },
  { key: 'tiktok', label: 'TikTok', get: (s) => s.social_tiktok },
  { key: 'linktree', label: 'Linktree', get: (s) => s.social_linktree },
  { key: 'talabat', label: 'Talabat', get: (s) => s.social_talabat },
  { key: 'snoonu', label: 'Snoonu', get: (s) => s.snoonu },
  { key: 'rafeeq', label: 'Rafeeq', get: (s) => s.rafeeq },
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
  rafeeq: (
    <>
      <path d="M5.5 3.6v8.8" />
      <path d="M5.5 3.6h2.6a2.8 2.8 0 0 1 0 5.6H5.5" />
      <path d="M8.4 9.2l3.1 3.1" />
    </>
  ),
}

export default function Footer({ site }) {
  const year = new Date().getFullYear()
  const socials = SOCIALS.filter((s) => s.get(site))

  return (
    <footer
      className="site-footer"
      style={site.footer_background ? { backgroundImage: `url(${site.footer_background})` } : undefined}
    >
      <div className="footer-grain" aria-hidden="true" />
      <div className="container footer-inner">
        <div className="footer-top">
          <motion.div
            className="footer-brand"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <img className="brand-logo" src="/images/rusk/logo.png" alt={site.site_name || 'Rusk'} />
            <span className="brand-name">{site.site_name || 'Rusk'}</span>
            <p className="footer-text">{site.footer_text || 'Speciality coffee & bakery, made fresh every day in Doha 7GPF QV Doha.'}</p>

            {socials.length > 0 && (
              <div className="footer-social">
                {socials.map((s) => (
                  <a
                    key={s.key}
                    className="footer-social-link"
                    href={s.get(site)}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={s.label}
                    title={s.label}
                  >
                    <svg
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
                  </a>
                ))}
              </div>
            )}
          </motion.div>

          <ul className="footer-nav">
            <li><a href="#today">Today</a></li>
            <li><a href="#menu">Menu</a></li>
            <li><a href="#instagram">Instagram</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul>
        </div>

        <p className="footer-giant" aria-hidden="true">
          RUSK
        </p>

        <div className="footer-bar">
          <p className="footer-meta">© {year} · Doha 7GPF QV Doha</p>
          <a className="admin-link" href="/admin">
            Admin
          </a>
        </div>
      </div>
    </footer>
  )
}
