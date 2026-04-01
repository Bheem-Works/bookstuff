import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { defaultDb } from './default-data.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dataDir = path.join(__dirname, 'data')
const dbPath = path.join(dataDir, 'db.json')

let writeQueue = Promise.resolve()

async function ensureDbFile() {
  await mkdir(dataDir, { recursive: true })

  try {
    await access(dbPath)
  } catch {
    await writeFile(dbPath, JSON.stringify(defaultDb, null, 2), 'utf8')
  }
}

export async function readDb() {
  await ensureDbFile()
  const raw = await readFile(dbPath, 'utf8')
  return JSON.parse(raw)
}

export async function writeDb(nextDb) {
  await ensureDbFile()

  writeQueue = writeQueue.then(() =>
    writeFile(dbPath, JSON.stringify(nextDb, null, 2), 'utf8'),
  )

  return writeQueue
}

// Centralized helper keeps read/modify/write operations serialized.
export async function updateDb(updater) {
  writeQueue = writeQueue.then(async () => {
    await ensureDbFile()
    const raw = await readFile(dbPath, 'utf8')
    const current = JSON.parse(raw)
    const nextDb = await updater(current)

    await writeFile(dbPath, JSON.stringify(nextDb, null, 2), 'utf8')
    return nextDb
  })

  return writeQueue
}
