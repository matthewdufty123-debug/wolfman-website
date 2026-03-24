import { config } from 'dotenv'
config({ path: '.env.local' })

import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { wolfbotConfig } from './schema'

const sql = neon(process.env.DATABASE_URL!)
const db = drizzle(sql)

// ── Colour Palette ──────────────────────────────────────────────────────────
const COLOUR_PALETTE = [
  { num: 1,  hex: '#2E2E2E', name: 'Background' },
  { num: 2,  hex: '#D9D9D9', name: 'Main Fur' },
  { num: 3,  hex: '#2E2E2E', name: 'Core Facial Feature' },
  { num: 4,  hex: '#7F7F7F', name: 'Alternate Facial' },
  { num: 5,  hex: '#4A90C4', name: 'Outer Eye' },
  { num: 6,  hex: '#C6DDEA', name: 'Inner Eye' },
  { num: 7,  hex: '#BB9040', name: 'Tongue / Bronze' },
  { num: 8,  hex: '#E8A0B0', name: 'Heart / Blush' },
  { num: 9,  hex: '#BF7E54', name: 'Object Colour' },
  { num: 10, hex: '#A72525', name: 'Angry' },
]

// ── Base Sprite v0.4 (locked) ───────────────────────────────────────────────
const BASE_SPRITE = [
  [1,1,1,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,1,1,1],
  [1,1,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,1,1],
  [1,2,2,4,4,2,2,1,1,1,1,1,1,1,1,1,1,1,2,2,4,4,2,2,1],
  [1,2,4,4,4,4,2,2,1,1,1,1,1,1,1,1,1,2,2,4,4,4,4,2,1],
  [1,2,4,4,4,4,4,2,2,2,2,2,2,2,2,2,2,2,4,4,4,4,4,2,1],
  [1,2,4,4,4,4,4,2,2,2,2,2,2,2,2,2,2,2,4,4,4,4,4,2,1],
  [1,2,4,4,4,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,4,4,4,2,1],
  [1,2,2,2,2,2,5,5,5,2,2,2,2,2,2,2,5,5,5,2,2,2,2,2,1],
  [1,2,2,2,2,5,5,5,5,5,5,2,2,2,5,5,5,5,5,5,2,2,2,2,1],
  [1,1,2,2,2,5,5,5,6,6,5,2,2,2,5,6,6,5,5,5,2,2,2,1,1],
  [1,1,1,2,2,2,2,5,6,6,5,2,2,2,5,6,6,5,2,2,2,2,1,1,1],
  [1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,1,1,1],
  [1,1,1,1,2,2,2,2,2,2,2,4,4,4,2,2,2,2,2,2,2,1,1,1,1],
  [1,1,1,1,2,2,2,2,2,2,3,4,4,4,3,2,2,2,2,2,2,1,1,1,1],
  [1,1,1,1,1,2,2,2,2,2,3,3,4,3,3,2,2,2,2,2,1,1,1,1,1],
  [1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,1,1,1,1],
  [1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,3,2,2,1,1,1,1,1,1],
  [1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,3,2,2,2,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,2,2,3,3,3,3,3,3,3,2,2,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,1,1,1,1,1,1,1,1,1,1],
]

// ── Emotion Register ────────────────────────────────────────────────────────
const EMOTION_REGISTER = [
  { name: 'confused',     label: 'Confused',     trigger: '404 error page',                animation_notes: '' },
  { name: 'eyeroll',      label: 'Eye Roll',      trigger: 'User finds a bug',              animation_notes: '' },
  { name: 'happy',        label: 'Happy',         trigger: 'Journal submitted',             animation_notes: '' },
  { name: 'loveEyes',     label: 'Love Eyes',     trigger: 'Achievement awarded',           animation_notes: '' },
  { name: 'thinking',     label: 'Thinking',      trigger: 'AI generating response',        animation_notes: '' },
  { name: 'shocked',      label: 'Shocked',       trigger: 'Personal record broken',        animation_notes: '' },
  { name: 'sleeping',     label: 'Sleeping',      trigger: 'Maintenance and idle',          animation_notes: '' },
  { name: 'proud',        label: 'Proud',         trigger: 'Matthew publishes a journal',   animation_notes: '' },
  { name: 'frustrated',   label: 'Frustrated',    trigger: 'Form validation failure',       animation_notes: '' },
  { name: 'celebratory',  label: 'Celebratory',   trigger: '30-day streak milestone',       animation_notes: '' },
]

