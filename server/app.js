import express from 'express'
import multer from 'multer'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { ensureSeeded } from './seedData.js'
import { publicRouter, adminRouter } from './routes.js'
import { db, DB_PATH } from './db.js'
import { isVercel, flushNow, canUploadToBlob, uploadImage } from './persist.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app = express()
app.disable('x-powered-by')
app.use(express.json({ limit: '2mb' }))

// ---------- persistence: DB snapshot is flushed into Blob BEFORE the
// response is sent, so a successful write can never be lost to an idle
// serverless instance. (No-op locally / without a Blob store; uploads and
// logins don't change the database so they're excluded.)
app.use('/api', (req, res, next) => {
  if (req.method === 'GET' || req.method === 'HEAD') return next()
  if (req.path === '/admin/upload' || req.path === '/admin/login') return next()
  const sendJson = res.json.bind(res)
  res.json = (body) => {
    const flush = res.statusCode < 300 ? flushNow(db, DB_PATH) : Promise.resolve()
    return flush.finally(() => sendJson(body))
  }
  next()
})

// ---------- seed on cold start (no-op when data is present) ----------
// prepareDb() (see persist.js) has already restored/copied the DB file by
// the time we get here — this only seeds when there is no data at all.
if (isVercel) {
  try {
    const stats = ensureSeeded()
    if (stats)
      console.log(
        `[cold start] Seeded ${stats.categories} categories, ${stats.products} products from JSON seed.`,
      )
  } catch (err) {
    console.error('[cold start] seed failed:', err.message)
  }
}

// ---------- uploads ----------
const UPLOAD_DIR =
  process.env.UPLOAD_DIR ||
  (process.env.VERCEL === '1' ? path.join('/tmp', 'uploads') : path.join(__dirname, 'uploads'))
fs.mkdirSync(UPLOAD_DIR, { recursive: true })

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const clean = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '-')
    cb(null, `${Date.now()}-${clean}`)
  },
})
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, /^image\//.test(file.mimetype)),
})

app.post('/api/admin/upload', adminRouter, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image uploaded.' })
  if (canUploadToBlob()) {
    try {
      const buf = await fs.promises.readFile(req.file.path)
      const url = await uploadImage(buf, req.file.originalname, req.file.mimetype)
      fs.promises.unlink(req.file.path).catch(() => {})
      return res.status(201).json({ url })
    } catch (err) {
      console.error('[persist] Blob upload failed, falling back to disk:', err.message)
    }
  }
  res.status(201).json({ url: `/uploads/${req.file.filename}` })
})

app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d' }))

// ---------- API ----------
app.use('/api', publicRouter)
app.use('/api/admin', adminRouter)

// ---------- static frontend (local production) ----------
// On Vercel the static files are served by Vercel's CDN, not this app.
const distDir = path.join(__dirname, '..', 'dist')
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir))
  app.use((req, res, next) => {
    if (req.method !== 'GET') return next()
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads') || req.path.startsWith('/images'))
      return next()
    res.sendFile(path.join(distDir, 'index.html'))
  })
}

// ---------- imagery (/images → public/images; on Vercel served from dist) ----------
const publicImages = path.join(__dirname, '..', 'public', 'images')
if (fs.existsSync(publicImages)) {
  app.use('/images', express.static(publicImages, { maxAge: '7d' }))
}

app.use((req, res) => res.status(404).json({ error: 'Not found' }))

export default app