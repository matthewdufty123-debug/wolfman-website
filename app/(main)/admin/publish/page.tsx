'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

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

type StatusType = 'idle' | 'publishing' | 'success' | 'error'
type TabType = 'new' | 'edit'

const ROUTINE_ITEMS = [
  { key: 'sunlight',     label: '☀️  Sunlight' },
  { key: 'breathwork',   label: '🌬️  Breathwork' },
  { key: 'cacao',        label: '🍫  Cacao' },
  { key: 'meditation',   label: '🧘  Meditation' },
  { key: 'coldShower',   label: '🚿  Cold Shower' },
  { key: 'walk',         label: '🚶  Walk' },
  { key: 'animalLove',   label: '🐾  Animal Love' },
] as const

type RoutineKey = typeof ROUTINE_ITEMS[number]['key']
type RoutineChecklist = Record<RoutineKey, boolean>

interface PostSummary {
  id: string
  slug: string
  title: string
  date: string
  category: string
}

function slugToLabel(post: PostSummary): string {
  return `${post.date} — ${post.title}`
}

function AdminPublishInner() {
  const searchParams = useSearchParams()

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

  // Morning state (new posts only)
  const [brainScale, setBrainScale] = useState(3)
  const [bodyScale, setBodyScale] = useState(3)
  const [routineChecklist, setRoutineChecklist] = useState<RoutineChecklist>({
    sunlight: false, breathwork: false, cacao: false, meditation: false,
    coldShower: false, walk: false, animalLove: false,
  })

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
  const [editPostList, setEditPostList] = useState<PostSummary[]>([])
  const [editSelectedId, setEditSelectedId] = useState('')
  const [editOriginalSlug, setEditOriginalSlug] = useState('')
  const [loadingPostList, setLoadingPostList] = useState(false)
  const [postListError, setPostListError] = useState('')
  const [loadingPost, setLoadingPost] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<StatusType>('idle')
  const [saveMsg, setSaveMsg] = useState('')
  const [slugChanged, setSlugChanged] = useState(false)

  // ── Init ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    setDate(new Date().toISOString().slice(0, 10))
    const editSlug = searchParams.get('edit')
    if (editSlug) setActiveTab('edit')
  }, [searchParams])

  useEffect(() => {
    if (activeTab === 'edit' && editPostList.length === 0) {
      loadEditPostList()
    }
  }, [activeTab]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (activeTab === 'edit' && editPostList.length > 0) {
      const editSlug = searchParams.get('edit')
      if (editSlug) {
        const match = editPostList.find(p => p.slug === editSlug)
        if (match && match.id !== editSelectedId) {
          setEditSelectedId(match.id)
          loadEditPost(match.id)
        }
      }
    }
  }, [editPostList]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── API helpers ───────────────────────────────────────────────────────────

  async function loadEditPostList() {
    setLoadingPostList(true)
    setPostListError('')
    try {
      const res = await fetch('/api/admin/posts')
      if (!res.ok) throw new Error(`Failed to load posts (${res.status})`)
      const data: PostSummary[] = await res.json()
      setEditPostList(data.sort((a, b) => b.date.localeCompare(a.date)))
    } catch (err) {
      setPostListError(err instanceof Error ? err.message : 'Failed to load posts.')
    } finally {
      setLoadingPostList(false)
    }
  }

  async function loadEditPost(id: string) {
    setLoadingPost(true)
    setSlugChanged(false)
    setSaveStatus('idle')
    try {
      const res = await fetch(`/api/admin/posts/${id}`)
      if (!res.ok) throw new Error('Could not load post')
      const post = await res.json()

      setEditOriginalSlug(post.slug)
      setTitle(post.title)
      setDate(post.date)
      setCategory(post.category)
      setExcerpt(post.excerpt ?? '')
      setImage(post.image ?? '')
      setReview(post.review ?? '')
      setSuggestedTitle('')

      const datePrefix = `${post.date}-`
      setSlug(post.slug.startsWith(datePrefix) ? post.slug.slice(datePrefix.length) : post.slug)

      if (post.category === 'morning-walk') {
        setWalkUrl(post.videoId ? `https://www.youtube.com/watch?v=${post.videoId}` : '')
        setWalkContext(post.content.trim())
        setContent('')
      } else {
        setContent(post.content.trim())
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
      try { data = await res.json() }
      catch { throw new Error(`Server error (${res.status}) — try again.`) }
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
    if (activeTab === 'new') setSlug(titleToSlug(val))
  }

  function handleSlugChange(val: string) {
    setSlug(val)
    if (activeTab === 'edit') {
      setSlugChanged(`${date}-${val}` !== editOriginalSlug)
    }
  }

  // ── Publish (new post) ────────────────────────────────────────────────────

  async function handlePublish() {
    if (!date || !title) {
      setStatus('error')
      setStatusMsg('Please fill in the date and title before publishing.')
      return
    }

    const fullSlug = `${date}-${slug || titleToSlug(title)}`
    let postContent: string
    let videoId: string | undefined

    if (category === 'morning-intention') {
      if (!content.trim()) { setStatus('error'); setStatusMsg('Please write your post content before publishing.'); return }
      postContent = content.trim()
    } else {
      if (!walkUrl.trim() || !walkContext.trim()) { setStatus('error'); setStatusMsg('Please fill in the YouTube URL and context before publishing.'); return }
      const vid = extractYoutubeId(walkUrl.trim())
      if (!vid) { setStatus('error'); setStatusMsg('Could not extract a YouTube video ID from that URL. Please check it.'); return }
      videoId = vid
      postContent = walkContext.trim()
    }

    setPublishing(true)
    setStatus('publishing')
    setStatusMsg('Publishing...')

    try {
      const res = await fetch('/api/admin/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: fullSlug, title, date, category, content: postContent,
          excerpt: excerpt || undefined, image: image || undefined,
          videoId, review: review || undefined,
          morning: { brainScale, bodyScale, routineChecklist },
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `Failed to publish (${res.status})`)
      setStatus('success')
      setStatusMsg(`https://wolfman.blog/posts/${fullSlug}`)
    } catch (err) {
      setStatus('error')
      setStatusMsg(err instanceof Error ? err.message : String(err))
    } finally {
      setPublishing(false)
    }
  }

  // ── Save (edit post) ──────────────────────────────────────────────────────

  async function handleSave() {
    if (!editSelectedId) { setSaveStatus('error'); setSaveMsg('No post loaded. Select a post from the dropdown first.'); return }
    if (!date || !title) { setSaveStatus('error'); setSaveMsg('Date and title are required.'); return }

    const newFullSlug = `${date}-${slug || titleToSlug(title)}`

    if (slugChanged) {
      const proceed = window.confirm(`You've changed the slug from "${editOriginalSlug}" to "${newFullSlug}".\n\nThis will change the post URL — any existing links to the old URL will break.\n\nSave anyway?`)
      if (!proceed) return
    }

    let postContent: string
    let videoId: string | undefined

    if (category === 'morning-intention') {
      if (!content.trim()) { setSaveStatus('error'); setSaveMsg('Post content cannot be empty.'); return }
      postContent = content.trim()
    } else {
      if (!walkUrl.trim() || !walkContext.trim()) { setSaveStatus('error'); setSaveMsg('YouTube URL and context are required.'); return }
      const vid = extractYoutubeId(walkUrl.trim())
      if (!vid) { setSaveStatus('error'); setSaveMsg('Could not extract a YouTube video ID from that URL.'); return }
      videoId = vid
      postContent = walkContext.trim()
    }

    setSaving(true)
    setSaveStatus('publishing')
    setSaveMsg('Saving...')

    try {
      const res = await fetch('/api/admin/posts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editSelectedId, slug: newFullSlug, title, date, category, content: postContent, excerpt: excerpt || undefined, image: image || undefined, videoId, review: review || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `Failed to save (${res.status})`)
      setSaveStatus('success')
      setSaveMsg(`https://wolfman.blog/posts/${newFullSlug}`)
      setEditOriginalSlug(newFullSlug)
      setSlugChanged(false)
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

  // ── Shared form ───────────────────────────────────────────────────────────

  const sharedForm = (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="admin-field">
          <label className="admin-label" htmlFor="postDate">Date</label>
          <input id="postDate" type="date" className="admin-input" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <div className="admin-field">
          <label className="admin-label" htmlFor="postTitle">Post Title</label>
          <input id="postTitle" type="text" className="admin-input" placeholder="The Honda Engine" value={title} onChange={e => handleTitleChange(e.target.value)} />
        </div>
      </div>

      <div className="admin-field">
        <label className="admin-label" htmlFor="postSlug">URL Slug</label>
        <input id="postSlug" type="text" className="admin-input" placeholder="auto-generated from title" value={slug} onChange={e => handleSlugChange(e.target.value)} />
        {isEditMode && slugChanged ? (
          <p className="admin-hint" style={{ color: '#A82020', opacity: 1 }}>
            ⚠ Slug changed: <strong>{editOriginalSlug}</strong> → <strong>{currentFullSlug}</strong>. Existing links to this post will break.
          </p>
        ) : (
          <p className="admin-hint">
            {isEditMode ? `Full URL: wolfman.blog/posts/${currentFullSlug}` : 'Auto-filled from title. Edit if needed. Date is prepended automatically.'}
          </p>
        )}
      </div>

      <div className="admin-field">
        <label className="admin-label" htmlFor="postCategory">Category</label>
        <select id="postCategory" className="admin-input" value={category} onChange={e => handleCategoryChange(e.target.value)}>
          <option value="morning-intention">Morning Intention</option>
          <option value="morning-walk">Morning Walk with Matthew</option>
        </select>
      </div>

      <div className="admin-field">
        <label className="admin-label" htmlFor="postImage">
          Social Image <span style={{ fontWeight: 400, textTransform: 'none', opacity: 0.7 }}>(optional — og:image only, not shown on post)</span>
        </label>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <input id="postImage" type="url" className="admin-input" placeholder="Upload below or paste a URL" value={image} onChange={e => setImage(e.target.value)} style={{ flex: 1, minWidth: 200 }} />
          <label className="admin-upload-btn" style={{ cursor: uploadingImage ? 'not-allowed' : 'pointer', opacity: uploadingImage ? 0.6 : 1 }}>
            {uploadingImage ? 'Uploading…' : 'Upload image'}
            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" style={{ display: 'none' }} disabled={uploadingImage} onChange={handleImageUpload} />
          </label>
        </div>
        {image && <img src={image} alt="Social preview" style={{ marginTop: '0.75rem', maxHeight: 120, maxWidth: '100%', borderRadius: 4, objectFit: 'cover' }} />}
        <p className="admin-hint">Used for social sharing previews on LinkedIn, Facebook etc. Not displayed on the post page.</p>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid var(--admin-border)', margin: '2rem 0' }} />

      {category === 'morning-intention' && (
        <>
          <div className="admin-field">
            <label className="admin-label" htmlFor="postContent">Post Content</label>
            <textarea id="postContent" className="admin-textarea"
              placeholder={`Use ## headings to separate sections:\n\n## Today's Intention\n\nYour story here...\n\n## I'm Grateful For\n\nSomething specific...\n\n## Something I'm Great At\n\nOwn it.`}
              value={content} onChange={e => setContent(e.target.value)} />
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
              <textarea className="admin-textarea" style={{ minHeight: '120px' }} value={review} onChange={e => setReview(e.target.value)} />
              <p className="admin-hint">Edit freely. This appears at the bottom of the published post attributed to Claude.</p>
            </div>
          )}
        </>
      )}

      {category === 'morning-walk' && (
        <>
          <div className="admin-field">
            <label className="admin-label" htmlFor="walkUrl">YouTube URL</label>
            <input id="walkUrl" type="url" className="admin-input" placeholder="https://www.youtube.com/watch?v=..." value={walkUrl} onChange={e => setWalkUrl(e.target.value)} />
          </div>
          <div className="admin-field">
            <label className="admin-label" htmlFor="walkContext">Context</label>
            <textarea id="walkContext" className="admin-textarea" placeholder="A few words about this walk..." value={walkContext} onChange={e => setWalkContext(e.target.value)} />
          </div>
        </>
      )}

      {/* Morning State — new posts only */}
      {!isEditMode && (
        <>
          <hr style={{ border: 'none', borderTop: '1px solid var(--admin-border)', margin: '2rem 0' }} />
          <div style={{ marginBottom: '1.5rem' }}>
            <p className="admin-label" style={{ marginBottom: '0.75rem' }}>Morning State</p>
            <p style={{ fontSize: '0.8rem', color: 'var(--body-text)', opacity: 0.7, margin: '0 0 1.25rem' }}>
              Captured once at publish time — how you arrived at this day.
            </p>

            {/* Routine checklist */}
            <div className="admin-field">
              <label className="admin-label">Morning Routine</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.25rem' }}>
                {ROUTINE_ITEMS.map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setRoutineChecklist(prev => ({ ...prev, [key]: !prev[key] }))}
                    style={{
                      padding: '0.4rem 0.85rem',
                      borderRadius: 20,
                      border: `2px solid ${routineChecklist[key] ? '#3AB87A' : '#ccc'}`,
                      background: routineChecklist[key] ? '#e8f6ee' : 'var(--admin-card-bg, #f8f8f8)',
                      color: routineChecklist[key] ? '#1e5c38' : 'var(--body-text)',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                      transition: 'all 0.15s ease',
                      fontWeight: routineChecklist[key] ? 600 : 400,
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Brain scale */}
            <div className="admin-field">
              <label className="admin-label">Brain Activity</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--body-text)', opacity: 0.7, minWidth: 64 }}>Peaceful</span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setBrainScale(n)}
                      style={{
                        width: 36, height: 36, borderRadius: '50%',
                        border: `2px solid ${brainScale === n ? '#4A7FA5' : '#ccc'}`,
                        background: brainScale === n ? '#4A7FA5' : 'var(--admin-card-bg, #f8f8f8)',
                        color: brainScale === n ? '#fff' : 'var(--body-text)',
                        fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer',
                        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                        transition: 'all 0.15s ease',
                      }}
                    >{n}</button>
                  ))}
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--body-text)', opacity: 0.7, minWidth: 48 }}>Manic</span>
              </div>
            </div>

            {/* Body scale */}
            <div className="admin-field">
              <label className="admin-label">Body Energy</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--body-text)', opacity: 0.7, minWidth: 64 }}>Lethargic</span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setBodyScale(n)}
                      style={{
                        width: 36, height: 36, borderRadius: '50%',
                        border: `2px solid ${bodyScale === n ? '#A0622A' : '#ccc'}`,
                        background: bodyScale === n ? '#A0622A' : 'var(--admin-card-bg, #f8f8f8)',
                        color: bodyScale === n ? '#fff' : 'var(--body-text)',
                        fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer',
                        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                        transition: 'all 0.15s ease',
                      }}
                    >{n}</button>
                  ))}
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--body-text)', opacity: 0.7, minWidth: 48 }}>Buzzing</span>
              </div>
            </div>
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
          Write your post, click Publish. It goes straight to the database and is live immediately.
        </p>

        {/* Tab toggle */}
        <div style={{ display: 'flex', gap: 0, marginBottom: '2rem', borderBottom: '2px solid var(--admin-border, #ddd)' }}>
          {(['new', 'edit'] as TabType[]).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: '0.6rem 1.25rem', border: 'none',
              borderBottom: activeTab === tab ? '2px solid #4A7FA5' : '2px solid transparent',
              marginBottom: '-2px', background: 'none',
              fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
              fontSize: '0.85rem', fontWeight: activeTab === tab ? 600 : 400,
              color: activeTab === tab ? '#e6edf3' : '#8b949e', cursor: 'pointer', letterSpacing: '0.03em',
            }}>
              {tab === 'new' ? 'New Post' : 'Edit Post'}
            </button>
          ))}
        </div>

        {/* ── NEW POST TAB ── */}
        {activeTab === 'new' && (
          <>
            {sharedForm}
            <button className="admin-publish-btn" onClick={handlePublish} disabled={publishing}>
              {publishing ? 'Publishing...' : 'Publish Post'}
            </button>
            {status !== 'idle' && (
              <div className={`admin-status admin-status--${status}`}>
                {status === 'publishing' && (<><span className="admin-spinner" /><span>{statusMsg}</span></>)}
                {status === 'success' && (
                  <>
                    <strong>Published.</strong> Your post is live.<br />
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      <a href={statusMsg} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', fontWeight: 600 }}>View post →</a>
                      <a href="/intentions" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', opacity: 0.75 }}>Go to all posts →</a>
                    </div>
                  </>
                )}
                {status === 'error' && <span><strong>Something went wrong.</strong> {statusMsg}</span>}
              </div>
            )}
          </>
        )}

        {/* ── EDIT POST TAB ── */}
        {activeTab === 'edit' && (
          <>
            <div className="admin-field">
              <label className="admin-label" htmlFor="editPostSelect">Select Post</label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <select id="editPostSelect" className="admin-input" value={editSelectedId}
                  onChange={e => { setEditSelectedId(e.target.value); if (e.target.value) loadEditPost(e.target.value) }}
                  style={{ flex: 1 }} disabled={loadingPostList}>
                  <option value="">{loadingPostList ? 'Loading posts…' : '— Select a post —'}</option>
                  {editPostList.map(p => <option key={p.id} value={p.id}>{slugToLabel(p)}</option>)}
                </select>
                <button type="button" className="admin-upload-btn" onClick={loadEditPostList} disabled={loadingPostList}
                  style={{ cursor: loadingPostList ? 'not-allowed' : 'pointer', opacity: loadingPostList ? 0.6 : 1 }}>
                  {loadingPostList ? 'Loading…' : 'Refresh'}
                </button>
              </div>
              {postListError
                ? <p className="admin-hint" style={{ color: '#A82020', opacity: 1 }}>{postListError}</p>
                : <p className="admin-hint">Posts sorted newest first. Selecting one loads all its fields.</p>}
            </div>

            {loadingPost && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', color: '#2a5a7a', fontSize: '0.9rem' }}>
                <span className="admin-spinner" />Loading post…
              </div>
            )}

            {!loadingPost && editSelectedId && (
              <>
                {sharedForm}
                <button className="admin-publish-btn" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                {saveStatus !== 'idle' && (
                  <div className={`admin-status admin-status--${saveStatus}`}>
                    {saveStatus === 'publishing' && (<><span className="admin-spinner" /><span>{saveMsg}</span></>)}
                    {saveStatus === 'success' && (
                      <>
                        <strong>Saved.</strong> Your changes are live.<br />
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                          <a href={saveMsg} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', fontWeight: 600 }}>View post →</a>
                          <a href="/intentions" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', opacity: 0.75 }}>Go to all posts →</a>
                        </div>
                      </>
                    )}
                    {saveStatus === 'error' && <span><strong>Something went wrong.</strong> {saveMsg}</span>}
                  </div>
                )}
              </>
            )}

            {!loadingPost && !editSelectedId && !loadingPostList && (
              <p style={{ color: 'var(--body-text)', opacity: 0.6, fontSize: '0.9rem', marginTop: '1rem' }}>
                Select a post above to load it for editing.
              </p>
            )}
          </>
        )}
      </div>

      <style>{`
        .admin-field { margin-bottom: 1.5rem; }
        .admin-label { display: block; font-size: 0.8rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--body-text); margin-bottom: 0.4rem; }
        .admin-input, .admin-textarea { width: 100%; padding: 0.6rem 0.75rem; border: 1px solid #ccc; border-radius: 4px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 0.95rem; background: #fff; color: #222; line-height: 1.5; box-sizing: border-box; }
        .admin-input:focus, .admin-textarea:focus { outline: none; border-color: #4A7FA5; box-shadow: 0 0 0 2px rgba(74,127,165,0.2); }
        .admin-textarea { resize: vertical; min-height: 280px; }
        .admin-hint { font-size: 0.78rem; color: var(--body-text); opacity: 0.75; margin-top: 0.3rem; }
        .admin-upload-btn { display: inline-block; background: #4A7FA5; color: #fff; border: none; padding: 0.5rem 1rem; border-radius: 4px; font-size: 0.85rem; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; white-space: nowrap; transition: background 0.2s ease; cursor: pointer; }
        .admin-upload-btn:hover { background: #3a6a8a; }
        .admin-publish-btn { background: #214459; color: #fff; border: none; padding: 0.75rem 2rem; font-size: 1rem; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; border-radius: 4px; cursor: pointer; font-weight: 600; }
        .admin-publish-btn:hover:not(:disabled) { background: #1a3547; }
        .admin-publish-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .admin-status { margin-top: 1.5rem; padding: 1rem 1.25rem; border-radius: 6px; font-size: 0.9rem; line-height: 1.6; }
        .admin-status--publishing { background: #eef4fb; border: 1px solid #b8d0e8; color: #2a5a7a; display: flex; align-items: center; gap: 0.75rem; }
        .admin-status--success { background: #e8f6ee; border: 1px solid #b0dcc0; color: #1e5c38; }
        .admin-status--error { background: #fbeaea; border: 1px solid #e0b0b0; color: #7a2020; }
        .admin-spinner { display: inline-block; width: 18px; height: 18px; border: 2px solid #b8d0e8; border-top-color: #2a5a7a; border-radius: 50%; animation: admin-spin 0.7s linear infinite; flex-shrink: 0; }
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
