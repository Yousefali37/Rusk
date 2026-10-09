import { useRef, useState } from 'react'
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion'
import { AnimatedTitle } from '../Reveal.jsx'

const RING_TEXT = 'RUSK CAFE • SPECIALITY COFFEE & BAKERY • DOHA • QATAR • '
const HERO_FALLBACK_IMAGE = '/images/rusk/hero.jpg'

function RotatingBadge({ text = RING_TEXT }) {
  return (
    <span className="circle-badge" aria-hidden="true">
      <svg viewBox="0 0 100 100">
        <defs>
          <path id="badge-circle" d="M50,50 m-37,0 a37,37 0 1,1 74,0 a37,37 0 1,1 -74,0" />
        </defs>
        <text className="circle-badge-text">
          <textPath href="#badge-circle">{text}</textPath>
        </text>
      </svg>
      <span className="circle-badge-core">R</span>
    </span>
  )
}

function Ticker() {
  const items = ['Speciality Coffee', 'Artisan Bakery', 'Fresh Croissants', 'Signature Matcha', 'London Cake', 'Flatbreads', 'Breakfast All Day']
  const row = [...items, ...items]
  const strip = (start) =>
    row.map((t, i) => (
      <span className="ticker-item" key={`${start}-${i}`} aria-hidden={i >= items.length || start === 1}>
        {t}
        <span className="ticker-star" aria-hidden="true">
          ✦
        </span>
      </span>
    ))
  return (
    <div className="ticker" aria-hidden="true">
      <div className="ticker-track">
        <div className="ticker-row">{strip(0)}</div>
        <div className="ticker-row">{strip(1)}</div>
      </div>
    </div>
  )
}

export default function Hero({ site }) {
  const reduced = useReducedMotion()
  const ref = useRef(null)
  const { hero_title, hero_subtitle, hero_image, today_product, today_badge } = site || {}

  const media = hero_image || (today_product && today_product.image) || ''
  const [brokenSrc, setBrokenSrc] = useState(() => new Set())
  const candidates = media ? [media, HERO_FALLBACK_IMAGE] : []
  const imgSrc = candidates.find((s) => !brokenSrc.has(s)) || ''
  const onImgError = () => setBrokenSrc((prev) => new Set(prev).add(imgSrc))
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const imgY = useTransform(scrollYProgress, [0, 1], ['0%', '16%'])
  const copyY = useTransform(scrollYProgress, [0, 1], ['0%', '-14%'])
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, 0.25])

  return (
    <>
      <section id="top" className="hero-section" ref={ref}>
        <div className="hero-blob hero-blob-a" aria-hidden="true" />
        <div className="hero-blob hero-blob-b" aria-hidden="true" />

        <div className="container hero-grid">
          <motion.div className="hero-copy" style={reduced ? undefined : { y: copyY, opacity: fade }}>
            <motion.span
              className="hero-eyebrow"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              Speciality Coffee &amp; Bakery — Doha 7GPF QV Doha
            </motion.span>

            <h1 className="hero-title">
              <AnimatedTitle text={hero_title || 'Rusk'} as="span" />
              <span className="hero-title-italic">a taste of Brown</span>
            </h1>

            <motion.p
              className="hero-sub"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              {hero_subtitle ||
                'Speciality coffee, artisan bakery and indulgent desserts — baked fresh every day in Doha 7GPF QV Doha.'}
            </motion.p>

            <motion.div
              className="hero-actions"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <a className="btn btn-primary hero-cta" href="#menu">
                Explore the Menu
                <span className="btn-arrow" aria-hidden="true">
                  →
                </span>
              </a>
              {today_product && (
                <a className="btn btn-ghost" href="#today">
                  {today_badge || "Today's Special"}
                </a>
              )}
            </motion.div>
          </motion.div>

          <motion.div
            className="hero-media"
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.div className="hero-frame" style={reduced ? undefined : { y: imgY }}>
              {imgSrc ? (
                <img src={imgSrc} alt={hero_title || 'Rusk'} onError={onImgError} fetchPriority="high" />
              ) : (
                <div className="hero-frame-fallback">
                  <span className="brand-mark lg">
                    <span>B</span>
                  </span>
                </div>
              )}
            </motion.div>
            <motion.div
              className="hero-badge-wrap"
              initial={{ opacity: 0, scale: 0.6, rotate: -30 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 120, damping: 14, delay: 0.75 }}
            >
              <RotatingBadge />
            </motion.div>
          </motion.div>
        </div>

        <motion.a
          className="hero-scroll"
          href="#today"
          aria-label="Scroll down"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.6 }}
        >
          <span />
        </motion.a>
      </section>
      <Ticker />
    </>
  )
}