import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Reveal } from '../Reveal.jsx'
import { EASE, fadeUp, stagger } from '../motion.js'
import ProductModal from './ProductModal.jsx'

function ProductCard({ product, focusId, onOpen }) {
  const isFocus = focusId && product.id === focusId
  return (
    <motion.article
      variants={fadeUp}
      className={`product-card ${isFocus ? 'focus' : ''}`}
      role="button"
      tabIndex={0}
      onClick={() => onOpen(product)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen(product)
        }
      }}
    >
      <div className="product-media">
        {product.image ? (
          <img className="product-img" src={product.image} alt={product.name} loading="lazy" />
        ) : (
          <div className="product-img product-img-fallback">
            <span className="brand-mark">
              <span>B</span>
            </span>
          </div>
        )}
        {product.price > 0 && (
          <span className="product-tag">QAR {Number(product.price).toFixed(2)}</span>
        )}
      </div>
      <div className="product-info">
        <div className="product-title-row">
          <h4 className="product-name">{product.name}</h4>
          <span className="product-price-fill" aria-hidden="true" />
          <span className="product-price">
            {product.price > 0 ? `QAR ${Number(product.price).toFixed(2)}` : '—'}
          </span>
        </div>
        {product.description ? <p className="product-desc">{product.description}</p> : null}
      </div>
    </motion.article>
  )
}

function countItems(sub) {
  return (sub.products || []).length
}

function countTop(top) {
  return (
    (top.products || []).length +
    (top.subcategories || []).reduce((n, g) => n + countItems(g), 0)
  )
}

function PageNav({ page, total, label, onPrev, onNext }) {
  return (
    <div className="menu-pagination">
      <button
        type="button"
        className="page-btn"
        disabled={page <= 0}
        onClick={onPrev}
        aria-label="Previous page"
      >
        <span className="page-arrow" aria-hidden="true">
          ←
        </span>
        <span>Prev</span>
      </button>
      <div className="page-indicator">
        <strong>{label}</strong>
        <span className="page-count">
          {page + 1} <small>of</small> {total}
        </span>
      </div>
      <button
        type="button"
        className="page-btn"
        disabled={page >= total - 1}
        onClick={onNext}
        aria-label="Next page"
      >
        <span>Next</span>
        <span className="page-arrow" aria-hidden="true">
          →
        </span>
      </button>
    </div>
  )
}

