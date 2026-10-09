/**
 * Vercel Blob persistence — keeps the SQLite DB and uploaded images alive
 * across deploys and cold starts.
 *
 * On Vercel the filesystem is read-only except /tmp, and /tmp is wiped on
 * every deploy/cold start. So we:
 *   - restore the DB snapshot from a PRIVATE Blob store before SQLite opens
 *   - flush the DB file back (debounced + serialized) after every write
 *   - store uploaded images in a PUBLIC Blob store (permanent URLs)
 *
 * Local dev never touches Blob: DB in server/data, uploads in server/uploads.
 */
import { get, put } from '@vercel/blob'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export const isVercel = process.env.VERCEL === '1'

const DB_PATHNAME = 'data/rusk.db'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function authFor(kind) {
  const auth = {}
  const storeId =
    kind === 'data'
      ? process.env.BLOB_DATA_STORE_ID || process.env.BLOB_STORE_ID
      : process.env.BLOB_UPLOADS_STORE_ID
  const token = kind === 'data' ? process.env.BLOB_DATA_TOKEN : process.env.BLOB_UPLOADS_TOKEN
  if (storeId) auth.storeId = storeId
  if (token) auth.token = token
  return auth
}

/** true when a data store is configured — otherwise Blob calls would fail */
export function canPersist() {
  return Boolean(
    isVercel &&
      (process.env.BLOB_DATA_STORE_ID ||
        process.env.BLOB_STORE_ID ||
        process.env.BLOB_DATA_TOKEN ||
        process.env.BLOB_READ_WRITE_TOKEN),
  )
}

export function canUploadToBlob() {
  return Boolean(
    isVercel &&
      (process.env.BLOB_UPLOADS_STORE_ID ||
        process.env.BLOB_UPLOADS_TOKEN ||
        process.env.BLOB_READ_WRITE_TOKEN),
  )
}

/**
 * Download the DB snapshot into dbPath BEFORE SQLite opens it.
 * Returns 'restored' | 'missing'. Never throws — on failure the caller
 * falls back to the bundled/seeded database so the site stays operational.
 */
export async function restoreDb(dbPath) {
  if (!canPersist()) return 'missing'
  try {
    const res = await get(DB_PATHNAME, { access: 'private', useCache: false, ...authFor('data') })
    if (!res || res.statusCode !== 200 || !res.stream) return 'missing'
    const buf = Buffer.from(await new Response(res.stream).arrayBuffer())
    fs.mkdirSync(path.dirname(dbPath), { recursive: true })
    fs.writeFileSync(dbPath, buf)
    console.log(`[persist] restored DB snapshot from Blob (${buf.length} bytes)`)
    return 'restored'
  } catch (err) {
    console.error('[persist] DB restore failed:', err.message)
    return 'missing'
  }
}

/**
 * First boot with no Blob snapshot: ship the repo-tracked database
 * (server/data/rusk.db) so production starts from the local content.
 * Returns true when a file ended up at dbPath.
 */
export function seedFromBundledDb(dbPath) {
  try {
    if (fs.existsSync(dbPath) && fs.statSync(dbPath).size > 0) return true
    const bundled = path.join(__dirname, 'data', 'rusk.db')
    if (!fs.existsSync(bundled)) return false
    fs.mkdirSync(path.dirname(dbPath), { recursive: true })
    fs.copyFileSync(bundled, dbPath)
    console.log('[persist] first boot: copied bundled server/data/rusk.db')
    return true
  } catch (err) {
    console.error('[persist] bundled DB copy failed:', err.message)
    return false
  }
}

/**
 * One-shot restore flow used by the function entry. Never throws.
 * Order matters: the file must exist before better-sqlite3 opens it.
 */
export async function prepareDb(dbPath) {
  if (!isVercel) return
  const restored = await restoreDb(dbPath)
  if (restored !== 'restored') seedFromBundledDb(dbPath)
}

/**
 * Immediate, awaited flush — used on the request path so a mutation's
 * response is only sent AFTER the snapshot is safely in Blob (a fire-and-
 * forget flush can be killed if the serverless instance goes idle first).
 * Falls back to the retrying scheduleFlush() on failure.
 */
export async function flushNow(db, dbPath) {
  if (!canPersist()) return
  try {
    db.pragma('wal_checkpoint(TRUNCATE)')
    const buf = await fs.promises.readFile(dbPath)
    await put(DB_PATHNAME, buf, {
      access: 'private',
      allowOverwrite: true,
      addRandomSuffix: false,
      contentType: 'application/octet-stream',
      ...authFor('data'),
    })
    queued = false
    console.log(`[persist] DB snapshot flushed (${buf.length} bytes)`)
    return true
  } catch (err) {
    console.error('[persist] flush failed:', err.message)
    scheduleFlush(db, dbPath)
    return false
  }
}

/**
 * Flush the SQLite file back to Blob. Serialized: writes that land while a
 * flush is running trigger exactly one more run afterwards.
 * Retries up to 3 times with a 3s delay, then gives up until the next write.
 */
export function scheduleFlush(db, dbPath) {
  if (!canPersist()) return
  queued = true
  if (!running) void runFlush(db, dbPath)
}

let queued = false
let running = false

async function runFlush(db, dbPath) {
  if (running) return
  running = true
  let failures = 0
  try {
    while (queued) {
      queued = false
      try {
        db.pragma('wal_checkpoint(TRUNCATE)')
        const buf = await fs.promises.readFile(dbPath)
        await put(DB_PATHNAME, buf, {
          access: 'private',
          allowOverwrite: true,
          addRandomSuffix: false,
          contentType: 'application/octet-stream',
          ...authFor('data'),
        })
        failures = 0
        console.log(`[persist] DB snapshot flushed (${buf.length} bytes)`)
      } catch (err) {
        failures += 1
        console.error(`[persist] flush attempt ${failures}/3 failed:`, err.message)
        queued = failures < 3
        if (queued) await sleep(3000)
      }
    }
  } finally {
    running = false
  }
}

/** Upload an image to the PUBLIC store; returns its permanent absolute URL. */
export async function uploadImage(buffer, originalName, contentType) {
  const clean = path.basename(originalName).replace(/[^a-zA-Z0-9._-]/g, '-')
  const blob = await put(`uploads/${Date.now()}-${clean}`, buffer, {
    access: 'public',
    addRandomSuffix: true,
    contentType,
    ...authFor('uploads'),
  })
  return blob.url
}
