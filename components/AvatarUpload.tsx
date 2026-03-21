'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'

interface AvatarUploadProps {
  currentAvatar: string | null
  name: string | null
}

export default function AvatarUpload({ currentAvatar, name }: AvatarUploadProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(currentAvatar)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const initials = name
    ? name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  async function handleFile(file: File) {
    setUploading(true)
    setError(null)
    const form = new FormData()
    form.append('file', file)
    try {
      const res = await fetch('/api/user/avatar', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Upload failed')
      setAvatarUrl(data.avatarUrl)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="avatar-upload">
      <button
        className="avatar-btn"
        onClick={() => inputRef.current?.click()}
        aria-label="Change profile photo"
        disabled={uploading}
      >
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt="Profile photo"
            width={80}
            height={80}
            className="avatar-img"
            unoptimized
          />
        ) : (
          <span className="avatar-initials">{initials}</span>
        )}
        <span className="avatar-overlay">{uploading ? '…' : 'change'}</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
      />
      {error && <p className="avatar-error">{error}</p>}
    </div>
  )
}
