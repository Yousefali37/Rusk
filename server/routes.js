import { Router } from 'express'
import { db, getSetting, getSettingJSON, setSetting } from './db.js'
import { verifyPassword, createSession, requireAuth } from './auth.js'

export const publicRouter = Router()
export const adminRouter = Router()

const FULL_SETTING_KEYS = [
  'site_name',
  'logo',
  'hero_image',
  'hero_title',
  'hero_subtitle',
  'today_badge',
  'today_product_id',
  'gallery',
  'insta_eyebrow',
  'insta_heading',
  'insta_subtitle',
  'insta_posts',
  'contact_address',
  'contact_phone',
  'contact_email',
  'contact_hours',
  'contact_map',
  'social_instagram',
  'social_tiktok',
  'social_linktree',
  'social_talabat',
  'snoonu',
  'rafeeq',
  'footer_text',
  'footer_background',
]

function readSettings() {
  const out = {}
  for (const key of FULL_SETTING_KEYS) {
    out[key] = getSettingJSON(key, getSetting(key, ''))
  }
  return out
}

function getTodayProduct(id) {
  if (!id) return null
  return (
    db
      .prepare(
        `SELECT p.*, c.name AS category_name FROM products p
         JOIN categories c ON c.id = p.category_id
         WHERE p.id = ? LIMIT 1`,
      )
      .get(id) || null
  )
}

function buildMenu({ includeInactive = false } = {}) {
  const whereCat = includeInactive ? '' : 'WHERE c.active = 1'
  const whereProd = includeInactive ? '' : 'AND p.active = 1'
  const categories = db
    .prepare(`SELECT * FROM categories c ${whereCat} ORDER BY c.parent_id IS NOT NULL, c.sort_order, c.name`)
    .all()
  const products = db
    .prepare(
      `SELECT p.* FROM products p
       JOIN categories c ON c.id = p.category_id
       WHERE 1=1 ${whereProd}
       ORDER BY p.sort_order, p.name`,
    )
    .all()

  const node = (c) => ({ ...c, subcategories: [], products: [] })
  const byId = new Map()
  const roots = []
  for (const c of categories) byId.set(c.id, node(c))
  for (const c of categories) {
    const n = byId.get(c.id)
    const parent = byId.get(c.parent_id)
    if (parent) parent.subcategories.push(n)
    else roots.push(n)
  }
  for (const p of products) {
    const parent = byId.get(p.category_id)
    if (parent) parent.products.push(p)
  }
  return roots
}

// ---------------- public ----------------

publicRouter.get('/site', (req, res) => {
  const settings = readSettings()
  const today = getTodayProduct(Number(settings.today_product_id) || null)
  res.json({
    ...settings,
    today_product: today,
    menu: buildMenu(),
  })
})

publicRouter.post('/messages', (req, res) => {
  const { name, email, phone, message } = req.body || {}
  if (!name?.trim() || !message?.trim()) {
    return res.status(400).json({ error: 'Name and message are required.' })
  }
  const info = db
    .prepare('INSERT INTO messages (name, email, phone, message) VALUES (?, ?, ?, ?)')
    .run(String(name).slice(0, 200), String(email || '').slice(0, 200), String(phone || '').slice(0, 100), String(message).slice(0, 5000))
  res.status(201).json({ ok: true, id: info.lastInsertRowid })
})

// ---------------- admin ----------------

adminRouter.post('/login', (req, res) => {
  const { password } = req.body || {}
  if (!password || !verifyPassword(password)) {
    return res.status(401).json({ error: 'Incorrect password.' })
  }
  res.json({ token: createSession() })
})

adminRouter.get('/site', requireAuth, (req, res) => {
  res.json(readSettings())
})

adminRouter.put('/site', requireAuth, (req, res) => {
  const body = req.body || {}
  for (const key of FULL_SETTING_KEYS) {
    if (key in body) setSetting(key, body[key])
  }
  res.json({ ok: true })
})

adminRouter.get('/menu', requireAuth, (req, res) => {
  res.json(buildMenu({ includeInactive: true }))
})

