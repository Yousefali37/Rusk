/* Motion presets + variants — plain values, no JSX. */

export const EASE = [0.22, 1, 0.36, 1]

export const viewport = { once: true, amount: 0.2 }

export const fadeUp = {
  hidden: { opacity: 0, y: 34 },
  show: { opacity: 1, y: 0, transition: { duration: 0.75, ease: EASE } },
}

export const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.8, ease: EASE } },
}

export const stagger = (delay = 0, gap = 0.09) => ({
  hidden: {},
  show: { transition: { staggerChildren: gap, delayChildren: delay } },
})

export const lineUp = {
  hidden: { y: '115%' },
  show: { y: '0%', transition: { duration: 0.85, ease: EASE } },
}