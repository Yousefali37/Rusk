import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { getSiteData } from '../api.js'
import Preloader from './Preloader.jsx'
import CustomCursor from './CustomCursor.jsx'
import Header from './components/Header.jsx'
import Hero from './components/Hero.jsx'
import TodaysMenu from './components/TodaysMenu.jsx'
import MenuSection from './components/MenuSection.jsx'
import InstagramFeed from './components/InstagramFeed.jsx'
import Contact from './components/Contact.jsx'
import Footer from './components/Footer.jsx'
import './site.css'

export default function PublicSite() {
  const [site, setSite] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(() => {
    try {
      return sessionStorage.getItem('brown-preloaded') !== '1'
    } catch {
      return true
    }
  })
  const [selection, setSelection] = useState({ topId: null, subId: null }) // tree selection (both null = full menu)
  const [focusId, setFocusId] = useState(null) // product id to highlight
  const [search, setSearch] = useState('')
  const defaultApplied = useRef(false)

  useEffect(() => {
    getSiteData()
      .then((data) => {
        setSite(data)
        if (!defaultApplied.current) {
          defaultApplied.current = true
          const first = (data.menu || [])[0]
          if (first) setSelection({ topId: first.id, subId: null })
        }
      })
      .catch((e) => {
        setError(e.message)
        setLoading(false)
      })
  }, [])

  // lock scroll while the preloader is showing
  useEffect(() => {
    if (loading) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [loading])

  useEffect(() => {
    if (!focusId) return
    const t = setTimeout(() => setFocusId(null), 4200)
    return () => clearTimeout(t)
  }, [focusId])

  const finishLoad = useCallback(() => {
    try {
      sessionStorage.setItem('brown-preloaded', '1')
    } catch {
      /* ignore */
    }
    setLoading(false)
  }, [])

  if (error) {
    return (
      <div className="boot-error">
        <h1>Cannot load the site</h1>
        <p>{error}</p>
        <p className="hint">Make sure the API server is running on port 4000, then refresh.</p>
      </div>
    )
  }

  if (!site) {
    return (
      <div className="boot-loading">
        <div className="boot-logo">
          <img src="/logo.webp" alt="Brown Cafe" />
        </div>
        <p>Setting the table…</p>
      </div>
    )
  }

  const findOnMenu = () => {
    setSearch('')
    const p = site.today_product
    if (p) {
      setFocusId(p.id)
      let found = false
      for (const top of site.menu || []) {
        if (top.id === p.category_id) {
          setSelection({ topId: top.id, subId: null })
          found = true
          break
        }
        const sub = (top.subcategories || []).find((s) => s.id === p.category_id)
        if (sub) {
          setSelection({ topId: top.id, subId: sub.id })
          found = true
          break
        }
      }
      if (!found) setSelection({ topId: null, subId: null })
    }
    const target = document.getElementById('menu')
    if (window.location.hash === '#menu') {
      target?.scrollIntoView({ behavior: 'smooth' })
    } else {
      window.location.hash = 'menu'
    }
  }

  return (
    <>
      <AnimatePresence>{loading && <Preloader onDone={finishLoad} />}</AnimatePresence>

      <CustomCursor />

      {!loading && (
        <div className="site">
          <Header site={site} />
          <main>
            <Hero site={site} />
            <TodaysMenu site={site} onFind={() => findOnMenu()} />
            <MenuSection
              site={site}
              selection={selection}
              focusId={focusId}
              search={search}
              onSearchChange={setSearch}
              onSelect={setSelection}
            />
            <InstagramFeed site={site} />
            <Contact site={site} />
          </main>
          <Footer site={site} />
        </div>
      )}
    </>
  )
}