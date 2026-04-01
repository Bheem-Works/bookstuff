import cors from 'cors'
import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { randomUUID } from 'node:crypto'
import { fileURLToPath } from 'node:url'

import { readDb, updateDb } from './db.mjs'

export const app = express()
const port = process.env.PORT || 4000
const jwtSecret = process.env.JWT_SECRET || 'dev-secret-change-me'

app.use(cors())
app.use(express.json())

function sanitizeUser(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    avatarLabel: user.avatarLabel,
    createdAt: user.createdAt,
  }
}

function createToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      username: user.username,
    },
    jwtSecret,
    { expiresIn: '7d' },
  )
}

function normalizeIdentifier(value = '') {
  return value.trim().toLowerCase()
}

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required.' })
  }

  try {
    const token = authHeader.slice('Bearer '.length)
    const payload = jwt.verify(token, jwtSecret)
    const db = await readDb()
    const user = db.users.find((entry) => entry.id === payload.sub)

    if (!user) {
      return res.status(401).json({ message: 'User session is no longer valid.' })
    }

    req.user = user
    req.db = db
    next()
  } catch {
    return res.status(401).json({ message: 'Invalid or expired session.' })
  }
}

function validateSignupCredentials({ username, email, password }) {
  if (!username?.trim()) {
    return 'Username is required.'
  }

  if (!email?.trim() || !email.includes('@')) {
    return 'A valid email address is required.'
  }

  if (!password || password.length < 6) {
    return 'Password must be at least 6 characters.'
  }

  return null
}

function validateLoginCredentials({ identifier, password }) {
  if (!identifier?.trim()) {
    return 'Email or username is required.'
  }

  if (!password) {
    return 'Password is required.'
  }

  return null
}

function formatHistoryItem(entry, db) {
  const collection = entry.contentType === 'book' ? db.books : db.articles
  const content = collection.find((item) => item.id === entry.contentId)

  return {
    ...entry,
    contentTitle: content?.title ?? 'Unknown item',
    contentAuthor: content?.author ?? 'Unknown author',
  }
}

export async function registerUser({ username = '', email = '', password = '' }) {
  const error = validateSignupCredentials({ username, email, password })

  if (error) {
    const validationError = new Error(error)
    validationError.statusCode = 400
    throw validationError
  }

  const normalizedEmail = normalizeIdentifier(email)
  const normalizedUsername = normalizeIdentifier(username)
  const cleanUsername = username.trim()
  const passwordHash = await bcrypt.hash(password, 10)
  const user = {
    id: randomUUID(),
    username: cleanUsername,
    email: normalizedEmail,
    passwordHash,
    avatarLabel: cleanUsername.slice(0, 1).toUpperCase(),
    createdAt: new Date().toISOString(),
  }

  await updateDb((currentDb) => {
    const duplicate = currentDb.users.find(
      (entry) =>
        normalizeIdentifier(entry.email) === normalizedEmail ||
        normalizeIdentifier(entry.username) === normalizedUsername,
    )

    if (duplicate) {
      const duplicateError = new Error(
        'An account with that username or email already exists.',
      )
      duplicateError.statusCode = 409
      throw duplicateError
    }

    return {
      ...currentDb,
      users: [...currentDb.users, user],
    }
  })

  return {
    token: createToken(user),
    user: sanitizeUser(user),
  }
}

export async function authenticateUser({
  identifier = '',
  email = '',
  username = '',
  password = '',
}) {
  const loginIdentifier = identifier || email || username
  const error = validateLoginCredentials({ identifier: loginIdentifier, password })

  if (error) {
    const validationError = new Error(error)
    validationError.statusCode = 400
    throw validationError
  }

  const normalizedIdentifier = normalizeIdentifier(loginIdentifier)
  const db = await readDb()
  const user = db.users.find(
    (entry) =>
      normalizeIdentifier(entry.email) === normalizedIdentifier ||
      normalizeIdentifier(entry.username) === normalizedIdentifier,
  )

  if (!user) {
    const credentialsError = new Error('Invalid email/username or password.')
    credentialsError.statusCode = 401
    throw credentialsError
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash)

  if (!isMatch) {
    const credentialsError = new Error('Invalid email/username or password.')
    credentialsError.statusCode = 401
    throw credentialsError
  }

  return {
    token: createToken(user),
    user: sanitizeUser(user),
  }
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.post('/api/auth/signup', async (req, res) => {
  try {
    const response = await registerUser(req.body ?? {})
    return res.status(201).json(response)
  } catch (updateError) {
    if (updateError.statusCode) {
      return res
        .status(updateError.statusCode)
        .json({ message: updateError.message })
    }

    throw updateError
  }
})

app.post('/api/auth/login', async (req, res) => {
  try {
    const response = await authenticateUser(req.body ?? {})
    return res.json(response)
  } catch (loginError) {
    if (loginError.statusCode) {
      return res.status(loginError.statusCode).json({ message: loginError.message })
    }

    throw loginError
  }
})

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  const db = req.db ?? (await readDb())
  const history = db.history
    .filter((entry) => entry.userId === req.user.id)
    .sort((a, b) => new Date(b.accessedAt) - new Date(a.accessedAt))
    .map((entry) => formatHistoryItem(entry, db))

  return res.json({
    user: sanitizeUser(req.user),
    history,
  })
})

app.get('/api/books', authMiddleware, async (req, res) => {
  const db = req.db ?? (await readDb())
  res.json({
    items: db.books.map(({ content, ...book }) => ({
      ...book,
      preview: `${content.slice(0, 120)}...`,
    })),
  })
})

app.get('/api/articles', authMiddleware, async (req, res) => {
  const db = req.db ?? (await readDb())
  res.json({
    items: db.articles.map(({ content, ...article }) => ({
      ...article,
      preview: `${content.slice(0, 120)}...`,
    })),
  })
})

app.get('/api/content/:type/:id', authMiddleware, async (req, res) => {
  const { type, id } = req.params
  const db = req.db ?? (await readDb())
  const collection = type === 'book' ? db.books : type === 'article' ? db.articles : null

  if (!collection) {
    return res.status(400).json({ message: 'Unsupported content type.' })
  }

  const item = collection.find((entry) => entry.id === id)

  if (!item) {
    return res.status(404).json({ message: 'Requested content was not found.' })
  }

  const historyEntry = {
    id: randomUUID(),
    userId: req.user.id,
    contentType: type,
    contentId: id,
    accessedAt: new Date().toISOString(),
  }

  await updateDb((currentDb) => ({
    ...currentDb,
    history: [...currentDb.history, historyEntry],
  }))

  res.json({ item })
})

app.get('/api/history', authMiddleware, async (req, res) => {
  const db = req.db ?? (await readDb())
  const history = db.history
    .filter((entry) => entry.userId === req.user.id)
    .sort((a, b) => new Date(b.accessedAt) - new Date(a.accessedAt))
    .map((entry) => formatHistoryItem(entry, db))

  res.json({ items: history })
})

app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ message: 'Something went wrong on the server.' })
})

const entryPath = process.argv[1]
const isDirectRun = entryPath
  ? fileURLToPath(import.meta.url) === entryPath
  : false

if (isDirectRun) {
  app.listen(port, () => {
    console.log(`Book Stuff API listening on http://localhost:${port}`)
  })
}
