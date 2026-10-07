import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { EASE } from '../motion.js'
import LogoMark from './LogoMark.jsx'

const NAV = [
  { href: '#today', label: "Today's Special" },
  { href: '#menu', label: 'Our Menu' },
  { href: '#instagram', label: 'Instagram' },
  { href: '#contact', label: 'Contact' },
]

export default function Header({ site }) {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { site_name, logo } = site || {}

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <motion.header
      className={`site-header ${scrolled ? 'is-scrolled' : ''} ${open ? 'is-open' : ''}`}
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: EASE, delay: 0.15 }}
    >
      <div className="container header-inner">
        <a href="#top" className="site-brand" onClick={() => setOpen(false)}>
          {logo ? (
            <img className="brand-logo" src={logo} alt={site_name} />
          ) : (
            <span className="brand-mark" aria-hidden="true">
              <LogoMark />
            </span>
          )}
          <span className="brand-name">{site_name}</span>
        </a>

        <nav className={`site-nav ${open ? 'open' : ''}`}>
          {NAV.map((n) => (
            <a key={n.href} href={n.href} onClick={() => setOpen(false)}>
              {n.label}
            </a>
          ))}
          <a
            className="btn btn-primary nav-cta"
            href={site?.social_talabat || '#menu'}
            target={site?.social_talabat ? '_blank' : undefined}
            rel={site?.social_talabat ? 'noreferrer' : undefined}
            onClick={() => setOpen(false)}
          >
            Order Now
          </a>
        </nav>

        <button
          type="button"
          className={`nav-toggle ${open ? 'open' : ''}`}
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </motion.header>
  )
}