// ── Emotion Sprites (empty until designed in the pixel editor) ──────────────
const EMOTION_SPRITES: Record<string, number[][]> = {
  confused:    [],
  eyeroll:     [],
  happy:       [],
  loveEyes:    [],
  thinking:    [],
  shocked:     [],
  sleeping:    [],
  proud:       [],
  frustrated:  [],
  celebratory: [],
}

// ── Event Map ───────────────────────────────────────────────────────────────
const EVENT_MAP = [
  { event: 'journal_submitted',      page: '/write',              emotion: 'happy',       message_context: 'User has just published a new journal entry' },
  { event: 'form_validation_failed', page: 'any form',            emotion: 'frustrated',  message_context: 'Form could not be submitted due to validation errors' },
  { event: 'ai_generating',          page: 'post review',         emotion: 'thinking',    message_context: 'AI is generating a response or review' },
  { event: 'streak_30_days',         page: '/[username]',         emotion: 'celebratory', message_context: 'User has reached a 30-day journalling streak' },
  { event: 'personal_record',        page: '/[username]',         emotion: 'shocked',     message_context: 'User has broken a personal best stat' },
  { event: 'achievement_awarded',    page: '/[username]',         emotion: 'loveEyes',    message_context: 'User has earned an achievement badge' },
  { event: 'page_not_found',         page: '/404',                emotion: 'confused',    message_context: 'User landed on a page that does not exist' },
  { event: 'bug_reported',           page: '/feedback',           emotion: 'eyeroll',     message_context: 'User has submitted a bug report' },
  { event: 'author_publishes',       page: '/[username]/[slug]',  emotion: 'proud',       message_context: 'Matthew has published a new journal entry' },
  { event: 'site_maintenance',       page: 'maintenance screen',  emotion: 'sleeping',    message_context: 'Site is undergoing maintenance or is idle' },
]

// ── Page Appearances ────────────────────────────────────────────────────────
const PAGE_APPEARANCES = [
  { path: '/write',              role: 'Journal creation companion',   default_emotion: 'happy',     active: false },
  { path: '/edit/[id]',          role: 'Journal editing companion',    default_emotion: 'thinking',  active: false },
  { path: '/[username]/[slug]',  role: 'Post page reaction',           default_emotion: 'proud',     active: false },
  { path: '/[username]',         role: 'Profile stats companion',      default_emotion: 'happy',     active: false },
  { path: '/',                   role: 'Home page greeter',            default_emotion: 'happy',     active: false },
  { path: '/404',                role: '404 page character',           default_emotion: 'confused',  active: false },
  { path: '/feedback',           role: 'Feedback form companion',      default_emotion: 'thinking',  active: false },
]

// ── Personality Modes (for issue #133) ──────────────────────────────────────
const PERSONALITY_MODES = [
  {
    id: 1,
    name: 'light_loving',
    label: 'Light & Loving',
    tier: 'free',
    system_prompt: 'You are Wolfbot in Light & Loving mode. You are warm, encouraging and deeply supportive. You find the beauty and growth in every journal entry. Your tone is gentle, kind and uplifting. You celebrate small wins enthusiastically and frame challenges as opportunities. You speak like a supportive friend who genuinely believes in the person. Never critical, always nurturing.',
  },
  {
    id: 2,
    name: 'honest_intellectual',
    label: 'Honest Intellectual',
    tier: 'premium',
    system_prompt: 'You are Wolfbot in Honest Intellectual mode. You are thoughtful, analytical and genuinely honest. You engage deeply with the content of the journal entry, offering real critique alongside real encouragement. You notice patterns, ask probing questions and offer insights that challenge the writer to think more deeply. You respect the person enough to be truthful with them. Your tone is warm but direct, curious but grounded.',
  },
  {
    id: 3,
    name: 'unhinged_sassy',
    label: 'Unhinged Sassy',
    tier: 'premium',
    system_prompt: 'You are Wolfbot in Unhinged Sassy mode. You are gloriously over the top, irreverent and delightfully dramatic. You have strong opinions and you share them loudly. You are sharp-witted, a little chaotic, and absolutely hilarious — but underneath the sass, you actually care. You roast the writer with love. You call out their nonsense while secretly rooting for them. You are the chaotic best friend who tells them the truth in the most entertaining way possible.',
  },
]