adminRouter.post('/categories', requireAuth, (req, res) => {
  const { name, description, image, parent_id, sort_order, active } = req.body || {}
  if (!name?.trim()) return res.status(400).json({ error: 'Category name is required.' })
  const info = db
    .prepare('INSERT INTO categories (name, description, image, parent_id, sort_order, active) VALUES (@name, @description, @image, @parent_id, @sort_order, @active)')
    .run({
      name: String(name).slice(0, 200),
      description: String(description || '').slice(0, 2000),
      image: image || '',
      parent_id: parent_id || null,
      sort_order: Number(sort_order) || 0,
      active: active === false ? 0 : 1,
    })
  res.status(201).json({ ok: true, id: info.lastInsertRowid })
})

adminRouter.put('/categories/:id', requireAuth, (req, res) => {
  const { name, description, image, parent_id, sort_order, active } = req.body || {}
  const cur = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id)
  if (!cur) return res.status(404).json({ error: 'Category not found.' })
  db.prepare('UPDATE categories SET name = ?, description = ?, image = ?, parent_id = ?, sort_order = ?, active = ? WHERE id = ?').run(
    name !== undefined ? String(name).slice(0, 200) : cur.name,
    description !== undefined ? String(description).slice(0, 2000) : cur.description,
    image !== undefined ? image : cur.image,
    parent_id !== undefined ? parent_id : cur.parent_id,
    sort_order !== undefined ? Number(sort_order) : cur.sort_order,
    active !== undefined ? (active ? 1 : 0) : cur.active,
    req.params.id,
  )
  res.json({ ok: true })
})

adminRouter.delete('/categories/:id', requireAuth, (req, res) => {
  const subs = db.prepare('SELECT COUNT(*) AS n FROM categories WHERE parent_id = ?').get(req.params.id).n
  if (subs > 0) return res.status(400).json({ error: 'Delete its subcategories and products first.' })
  const prods = db.prepare('SELECT COUNT(*) AS n FROM products WHERE category_id = ?').get(req.params.id).n
  if (prods > 0) return res.status(400).json({ error: 'This category still has products.' })
  db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

adminRouter.post('/products', requireAuth, (req, res) => {
  const { category_id, name, description, price, image, sort_order, active } = req.body || {}
  if (!name?.trim() || !category_id) return res.status(400).json({ error: 'Product name and category are required.' })
  const info = db
    .prepare('INSERT INTO products (category_id, name, description, price, image, sort_order, active) VALUES (@category_id, @name, @description, @price, @image, @sort_order, @active)')
    .run({
      category_id: Number(category_id),
      name: String(name).slice(0, 200),
      description: String(description || '').slice(0, 2000),
      price: Number(price) || 0,
      image: image || '',
      sort_order: Number(sort_order) || 0,
      active: active === false ? 0 : 1,
    })
  res.status(201).json({ ok: true, id: info.lastInsertRowid })
})

adminRouter.put('/products/:id', requireAuth, (req, res) => {
  const { category_id, name, description, price, image, sort_order, active } = req.body || {}
  const cur = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id)
  if (!cur) return res.status(404).json({ error: 'Product not found.' })
  db.prepare('UPDATE products SET category_id = ?, name = ?, description = ?, price = ?, image = ?, sort_order = ?, active = ? WHERE id = ?').run(
    category_id !== undefined ? Number(category_id) : cur.category_id,
    name !== undefined ? String(name).slice(0, 200) : cur.name,
    description !== undefined ? String(description).slice(0, 2000) : cur.description,
    price !== undefined ? Number(price) : cur.price,
    image !== undefined ? image : cur.image,
    sort_order !== undefined ? Number(sort_order) : cur.sort_order,
    active !== undefined ? (active ? 1 : 0) : cur.active,
    req.params.id,
  )
  res.json({ ok: true })
})

adminRouter.delete('/products/:id', requireAuth, (req, res) => {
  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

adminRouter.get('/messages', requireAuth, (req, res) => {
  res.json(db.prepare('SELECT * FROM messages ORDER BY id DESC').all())
})

adminRouter.put('/messages/:id/read', requireAuth, (req, res) => {
  db.prepare('UPDATE messages SET read = 1 WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

adminRouter.delete('/messages/:id', requireAuth, (req, res) => {
  db.prepare('DELETE FROM messages WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})