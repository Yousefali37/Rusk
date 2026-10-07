/**
 * Vercel Serverless Function — entry point for /api/* and /uploads/* rewrites.
 *
 * On every cold boot we restore the SQLite snapshot from Vercel Blob (private
 * store) before opening the database, so admin edits, menu changes and
 * contact messages survive deploys and cold starts. Fallback order when no
 * snapshot exists yet: repo-tracked server/data DB → JSON seed.
 */
import { prepareDb } from '../server/persist.js'
import { DB_PATH, openDb } from '../server/db.js'

let appPromise = null

async function boot() {
  await prepareDb(DB_PATH)
  openDb()
  const { default: app } = await import('../server/app.js')
  return app
}

export default function handler(req, res) {
  if (!appPromise) {
    appPromise = boot().catch((err) => {
      console.error('[boot] failed:', err)
      appPromise = null
      throw err
    })
  }
  return appPromise.then((app) => app(req, res))
}
