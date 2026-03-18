import path from 'path'
import { readdir, readFile } from 'fs/promises'
import matter from 'gray-matter'
import { remark } from 'remark'
import html from 'remark-html'

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

// Split markdown at ## headings into labelled sections
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

// Convert markdown string to HTML string via remark
async function markdownToHtml(markdown: string): Promise<string> {
  const result = await remark().use(html, { sanitize: false }).process(markdown)
  return result.toString()
}

// Auto-generate excerpt from first non-heading paragraph (max 160 chars)
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

export async function getAllPosts(): Promise<PostMeta[]> {
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

        const excerpt = fm.excerpt || deriveExcerpt(content)

        return { ...fm, excerpt }
      } catch {
        return null
      }
    })
  )

  return (posts.filter(Boolean) as PostMeta[]).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )
}

export async function getPostBySlug(slug: string): Promise<ProcessedPost | null> {
  const filename = `${slug}.md`
  let raw: string
  try {
    raw = await readFile(path.join(POSTS_DIR, filename), 'utf-8')
  } catch {
    return null
  }

  const { data, content } = matter(raw)
  const fm = data as PostFrontmatter

  if (!fm.title || !fm.date || !fm.category || !fm.slug) return null

  const excerpt = fm.excerpt || deriveExcerpt(content)
  const bodyHtml = await markdownToHtml(content)

  const base: ProcessedPost = { ...fm, excerpt, bodyHtml }

  if (fm.category === 'morning-intention') {
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

  if (fm.category === 'morning-walk') {
    const contextHtml = await markdownToHtml(content)
    return { ...base, contextHtml }
  }

  return base
}

export async function getAllSlugs(): Promise<string[]> {
  let files: string[]
  try {
    files = await readdir(POSTS_DIR)
  } catch {
    return []
  }
  return files
    .filter(f => f.endsWith('.md'))
    .map(f => f.replace(/\.md$/, ''))
}
