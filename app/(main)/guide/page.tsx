import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'The Guide — Wolfman',
  description: 'Everything you need to know about wolfman.blog — how it works, what to expect, and how to get the most from it.',
}

const SECTIONS = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    items: [
      {
        q: 'What is wolfman.blog?',
        a: 'wolfman.blog is a mindful morning journalling app in public beta. Write your daily intentions, log your morning routine, track your mood and energy, and receive an AI-generated reflection on your day. It is also the personal blog of Matthew Wolfman — a data engineer, mountain biker, and mindful human based in the UK.',
      },
      {
        q: 'How do I register?',
        a: 'Registration is currently open to public beta users. You can sign up with your Google account, GitHub account, or with an email and password. Once registered, you can start writing journals immediately.',
      },
      {
        q: 'How do I write my first journal?',
        a: 'Tap the + button in the top-left corner of any page, or find "Write a Journal" in the Site Navigation panel. Your journal has three sections: Today\'s Intention (your story or reflection), I\'m Grateful For (something specific and real), and Something I\'m Great At (a strength, owned without apology).',
      },
      {
        q: 'Are my journals private?',
        a: 'Yes. Your journals are private by default. Only you can see your drafts and published entries unless you choose to share them publicly.',
      },
    ],
  },
  {
    id: 'journaling',
    title: 'Journaling',
    items: [
      {
        q: 'What is the morning intention format?',
        a: 'Each journal has three sections. Today\'s Intention is a story, observation, or reflection that leads to a lesson or intention for the day. I\'m Grateful For captures something specific, vivid, and personal — never generic. Something I\'m Great At is a strength, owned with confidence.',
      },
      {
        q: 'What are morning scales?',
        a: 'When you publish a journal, you can log three scales from 1–6: Brain Activity (how sharp and focused you feel), Body Energy (how your body feels physically), and Happy Scale (your general mood and happiness). These build up over time into your personal stats.',
      },
      {
        q: 'What is the morning routine checklist?',
        a: 'The checklist tracks 10 morning rituals: sunlight exposure, breathwork, cacao, meditation, cold shower, walk, animal love, caffeine, yoga, and workout. Tick the ones you completed each morning. Over time, patterns emerge.',
      },
      {
        q: 'What is Claude\'s Take?',
        a: 'Claude\'s Take is an AI-generated synthesis of your day, created from your journal entry and morning state data. It gives you a thoughtful reflection on your intentions and how your energy and mood aligned with them. It generates automatically when you review and publish your journal.',
      },
      {
        q: 'What is an evening reflection?',
        a: 'After your day, you can return to your journal and add an evening reflection — a short note on how the day went, whether it went to plan, and a day rating out of 6. This feeds back into Claude\'s Take for a complete picture of your day.',
      },
    ],
  },
  {
    id: 'wolf-bot',
    title: 'WOLF|BOT',
    items: [
      {
        q: 'What is WOLF|BOT?',
        a: 'WOLF|BOT is your AI journalling companion — a character built specifically for the Wolfman experience. It will guide you through your morning routine, respond to your journal entries, and offer personalised reflections based on your habits over time.',
      },
      {
        q: 'Is WOLF|BOT available yet?',
        a: 'WOLF|BOT is in development and will be available in Release 0.2 of the beta. For now, you can meet it at the WOLF|BOT page — it is honest about where it is in its journey.',
      },
    ],
  },
  {
    id: 'your-profile',
    title: 'Your Profile',
    items: [
      {
        q: 'What is on my profile page?',
        a: 'Your profile shows your published journals, your morning stats (total entries, current streak, longest streak), a Morning Zone scatter chart of your brain and body energy over time, and your morning ritual breakdown.',
      },
      {
        q: 'How do I set a username?',
        a: 'Go to Account from the navigation. You can set a custom username that becomes your public profile URL — wolfman.blog/your-username. Usernames are checked for availability in real time.',
      },
      {
        q: 'Can I customise how the site looks?',
        a: 'Yes. Tap the settings cog in the top-right corner to choose your theme (dark, light, warm, cool), font size, and font family. These preferences are saved to your account and carry across all your devices.',
      },
    ],
  },
  {
    id: 'the-beta',
    title: 'The Beta',
    items: [
      {
        q: 'What is the beta?',
        a: 'wolfman.blog is currently in public beta, running from 1 May to 31 August 2026. The beta is capped at 51 users. It is a real, working product — not a prototype. Your data is real and will carry forward if the beta is successful.',
      },
      {
        q: 'What happens to my data when the beta ends?',
        a: 'If the beta is successful, your data migrates to the full app and you carry on seamlessly. If it is not continued, you will be notified immediately with a 30-day window to download all your data before hard deletion.',
      },
      {
        q: 'How do I give feedback?',
        a: 'Tap "SEND FEEDBACK" in the top navigation bar, or find the feedback link in the Site Navigation panel. Feedback goes directly to the development team via GitHub Issues. Every piece of feedback is read.',
      },
      {
        q: 'Where can I see what is being built?',
        a: 'The Features page gives a non-technical overview of planned releases. The Dev Log shows the live GitHub issues, branches, and pull requests for a technical view of active development.',
      },
    ],
  },
  {
    id: 'communities',
    title: 'Communities',
    items: [
      {
        q: 'What are communities?',
        a: 'Communities are shared spaces where groups of people — a team, a family, a running club — can journal together, share intentions publicly within the group, and see each other\'s morning stats. Communities are coming in Release 0.3.',
      },
      {
        q: 'Can I create a private community?',
        a: 'Yes. Communities will support both public and private modes. Private communities are invite-only. Public communities are discoverable. Custom communities (user-defined names and descriptions) will be available at launch.',
      },
    ],
  },
]

export default function GuidePage() {
  return (
    <main className="guide-page">
      <div className="guide-inner">
        <header className="guide-header">
          <h1 className="guide-title">The Guide</h1>
          <p className="guide-subtitle">
            Everything you need to know about wolfman.blog — how it works, what to expect, and how to get the most from your mornings.
          </p>
        </header>

        <nav className="guide-toc" aria-label="Guide contents">
          <p className="guide-toc-label">In this guide</p>
          <ul className="guide-toc-list">
            {SECTIONS.map(s => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="guide-toc-link">{s.title}</a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="guide-sections">
          {SECTIONS.map(section => (
            <section key={section.id} id={section.id} className="guide-section">
              <h2 className="guide-section-title">{section.title}</h2>
              <dl className="guide-items">
                {section.items.map((item, i) => (
                  <div key={i} className="guide-item">
                    <dt className="guide-item-q">{item.q}</dt>
                    <dd className="guide-item-a">{item.a}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>

        <footer className="guide-footer">
          <p>
            Something missing or out of date?{' '}
            <a href="/feedback" className="guide-footer-link">Let us know.</a>
          </p>
        </footer>
      </div>
    </main>
  )
}
