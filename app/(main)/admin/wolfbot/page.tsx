'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type Config = Record<string, string | number | null>

const PROMPT_FIELDS = [
  { key: 'prompt_core',    label: 'Core Prompt',    rows: 8 },
  { key: 'prompt_helpful', label: 'HELPFUL Prompt', rows: 6 },
  { key: 'prompt_sassy',   label: 'SASSY Prompt',   rows: 6 },
]

export default function WolfBotConfigPage() {
  const router = useRouter()
  const [config, setConfig] = useState<Config>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/wolfbot-config')
      .then(r => r.json())
      .then((rows: { key: string; value: string | number | null }[]) => {
        const map: Config = {}
        for (const row of rows) map[row.key] = row.value
        setConfig(map)
        setLoading(false)
      })
  }, [])

  async function save(key: string, value: string | number) {
    setSaving(key)
    setSaved(null)
    await fetch('/api/admin/wolfbot-config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value }),
    })
    setSaving(null)
    setSaved(key)
    setTimeout(() => setSaved(null), 2000)
  }

  if (loading) return <main className="dash-main"><div className="dash-wrap"><p className="dash-empty">Loading…</p></div></main>

  const promptVersion = config['prompt_version'] ?? '—'

  return (
    <main className="dash-main">
      <div className="dash-wrap">

        <header className="dash-header">
          <div>
            <h1 className="dash-title">WOLF|BOT Config</h1>
            <p className="dash-subtitle">WOLF BRAIN v{promptVersion} — live prompt editor</p>
          </div>
          <button className="dash-link" onClick={() => router.push('/admin')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            ← Admin
          </button>
        </header>

        {/* Prompts */}
        {PROMPT_FIELDS.map(({ key, label, rows }) => (
          <section key={key} className="dash-section">
            <h2 className="dash-section-title">{label}</h2>
            <textarea
              className="dash-config-textarea"
              rows={rows}
              defaultValue={(config[key] as string) ?? ''}
              onBlur={e => {
                if (e.target.value !== (config[key] ?? '')) {
                  save(key, e.target.value)
                }
              }}
            />
            {saving === key && <p className="dash-muted" style={{ marginTop: '0.5rem' }}>Saving…</p>}
            {saved === key && <p style={{ marginTop: '0.5rem', color: '#3AB87A', fontSize: '0.8rem' }}>Saved ✓</p>}
          </section>
        ))}

        {/* Max tokens */}
        <section className="dash-section">
          <h2 className="dash-section-title">Max tokens per review</h2>
          <input
            type="number"
            className="dash-config-textarea"
            style={{ width: '120px', fontFamily: 'inherit' }}
            defaultValue={(config['max_tokens'] as number) ?? 600}
            onBlur={e => {
              const val = parseInt(e.target.value, 10)
              if (!isNaN(val) && val !== config['max_tokens']) save('max_tokens', val)
            }}
          />
          {saving === 'max_tokens' && <p className="dash-muted" style={{ marginTop: '0.5rem' }}>Saving…</p>}
          {saved === 'max_tokens' && <p style={{ marginTop: '0.5rem', color: '#3AB87A', fontSize: '0.8rem' }}>Saved ✓</p>}
        </section>

        <p className="dash-muted" style={{ fontSize: '0.75rem', marginTop: '1rem' }}>
          Changes save on blur. Each prompt save auto-increments WOLF BRAIN version and logs to audit trail.
        </p>

      </div>
    </main>
  )
}
