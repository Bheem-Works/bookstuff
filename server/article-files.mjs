import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const articleDirectory = path.join(__dirname, '..', 'src', 'articles')

const articleOverrides = {
  'hometownchacha.txt': {
    id: 'article-hometown-cha-cha-cha',
    title: 'Hometown Cha-Cha-Cha',
    author: 'Community Reflection',
    topic: 'K-Drama',
    description:
      'A heartfelt reflection on kindness, self-love, fate, and the quiet beauty of village life.',
  },
}

function normalizeText(rawContent = '') {
  return rawContent
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .trim()
}

function titleFromFilename(filename) {
  return filename
    .replace(/\.txt$/i, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase())
}

function isLikelyHeading(line, fallbackTitle) {
  if (!line) {
    return false
  }

  const normalize = (value) => value.replace(/[^a-z0-9]/gi, '').toLowerCase()
  const normalizedLine = normalize(line)
  const normalizedFallback = normalize(fallbackTitle)

  return normalizedLine === normalizedFallback || line === line.toUpperCase()
}

function extractTitleAndContent(filename, rawContent) {
  const fallbackTitle = titleFromFilename(filename)
  const content = normalizeText(rawContent)

  if (!content) {
    return {
      title: fallbackTitle,
      content: '',
    }
  }

  const lines = content.split('\n')
  const firstNonEmptyLine = lines.find((line) => line.trim())

  if (firstNonEmptyLine && isLikelyHeading(firstNonEmptyLine.trim(), fallbackTitle)) {
    const title = articleOverrides[filename]?.title ?? titleFromFilename(firstNonEmptyLine)
    const headingIndex = lines.indexOf(firstNonEmptyLine)
    const body = lines.slice(headingIndex + 1).join('\n').trim()

    return {
      title,
      content: body,
    }
  }

  return {
    title: articleOverrides[filename]?.title ?? fallbackTitle,
    content,
  }
}

function createSummary(content, fallbackDescription) {
  if (fallbackDescription) {
    return fallbackDescription
  }

  const firstParagraph = content.split(/\n{2,}/).find((block) => block.trim()) ?? ''
  const condensed = firstParagraph.replace(/\s+/g, ' ').trim()

  if (!condensed) {
    return 'A text article from the local articles folder.'
  }

  return condensed.length > 140 ? `${condensed.slice(0, 137)}...` : condensed
}

export async function readFileArticles() {
  try {
    const entries = await readdir(articleDirectory, { withFileTypes: true })
    const textFiles = entries.filter((entry) => entry.isFile() && entry.name.endsWith('.txt'))

    const articles = await Promise.all(
      textFiles.map(async (entry) => {
        const rawContent = await readFile(path.join(articleDirectory, entry.name), 'utf8')
        const override = articleOverrides[entry.name] ?? {}
        const { title, content } = extractTitleAndContent(entry.name, rawContent)
        const summary = createSummary(content, override.description)

        return {
          id: override.id ?? `article-${entry.name.replace(/\.txt$/i, '')}`,
          title,
          author: override.author ?? 'Book Stuff Community',
          topic: override.topic ?? 'Reflection',
          description: override.description ?? summary,
          summary,
          content,
          source: entry.name,
        }
      }),
    )

    return articles.sort((left, right) => left.title.localeCompare(right.title))
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return []
    }

    throw error
  }
}
