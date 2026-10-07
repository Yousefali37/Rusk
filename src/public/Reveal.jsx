import { motion, useReducedMotion } from 'framer-motion'
import { EASE, fadeUp, viewport } from './motion.js'

export function Reveal({ children, className, variants = fadeUp, ...rest }) {
  return (
    <motion.div
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="show"
      viewport={viewport}
      {...rest}
    >
      {children}
    </motion.div>
  )
}

/** Splits text into words with a clip-path rise, one per line. */
export function AnimatedTitle({ text, as: Tag = 'span', italic = false }) {
  const reduced = useReducedMotion()
  const words = String(text).split(' ')
  if (reduced) {
    return <Tag className={italic ? 'title-italic' : ''}>{text}</Tag>
  }
  return (
    <Tag className={italic ? 'title-italic' : ''} aria-label={text}>
      {words.map((word, i) => (
        <span key={i} className="title-word">
          <motion.span
            className="title-word-inner"
            custom={i}
            initial={{ y: '115%' }}
            animate={{ y: '0%' }}
            transition={{ duration: 0.85, ease: EASE, delay: 0.12 + i * 0.07 }}
          >
            {word}
          </motion.span>
          {i < words.length - 1 ? ' ' : ''}
        </span>
      ))}
    </Tag>
  )
}