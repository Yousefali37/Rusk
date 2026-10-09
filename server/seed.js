/**
 * CLI seeder — re-seeds the database from server/seed-data/rusk-menu.json.
 *
 * Usage:
 *   node server/seed.js            # skip if already seeded
 *   node server/seed.js --force    # drop + reseed
 */
import { loadMenuData, populate } from './seedData.js'
import { db, initSchema, openDb } from './db.js'

openDb()

const force = process.argv.includes('--force')

if (force) {
  db.exec('DROP TABLE IF EXISTS messages; DROP TABLE IF EXISTS products; DROP TABLE IF EXISTS categories; DROP TABLE IF EXISTS settings;')
}

initSchema()

const catCount = db.prepare('SELECT COUNT(*) AS n FROM categories').get().n
if (catCount > 0 && !force) {
  console.log(`Database already has ${catCount} categories. Run with --force to reseed.`)
  process.exit(0)
}

const stats = populate(loadMenuData())
console.log(
  `Seeded "Rusk": ${stats.categories} categories, ${stats.products} products, ${stats.gallery} gallery items.`,
  `Today's item: "${stats.today ?? 'none'}"`,
)
console.log(`Reseed any time with: node server/seed.js --force`)