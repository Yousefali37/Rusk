import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { EASE } from '../motion.js'
import '../product-modal.css'

export default function ProductModal({ product, category, onClose }) {
  const closeRef = useRef(null)

  useEffect(() => {
    if (!product) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [product, onClose])

  return (
    <AnimatePresence>
      {product && (
        <motion.div
          className="product-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="product-modal-card"
            role="dialog"
            aria-modal="true"
            aria-label={product.name}
            initial={{ scale: 0.94, y: 18, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, y: 10, opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              ref={closeRef}
              type="button"
              className="product-modal-close"
              aria-label="Close"
              onClick={onClose}
            >
              ×
            </button>
            <div className="product-modal-media">
              {product.image ? (
                <img src={product.image} alt={product.name} />
              ) : (
                <div className="product-modal-fallback">
                  <span className="brand-mark lg">
                    <span>B</span>
                  </span>
                </div>
              )}
            </div>
            <div className="product-modal-body">
              {category ? <span className="product-modal-cat">{category}</span> : null}
              <h3 className="product-modal-title">{product.name}</h3>
              {product.description ? (
                <p className="product-modal-desc">{product.description}</p>
              ) : (
                <p className="product-modal-desc muted">Made fresh at Brown Cafe in West Walk, Qatar.</p>
              )}
              <p className="product-modal-price">
                {product.price > 0 ? `QAR ${Number(product.price).toFixed(2)}` : 'Price on request'}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}