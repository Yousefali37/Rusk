import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { EASE } from './motion.js'

const STEPS = ['grinding', 'brewing', 'plating', 'serving']
const TICKS = Array.from({ length: 60 })
const DIAL_LABELS = [
  { a: 0, v: '0' },
  { a: 90, v: '25' },
  { a: 180, v: '50' },
  { a: 270, v: '75' },
]

export default function Preloader({ onDone }) {
  const [count, setCount] = useState(0)
  const reduced = useReducedMotion()
  const doneRef = useRef(onDone)
  useEffect(() => {
    doneRef.current = onDone
  }, [onDone])

  useEffect(() => {
    const dur = reduced ? 700 : 2100
    const start = performance.now()
    let raf
    const tick = (now) => {
      const t = Math.min(1, (now - start) / dur)
      const eased = 1 - Math.pow(1 - t, 3)
      setCount(Math.round(eased * 100))
      if (t < 1) {
        raf = requestAnimationFrame(tick)
      } else {
        setTimeout(() => doneRef.current?.(), reduced ? 100 : 420)
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [reduced])

  const step = Math.min(STEPS.length - 1, Math.floor(count / (100 / STEPS.length)))
  const year = new Date().getFullYear()

  return (
    <motion.div
      className="preloader"
      exit={{ y: '-102%', transition: { duration: 0.85, ease: [0.76, 0, 0.24, 1] } }}
      aria-label="Loading Rusk"
    >
      <div className="preloader-fade" aria-hidden="true" />
      <div className="preloader-grain" aria-hidden="true" />

      <div className="preloader-inner">
        <div className="preloader-brandbar">
          <div className="preloader-brand">
            <img className="brand-logo" src="/images/rusk/logo.png" alt="Rusk" />
            <div className="preloader-brand-text">
              <span className="preloader-tagline">Speciality coffee, every day.</span>
            </div>
          </div>
        </div>

        <div className="preloader-stage">
          <p className="preloader-giant" aria-hidden="true">
            RUSK
          </p>

          <div className="preloader-cluster">
            <div className="preloader-dial">
            <svg className="preloader-dial-svg" viewBox="0 0 240 240" aria-hidden="true">
              <circle className="dial-face" cx="120" cy="120" r="104" />
              <g className="dial-ticks">
                {TICKS.map((_, i) => {
                  const a = (i * 6 * Math.PI) / 180
                  const major = i % 15 === 0
                  const inner = major ? 88 : 91
                  return (
                    <line
                      key={i}
                      className={major ? 'dial-tick major' : 'dial-tick'}
                      x1={120 + inner * Math.sin(a)}
                      y1={120 - inner * Math.cos(a)}
                      x2={120 + 96 * Math.sin(a)}
                      y2={120 - 96 * Math.cos(a)}
                    />
                  )
                })}
              </g>
              <g className="dial-labels">
                {DIAL_LABELS.map(({ a, v }) => {
                  const rad = (a * Math.PI) / 180
                  return (
                    <text
                      key={a}
                      className="dial-label"
                      x={120 + 74 * Math.sin(rad)}
                      y={120 - 74 * Math.cos(rad)}
                      textAnchor="middle"
                    >
                      {v}
                    </text>
                  )
                })}
              </g>
              <g className="dial-hand" transform={`rotate(${count * 3.6} 120 120)`}>
                <line x1="120" y1="120" x2="120" y2="34" />
                <circle className="dial-hub" cx="120" cy="120" r="9" />
              </g>
            </svg>
          </div>

          <div className="preloader-readout">
            <div className="preloader-display" aria-hidden="true">
              <span className="preloader-display-num">{String(count).padStart(3, '0')}</span>
              <span className="preloader-display-label">brew timer</span>
            </div>
            <div className="preloader-step" aria-live="off">
              <AnimatePresence mode="wait" initial={false}>
                <motion.p
                  key={step}
                  className="preloader-tag"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.35, ease: EASE }}
                >
                  {STEPS[step]}…
                </motion.p>
              </AnimatePresence>
            </div>
          </div>
          </div>
        </div>
      </div>

      <div className="preloader-bar">
        <p className="preloader-meta">© {year} Rusk · West Walk, Qatar</p>
        <p className="preloader-hint">setting the table</p>
      </div>
    </motion.div>
  )
}