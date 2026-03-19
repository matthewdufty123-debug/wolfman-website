import path from 'path'
import { readdir, readFile } from 'fs/promises'
import matter from 'gray-matter'
import { remark } from 'remark'
import html from 'remark-html'
import { db } from '@/lib/db'
import { posts as postsTable } from '@/lib/db/schema'
import { desc } from 'drizzle-orm'

export interface PostFrontmatter {
  title: string
  date: string                           // "YYYY-MM-DD"
  category: 'morning-intention' | 'morning-walk'
  slug: string
  excerpt?: string
  image?: string                         // og:image only — never rendered on page
  videoId?: string                       // morning-walk only
  review?: string                        // Claude's review — shown at bottom of post
}

export interface PostMeta extends PostFrontmatter {
  excerpt: string                        // always present after processing
}

export interface ParsedSection {
  label: string                          // "Today's Intention" etc.
  html: string                           // rendered HTML for this section body
}

export interface ProcessedPost extends PostMeta {
  sections?: ParsedSection[]             // morning-intention: array of sections
  contextHtml?: string                   // morning-walk: context text as HTML
  bodyHtml: string                       // full rendered HTML (fallback)
}

const POSTS_DIR = path.join(process.cwd(), 'posts')

const SECTION_MAP: Record<string, string> = {
  "today's intention":      "Today's Intention",
  "i'm grateful for":       "I'm Grateful For",
  "something i'm great at": "Something I'm Great At",
}

// ── Shared processing helpers ─────────────────────────────────────────────────

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

// Converts raw markdown content + meta into a fully processed post
async function processPostContent(meta: PostMeta, content: string): Promise<ProcessedPost> {
  const bodyHtml = await markdownToHtml(content)
  const base: ProcessedPost = { ...meta, bodyHtml }

  if (meta.category === 'morning-intention') {
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
  }

  if (meta.category === 'morning-walk') {
    const contextHtml = await markdownToHtml(content)
    return { ...base, contextHtml }
  }

  return base
}

// ── Database readers ──────────────────────────────────────────────────────────

async function getDbPosts(): Promise<PostMeta[]> {
  try {
    const rows = await db
      .select()
      .from(postsTable)
      .orderBy(desc(postsTable.date))

    return rows.map(row => ({
      title:    row.title,
      date:     row.date,
      category: row.category as 'morning-intention' | 'morning-walk',
      slug:     row.slug,
      excerpt:  row.excerpt || deriveExcerpt(row.content),
      image:    row.image    ?? undefined,
      videoId:  row.videoId  ?? undefined,
      review:   row.review   ?? undefined,
    }))
  } catch {
    return []
  }
}

async function getDbPostBySlug(slug: string): Promise<ProcessedPost | null> {
  try {
    const { eq } = await import('drizzle-orm')
    const [row] = await db
      .select()
      .from(postsTable)
      .where(eq(postsTable.slug, slug))

    if (!row) return null

    const meta: PostMeta = {
      title:    row.title,
      date:     row.date,
      category: row.category as 'morning-intention' | 'morning-walk',
      slug:     row.slug,
      excerpt:  row.excerpt || deriveExcerpt(row.content),
      image:    row.image    ?? undefined,
      videoId:  row.videoId  ?? undefined,
      review:   row.review   ?? undefined,
    }

    return processPostContent(meta, row.content)
  } catch {
    return null
  }
}

async function getDbSlugs(): Promise<string[]> {
  try {
    const rows = await db.select({ slug: postsTable.slug }).from(postsTable)
    return rows.map(r => r.slug)
  } catch {
    return []
  }
}

// ── Filesystem readers ────────────────────────────────────────────────────────

async function getFsSlugs(): Promise<string[]> {
  try {
    const files = await readdir(POSTS_DIR)
    return files.filter(f => f.endsWith('.md')).map(f => f.replace(/\.md$/, ''))
  } catch {
    return []
  }
}

async function getFsPosts(): Promise<PostMeta[]> {
  let files: string[]
  try {
    files = await readdir(POSTS_DIR)
  } catch {
    return []
  }

  const mdFiles = files.filter(f => f.endsWith('.md'))
  const posts = await Promise.all(
    mdFiles.map(async (filename): Promise<PostMeta | null> => {
      try {
        const raw = await readFile(path.join(POSTS_DIR, filename), 'utf-8')
        const { data, content } = matter(raw)
        const fm = data as PostFrontmatter
        if (!fm.title || !fm.date || !fm.category || !fm.slug) return null
        return { ...fm, excerpt: fm.excerpt || deriveExcerpt(content) }
      } catch {
        return null
      }
    })
  )
  return posts.filter(Boolean) as PostMeta[]
}

async function getFsPostBySlug(slug: string): Promise<ProcessedPost | null> {
  let raw: string
  try {
    raw = await readFile(path.join(POSTS_DIR, `${slug}.md`), 'utf-8')
  } catch {
    return null
  }

  const { data, content } = matter(raw)
  const fm = data as PostFrontmatter
  if (!fm.title || !fm.date || !fm.category || !fm.slug) return null

  const meta: PostMeta = { ...fm, excerpt: fm.excerpt || deriveExcerpt(content) }
  return processPostContent(meta, content)
}

// ── Public API — DB-first, filesystem fallback ────────────────────────────────

export async function getAllPosts(): Promise<PostMeta[]> {
  const [dbPosts, fsPosts] = await Promise.all([getDbPosts(), getFsPosts()])

  // Merge: DB wins on slug conflict
  const slugsSeen = new Set<string>()
  const merged: PostMeta[] = []

  for (const post of dbPosts) {
    slugsSeen.add(post.slug)
    merged.push(post)
  }
  for (const post of fsPosts) {
    if (!slugsSeen.has(post.slug)) merged.push(post)
  }

  return merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export async function getPostBySlug(slug: string): Promise<ProcessedPost | null> {
  const dbPost = await getDbPostBySlug(slug)
  if (dbPost) return dbPost
  return getFsPostBySlug(slug)
}

export async function getAllSlugs(): Promise<string[]> {
  const [dbSlugs, fsSlugs] = await Promise.all([getDbSlugs(), getFsSlugs()])
  return [...new Set([...dbSlugs, ...fsSlugs])]
}
