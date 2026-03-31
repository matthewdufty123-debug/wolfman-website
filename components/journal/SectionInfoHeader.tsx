'use client'

import { useState } from 'react'

interface Props {
  title: string
  description: string
  popupBody: string
  popupLink?: { href: string; label: string }
}

export default function SectionInfoHeader({ title, description, popupBody, popupLink }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div className="sih-wrap">
      <div className="sih-title-row">
        <h2 className="sih-title">{title}</h2>
        <button
          type="button"
          className="sih-q-btn"
          aria-label={`About ${title}`}
          onClick={() => setOpen(true)}
        >?</button>
      </div>
      <p className="sih-desc">{description}</p>

      {open && (
        <>
          <div
            className="sih-backdrop"
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`About ${title}`}
            className="sih-popup"
          >
            <button
              type="button"
              className="sih-popup-close"
              aria-label="Close"
              onClick={() => setOpen(false)}
            >✕</button>
            <h3 className="sih-popup-title">{title}</h3>
            <p className="sih-popup-body">{popupBody}</p>
            {popupLink && (
              <a href={popupLink.href} className="sih-popup-link">
                {popupLink.label} →
              </a>
            )}
          </div>
        </>
      )}
    </div>
  )
}
