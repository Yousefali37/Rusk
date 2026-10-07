import { motion } from 'framer-motion'
import { Reveal } from '../Reveal.jsx'
import { fadeUp, viewport } from '../motion.js'

export default function TodaysMenu({ site, onFind }) {
  const p = site.today_product
  if (!p) return null

  return (
    <section id="today" className="today-section container">
      <div className="section-head">
        <Reveal>
          <span className="eyebrow">{site.today_badge || "Today's Special"}</span>
          <h2>
            Featured <em>Fresh</em> Today
          </h2>
        </Reveal>
      </div>

      <motion.div className="today-card" variants={fadeUp} initial="hidden" whileInView="show" viewport={viewport}>
        <div className="today-media">
          {p.image ? (
            <img src={p.image} alt={p.name} />
          ) : (
            <div className="today-placeholder">
              <span className="brand-mark lg">
                <span>B</span>
              </span>
            </div>
          )}
          <span className="today-badge">{p.category_name || 'Featured'}</span>
        </div>

        <div className="today-body">
          <span className="today-label">{site.today_badge || "Today's Special"}</span>
          <h3>{p.name}</h3>
          {p.description ? <p className="today-desc">{p.description}</p> : null}
          <p className="today-price">
            {p.price > 0 ? `QAR ${Number(p.price).toFixed(2)}` : 'Price on request'}
          </p>
          <button type="button" className="btn btn-primary today-cta" onClick={onFind}>
            Find it on the menu
            <span className="btn-arrow" aria-hidden="true">
              →
            </span>
          </button>
        </div>
      </motion.div>
    </section>
  )
}