import { openDb } from './db.js'

openDb()
const { default: app } = await import('./app.js')

const PORT = process.env.PORT || 4000

app.listen(PORT, () => {
  console.log(`Rusk API  →  http://localhost:${PORT}`)
  console.log(`Admin password   →  ${process.env.ADMIN_PASSWORD ? '(from ADMIN_PASSWORD env)' : 'RuskAdmin (default)'}`)
  console.log(`Docs: run "npm run seed" to (re)load the Brown menu.`)
})
