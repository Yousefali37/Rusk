import crypto from 'node:crypto'

const PASSWORD =
  process.env.ADMIN_PASSWORD || 'RuskAdmin'

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 32).toString('hex')
  return `${salt}:${hash}`
}

const PASSWORD_HASH = hashPassword(PASSWORD)

export function verifyPassword(password) {
  const [salt, hash] = PASSWORD_HASH.split(':')
  const candidate = crypto.scryptSync(password, salt, 32).toString('hex')
  const a = Buffer.from(hash, 'hex')
  const b = Buffer.from(candidate, 'hex')
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

export function createSession() {
  return crypto.createHash('sha256').update(PASSWORD).digest('hex')
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  const expected = Buffer.from(createSession(), 'hex')
  const given = Buffer.from(token, 'hex')
  if (given.length !== expected.length || !crypto.timingSafeEqual(expected, given)) {
    return res.status(401).json({ error: 'Unauthorized. Log in to continue.' })
  }
  next()
}