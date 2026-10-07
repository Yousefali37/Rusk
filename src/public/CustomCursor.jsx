import { useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

const HOVER_SELECTOR =
  'a, button, input, textarea, select, .product-card, [data-cursor]'

function cursorSupported() {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(pointer: fine)').matches &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

export default function CustomCursor() {
  const [enabled] = useState(cursorSupported)
  const [hovering, setHovering] = useState(false)
  const [visible, setVisible] = useState(false)

  const x = useMotionValue(-100)
  const y = useMotionValue(-100)
  const ringX = useSpring(x, { stiffness: 260, damping: 24, mass: 0.55 })
  const ringY = useSpring(y, { stiffness: 260, damping: 24, mass: 0.55 })

  useEffect(() => {
    if (!enabled) return
    document.documentElement.classList.add('has-custom-cursor')

    const move = (e) => {
      x.set(e.clientX)
      y.set(e.clientY)
      setVisible(true)
      const hit = e.target.closest && e.target.closest(HOVER_SELECTOR)
      setHovering(Boolean(hit))
    }
    const leave = () => setVisible(false)
    window.addEventListener('mousemove', move, { passive: true })
    document.documentElement.addEventListener('mouseleave', leave)
    return () => {
      document.documentElement.classList.remove('has-custom-cursor')
      window.removeEventListener('mousemove', move)
      document.documentElement.removeEventListener('mouseleave', leave)
    }
  }, [enabled, x, y])

  if (!enabled) return null

  const dotClass = ['cursor-dot', hovering && 'is-hover', !visible && 'is-hidden'].filter(Boolean).join(' ')
  const ringClass = ['cursor-ring', hovering && 'is-hover', !visible && 'is-hidden'].filter(Boolean).join(' ')

  return (
    <>
      <motion.div className={dotClass} style={{ x, y }} aria-hidden="true">
        <span className="cursor-dot-core" />
      </motion.div>
      <motion.div className={ringClass} style={{ x: ringX, y: ringY }} aria-hidden="true">
        <span className="cursor-ring-core" />
      </motion.div>
    </>
  )
}