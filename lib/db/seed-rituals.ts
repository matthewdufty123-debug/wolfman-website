/**
 * One-time seed script: populate the rituals table with the 10 existing
 * hardcoded rituals from RoutineIcons.tsx.
 *
 * Run:  npx tsx lib/db/seed-rituals.ts
 *
 * SVG content is the inner markup only (no wrapping <svg> tag).
 * The RitualIcon component wraps it at render time.
 *
 * Note: animalLove uses fill="{{color}}" instead of stroke — the RitualIcon
 * component handles this via a data-fill attribute on the DB record.
 */
import { config } from 'dotenv'
config({ path: '.env.local' })

import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { rituals } from './schema'

const sql = neon(process.env.DATABASE_URL!)
const db = drizzle(sql)

const SEED_RITUALS = [
  {
    key: 'sunlight',
    label: 'Sunlight',
    description: 'Natural light directly in the eyes to anchor your circadian rhythm',
    category: 'Mindfulness',
    color: '#C8B020',
    emoji: '🌅',
    hashtag: '#sunlight',
    sortOrder: 0,
    svgContent: `<circle cx="9" cy="9" r="3"/><line x1="9" y1="1.5" x2="9" y2="3.5"/><line x1="9" y1="14.5" x2="9" y2="16.5"/><line x1="1.5" y1="9" x2="3.5" y2="9"/><line x1="14.5" y1="9" x2="16.5" y2="9"/><line x1="3.4" y1="3.4" x2="4.8" y2="4.8"/><line x1="13.2" y1="13.2" x2="14.6" y2="14.6"/><line x1="14.6" y1="3.4" x2="13.2" y2="4.8"/><line x1="4.8" y1="13.2" x2="3.4" y2="14.6"/>`,
  },
  {
    key: 'breathwork',
    label: 'Breathwork',
    description: 'Pranayama or Wim Hof — breathwork to regulate the nervous system',
    category: 'Mindfulness',
    color: '#70C0C8',
    emoji: '🌬️',
    hashtag: '#breathwork',
    sortOrder: 1,
    svgContent: `<path d="M2 9 C4 5, 6 5, 8 9 S12 13, 14 9 S16 5, 16 7"/><path d="M9 14 C9 14, 9 12, 9 11" opacity="0.5"/><circle cx="9" cy="15" r="1" fill="currentColor" stroke="none"/>`,
  },
  {
    key: 'meditation',
    label: 'Still Meditation',
    description: 'Sitting in stillness to observe the mind before the day',
    category: 'Mindfulness',
    color: '#4A7FA5',
    emoji: '🧘',
    hashtag: '#meditation',
    sortOrder: 2,
    svgContent: `<circle cx="9" cy="3.5" r="1.5"/><path d="M6 14 Q9 12 12 14"/><path d="M4 10 Q6.5 7 9 8 Q11.5 7 14 10"/><line x1="4" y1="10" x2="3" y2="13"/><line x1="14" y1="10" x2="15" y2="13"/><line x1="9" y1="8" x2="9" y2="12"/>`,
  },
  {
    key: 'coldShower',
    label: 'Cold Shower',
    description: 'Cold exposure to activate presence and sharpen the body',
    category: 'Physical',
    color: '#2A6AB0',
    emoji: '🧊',
    hashtag: '#coldshower',
    sortOrder: 3,
    svgContent: `<path d="M4 4 L4 7 Q4 8 5 8 L13 8 Q14 8 14 7 L14 4"/><line x1="4" y1="4" x2="14" y2="4"/><line x1="7" y1="11" x2="7" y2="13"/><line x1="9" y1="11" x2="9" y2="13"/><line x1="11" y1="11" x2="11" y2="13"/><line x1="6" y1="14" x2="6" y2="16"/><line x1="9" y1="14.5" x2="9" y2="16.5"/><line x1="12" y1="14" x2="12" y2="16"/>`,
  },
  {
    key: 'yoga',
    label: 'Yoga Movement',
    description: 'Yoga movement to stretch, breathe and arrive in the body',
    category: 'Physical',
    color: '#8070B0',
    emoji: '🧘',
    hashtag: '#yoga',
    sortOrder: 4,
    svgContent: `<circle cx="9" cy="3" r="1.5"/><line x1="9" y1="4.5" x2="9" y2="10"/><line x1="9" y1="7" x2="2.5" y2="7"/><line x1="9" y1="7" x2="15.5" y2="7"/><path d="M9 10 L6.5 13 L6 16"/><line x1="9" y1="10" x2="13" y2="15.5"/>`,
  },
  {
    key: 'workout',
    label: 'Workout',
    description: 'Physical training to build strength and charge the day ahead',
    category: 'Physical',
    color: '#C05828',
    emoji: '💪',
    hashtag: '#morningworkout',
    sortOrder: 5,
    svgContent: `<line x1="6" y1="9" x2="12" y2="9" stroke-width="2.5"/><rect x="1.5" y="6" width="4.5" height="6" rx="1.5"/><rect x="12" y="6" width="4.5" height="6" rx="1.5"/>`,
  },
  {
    key: 'walk',
    label: 'Outside Walk',
    description: 'Moving through nature to ground and clear the mind',
    category: 'Connection',
    color: '#3AB87A',
    emoji: '🌿',
    hashtag: '#morningwalk',
    sortOrder: 6,
    svgContent: `<circle cx="9" cy="3" r="1.5"/><path d="M9 5 L8 9 L5 11"/><path d="M9 5 L10 9 L13 11"/><path d="M8 9 L7 13 L5 15"/><path d="M10 9 L11 13 L13 15"/>`,
  },
  {
    key: 'animalLove',
    label: 'Animal Love',
    description: 'Connecting with animals for a moment of pure presence',
    category: 'Connection',
    color: '#C87840',
    emoji: '🐾',
    hashtag: '#animallove',
    sortOrder: 7,
    // This icon uses fill instead of stroke — RitualIcon handles via data-fill-icon attribute
    svgContent: `<ellipse cx="9" cy="12" rx="3.5" ry="2.5"/><ellipse cx="5.5" cy="9" rx="1.3" ry="1.6"/><ellipse cx="12.5" cy="9" rx="1.3" ry="1.6"/><ellipse cx="7" cy="7" rx="1.2" ry="1.4"/><ellipse cx="11" cy="7" rx="1.2" ry="1.4"/>`,
  },
  {
    key: 'cacao',
    label: 'Ceremonial Drink',
    description: 'Cacao, Matcha or other mindful ceremonial morning drink',
    category: 'Nourishment',
    color: '#A0622A',
    emoji: '🍫',
    hashtag: '#ceremonialdrink',
    sortOrder: 8,
    svgContent: `<path d="M5 8 Q5 14 9 14 Q13 14 13 8 Z"/><line x1="5" y1="8" x2="13" y2="8"/><path d="M7 3 Q7 1.5 8.5 2 Q8.5 3.5 7 3" stroke-width="1.2"/><path d="M10 4 Q10 2.5 11.5 3 Q11.5 4.5 10 4" stroke-width="1.2"/><line x1="13" y1="10" x2="15" y2="10" stroke-width="1.5"/><path d="M15 8.5 Q16.5 10 15 11.5"/>`,
  },
  {
    key: 'caffeine',
    label: 'Drink Caffeine',
    description: 'Tea or Coffee — a mindful morning brew to awaken the senses',
    category: 'Nourishment',
    color: '#7A5030',
    emoji: '☕',
    hashtag: '#morningcoffee',
    sortOrder: 9,
    svgContent: `<path d="M3 8 L3 14 Q3 16 5 16 L12 16 Q14 16 14 14 L14 8"/><line x1="3" y1="8" x2="14" y2="8"/><path d="M14 9.5 Q17 9.5 17 12 Q17 14.5 14 14.5"/><path d="M7.5 5.5 Q7 4 8 3"/><path d="M10.5 5.5 Q10 4 11 3"/>`,
  },
]

async function seed() {
  console.log('Seeding rituals table with 10 existing rituals...')

  for (const ritual of SEED_RITUALS) {
    await db
      .insert(rituals)
      .values(ritual)
      .onConflictDoNothing({ target: rituals.key })
    console.log(`  ✓ ${ritual.key} (${ritual.category})`)
  }

  console.log('Done! Seeded', SEED_RITUALS.length, 'rituals.')
  process.exit(0)
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