// ── Seed Records ────────────────────────────────────────────────────────────
const SEED_RECORDS = [
  {
    key: 'version',
    category: 'identity',
    label: 'Version',
    value: 'v1.0.0',
    description: 'Current Wolfbot version string',
  },
  {
    key: 'personality_prompt',
    category: 'identity',
    label: 'Personality Prompt',
    value: 'You are Wolfbot — the Journal Intelligence Unit for wolfman.blog. You are a pixel art wolf robot with a sharp mind, genuine warmth, and a deep respect for the act of journalling. You synthesise morning journal entries into meaningful, personalised reviews. You notice patterns, celebrate effort, and always leave the writer feeling seen and motivated. You speak concisely but with substance. You are never generic.',
    description: 'Base Claude system prompt defining Wolfbot character and voice',
  },
  {
    key: 'tagline',
    category: 'identity',
    label: 'Tagline',
    value: 'JOURNAL INTELLIGENCE UNIT',
    description: 'Wolfbot display tagline',
  },
  {
    key: 'personality_modes',
    category: 'identity',
    label: 'Personality Modes',
    value: PERSONALITY_MODES,
    description: 'Three personality modes for Wolfbot journal reviews (see issue #133). free = Light & Loving; premium = Honest Intellectual and Unhinged Sassy.',
  },
  {
    key: 'colour_palette',
    category: 'palette',
    label: 'Colour Palette',
    value: COLOUR_PALETTE,
    description: '10-colour Wolfbot pixel art palette. Read-only — matches the locked artwork spec.',
  },
  {
    key: 'base_sprite',
    category: 'sprite',
    label: 'Base Sprite',
    value: BASE_SPRITE,
    description: 'Locked v0.4 base sprite — 25×25 integer array. Each integer maps to a palette colour (1–10).',
  },
  {
    key: 'emotion_sprites',
    category: 'sprite',
    label: 'Emotion Sprites',
    value: EMOTION_SPRITES,
    description: 'Per-emotion sprite overrides. Each key is an emotion name; value is a 25×25 integer array or [] if not yet designed.',
  },
  {
    key: 'emotion_register',
    category: 'emotions',
    label: 'Emotion Register',
    value: EMOTION_REGISTER,
    description: '10 emotion definitions — name, label, trigger condition, and animation notes.',
  },
  {
    key: 'event_map',
    category: 'events',
    label: 'Event Map',
    value: EVENT_MAP,
    description: 'Site events that trigger Wolfbot reactions. Each entry maps an event to a page, emotion and message context.',
  },
  {
    key: 'page_appearances',
    category: 'pages',
    label: 'Page Appearances',
    value: PAGE_APPEARANCES,
    description: 'Pages where Wolfbot will eventually appear. active: false until explicitly enabled.',
  },
]

async function seed() {
  console.log('Seeding wolfbot_config...')
  for (const record of SEED_RECORDS) {
    await db
      .insert(wolfbotConfig)
      .values(record)
      .onConflictDoUpdate({
        target: wolfbotConfig.key,
        set: {
          value: record.value,
          label: record.label,
          description: record.description,
          updatedAt: new Date(),
        },
      })
    console.log(`  ✓ ${record.key}`)
  }
  console.log(`\nDone. ${SEED_RECORDS.length} records seeded.`)
  process.exit(0)
}

seed().catch(e => {
  console.error('Seed failed:', e)
  process.exit(1)
})