export default function MenuSection({ site, selection, focusId, onSelect, search, onSearchChange }) {
  const menu = useMemo(() => site.menu || [], [site])
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(null) // { product, category }
  const [searchPage, setSearchPage] = useState(0) // current search-results page

  const tops = useMemo(() => menu.filter((c) => !c.parent_id), [menu])

  // product id -> category breadcrumb ("Warm Coffee · Signature Latte")
  const catLabel = useMemo(() => {
    const m = new Map()
    for (const top of menu) {
      for (const sub of top.subcategories || []) {
        for (const p of sub.products) m.set(p.id, `${top.name} · ${sub.name}`)
      }
      for (const p of top.products || []) m.set(p.id, top.name)
    }
    return m
  }, [menu])

  // all product ids across the tree (for highlight + empty states)
  const allProducts = useMemo(() => {
    const out = []
    for (const top of menu) {
      for (const sub of top.subcategories || []) out.push(...sub.products)
      out.push(...(top.products || []))
    }
    return out
  }, [menu])

  const selectedTop = selection.topId ? tops.find((t) => t.id === selection.topId) || null : null
  const selectedSub = selection.subId
    ? selectedTop?.subcategories?.find((s) => s.id === selection.subId) || null
    : null

  // category page is driven by the selected category (falling back to the first one)
  const page = selection.topId ? Math.max(0, tops.findIndex((t) => t.id === selection.topId)) : 0
  const currentTop = tops[page] || null

  const q = search.trim().toLowerCase()
  const filterPrice = (p) =>
    !q || p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q)

  const filteredAll = q ? allProducts.filter(filterPrice) : []

  const countText = q ? `${filteredAll.length} result${filteredAll.length === 1 ? '' : 's'}` : null

  const PER_PAGE = 18
  const totalSearchPages = Math.max(1, Math.ceil(filteredAll.length / PER_PAGE))
  const sp = Math.min(searchPage, totalSearchPages - 1)

  const handleSearch = (value) => {
    setSearchPage(0)
    onSearchChange(value)
  }

  const goTo = (i) => {
    if (tops.length === 0) return
    const idx = Math.min(Math.max(0, i), tops.length - 1)
    onSelect({ topId: tops[idx].id, subId: null })
  }

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <section id="menu" className="menu-section">
      <div className="container">
        <div className="section-head">
          <Reveal>
            <span className="eyebrow">Made to Order</span>
            <h2>
              Taste the <em>Menu</em>
            </h2>
            <p>
              Browse the menu category by category with the arrows below, or use the filter to jump
              straight to a favourite. Every plate is made fresh at Brown Cafe in West Walk, Qatar.
            </p>
          </Reveal>
        </div>

        {/* filters: popup + visible active pills only */}
        <Reveal>
          <div className="menu-filter">
            <div className="filter-line">
              <button
                type="button"
                className="filter-trigger"
                aria-haspopup="dialog"
                aria-expanded={open}
                onClick={() => setOpen(true)}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                  <path
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    d="M3 5h18l-7 8.5V19l-4 2v-7.5L3 5z"
                  />
                </svg>
                Filters
              </button>

              <div className="active-filters">
                {selectedTop && (
                  <button
                    type="button"
                    className="active-chip"
                    onClick={() => onSelect({ topId: null, subId: null })}
                  >
                    <span>{selectedTop.name}</span>
                    <span className="active-chip-count">{countTop(selectedTop)}</span>
                    <span className="active-chip-x" aria-label="Clear category">
                      ×
                    </span>
                  </button>
                )}
              </div>

              <span className="filter-spacer" />

              <label className="menu-search">
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                  <path
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm10 2-4.35-4.35"
                  />
                </svg>
                <input
                  type="search"
                  placeholder="Search matcha, tiramisu, coffee…"
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </label>
            </div>
          </div>
        </Reveal>

        {/* filter popup */}
        <AnimatePresence>
          {open && (
            <motion.div
              className="filter-modal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            >
              <motion.div
                className="filter-popup"
                role="dialog"
                aria-modal="true"
                aria-label="Filter the menu"
                initial={{ scale: 0.94, y: 16 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.94, y: 16 }}
                transition={{ duration: 0.28, ease: EASE }}
                onClick={(e) => e.stopPropagation()}
              >
                  <div className="filter-popup-head">
                    <div>
                      <span className="eyebrow">Explore</span>
                      <h3 className="filter-popup-title">Filter the menu</h3>
                    </div>
                    <button
                      type="button"
                      className="filter-popup-close"
                      aria-label="Close"
                      onClick={() => setOpen(false)}
                    >
                      ×
                    </button>
                  </div>

                  <div className="filter-popup-body">
                    <p className="filter-popup-label">Category</p>
                    <div className="chip-row">
                      {tops.map((top) => {
                        const hasSubs = (top.subcategories || []).length > 0
                        const already = selection.topId === top.id
                        return (
                          <button
                            key={top.id}
                            type="button"
                            className={`chip ${selection.topId === top.id ? 'active' : ''}`}
                            onClick={() => {
                              onSelect({ topId: top.id, subId: null })
                              if (already || !hasSubs) setOpen(false)
                            }}
                          >
                            {top.name}
                            <span className="chip-count">{countTop(top)}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="filter-popup-foot">
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => {
                        onSelect({ topId: null, subId: null })
                        setOpen(false)
                      }}
                    >
                      Clear filters
                    </button>
                    <button type="button" className="btn btn-primary" onClick={() => setOpen(false)}>
                      Done
                    </button>
                  </div>
                </motion.div>
              </motion.div>
          )}
        </AnimatePresence>

        {/* results */}
        <div className="menu-results">
          {q ? (
            <div className="menu-groups">
              <p className="results-note">{countText}</p>
              {totalSearchPages > 1 && (
                <PageNav
                  page={sp}
                  total={totalSearchPages}
                  label="Results"
                  onPrev={() => setSearchPage(sp - 1)}
                  onNext={() => setSearchPage(sp + 1)}
                />
              )}
              <motion.div key={`search-${q}-${sp}`} {...productGridMotion}>
                <div className="product-grid">
                  {filteredAll.slice(sp * PER_PAGE, sp * PER_PAGE + PER_PAGE).map((p) => (
                    <ProductCard key={p.id} product={p} focusId={null} onOpen={(p) => setActive({ product: p, category: catLabel.get(p.id) })} />
                  ))}
                </div>
              </motion.div>
              {filteredAll.length === 0 && (
                <div className="menu-empty">
                  <p>Nothing matched “{search}”.</p>
                  <button type="button" className="btn btn-outline" onClick={() => handleSearch('')}>
                    Clear search
                  </button>
                </div>
              )}
            </div>
          ) : selectedSub ? (
            <div className="menu-groups">
              <div className="menu-group" key={`${selectedTop.id}-${selectedSub.id}`}>
                <h3 className="menu-group-title">
                  <span>{selectedTop.name}</span>
                  <span className="menu-group-count">{countItems(selectedSub)}</span>
                </h3>
                <motion.div key={`sub-${selectedSub.id}`} {...productGridMotion}>
                  <div className="product-grid">
                    {selectedSub.products.map((p) => (
                      <ProductCard key={p.id} product={p} focusId={focusId} onOpen={(p) => setActive({ product: p, category: catLabel.get(p.id) })} />
                    ))}
                  </div>
                </motion.div>
              </div>
            </div>
          ) : (
            <div className="menu-groups">
              {currentTop ? (
                <>
                  <PageNav
                    page={page}
                    total={tops.length}
                    label={currentTop.name}
                    onPrev={() => goTo(page - 1)}
                    onNext={() => goTo(page + 1)}
                  />
                  <div className="menu-group" key={currentTop.id}>
                    <h3 className="menu-group-title top">
                      <span>{currentTop.name}</span>
                      <span className="menu-group-count">{countTop(currentTop)}</span>
                    </h3>
                    {(currentTop.products || []).length > 0 && (
                      <motion.div key={`top-${currentTop.id}-${page}`} {...productGridMotion}>
                        <div className="product-grid">
                          {currentTop.products.map((p) => (
                            <ProductCard key={p.id} product={p} focusId={focusId} onOpen={(p) => setActive({ product: p, category: catLabel.get(p.id) })} />
                          ))}
                        </div>
                      </motion.div>
                    )}
                    {(currentTop.subcategories || []).map((g) => (
                      <div className="menu-subgroup" key={g.id}>
                        <h4 className="menu-subgroup-title">
                          <span>{g.name}</span>
                          <span className="menu-group-count">{countItems(g)}</span>
                        </h4>
                        <motion.div key={`s-${currentTop.id}-${g.id}`} {...productGridMotion}>
                          <div className="product-grid">
                            {g.products.map((p) => (
                              <ProductCard key={p.id} product={p} focusId={focusId} onOpen={(p) => setActive({ product: p, category: catLabel.get(p.id) })} />
                            ))}
                          </div>
                        </motion.div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="menu-empty">
                  <p>Nothing on the pass yet — the kitchen is still waking up.</p>
                </div>
              )}
            </div>
          )}
        </div>

        <ProductModal
          product={active?.product || null}
          category={active?.category}
          onClose={() => setActive(null)}
        />
      </div>
    </section>
  )
}

const productGridMotion = {
  variants: stagger(0.05, 0.05),
  initial: 'hidden',
  animate: 'show',
}