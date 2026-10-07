import { motion } from 'framer-motion'
import { Fragment, useState } from 'react'
import { Reveal } from '../Reveal.jsx'
import { fadeUp, stagger } from '../motion.js'
import {
  DEFAULT_INSTA_EYEBROW,
  DEFAULT_INSTA_HEADING,
  DEFAULT_INSTA_SUBTITLE,
  DEFAULT_INSTA_POSTS,
} from '../../instagramDefaults.js'

const PER_PAGE = 5

function tileClass(i, n) {
  if (n === 5) return i === 0 ? 'insta-big' : i === 1 ? 'insta-wide' : ''
  if (n === 4) return i < 2 ? 'insta-wide' : ''
  if (n === 3) return i === 0 ? 'insta-big' : ''
  if (n === 2) return i === 0 ? 'insta-wide' : ''
  if (n === 1) return 'insta-full'
  return ''
}

function EmText({ text }) {
  const parts = String(text || '').split(/\*([^*]+)\*/g)
  return parts.map((part, i) => (i % 2 ? <em key={i}>{part}</em> : <Fragment key={i}>{part}</Fragment>))
}

export default function InstagramFeed({ site }) {
  const handle = site?.social_instagram?.replace(/\/+$/, '')
  const segs = (handle?.match(/instagram\.com\/?(.*)$/)?.[1] || '').split('/').filter(Boolean)
  const first = segs[0]
  const RESERVED = ['p', 'reel', 'tv', 'explore', 'stories', 'share']
  const handleLabel = first && !RESERVED.includes(first) ? '@' + first.replace(/^@/, '') : '@browncafe.qa'

  const posts =
    Array.isArray(site?.insta_posts) && site.insta_posts.length
      ? site.insta_posts.filter((p) => p && p.src)
      : DEFAULT_INSTA_POSTS

  const [page, setPage] = useState(0)
  const pageCount = Math.ceil(posts.length / PER_PAGE)
  const current = pageCount > 0 ? Math.min(page, pageCount - 1) : 0
  const visible = pageCount > 1 ? posts.slice(current * PER_PAGE, current * PER_PAGE + PER_PAGE) : posts

  return (
    <section id="instagram" className="insta-section">
      <div className="container">
        <div className="section-head">
          <Reveal>
            <span className="eyebrow">{site?.insta_eyebrow || DEFAULT_INSTA_EYEBROW}</span>
            <h2>
              <EmText text={site?.insta_heading || DEFAULT_INSTA_HEADING} />
            </h2>
            <p>{site?.insta_subtitle || DEFAULT_INSTA_SUBTITLE}</p>
          </Reveal>
          <Reveal>
            <a
              className="btn-line insta-follow"
              href={handle || 'https://www.instagram.com/browncafe.qa/'}
              target="_blank"
              rel="noreferrer noopener"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zm0 10.162a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </svg>
              {handleLabel}
            </a>
          </Reveal>
        </div>

        <motion.div
          key={current}
          className="insta-grid"
          variants={stagger(0.05, 0.06)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
        >
          {visible.map((post, i) => (
            <motion.a
              key={i}
              className={`insta-card ${tileClass(i, visible.length)}`}
              href={post.url || (handle || 'https://www.instagram.com/browncafe.qa/')}
              target="_blank"
              rel="noreferrer noopener"
              variants={fadeUp}
              data-cursor
            >
              <img
                src={post.src}
                alt="Brown Cafe on Instagram"
                loading="lazy"
                style={{ objectFit: post.fit || 'cover', objectPosition: post.pos || 'center' }}
              />
              <span className="insta-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zm0 10.162a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </span>
            </motion.a>
          ))}
        </motion.div>

        {pageCount > 1 && (
          <nav className="insta-pager" aria-label="Instagram posts pagination">
            <button
              type="button"
              className="insta-page-btn"
              onClick={() => setPage(current - 1)}
              disabled={current === 0}
              aria-label="Previous page"
            >
              ‹
            </button>
            {Array.from({ length: pageCount }, (_, i) => (
              <button
                key={i}
                type="button"
                className={`insta-page-dot ${i === current ? 'on' : ''}`}
                onClick={() => setPage(i)}
                aria-label={`Page ${i + 1}`}
                aria-current={i === current ? 'page' : undefined}
              >
                {i + 1}
              </button>
            ))}
            <button
              type="button"
              className="insta-page-btn"
              onClick={() => setPage(current + 1)}
              disabled={current === pageCount - 1}
              aria-label="Next page"
            >
              ›
            </button>
          </nav>
        )}
      </div>
    </section>
  )
}
