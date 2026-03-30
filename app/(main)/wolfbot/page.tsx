import Link from 'next/link'
import WolfBotIcon from '@/components/WolfBotIcon'

export const metadata = {
  title: 'WOLF|BOT — Wolfman',
  description: 'Your AI search and journalling companion. Coming soon.',
}

export default function WolfBotPage() {
  return (
    <main className="wolfbot-page">
      <div className="wolfbot-coming-soon">

        <div className="wolfbot-coming-icon-wrap">
          <WolfBotIcon size={180} className="wolfbot-page-icon" />
        </div>

        <div className="wolfbot-coming-terminal">
          <div className="wolfbot-terminal-bar">
            <span className="wolfbot-terminal-dot wbt-red" />
            <span className="wolfbot-terminal-dot wbt-amber" />
            <span className="wolfbot-terminal-dot wbt-green" />
            <span className="wolfbot-terminal-label">WOLF|BOT v0.0.1-alpha</span>
          </div>
          <div className="wolfbot-bubble-inner">
            <p className="wolfbot-terminal-line">
              <span className="wbt-prompt">&gt;&nbsp;</span>
              <span className="wbt-boot">WOLF|BOT SEARCH ENGINE</span>
            </p>
            <p className="wolfbot-terminal-line">
              <span className="wbt-prompt">&gt;&nbsp;</span>
              <span className="wbt-boot">STATUS: UNDER CONSTRUCTION</span>
            </p>
            <p className="wolfbot-terminal-line">&nbsp;</p>
            <p className="wolfbot-terminal-line wbt-body">
              I&apos;m being built. My neural pathways are still calibrating.
              My search index is... mostly vibes right now.
            </p>
            <p className="wolfbot-terminal-line">&nbsp;</p>
            <p className="wolfbot-terminal-line wbt-body">
              The plan: search journals, features, the full Wolfman archive.
              Answer questions. Judge morning routines. Respectfully.
            </p>
            <p className="wolfbot-terminal-line">&nbsp;</p>
            <p className="wolfbot-terminal-line">
              <span className="wbt-prompt">&gt;&nbsp;</span>
              <span className="wbt-boot">FOLLOW PROGRESS:</span>
            </p>
          </div>
        </div>

        <Link href="/dev" className="wolfbot-coming-dev-link">
          View Dev Log →
        </Link>

      </div>
    </main>
  )
}
