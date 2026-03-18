'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

const REPO = 'matthewdufty123-debug/wolfman-website'
const API = 'https://api.github.com'

const DEFAULT_INTENTION_TITLE = "Wolfman's Morning Message"

function titleToSlug(t: string) {
  return t.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

function extractYoutubeId(url: string): string | null {
  const patterns = [
    /[?&]v=([^&#]+)/,
    /youtu\.be\/([^?&#]+)/,
    /\/embed\/([^?&#]+)/,
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m) return m[1]
  }
  return null
}

function toBase64(str: string): string {
  return btoa(unescape(encodeURIComponent(str)))
}

function fromBase64(b64: string): string {
  return decodeURIComponent(escape(atob(b64)))
}

function buildFrontmatter(fields: {
  title: string
  date: string
  category: string
  slug: string
  excerpt?: string
  image?: string
  videoId?: string
  review?: string
}): string {
  const lines = [
    '---',
    `title: "${fields.title.replace(/"/g, '\\"')}"`,
    `date: "${fields.date}"`,
    `category: "${fields.category}"`,
    `slug: "${fields.slug}"`,
  ]
  if (fields.excerpt) lines.push(`excerpt: "${fields.excerpt.replace(/"/g, '\\"')}"`)
  if (fields.image)   lines.push(`image: "${fields.image}"`)
  if (fields.videoId) lines.push(`videoId: "${fields.videoId}"`)
  if (fields.review)  lines.push(`review: "${fields.review.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`)
  lines.push('---')
  return lines.join('\n')
}

function parseFrontmatter(raw: string): { meta: Record<string, string>; body: string } {
  const fmMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!fmMatch) return { meta: {}, body: raw }
  const yamlStr = fmMatch[1]
  const body = fmMatch[2]
  const meta: Record<string, string> = {}
  for (const line of yamlStr.split('\n')) {
    const colonIdx = line.indexOf(':')
    if (colonIdx === -1) continue
    const key = line.slice(0, colonIdx).trim()
    const rawVal = line.slice(colonIdx + 1).trim()
    let val = rawVal
    if (val.startsWith('"')) {
      const inner = val.slice(1)
      let result = ''
      let i = 0
      while (i < inner.length) {
        if (inner[i] === '\\' && i + 1 < inner.length) {
          const next = inner[i + 1]
          if (next === '"')  { result += '"';  i += 2; continue }
          if (next === 'n')  { result += '\n'; i += 2; continue }
          if (next === '\\') { result += '\\'; i += 2; continue }
        }
        if (inner[i] === '"') break
        result += inner[i]
        i++
      }
      val = result
    }
    meta[key] = val
  }
  return { meta, body }
}

function slugToLabel(fullSlug: string): string {
  const m = fullSlug.match(/^(\d{4}-\d{2}-\d{2})-(.+)$/)
  if (!m) return fullSlug
  const words = m[2].split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  return `${m[1]} — ${words}`
}

function stripDatePrefix(fullSlug: string, date: string): string {
  const prefix = `${date}-`
  return fullSlug.startsWith(prefix) ? fullSlug.slice(prefix.length) : fullSlug
}

async function ghFetch(
  urlPath: string,
  method: string,
  token: string,
  body?: object
): Promise<Response> {
  return fetch(`${API}${urlPath}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
}

type StatusType = 'idle' | 'publishing' | 'success' | 'error'
type TabType = 'new' | 'edit'

function AdminPublishInner() {
  const searchParams = useSearchParams()

  const [tokenSaved, setTokenSaved] = useState(false)
  const [tokenOpen, setTokenOpen] = useState(false)
  const tokenInputRef = useRef<HTMLInputElement>(null)

  // Shared form fields
  const [date, setDate] = useState('')
  const [title, setTitle] = useState(DEFAULT_INTENTION_TITLE)
  const [slug, setSlug] = useState(titleToSlug(DEFAULT_INTENTION_TITLE))
  const [category, setCategory] = useState('morning-intention')
  const [excerpt, setExcerpt] = useState('')
  const [image, setImage] = useState('')
  const [content, setContent] = useState('')
  const [walkUrl, setWalkUrl] = useState('')
  const [walkContext, setWalkContext] = useState('')
  const [review, setReview] = useState('')
  const [suggestedTitle, setSuggestedTitle] = useState('')

  // New post status
  const [status, setStatus] = useState<StatusType>('idle')
  const [statusMsg, setStatusMsg] = useState('')
  const [publishing, setPublishing] = useState(false)

  // Shared UI
  const [uploadingImage, setUploadingImage] = useState(false)
  const [generatingSeo, setGeneratingSeo] = useState(false)
  const [seoError, setSeoError] = useState('')

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('new')

  // Edit mode state
  const [editPostList, setEditPostList] = useState<Array<{ slug: string; label: string }>>([])
  const [editSelectedSlug, setEditSelectedSlug] = useState('')
  const [editOriginalFullSlug, setEditOriginalFullSlug] = useState('')
  const [editFileSha, setEditFileSha] = useState('')
  const [loadingPostList, setLoadingPostList] = useState(false)
  const [postListError, setPostListError] = useState('')
  const [loadingPost, setLoadingPost] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<StatusType>('idle')
  const [saveMsg, setSaveMsg] = useState('')
  const [slugChanged, setSlugChanged] = useState(false)

  // ── Init ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    const saved = localStorage.getItem('wm_gh_token')
    if (saved) {
      setTokenSaved(true)
    } else {
      setTokenOpen(true)
    }
    setDate(new Date().toISOString().slice(0, 10))

    const editSlug = searchParams.get('edit')
    if (editSlug) {
      setActiveTab('edit')
      setEditSelectedSlug(editSlug)
    }
  }, [searchParams])

  // Load post list when edit tab becomes active and we have a token
  useEffect(() => {
    if (activeTab === 'edit' && editPostList.length === 0) {
      loadEditPostList()
    }
  }, [activeTab]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-load post when coming from ?edit=slug and post list is ready
  useEffect(() => {
    if (activeTab === 'edit' && editSelectedSlug && editPostList.length > 0 && !editFileSha) {
      loadEditPost(editSelectedSlug)
    }
  }, [editPostList, editSelectedSlug]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── GitHub helpers ────────────────────────────────────────────────────────

  async function loadEditPostList() {
    const token = localStorage.getItem('wm_gh_token') || ''
    if (!token) {
      setPostListError('No GitHub token saved. Expand the token section above and save one first.')
      return
    }
    setLoadingPostList(true)
    setPostListError('')
    try {
      const res = await ghFetch(`/repos/${REPO}/contents/posts`, 'GET', token)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || `GitHub API error (${res.status})`)
      }
      const files: Array<{ name: string }> = await res.json()
      const posts = files
        .filter(f => f.name.endsWith('.md'))
        .sort((a, b) => b.name.localeCompare(a.name))
        .map(f => {
          const s = f.name.replace('.md', '')
          return { slug: s, label: slugToLabel(s) }
        })
      setEditPostList(posts)
    } catch (err) {
      setPostListError(err instanceof Error ? err.message : 'Failed to load posts list.')
    } finally {
      setLoadingPostList(false)
    }
  }

  async function loadEditPost(postSlug: string) {
    const token = localStorage.getItem('wm_gh_token') || ''
    if (!token) return
    setLoadingPost(true)
    setSlugChanged(false)
    setSaveStatus('idle')
    try {
      const res = await ghFetch(`/repos/${REPO}/contents/posts/${postSlug}.md`, 'GET', token)
      if (!res.ok) throw new Error(`Could not load post "${postSlug}"`)
      const file: { content: string; sha: string } = await res.json()
      const raw = fromBase64(file.content.replace(/\n/g, ''))
      const { meta, body } = parseFrontmatter(raw)

      setEditFileSha(file.sha)
      setEditOriginalFullSlug(postSlug)

      setTitle(meta.title ?? '')
      setDate(meta.date ?? '')
      setCategory(meta.category ?? 'morning-intention')
      setExcerpt(meta.excerpt ?? '')
      setImage(meta.image ?? '')
      setReview(meta.review ?? '')
      setSuggestedTitle('')

      // Derive the slug portion without date prefix
      const titleSlugPart = stripDatePrefix(postSlug, meta.date ?? '')
      setSlug(titleSlugPart)

      if (meta.category === 'morning-walk') {
        setWalkUrl(meta.videoId ? `https://www.youtube.com/watch?v=${meta.videoId}` : '')
        setWalkContext(body.trim())
        setContent('')
      } else {
        setContent(body.trim())
        setWalkUrl('')
        setWalkContext('')
      }
    } catch (err) {
      setSaveStatus('error')
      setSaveMsg(err instanceof Error ? err.message : 'Failed to load post')
    } finally {
      setLoadingPost(false)
    }
  }

  // ── Form handlers ─────────────────────────────────────────────────────────

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingImage(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/admin/upload', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      setImage(data.url)
    } catch (err) {
      setStatus('error')
      setStatusMsg(err instanceof Error ? err.message : 'Image upload failed')
    } finally {
      setUploadingImage(false)
      e.target.value = ''
    }
  }

  async function handleGenerateSeo() {
    if (!title.trim()) { setSeoError('Add a title first.'); return }
    if (!content.trim()) { setSeoError('Write your post content first — Claude needs something to read.'); return }
    setSeoError('')
    setGeneratingSeo(true)
    try {
      const res = await fetch('/api/admin/seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      })
      let data: { excerpt?: string; suggestedTitle?: string; review?: string; error?: string }
      try {
        data = await res.json()
      } catch {
        throw new Error(`Server error (${res.status}) — Claude took too long or something went wrong. Try again.`)
      }
      if (!res.ok) throw new Error(data.error || 'Generation failed')
      setExcerpt(data.excerpt ?? '')
      setSuggestedTitle(data.suggestedTitle ?? '')
      setReview(data.review ?? '')
    } catch (err) {
      setSeoError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setGeneratingSeo(false)
    }
  }

  function handleCategoryChange(val: string) {
    setCategory(val)
    if (val === 'morning-intention' && !title.trim()) {
      setTitle(DEFAULT_INTENTION_TITLE)
      setSlug(titleToSlug(DEFAULT_INTENTION_TITLE))
    }
  }

  function handleTitleChange(val: string) {
    setTitle(val)
    if (activeTab === 'new') {
      setSlug(titleToSlug(val))
    }
  }

  function handleSlugChange(val: string) {
    setSlug(val)
    if (activeTab === 'edit') {
      const newFull = `${date}-${val}`
      setSlugChanged(newFull !== editOriginalFullSlug)
    }
  }

  function saveToken() {
    const val = tokenInputRef.current?.value.trim()
    if (!val) return
    localStorage.setItem('wm_gh_token', val)
    setTokenSaved(true)
    setTokenOpen(false)
  }

  // ── Publish (new post) ────────────────────────────────────────────────────

  async function handlePublish() {
    const token = localStorage.getItem('wm_gh_token') || tokenInputRef.current?.value.trim() || ''

    if (!token) {
      setTokenOpen(true)
      tokenInputRef.current?.focus()
      setStatus('error')
      setStatusMsg('Please save your GitHub token first.')
      return
    }

    if (!date || !title) {
      setStatus('error')
      setStatusMsg('Please fill in the date and title before publishing.')
      return
    }

    const fullSlug = `${date}-${slug || titleToSlug(title)}`
    const postPath = `posts/${fullSlug}.md`

    let fileContent: string

    if (category === 'morning-intention') {
      if (!content.trim()) {
        setStatus('error')
        setStatusMsg('Please write your post content before publishing.')
        return
      }
      fileContent = buildFrontmatter({
        title, date, category, slug: fullSlug,
        excerpt: excerpt || undefined,
        image: image || undefined,
        review: review || undefined,
      }) + '\n\n' + content.trim() + '\n'
    } else {
      if (!walkUrl.trim() || !walkContext.trim()) {
        setStatus('error')
        setStatusMsg('Please fill in the YouTube URL and context before publishing.')
        return
      }
      const videoId = extractYoutubeId(walkUrl.trim())
      if (!videoId) {
        setStatus('error')
        setStatusMsg('Could not extract a YouTube video ID from that URL. Please check it.')
        return
      }
      fileContent = buildFrontmatter({
        title, date, category, slug: fullSlug,
        excerpt: excerpt || undefined,
        image: image || undefined,
        videoId,
      }) + '\n\n' + walkContext.trim() + '\n'
    }

    setPublishing(true)
    setStatus('publishing')
    setStatusMsg('Publishing...')

    try {
      setStatusMsg('Checking for existing file...')
      const checkRes = await ghFetch(`/repos/${REPO}/contents/${postPath}`, 'GET', token)

      let sha: string | undefined
      if (checkRes.ok) {
        const existing = await checkRes.json()
        sha = existing.sha
        const overwrite = window.confirm(`A post with the slug "${fullSlug}" already exists. Overwrite it?`)
        if (!overwrite) {
          setStatus('idle')
          setPublishing(false)
          return
        }
        setStatus('publishing')
        setStatusMsg('Overwriting post...')
      } else {
        setStatusMsg('Uploading post...')
      }

      const putRes = await ghFetch(`/repos/${REPO}/contents/${postPath}`, 'PUT', token, {
        message: sha ? `Update post: ${title}` : `Add post: ${title}`,
        content: toBase64(fileContent),
        ...(sha ? { sha } : {}),
      })

      if (!putRes.ok) {
        const err = await putRes.json()
        throw new Error(err.message || `Failed to upload post (${putRes.status})`)
      }

      const postUrl = `https://wolfman.blog/posts/${fullSlug}`
      setStatus('success')
      setStatusMsg(postUrl)
    } catch (err) {
      setStatus('error')
      setStatusMsg(err instanceof Error ? err.message : String(err))
    } finally {
      setPublishing(false)
    }
  }

  // ── Save (edit post) ──────────────────────────────────────────────────────

  async function handleSave() {
    const token = localStorage.getItem('wm_gh_token') || ''
    if (!token) {
      setTokenOpen(true)
      setSaveStatus('error')
      setSaveMsg('Please save your GitHub token first.')
      return
    }

    if (!editFileSha) {
      setSaveStatus('error')
      setSaveMsg('No post loaded. Select a post from the dropdown first.')
      return
    }

    if (!date || !title) {
      setSaveStatus('error')
      setSaveMsg('Date and title are required.')
      return
    }

    const newFullSlug = `${date}-${slug || titleToSlug(title)}`

    if (slugChanged) {
      const proceed = window.confirm(
        `You've changed the slug from "${editOriginalFullSlug}" to "${newFullSlug}".\n\nThis will change the post URL — any existing links to the old URL will break.\n\nSave anyway?`
      )
      if (!proceed) return
    }

    let fileContent: string
    const originalPath = `posts/${editOriginalFullSlug}.md`
    const newPath = `posts/${newFullSlug}.md`

    if (category === 'morning-intention') {
      if (!content.trim()) {
        setSaveStatus('error')
        setSaveMsg('Post content cannot be empty.')
        return
      }
      fileContent = buildFrontmatter({
        title, date, category, slug: newFullSlug,
        excerpt: excerpt || undefined,
        image: image || undefined,
        review: review || undefined,
      }) + '\n\n' + content.trim() + '\n'
    } else {
      if (!walkUrl.trim() || !walkContext.trim()) {
        setSaveStatus('error')
        setSaveMsg('YouTube URL and context are required.')
        return
      }
      const videoId = extractYoutubeId(walkUrl.trim())
      if (!videoId) {
        setSaveStatus('error')
        setSaveMsg('Could not extract a YouTube video ID from that URL.')
        return
      }
      fileContent = buildFrontmatter({
        title, date, category, slug: newFullSlug,
        excerpt: excerpt || undefined,
        image: image || undefined,
        videoId,
      }) + '\n\n' + walkContext.trim() + '\n'
    }

    setSaving(true)
    setSaveStatus('publishing')
    setSaveMsg('Saving...')

    try {
      if (slugChanged) {
        // Create new file at new path
        setSaveMsg('Creating file at new path...')
        const putRes = await ghFetch(`/repos/${REPO}/contents/${newPath}`, 'PUT', token, {
          message: `Update post: ${title}`,
          content: toBase64(fileContent),
        })
        if (!putRes.ok) {
          const err = await putRes.json()
          throw new Error(err.message || `Failed to create new file (${putRes.status})`)
        }
        // Delete old file
        setSaveMsg('Removing old file...')
        const delRes = await ghFetch(`/repos/${REPO}/contents/${originalPath}`, 'DELETE', token, {
          message: `Remove old post file: ${editOriginalFullSlug}`,
          sha: editFileSha,
        })
        if (!delRes.ok) {
          // Non-fatal — new file was created, old file still exists
          setSaveStatus('success')
          setSaveMsg(`https://wolfman.blog/posts/${newFullSlug}`)
          setEditOriginalFullSlug(newFullSlug)
          setSlugChanged(false)
          return
        }
      } else {
        // Overwrite in place with existing sha
        setSaveMsg('Saving...')
        const putRes = await ghFetch(`/repos/${REPO}/contents/${originalPath}`, 'PUT', token, {
          message: `Update post: ${title}`,
          content: toBase64(fileContent),
          sha: editFileSha,
        })
        if (!putRes.ok) {
          const err = await putRes.json()
          throw new Error(err.message || `Failed to save post (${putRes.status})`)
        }
        // Update sha from response
        const putData = await putRes.json()
        setEditFileSha(putData?.content?.sha ?? editFileSha)
      }

      setSaveStatus('success')
      setSaveMsg(`https://wolfman.blog/posts/${newFullSlug}`)
      setEditOriginalFullSlug(newFullSlug)
      setSlugChanged(false)
      // Refresh post list to reflect any slug change
      if (slugChanged) loadEditPostList()
    } catch (err) {
      setSaveStatus('error')
      setSaveMsg(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  // ── Derived ───────────────────────────────────────────────────────────────

  const isEditMode = activeTab === 'edit'
  const currentFullSlug = `${date}-${slug || titleToSlug(title)}`

  // ── Shared form sections ──────────────────────────────────────────────────

  const sharedForm = (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="admin-field">
          <label className="admin-label" htmlFor="postDate">Date</label>
          <input
            id="postDate"
            type="date"
            className="admin-input"
            value={date}
            onChange={e => setDate(e.target.value)}
          />
        </div>
        <div className="admin-field">
          <label className="admin-label" htmlFor="postTitle">Post Title</label>
          <input
            id="postTitle"
            type="text"
            className="admin-input"
            placeholder="The Honda Engine"
            value={title}
            onChange={e => handleTitleChange(e.target.value)}
          />
        </div>
      </div>

      <div className="admin-field">
        <label className="admin-label" htmlFor="postSlug">URL Slug</label>
        <input
          id="postSlug"
          type="text"
          className="admin-input"
          placeholder="auto-generated from title"
          value={slug}
          onChange={e => handleSlugChange(e.target.value)}
        />
        {isEditMode && slugChanged ? (
          <p className="admin-hint" style={{ color: '#A82020', opacity: 1 }}>
            ⚠ Slug changed: <strong>{editOriginalFullSlug}</strong> → <strong>{currentFullSlug}</strong>. Existing links to this post will break.
          </p>
        ) : (
          <p className="admin-hint">
            {isEditMode
              ? `Full URL: wolfman.blog/posts/${currentFullSlug}`
              : 'Auto-filled from title. Edit if needed. Date is prepended automatically.'}
          </p>
        )}
      </div>

      <div className="admin-field">
        <label className="admin-label" htmlFor="postCategory">Category</label>
        <select
          id="postCategory"
          className="admin-input"
          value={category}
          onChange={e => handleCategoryChange(e.target.value)}
        >
          <option value="morning-intention">Morning Intention</option>
          <option value="morning-walk">Morning Walk with Matthew</option>
        </select>
      </div>

      <div className="admin-field">
        <label className="admin-label" htmlFor="postImage">
          Social Image <span style={{ fontWeight: 400, textTransform: 'none', opacity: 0.7 }}>(optional — og:image only, not shown on post)</span>
        </label>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            id="postImage"
            type="url"
            className="admin-input"
            placeholder="Upload below or paste a URL"
            value={image}
            onChange={e => setImage(e.target.value)}
            style={{ flex: 1, minWidth: 200 }}
          />
          <label className="admin-upload-btn" style={{ cursor: uploadingImage ? 'not-allowed' : 'pointer', opacity: uploadingImage ? 0.6 : 1 }}>
            {uploadingImage ? 'Uploading…' : 'Upload image'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              style={{ display: 'none' }}
              disabled={uploadingImage}
              onChange={handleImageUpload}
            />
          </label>
        </div>
        {image && (
          <img src={image} alt="Social preview" style={{ marginTop: '0.75rem', maxHeight: 120, maxWidth: '100%', borderRadius: 4, objectFit: 'cover' }} />
        )}
        <p className="admin-hint">Used for social sharing previews on LinkedIn, Facebook etc. Not displayed on the post page.</p>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid var(--admin-border)', margin: '2rem 0' }} />

      {/* Morning Intention fields */}
      {category === 'morning-intention' && (
        <>
          <div className="admin-field">
            <label className="admin-label" htmlFor="postContent">Post Content</label>
            <textarea
              id="postContent"
              className="admin-textarea"
              placeholder={`Use ## headings to separate sections:\n\n## Today's Intention\n\nYour story here...\n\n## I'm Grateful For\n\nSomething specific...\n\n## Something I'm Great At\n\nOwn it.`}
              value={content}
              onChange={e => setContent(e.target.value)}
            />
          </div>

          {suggestedTitle && (
            <div className="admin-field">
              <label className="admin-label">Suggested SEO Title</label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ flex: 1, fontSize: '0.95rem', color: 'var(--body-text)', padding: '0.6rem 0.75rem', border: '1px solid #ddd', borderRadius: 4, background: 'var(--admin-card-bg)' }}>
                  {suggestedTitle}
                </span>
                <button type="button" className="admin-upload-btn" onClick={() => { setTitle(suggestedTitle); if (!isEditMode) setSlug(titleToSlug(suggestedTitle)) }}>
                  Use this
                </button>
              </div>
              <p className="admin-hint">{suggestedTitle.length} / 60 characters</p>
            </div>
          )}

          <div className="admin-field">
            <label className="admin-label" htmlFor="postExcerpt">
              Excerpt <span style={{ fontWeight: 400, textTransform: 'none', opacity: 0.7 }}>(recommended — shown in social previews)</span>
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginBottom: '0.4rem' }}>
              {excerpt && (
                <button type="button" className="admin-upload-btn" onClick={handleGenerateSeo} disabled={generatingSeo}
                  style={{ background: '#888', cursor: generatingSeo ? 'not-allowed' : 'pointer' }}>
                  Regenerate ↺
                </button>
              )}
              <button type="button" className="admin-upload-btn" onClick={handleGenerateSeo}
                disabled={generatingSeo || !content.trim()}
                style={{ cursor: generatingSeo || !content.trim() ? 'not-allowed' : 'pointer', opacity: !content.trim() ? 0.5 : 1 }}>
                {generatingSeo ? 'Asking Claude…' : 'Generate with Claude ✦'}
              </button>
            </div>
            <textarea id="postExcerpt" className="admin-textarea" style={{ minHeight: '80px' }}
              placeholder="One or two sentences that capture the heart of this post..."
              value={excerpt} onChange={e => setExcerpt(e.target.value)} />
            <p className="admin-hint">
              {excerpt.length > 0
                ? `${excerpt.length} / 160 characters${excerpt.length > 160 ? ' — consider trimming' : ''}`
                : 'If left blank, the opening paragraph of your post is used automatically.'}
            </p>
            {seoError && <p className="admin-hint" style={{ color: '#7a2020', opacity: 1 }}>{seoError}</p>}
          </div>

          {review && (
            <div className="admin-field">
              <label className="admin-label">Claude&apos;s Review <span style={{ fontWeight: 400, textTransform: 'none', opacity: 0.7 }}>(shown at bottom of post)</span></label>
              <textarea className="admin-textarea" style={{ minHeight: '120px' }}
                value={review} onChange={e => setReview(e.target.value)} />
              <p className="admin-hint">Edit freely. This appears at the bottom of the published post attributed to Claude.</p>
            </div>
          )}
        </>
      )}

      {/* Morning Walk fields */}
      {category === 'morning-walk' && (
        <>
          <div className="admin-field">
            <label className="admin-label" htmlFor="walkUrl">YouTube URL</label>
            <input
              id="walkUrl"
              type="url"
              className="admin-input"
              placeholder="https://www.youtube.com/watch?v=..."
              value={walkUrl}
              onChange={e => setWalkUrl(e.target.value)}
            />
          </div>
          <div className="admin-field">
            <label className="admin-label" htmlFor="walkContext">Context</label>
            <textarea
              id="walkContext"
              className="admin-textarea"
              placeholder="A few words about this walk..."
              value={walkContext}
              onChange={e => setWalkContext(e.target.value)}
            />
          </div>
        </>
      )}
    </>
  )

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <main style={{ padding: '2rem 1rem 4rem', fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
      <div style={{ maxWidth: 700, margin: '0 auto', paddingBottom: '9rem' }}>
        <h1 style={{ fontSize: '1.25rem', margin: '0 0 0.25rem', fontWeight: 600, color: 'var(--heading)' }}>
          Wolfman — Post Publisher
        </h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--body-text)', margin: '0 0 2rem', opacity: 0.75 }}>
          Write your post, click Publish. It commits to GitHub and deploys to Vercel automatically.
        </p>

        {/* Token section */}
        <div className="admin-token-section">
          <div
            className="admin-token-header"
            onClick={() => setTokenOpen(o => !o)}
            style={{ cursor: 'pointer', userSelect: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--body-text)' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: tokenSaved ? '#3AB87A' : '#ccc', display: 'inline-block', flexShrink: 0 }} />
              GitHub Token
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--body-text)', opacity: 0.7 }}>
              {tokenOpen ? '▾ collapse' : '▸ expand'}
            </span>
          </div>

          {tokenOpen && (
            <div style={{ marginTop: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  ref={tokenInputRef}
                  type="password"
                  placeholder="github_pat_..."
                  style={{ flex: 1, padding: '0.5rem 0.75rem', border: '1px solid #ccc', borderRadius: 4, fontFamily: 'monospace', fontSize: '0.85rem' }}
                />
                <button onClick={saveToken} className="admin-btn-save-token">Save</button>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--body-text)', margin: '0.5rem 0 0', lineHeight: 1.5, opacity: 0.8 }}>
                Token is saved in your browser only — never sent anywhere except the GitHub API.<br />
                Need one?{' '}
                <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener noreferrer" style={{ color: '#4A7FA5' }}>
                  github.com/settings/tokens
                </a>
                {' '}→ Fine-grained → Repository: wolfman-website → Contents: Read and write.
              </p>
            </div>
          )}
        </div>

        <p style={{ fontSize: '0.8rem', color: 'var(--body-text)', margin: '-1rem 0 2rem', opacity: 0.75 }}>
          Manage GitHub tokens →{' '}
          <a href="https://github.com/settings/personal-access-tokens" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--admin-muted)' }}>
            github.com/settings/personal-access-tokens
          </a>
        </p>

        {/* Tab toggle */}
        <div style={{ display: 'flex', gap: 0, marginBottom: '2rem', borderBottom: '2px solid var(--admin-border, #ddd)' }}>
          {(['new', 'edit'] as TabType[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '0.6rem 1.25rem',
                border: 'none',
                borderBottom: activeTab === tab ? '2px solid #4A7FA5' : '2px solid transparent',
                marginBottom: '-2px',
                background: 'none',
                fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                fontSize: '0.85rem',
                fontWeight: activeTab === tab ? 600 : 400,
                color: activeTab === tab ? '#e6edf3' : '#8b949e',
                cursor: 'pointer',
                letterSpacing: '0.03em',
              }}
            >
              {tab === 'new' ? 'New Post' : 'Edit Post'}
            </button>
          ))}
        </div>

        {/* ── NEW POST TAB ── */}
        {activeTab === 'new' && (
          <>
            {sharedForm}

            <button
              className="admin-publish-btn"
              onClick={handlePublish}
              disabled={publishing}
            >
              {publishing ? 'Publishing...' : 'Publish Post'}
            </button>

            {status !== 'idle' && (
              <div className={`admin-status admin-status--${status}`}>
                {status === 'publishing' && (
                  <>
                    <span className="admin-spinner" />
                    <span>{statusMsg}</span>
                  </>
                )}
                {status === 'success' && (
                  <>
                    <strong>Published.</strong> Vercel is deploying — live in about 30 seconds.<br />
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      <a href={statusMsg} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', fontWeight: 600 }}>
                        View post →
                      </a>
                      <a href="/intentions" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', opacity: 0.75 }}>
                        Go to all posts →
                      </a>
                    </div>
                  </>
                )}
                {status === 'error' && (
                  <span>
                    <strong>Something went wrong.</strong> {statusMsg}
                  </span>
                )}
              </div>
            )}
          </>
        )}

        {/* ── EDIT POST TAB ── */}
        {activeTab === 'edit' && (
          <>
            {/* Post selector */}
            <div className="admin-field">
              <label className="admin-label" htmlFor="editPostSelect">Select Post</label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <select
                  id="editPostSelect"
                  className="admin-input"
                  value={editSelectedSlug}
                  onChange={e => {
                    setEditSelectedSlug(e.target.value)
                    if (e.target.value) loadEditPost(e.target.value)
                  }}
                  style={{ flex: 1 }}
                  disabled={loadingPostList}
                >
                  <option value="">{loadingPostList ? 'Loading posts…' : '— Select a post —'}</option>
                  {editPostList.map(p => (
                    <option key={p.slug} value={p.slug}>{p.label}</option>
                  ))}
                </select>
                <button
                  type="button"
                  className="admin-upload-btn"
                  onClick={loadEditPostList}
                  disabled={loadingPostList}
                  style={{ cursor: loadingPostList ? 'not-allowed' : 'pointer', opacity: loadingPostList ? 0.6 : 1 }}
                >
                  {loadingPostList ? 'Loading…' : 'Refresh'}
                </button>
              </div>
              {postListError
                ? <p className="admin-hint" style={{ color: '#A82020', opacity: 1 }}>{postListError}</p>
                : <p className="admin-hint">Posts sorted newest first. Selecting one loads all its fields.</p>
              }
            </div>

            {loadingPost && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', color: '#2a5a7a', fontSize: '0.9rem' }}>
                <span className="admin-spinner" />
                Loading post…
              </div>
            )}

            {!loadingPost && editFileSha && (
              <>
                {sharedForm}

                <button
                  className="admin-publish-btn"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>

                {saveStatus !== 'idle' && (
                  <div className={`admin-status admin-status--${saveStatus}`}>
                    {saveStatus === 'publishing' && (
                      <>
                        <span className="admin-spinner" />
                        <span>{saveMsg}</span>
                      </>
                    )}
                    {saveStatus === 'success' && (
                      <>
                        <strong>Saved.</strong> Vercel is deploying — live in about 30 seconds.<br />
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                          <a href={saveMsg} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', fontWeight: 600 }}>
                            View post →
                          </a>
                          <a href="/intentions" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', opacity: 0.75 }}>
                            Go to all posts →
                          </a>
                        </div>
                      </>
                    )}
                    {saveStatus === 'error' && (
                      <span>
                        <strong>Something went wrong.</strong> {saveMsg}
                      </span>
                    )}
                  </div>
                )}
              </>
            )}

            {!loadingPost && !editFileSha && !loadingPostList && (
              <p style={{ color: 'var(--body-text)', opacity: 0.6, fontSize: '0.9rem', marginTop: '1rem' }}>
                Select a post above to load it for editing.
              </p>
            )}
          </>
        )}
      </div>

      <style>{`
        .admin-token-section {
          background: var(--admin-card-bg, #f8f8f8);
          border: 1px solid var(--admin-border, #ddd);
          border-radius: 6px;
          padding: 1rem 1.25rem;
          margin-bottom: 2rem;
        }
        .admin-field { margin-bottom: 1.5rem; }
        .admin-label {
          display: block;
          font-size: 0.8rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--body-text);
          margin-bottom: 0.4rem;
        }
        .admin-input,
        .admin-textarea {
          width: 100%;
          padding: 0.6rem 0.75rem;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          font-size: 0.95rem;
          background: #fff;
          color: #222;
          line-height: 1.5;
          box-sizing: border-box;
        }
        .admin-input:focus,
        .admin-textarea:focus {
          outline: none;
          border-color: #4A7FA5;
          box-shadow: 0 0 0 2px rgba(74,127,165,0.2);
        }
        .admin-textarea {
          resize: vertical;
          min-height: 280px;
        }
        .admin-hint {
          font-size: 0.78rem;
          color: var(--body-text);
          opacity: 0.75;
          margin-top: 0.3rem;
        }
        .admin-upload-btn {
          display: inline-block;
          background: #4A7FA5;
          color: #fff;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          font-size: 0.85rem;
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          white-space: nowrap;
          transition: background 0.2s ease;
          cursor: pointer;
        }
        .admin-upload-btn:hover { background: #3a6a8a; }
        .admin-btn-save-token {
          background: #4A7FA5;
          color: #fff;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          font-size: 0.85rem;
          cursor: pointer;
          white-space: nowrap;
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
        }
        .admin-btn-save-token:hover { background: #3a6a8a; }
        .admin-publish-btn {
          background: #214459;
          color: #fff;
          border: none;
          padding: 0.75rem 2rem;
          font-size: 1rem;
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 600;
        }
        .admin-publish-btn:hover:not(:disabled) { background: #1a3547; }
        .admin-publish-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .admin-status {
          margin-top: 1.5rem;
          padding: 1rem 1.25rem;
          border-radius: 6px;
          font-size: 0.9rem;
          line-height: 1.6;
        }
        .admin-status--publishing {
          background: #eef4fb;
          border: 1px solid #b8d0e8;
          color: #2a5a7a;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .admin-status--success {
          background: #e8f6ee;
          border: 1px solid #b0dcc0;
          color: #1e5c38;
        }
        .admin-status--error {
          background: #fbeaea;
          border: 1px solid #e0b0b0;
          color: #7a2020;
        }
        .admin-spinner {
          display: inline-block;
          width: 18px;
          height: 18px;
          border: 2px solid #b8d0e8;
          border-top-color: #2a5a7a;
          border-radius: 50%;
          animation: admin-spin 0.7s linear infinite;
          flex-shrink: 0;
        }
        @keyframes admin-spin { to { transform: rotate(360deg); } }
      `}</style>
    </main>
  )
}

export default function AdminPublishPage() {
  return (
    <Suspense fallback={null}>
      <AdminPublishInner />
    </Suspense>
  )
}
