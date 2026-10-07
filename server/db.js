import Database from 'better-sqlite3'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
// On Vercel the filesystem is read-only except /tmp, which resets on cold
// starts — the entry points restore the snapshot from Vercel Blob (see
// persist.js) BEFORE openDb() runs, and flush writes back after every change.
export const DB_PATH =
  process.env.DB_PATH ||
  (process.env.VERCEL === '1'
    ? path.join('/tmp', 'brown-cafe.db')
    : path.join(__dirname, 'data', 'brown-cafe.db'))

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })

export let db = null

/**
 * Open the SQLite database. Must be called (by the entry point) before any
 * query runs — entries await restore/seed first, then call openDb().
 */
export function openDb() {
  if (!db) {
    db = new Database(DB_PATH)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
  }
  return db
}

export function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS categories (
      id          INTEGER PRIMARY KEY,
      name        TEXT NOT NULL,
      description TEXT DEFAULT '',
      image       TEXT DEFAULT '',
      parent_id   INTEGER,
      sort_order  INTEGER DEFAULT 0,
      active      INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS products (
      id          INTEGER PRIMARY KEY,
      category_id INTEGER NOT NULL,
      name        TEXT NOT NULL,
      description TEXT DEFAULT '',
      price       REAL DEFAULT 0,
      image       TEXT DEFAULT '',
      sort_order  INTEGER DEFAULT 0,
      active      INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS messages (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT,
      email      TEXT,
      phone      TEXT,
      message    TEXT,
      read       INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `)
}

export function getSetting(key, fallback = '') {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key)
  return row ? row.value : fallback
}

export function setSetting(key, value) {
  db.prepare(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
  ).run(key, JSON.stringify(value))
}

export function getSettingJSON(key, fallback = null) {
  const raw = getSetting(key, null)
  if (raw === null) return fallback
  try {
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}