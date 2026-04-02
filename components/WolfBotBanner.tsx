'use client'

import { useEffect, useState } from 'react'

export default function WolfBotBanner() {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const section = document.getElementById('wolfbot-review')
    if (!section) return
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0.1 }
    )
    observer.observe(section)
    return () => observer.disconnect()
  }, [])

  function scrollToReview() {
    document.getElementById('wolfbot-review')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div
      className={`wolfbot-banner${visible ? '' : ' wolfbot-banner--hidden'}`}
      onClick={scrollToReview}
      role="button"
      tabIndex={0}
      aria-label="Scroll to WOLF|BOT review"
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') scrollToReview() }}
    >
      <span className="wolfbot-banner-text">WOLF|BOT&apos;S REVIEW ↓</span>
    </div>
  )
}
