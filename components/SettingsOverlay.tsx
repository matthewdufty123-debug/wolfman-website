'use client'

import ThemeButtons from './ThemeButtons'
import FontSizeButtons from './FontSizeButtons'
import FontFamilyButtons from './FontFamilyButtons'

interface SettingsOverlayProps {
  open: boolean
  onClose: () => void
}

export default function SettingsOverlay({ open, onClose }: SettingsOverlayProps) {
  return (
    <div
      className={`settings-overlay${open ? ' is-open' : ''}`}
      aria-hidden={!open}
    >
      <button
        className="settings-close"
        aria-label="Close experience settings"
        onClick={onClose}
      >
        &times;
      </button>
      <div className="settings-inner">
        <p className="settings-overlay-title">experience</p>
        <ThemeButtons />
        <FontSizeButtons />
        <FontFamilyButtons />
      </div>
    </div>
  )
}
