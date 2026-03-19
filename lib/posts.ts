import { remark } from 'remark'
import html from 'remark-html'
import { db } from '@/lib/db'
import { posts as postsTable } from '@/lib/db/schema'
import { desc, eq } from 'drizzle-orm'

export interface PostMeta {
  id?: string                            // DB id — present for DB posts, absent for archived filesystem posts
  slug: string
  title: string
  date: string                           // "YYYY-MM-DD"
  category: 'morning-intention' | 'morning-walk'
  excerpt: string
  image?: string                         // og:image only — never rendered on page
  videoId?: string                       // morning-walk only
  review?: string                        // Claude's review — shown at bottom of post
}

export interface ParsedSection {
  label: string                          // "Today's Intention" etc.
  html: string                           // rendered HTML for this section body
}

export interface ProcessedPost extends PostMeta {
  sections?: ParsedSection[]             // morning-intention: array of named sections
  contextHtml?: string                   // morning-walk: context text as HTML
  bodyHtml: string                       // full rendered HTML
}

const SECTION_MAP: Record<string, string> = {
  "today's intention":      "Today's Intention",
  "i'm grateful for":       "I'm Grateful For",
  "something i'm great at": "Something I'm Great At",
}

// ── Processing helpers ────────────────────────────────────────────────────────

function splitMarkdownSections(content: string): Array<{ heading: string | null; body: string }> {
  const lines = content.split('\n')
  const sections: Array<{ heading: string | null; body: string }> = []
  let current: { heading: string | null; body: string } = { heading: null, body: '' }

  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (current.body.trim() || current.heading !== null) sections.push(current)
      current = { heading: line.replace(/^##\s+/, '').trim(), body: '' }
    } else {
      current.body += line + '\n'
    }
  }
  if (current.body.trim() || current.heading !== null) sections.push(current)
  return sections
}

// Normalise text for fuzzy section-header matching:
// lowercase, strip apostrophes/special chars, collapse whitespace
function normalizeForMatch(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\u2018\u2019\u201A\u201B''`]/g, '') // fancy + straight apostrophes
    .replace(/[^a-z ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// Pre-compute normalised keys from SECTION_MAP
const INLINE_SECTION_KEYS = Object.entries(SECTION_MAP).map(([key, canonical]) => ({
  normalized: normalizeForMatch(key),
  canonical,
}))

// Try to match a line starting with "Section heading; rest of content"
// Returns { label, rest } on match, null otherwise
function matchInlineSectionHeader(line: string): { label: string; rest: string } | null {
  const semiIdx = line.indexOf(';')
  if (semiIdx === -1) return null
  const candidate = normalizeForMatch(line.slice(0, semiIdx))
  const rest = line.slice(semiIdx + 1).trim()
  for (const { normalized, canonical } of INLINE_SECTION_KEYS) {
    if (candidate === normalized) return { label: canonical, rest }
  }
  return null
}

// Parse legacy "Heading; content" inline format (paragraphs separated by blank lines)
function splitInlineSections(content: string): Array<{ heading: string; body: string }> | null {
  const paragraphs = content.split(/\n\n+/)
  const result: Array<{ heading: string; body: string }> = []
  let current: { heading: string; body: string } | null = null

  for (const para of paragraphs) {
    const trimmed = para.trim()
    if (!trimmed) continue
    const match = matchInlineSectionHeader(trimmed)
    if (match) {
      if (current) result.push(current)
      current = { heading: match.label, body: match.rest }
    } else if (current) {
      current.body += '\n\n' + trimmed
    }
    // paragraphs before any matched header are skipped (pre-content / title lines)
  }

  if (current) result.push(current)
  return result.length > 0 ? result : null
}

async function markdownToHtml(markdown: string): Promise<string> {
  const result = await remark().use(html, { sanitize: false }).process(markdown)
  return result.toString()
}

function deriveExcerpt(content: string): string {
  const firstPara = content
    .split('\n\n')
    .map(p => p.trim())
    .find(p => p && !p.startsWith('#'))
  if (!firstPara) return ''
  return firstPara
    .replace(/[*_`~]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .slice(0, 160)
}

async function processPostContent(meta: PostMeta, content: string): Promise<ProcessedPost> {
  const bodyHtml = await markdownToHtml(content)
  const base: ProcessedPost = { ...meta, bodyHtml }

  if (meta.category === 'morning-intention') {
    // Try modern ## heading format first
    const rawSections = splitMarkdownSections(content)
    const namedSections = rawSections.filter(s => s.heading !== null)
    if (namedSections.length > 0) {
      const sections: ParsedSection[] = await Promise.all(
        namedSections.map(async s => {
          const key = (s.heading ?? '').toLowerCase()
          const label = SECTION_MAP[key] ?? s.heading ?? ''
          const sectionHtml = await markdownToHtml(s.body)
          return { label, html: sectionHtml }
        })
      )
      return { ...base, sections }
    }

    // Fallback: legacy "Heading; content" inline format
    const inlineSections = splitInlineSections(content)
    if (inlineSections) {
      const sections: ParsedSection[] = await Promise.all(
        inlineSections.map(async s => ({
          label: s.heading,
          html: await markdownToHtml(s.body),
        }))
      )
      return { ...base, sections }
    }
  }

  if (meta.category === 'morning-walk') {
    return { ...base, contextHtml: await markdownToHtml(content) }
  }

  return base
}

function rowToMeta(row: typeof postsTable.$inferSelect): PostMeta {
  return {
    id:       row.id,
    slug:     row.slug,
    title:    row.title,
    date:     row.date,
    category: row.category as 'morning-intention' | 'morning-walk',
    excerpt:  row.excerpt || deriveExcerpt(row.content),
    image:    row.image    ?? undefined,
    videoId:  row.videoId  ?? undefined,
    review:   row.review   ?? undefined,
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function getAllPosts(): Promise<PostMeta[]> {
  try {
    const rows = await db.select().from(postsTable).orderBy(desc(postsTable.date))
    return rows.map(rowToMeta)
  } catch {
    return []
  }
}

export async function getPostBySlug(slug: string): Promise<ProcessedPost | null> {
  try {
    const [row] = await db.select().from(postsTable).where(eq(postsTable.slug, slug))
    if (!row) return null
    return processPostContent(rowToMeta(row), row.content)
  } catch {
    return null
  }
}

export async function getAllSlugs(): Promise<string[]> {
  try {
    const rows = await db.select({ slug: postsTable.slug }).from(postsTable)
    return rows.map(r => r.slug)
  } catch {
    return []
  }
}
