import { useEffect, useState } from 'react'
import { adminApi, isUnauthorized } from '../api.js'
import ImageInput from './ImageInput.jsx'

const emptyCat = { name: '', description: '', image: '', parent_id: null, sort_order: 0 }
const emptyProd = { name: '', description: '', price: 0, image: '', category_id: '', sort_order: 0 }

function Toggle({ on, onToggle, label }) {
  return (
    <button
      type="button"
      className={`toggle ${on ? 'on' : ''}`}
      title={label}
      aria-pressed={on}
      onClick={onToggle}
    >
      <span className="toggle-knob" />
    </button>
  )
}

export default function AdminMenu({ token, onUnauthorized }) {
  const [tree, setTree] = useState(null)
  const [version, setVersion] = useState(0)
  const [expandedCat, setExpandedCat] = useState({})
  const [expandedSub, setExpandedSub] = useState({})
  const [editingCat, setEditingCat] = useState(null)
  const [editingProd, setEditingProd] = useState(null)
  const [newSubFor, setNewSubFor] = useState(null)
  const [newProdFor, setNewProdFor] = useState(null)
  const [query, setQuery] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)

  useEffect(() => {
    let live = true
    adminApi.getMenu(token)
      .then((m) => {
        if (live) setTree(m)
      })
      .catch((e) => {
        if (live) {
          if (isUnauthorized(e)) onUnauthorized?.()
          else setError(e.message)
        }
      })
    return () => {
      live = false
    }
  }, [token, version, onUnauthorized])

  const fail = (e) => {
    if (isUnauthorized(e)) onUnauthorized?.()
    else setError(e.message)
  }

  const flash = (msg) => {
    setNotice(msg)
    setTimeout(() => setNotice(null), 2600)
  }

  const toggleExpanded = (setter, id) => setter((s) => ({ ...s, [id]: !s[id] }))

  // ---------------- category helpers ----------------
  const saveCategory = async (cat, data) => {
    setBusy(true)
    try {
      if (cat.id === 'new') {
        await adminApi.createCategory(token, { ...data, parent_id: data.parent_id || null })
      } else {
        await adminApi.updateCategory(token, cat.id, data)
      }
      setVersion((v) => v + 1)
      setEditingCat(null)
      setNewSubFor(null)
      flash('Category saved')
    } catch (e) {
      fail(e)
    } finally {
      setBusy(false)
    }
  }

  const removeCategory = async (cat) => {
    if (!window.confirm(`Delete "${cat.name}"? Empty categories only.`)) return
    try {
      await adminApi.deleteCategory(token, cat.id)
      setVersion((v) => v + 1)
      flash('Category deleted')
    } catch (e) {
      fail(e)
    }
  }

  // ---------------- product helpers ----------------
  const saveProduct = async (prod, data) => {
    setBusy(true)
    try {
      if (prod.id === 'new') {
        await adminApi.createProduct(token, { ...data, category_id: Number(data.category_id) })
      } else {
        await adminApi.updateProduct(token, prod.id, data)
      }
      setVersion((v) => v + 1)
      setEditingProd(null)
      setNewProdFor(null)
      flash('Product saved')
    } catch (e) {
      fail(e)
    } finally {
      setBusy(false)
    }
  }

  const removeProduct = async (prod) => {
    if (!window.confirm(`Delete "${prod.name}"?`)) return
    try {
      await adminApi.deleteProduct(token, prod.id)
      setVersion((v) => v + 1)
      flash('Product deleted')
    } catch (e) {
      fail(e)
    }
  }

  const toggleProductActive = async (prod) => {
    try {
      await adminApi.updateProduct(token, prod.id, { active: prod.active ? 0 : 1 })
      setVersion((v) => v + 1)
    } catch (e) {
      fail(e)
    }
  }

  const toggleCategoryActive = async (cat) => {
    try {
      await adminApi.updateCategory(token, cat.id, { active: cat.active ? 0 : 1 })
      setVersion((v) => v + 1)
    } catch (e) {
      fail(e)
    }
  }

  // ---------------- rendering ----------------
  if (!tree) return <p className="loading">Loading menu…</p>

  const q = query.trim().toLowerCase()
  const filterProd = (p) => !q || p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q)
  const filterCat = (c) => !q || c.name.toLowerCase().includes(q) || (c.products || []).some(filterProd) || (c.subcategories || []).some(fc => filterCat(fc))

  const topCats = q ? tree.filter(filterCat) : tree

  return (
    <div className="admin-pane">
      <div className="pane-head">
        <h2>Menu items</h2>
        <div className="pane-head-actions">
          <input
            className="search-inline"
            type="search"
            placeholder="Search menu…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="button" className="btn btn-primary" onClick={() => setEditingCat({ id: 'new', ...emptyCat })}>
            + New category
          </button>
        </div>
      </div>

      {notice && <p className="form-status ok">{notice}</p>}
      {error && <p className="form-status err">{error}</p>}

      {topCats.length === 0 && <p className="muted">No categories yet — create one.</p>}

      {topCats.map((top) => (
        <div className={`cat-block ${top.active ? '' : 'inactive'}`} key={top.id}>
          <div className="cat-row">
            <button type="button" className="cat-expand" onClick={() => toggleExpanded(setExpandedCat, top.id)}>
              <svg width="12" height="12" viewBox="0 0 24 24" className={expandedCat[top.id] ? 'rot' : ''}>
                <path fill="currentColor" d="M7 10l5 5 5-5z" />
              </svg>
            </button>
            <div className="cat-avatar">{top.image ? <img src={top.image} alt="" /> : <span>🍞</span>}</div>
            <div className="cat-name">
              <strong>{top.name}</strong>
              <span className="cat-meta">
                {top.active ? 'visible' : 'hidden'} · {top.subcategories.length} subcategories ·
                {top.products.length + top.subcategories.reduce((n, s) => n + s.products.length, 0)} items
              </span>
            </div>
            <Toggle on={!!top.active} onToggle={() => toggleCategoryActive(top)} label="Toggle visibility" />
            <button type="button" className="btn btn-xs" onClick={() => setEditingCat(top)}>Edit</button>
            <button type="button" className="btn btn-xs" onClick={() => setNewProdFor(top)}>+ Item</button>
            <button type="button" className="btn btn-xs" onClick={() => setNewSubFor(top)}>+ Sub</button>
            <button type="button" className="btn btn-xs btn-danger" onClick={() => removeCategory(top)}>Delete</button>
          </div>

          {editingCat && editingCat.id === top.id && (
            <CategoryEditor
              cat={top}
              token={token}
              tree={tree}
              busy={busy}
              onSave={(data) => saveCategory(top, data)}
              onCancel={() => setEditingCat(null)}
              onUnauthorized={onUnauthorized}
            />
          )}

          {newSubFor && newSubFor.id === top.id && (
            <CategoryEditor
              cat={{ id: 'new', ...emptyCat, parent_id: top.id }}
              token={token}
              tree={tree}
              isNew
              busy={busy}
              onSave={(data) => saveCategory({ id: 'new' }, data)}
              onCancel={() => setNewSubFor(null)}
              onUnauthorized={onUnauthorized}
            />
          )}

          {newProdFor && newProdFor.id === top.id && (
            <ProductEditor
              prod={{ id: 'new', ...emptyProd, category_id: top.id }}
              token={token}
              tree={tree}
              isNew
              busy={busy}
              onSave={(data) => saveProduct({ id: 'new' }, data)}
              onCancel={() => setNewProdFor(null)}
              onUnauthorized={onUnauthorized}
            />
          )}

          {expandedCat[top.id] && (
            <div className="cat-children">
              {top.products.filter(filterProd).length > 0 && (
                <div className="prod-list">
                  <ProductRows
                    prods={top.products.filter(filterProd)}
                    token={token}
                    tree={tree}
                    busy={busy}
                    editingProd={editingProd}
                    setEditingProd={setEditingProd}
                    saveProduct={saveProduct}
                    removeProduct={removeProduct}
                    toggleProductActive={toggleProductActive}
                    onUnauthorized={onUnauthorized}
                  />
                </div>
              )}
              {top.products.filter(filterProd).length === 0 && top.products.length > 0 && (
                <p className="muted small">No items.</p>
              )}
              {top.subcategories.map((sub) => {
                const prods = q ? (sub.products || []).filter(filterProd) : sub.products || []
                return (
                  <div className={`sub-block ${sub.active ? '' : 'inactive'}`} key={sub.id}>
                    <div className="cat-row sub">
                      <button type="button" className="cat-expand" onClick={() => toggleExpanded(setExpandedSub, sub.id)}>
                        <svg width="12" height="12" viewBox="0 0 24 24" className={expandedSub[sub.id] ? 'rot' : ''}>
                          <path fill="currentColor" d="M7 10l5 5 5-5z" />
                        </svg>
                      </button>
                      <div className="cat-avatar">{sub.image ? <img src={sub.image} alt="" /> : <span>🥐</span>}</div>
                      <div className="cat-name">
                        <strong>{sub.name}</strong>
                        <span className="cat-meta">{sub.active ? 'visible' : 'hidden'} · {sub.products.length} items</span>
                      </div>
                      <Toggle on={!!sub.active} onToggle={() => toggleCategoryActive(sub)} label="Toggle visibility" />
                      <button type="button" className="btn btn-xs" onClick={() => setEditingCat(sub)}>Edit</button>
                      <button type="button" className="btn btn-xs" onClick={() => setNewProdFor(sub)}>+ Item</button>
                      <button type="button" className="btn btn-xs btn-danger" onClick={() => removeCategory(sub)}>Delete</button>
                    </div>

                    {editingCat && editingCat.id === sub.id && (
                      <CategoryEditor
                        cat={sub}
                        token={token}
                        tree={tree}
                        busy={busy}
                        onSave={(data) => saveCategory(sub, data)}
                        onCancel={() => setEditingCat(null)}
                        onUnauthorized={onUnauthorized}
                      />
                    )}

                    {newProdFor && newProdFor.id === sub.id && (
                      <ProductEditor
                        prod={{ id: 'new', ...emptyProd, category_id: sub.id }}
                        token={token}
                        tree={tree}
                        isNew
                        busy={busy}
                        onSave={(data) => saveProduct({ id: 'new' }, data)}
                        onCancel={() => setNewProdFor(null)}
                        onUnauthorized={onUnauthorized}
                      />
                    )}

                    {expandedSub[sub.id] && (
                      <div className="prod-list">
                        <ProductRows
                          prods={prods}
                          token={token}
                          tree={tree}
                          busy={busy}
                          editingProd={editingProd}
                          setEditingProd={setEditingProd}
                          saveProduct={saveProduct}
                          removeProduct={removeProduct}
                          toggleProductActive={toggleProductActive}
                          onUnauthorized={onUnauthorized}
                        />
                        {prods.length === 0 && <p className="muted small">No items.</p>}
                      </div>
                    )}
                  </div>
                )
              })}
              {top.subcategories.length === 0 && <p className="muted small">No subcategories.</p>}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ---------------- editor forms ----------------
function ProductRows({ prods, token, tree, busy, editingProd, setEditingProd, saveProduct, removeProduct, toggleProductActive, onUnauthorized }) {
  return prods.map((p) => (
    <div key={p.id}>
      <div className={`prod-row ${p.active ? '' : 'inactive'}`}>
        <div className="cat-avatar">{p.image ? <img src={p.image} alt="" /> : <span>🧁</span>}</div>
        <div className="cat-name">
          <strong>{p.name}</strong>
          <span className="cat-meta">QAR {Number(p.price).toFixed(2)}{p.description ? ' · ' + p.description : ''}</span>
        </div>
        <Toggle on={!!p.active} onToggle={() => toggleProductActive(p)} label="Toggle visibility" />
        <button type="button" className="btn btn-xs" onClick={() => setEditingProd(p)}>Edit</button>
        <button type="button" className="btn btn-xs btn-danger" onClick={() => removeProduct(p)}>Delete</button>
      </div>
      {editingProd && editingProd.id === p.id && (
        <ProductEditor
          prod={p}
          token={token}
          tree={tree}
          busy={busy}
          onSave={(data) => saveProduct(p, data)}
          onCancel={() => setEditingProd(null)}
          onUnauthorized={onUnauthorized}
        />
      )}
    </div>
  ))
}

function CategoryEditor({ cat, isNew, tree, token, busy, onSave, onCancel, onUnauthorized }) {
  const [d, setD] = useState({ ...cat })
  const set = (k, v) => setD((s) => ({ ...s, [k]: v }))

  return (
    <div className="editor">
      <div className="editor-grid">
        <label className="field">
          <span className="span-label">Name</span>
          <input value={d.name} onChange={(e) => set('name', e.target.value)} autoFocus />
        </label>
        <label className="field">
          <span className="span-label">Parent category</span>
          <select value={d.parent_id || ''} onChange={(e) => set('parent_id', e.target.value ? Number(e.target.value) : null)}>
            <option value="">— top level —</option>
            {tree.filter((t) => t.id !== cat.id).map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </label>
      </div>
      <label className="field">
        <span className="span-label">Description</span>
        <textarea rows={2} value={d.description} onChange={(e) => set('description', e.target.value)} />
      </label>
      <ImageInput label="Category image" token={token} value={d.image} onChange={(v) => set('image', v)} onUnauthorized={onUnauthorized} />
      <div className="editor-actions">
        <button type="button" className="btn btn-primary" disabled={busy || !d.name.trim()} onClick={() => onSave(d)}>
          {isNew ? 'Create category' : 'Save category'}
        </button>
        <button type="button" className="btn btn-outline" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}

function ProductEditor({ prod, isNew, tree, token, busy, onSave, onCancel, onUnauthorized }) {
  const [d, setD] = useState({ ...prod, category_id: prod.category_id || '' })
  const set = (k, v) => setD((s) => ({ ...s, [k]: v }))

  const options = []
  for (const top of tree) {
    const subs = top.subcategories || []
    options.push(
      <optgroup key={top.id} label={top.name}>
        <option value={top.id}>{top.name}</option>
        {subs.map((s) => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </optgroup>,
    )
  }

  return (
    <div className="editor">
      <div className="editor-grid">
        <label className="field">
          <span className="span-label">Name</span>
          <input value={d.name} onChange={(e) => set('name', e.target.value)} autoFocus />
        </label>
        <label className="field">
          <span className="span-label">Category</span>
          <select value={d.category_id || ''} onChange={(e) => set('category_id', e.target.value)}>
            <option value="">— select category —</option>
            {options}
          </select>
        </label>
        <label className="field">
          <span className="span-label">Price (QAR)</span>
          <input type="number" step="0.01" min="0" value={d.price} onChange={(e) => set('price', e.target.value)} />
        </label>
        <label className="field">
          <span className="span-label">Sort order</span>
          <input type="number" value={d.sort_order} onChange={(e) => set('sort_order', e.target.value)} />
        </label>
      </div>
      <label className="field">
        <span className="span-label">Description</span>
        <textarea rows={2} value={d.description} onChange={(e) => set('description', e.target.value)} />
      </label>
      <ImageInput label="Product image" token={token} value={d.image} onChange={(v) => set('image', v)} onUnauthorized={onUnauthorized} />
      <div className="editor-actions">
        <button type="button" className="btn btn-primary" disabled={busy || !d.name.trim() || !d.category_id} onClick={() => onSave(d)}>
          {isNew ? 'Create item' : 'Save item'}
        </button>
        <button type="button" className="btn btn-outline" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}