// Skeleton fallbacks for Suspense-wrapped journal sections.
// Each skeleton matches the approximate dimensions of its loaded state
// to minimise layout shift during streaming.

function Pulse({ className }: { className?: string }) {
  return <div className={`skel-pulse ${className ?? ''}`} />
}

// ── Section 1: Journal text + WOLF|BOT review ───────────────────────────────

export function Section1Skeleton() {
  return (
    <div className="journal-section journal-section--text skel-section">
      <Pulse className="skel-line skel-line--title" />
      <Pulse className="skel-line skel-line--full" />
      <Pulse className="skel-line skel-line--full" />
      <Pulse className="skel-line skel-line--3q" />
      <Pulse className="skel-line skel-line--full" />
      <Pulse className="skel-line skel-line--half" />
      <div className="skel-spacer" />
      <Pulse className="skel-line skel-line--full" />
      <Pulse className="skel-line skel-line--full" />
      <Pulse className="skel-line skel-line--3q" />
    </div>
  )
}

// ── Section 2: How I Showed Up (score rings) ─────────────────────────────────

export function Section2Skeleton() {
  return (
    <div className="journal-section skel-section">
      <Pulse className="skel-label" />
      <div className="skel-rings">
        <Pulse className="skel-ring" />
        <Pulse className="skel-ring" />
        <Pulse className="skel-ring" />
        <Pulse className="skel-ring" />
      </div>
    </div>
  )
}

// ── Section 3: Morning Rituals (vertical stack) ──────────────────────────────

export function Section3Skeleton() {
  return (
    <div className="journal-section skel-section">
      <div className="skel-pulse skel-label" />
      <div className="skel-ritual-stack">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skel-ritual-row">
            <div className="skel-pulse skel-ritual-icon" />
            <div className="skel-ritual-spacer" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Section 4: Post info + navigation ────────────────────────────────────────

export function Section4Skeleton() {
  return (
    <div className="journal-section skel-section">
      <Pulse className="skel-line skel-line--half" />
      <Pulse className="skel-line skel-line--3q" />
      <div className="skel-spacer" />
      <Pulse className="skel-btn" />
      <Pulse className="skel-btn" />
    </div>
  )
}

// ── Section 5: Writing Stats (bar chart skeleton) ─────────────────────────────

const BAR_HEIGHTS = ['55%', '75%', '40%', '90%', '65%', '85%', '70%', '100%', '60%', '80%']

export function Section5Skeleton() {
  return (
    <div className="journal-section skel-section">
      <div className="skel-pulse skel-label" />
      <div className="skel-bars">
        {BAR_HEIGHTS.map((h, i) => (
          <div key={i} className="skel-pulse skel-bar" style={{ height: h }} />
        ))}
      </div>
      <div className="skel-spacer" />
    </div>
  )
}
