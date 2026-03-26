export default function LandscapeBlock() {
  return (
    <div className="landscape-block" aria-hidden="true">
      <svg
        className="landscape-block-icon"
        width="64"
        height="64"
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Phone outline */}
        <rect x="20" y="8" width="24" height="40" rx="4" stroke="rgba(255,255,255,0.6)" strokeWidth="2" fill="none"/>
        {/* Home indicator */}
        <rect x="28" y="43" width="8" height="2" rx="1" fill="rgba(255,255,255,0.4)"/>
        {/* Rotation arrow */}
        <path
          d="M10 32 C10 18 22 8 36 8"
          stroke="rgba(255,255,255,0.85)"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />
        <polyline
          points="32,4 36,8 32,12"
          stroke="rgba(255,255,255,0.85)"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <p className="landscape-block-title">rotate your device</p>
      <p className="landscape-block-subtitle">wolfman works best in portrait</p>
    </div>
  )
}
