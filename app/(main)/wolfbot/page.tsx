import WolfBotIcon from '@/components/WolfBotIcon'

export const metadata = {
  title: 'WOLF|BOT — Wolfman',
  description: 'Your AI journalling companion. Coming soon.',
}

export default function WolfBotPage() {
  return (
    <main className="wolfbot-page">
      <div className="wolfbot-page-inner">
        <WolfBotIcon size={220} className="wolfbot-page-icon" />
        <p className="wolfbot-page-caption">I am not fully functional yet :(</p>
      </div>
    </main>
  )
}
