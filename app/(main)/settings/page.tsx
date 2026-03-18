import ThemeButtons from '@/components/ThemeButtons'
import FontSizeButtons from '@/components/FontSizeButtons'

export default function SettingsPage() {
  return (
    <main className="settings-main">
      <div className="settings-section">
        <h1 className="settings-title">settings</h1>
        <ThemeButtons />
        <FontSizeButtons />
      </div>
    </main>
  )
}
