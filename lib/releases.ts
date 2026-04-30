export type FeatureStatus = 'built' | 'in-development' | 'planned'
export type ReleaseStatus = 'live' | 'in-progress' | 'planned'

export interface Feature {
  name: string
  description: string
  status: FeatureStatus
}

export interface Release {
  version: string
  name: string
  tagline: string
  status: ReleaseStatus
  features: Feature[]
}

export const releases: Release[] = [
  {
    version: '0.1',
    name: 'Journaling',
    tagline: 'The foundation. Write your morning, track your rituals, see your patterns.',
    status: 'in-progress',
    features: [
      { name: 'Morning journal', description: 'Write your daily intention, gratitude, and strength.', status: 'built' },
      { name: 'Mood scales', description: 'Log your brain activity, body energy, and happiness (1–6) each morning.', status: 'built' },
      { name: 'Morning rituals', description: 'Track which of your 10 daily rituals you completed.', status: 'built' },
      { name: 'Evening reflection', description: 'End the day with a short reflection and a day rating.', status: 'built' },
      { name: 'Profile and stats', description: 'Your personal stats page with streaks, trends, and scatter charts.', status: 'built' },
      { name: 'Morning reminders', description: 'Opt-in email nudge to journal each morning at a time you choose.', status: 'planned' },
      { name: 'Admin panel', description: 'Beta health dashboard, error logs, and feedback view for Matthew.', status: 'planned' },
      { name: 'Data deletion', description: 'Delete your account and all your data from your profile settings.', status: 'planned' },
    ],
  },
  {
    version: '0.2',
    name: 'WOLF|BOT',
    tagline: 'Your AI journalling companion. It reads your mornings and talks back.',
    status: 'planned',
    features: [
      { name: 'WOLF|BOT review', description: 'After you publish a journal, WOLF|BOT generates a personal synthesis of your day.', status: 'built' },
      { name: 'Personality modes', description: 'Choose how WOLF|BOT talks to you — from gentle coach to straight-talking sparring partner.', status: 'planned' },
      { name: 'Title suggestion', description: 'Let WOLF|BOT suggest a title for your journal if you leave it blank.', status: 'planned' },
      { name: 'Prompt configuration', description: 'Admin control over WOLF|BOT prompts with version history and rollback.', status: 'planned' },
    ],
  },
  {
    version: '0.3',
    name: 'Communities',
    tagline: 'Journal alongside others. Public communities, shared rhythms.',
    status: 'planned',
    features: [
      { name: 'Community feed', description: 'Join communities and see fellow members\' public journal entries in your feed.', status: 'planned' },
      { name: 'Community pages', description: 'Every community has its own page — open or closed, visible or private.', status: 'planned' },
      { name: 'Public sharing toggle', description: 'Choose to make individual journals visible to your community.', status: 'planned' },
      { name: 'Communities navigation', description: 'Browse and join communities from the main navigation.', status: 'planned' },
    ],
  },
  {
    version: '0.4',
    name: 'Rituals',
    tagline: 'Your rituals, fully realised. Logos, descriptions, and your own additions.',
    status: 'planned',
    features: [
      { name: 'Ritual library', description: 'All standard rituals with icons, names, and plain-English descriptions.', status: 'planned' },
      { name: 'Custom rituals', description: 'Add your own rituals beyond the standard ten.', status: 'planned' },
    ],
  },
  {
    version: '0.5',
    name: 'Statistics',
    tagline: 'Deeper insight into your mornings. Site-wide patterns. The data layer for everything that follows.',
    status: 'planned',
    features: [
      { name: 'Enhanced profile stats', description: 'Richer charts and breakdowns on your personal stats page.', status: 'planned' },
      { name: 'Site-wide statistics', description: 'Aggregated community patterns — what the collective morning looks like.', status: 'planned' },
      { name: 'WOLF|BOT data layer', description: 'WOLF|BOT gains access to your long-term patterns, not just today\'s entry.', status: 'planned' },
    ],
  },
  {
    version: '0.6',
    name: 'Achievements',
    tagline: 'Your consistency, recognised. Streaks, badges, and milestones worth earning.',
    status: 'planned',
    features: [
      { name: 'Streak tracking', description: 'Current and longest streaks, tracked and celebrated.', status: 'planned' },
      { name: 'Achievement badges', description: 'Earn badges for consistency, rituals completed, and milestones reached.', status: 'planned' },
      { name: 'Achievements history', description: 'A timeline of your achievements on your profile.', status: 'planned' },
    ],
  },
  {
    version: '0.7',
    name: 'Shop',
    tagline: 'Photography canvases and prints. Something to hold from a morning that moved you.',
    status: 'planned',
    features: [
      { name: 'Photography prints', description: 'Matthew\'s own photography available as canvases and prints.', status: 'planned' },
      { name: 'Print-on-demand', description: 'Orders fulfilled automatically via Printful.', status: 'planned' },
      { name: 'Guest checkout', description: 'No account needed to buy — just choose, pay, and it arrives.', status: 'planned' },
    ],
  },
  {
    version: '0.8',
    name: 'Subscriptions',
    tagline: 'Support the project. Unlock the tools that need a little more to run.',
    status: 'planned',
    features: [
      { name: 'Free tier', description: 'Core journalling, rituals, scales, and WOLF|BOT review — always free.', status: 'planned' },
      { name: 'Premium tier', description: 'Custom rituals, advanced statistics, WOLF|BOT personality modes, and more.', status: 'planned' },
      { name: 'Feature comparison page', description: 'A clear, honest breakdown of what\'s free and what\'s premium.', status: 'planned' },
    ],
  },
  {
    version: '0.9',
    name: 'Legal',
    tagline: 'The last gate before go-live. Everything signed off, every box ticked.',
    status: 'planned',
    features: [
      { name: 'Full terms and conditions', description: 'Properly reviewed T&Cs covering the site, shop, and subscriptions.', status: 'planned' },
      { name: 'GDPR compliance', description: 'Cookie consent, data subject rights, retention policies.', status: 'planned' },
      { name: 'EU and US legal requirements', description: 'Jurisdictional compliance review — where we can and cannot operate.', status: 'planned' },
      { name: 'Privacy policy', description: 'Full privacy policy covering all data collected and how it is used.', status: 'planned' },
    ],
  },
]
