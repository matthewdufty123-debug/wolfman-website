import { pgTable, text, integer, timestamp, uuid, boolean, date, smallint, jsonb, serial, index } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').unique(),
  emailVerified: timestamp('email_verified', { mode: 'date' }),
  passwordHash: text('password_hash'),
  name: text('name'),
  displayName: text('display_name'),    // public-facing name shown on posts/profile
  bio: text('bio'),                     // short personal bio shown on profile
  image: text('image'),                 // OAuth provider avatar (auto-set)
  avatar: text('avatar'),               // user-uploaded avatar (takes precedence over image)
  role: text('role').notNull().default('customer'),
  username: text('username').unique(),  // URL-safe handle for /[username] routes
  preferences: jsonb('preferences').notNull().default({}),  // { theme?, fontSize?, fontFamily? }
  communityEnabled: boolean('community_enabled').notNull().default(false),   // opted in to community posting
  defaultPublic: boolean('default_public').notNull().default(false),         // new posts public by default
  onboardingComplete: boolean('onboarding_complete').notNull().default(false), // completed onboarding flow
  profession:    text('profession'),          // user's profession — personalises WOLF|BOT prompts
  humourSource:  text('humour_source'),       // where user finds humour — calibrates WOLF|BOT wit
  // Morning reminder
  morningReminderEnabled:  boolean('morning_reminder_enabled').notNull().default(false),
  morningReminderTime:     text('morning_reminder_time'),      // 'HH:MM' in user's local time
  morningReminderTimezone: text('morning_reminder_timezone'),  // IANA tz string e.g. 'Europe/London'
  lastReminderSentAt:      timestamp('last_reminder_sent_at'), // guards against double-sends
  timezone:                text('timezone'),                   // IANA tz string — canonical user timezone for day boundaries
  // Phone / Telegram
  phoneNumber:    text('phone_number').unique(),                    // E.164 format e.g. +447700900000
  phoneVerified:  boolean('phone_verified').notNull().default(false),
  telegramChatId: text('telegram_chat_id'),                          // set when Telegram account linked
  telegramState:  jsonb('telegram_state'),                            // conversation state machine: { state, type?, postId?, date? }
  // Telegram scheduled prompts
  telegramPromptsEnabled:   boolean('telegram_prompts_enabled').notNull().default(false),
  telegramMorningTime:      text('telegram_morning_time'),             // HH:MM, default '07:00'
  telegramMiddayEnabled:    boolean('telegram_midday_enabled').notNull().default(true),
  telegramEveningEnabled:   boolean('telegram_evening_enabled').notNull().default(true),
  lastTelegramPromptSentAt: timestamp('last_telegram_prompt_sent_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const accounts = pgTable('accounts', {
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: text('token_type'),
  scope: text('scope'),
  id_token: text('id_token'),
  session_state: text('session_state'),
})

export const sessions = pgTable('sessions', {
  sessionToken: text('session_token').primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
})

export const verificationTokens = pgTable('verification_tokens', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull(),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
})

export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  stripePaymentIntentId: text('stripe_payment_intent_id').unique(),
  status: text('status').notNull().default('pending'),
  totalAmount: integer('total_amount').notNull(),
  email: text('email').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const orderItems = pgTable('order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').notNull().references(() => orders.id),
  printfulProductId: text('printful_product_id').notNull(),
  productName: text('product_name').notNull(),
  variantName: text('variant_name').notNull(),
  quantity: integer('quantity').notNull(),
  unitPrice: integer('unit_price').notNull(),
})

// ── Blog ──────────────────────────────────────────────────────────────────────

export const posts = pgTable('posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  date: date('date').notNull(),
  category: text('category').notNull().default('morning-intention'),
  content: text('content').notNull(),
  excerpt: text('excerpt'),
  image: text('image'),
  imageCaption: text('image_caption'),
  videoId: text('video_id'),
  review: text('review'),
  authorId: uuid('author_id').references(() => users.id),
  status: text('status').notNull().default('draft'),  // 'draft' | 'published'
  isPublic: boolean('is_public').notNull().default(false),  // visible in community feed
  publishedAt: timestamp('published_at').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  // Evening reflection — stored directly on post (no separate table)
  eveningReflection: text('evening_reflection'),     // "How did the day go?" free text
  feelAboutToday: integer('feel_about_today'),        // 1–6 sentiment scale
  // WOLF|BOT title suggestions — premium feature, max 2 per post
  titleSuggestionsUsed: integer('title_suggestions_used').notNull().default(0),
  titleTokensInput:     integer('title_tokens_input'),
  titleTokensOutput:    integer('title_tokens_output'),
  // Word counts — captured on every save (draft + published)
  wordCountIntention:   integer('word_count_intention'),
  wordCountGratitude:   integer('word_count_gratitude'),
  wordCountGreatAt:     integer('word_count_great_at'),
  wordCountTotal:       integer('word_count_total'),
})

// Captured at publish time — how Matthew arrived at the day
// Brain: 1 (Completely Silent) → 8 (Totally Manic)
// Body:  1 (Nothing to Give) → 8 (Absolutely Buzzing)
// Happy: 1 (Completely Lost) → 8 (Absolutely Joyful)
// Stress State: 1 (Completely Overwhelmed) → 8 (Hunt Mode)
// Routine: { sunlight, breathwork, cacao, meditation, coldShower, walk, animalLove } — true/false
export const morningState = pgTable('morning_state', {
  id: uuid('id').primaryKey().defaultRandom(),
  postId: uuid('post_id').notNull().unique().references(() => posts.id, { onDelete: 'cascade' }),
  brainScale: smallint('brain_scale'),   // 1–8, nullable (user may skip)
  bodyScale: smallint('body_scale'),     // 1–8, nullable (user may skip)
  happyScale: smallint('happy_scale'),   // 1–8, nullable
  stressScale: smallint('stress_scale'), // 1–8, nullable
  routineChecklist: jsonb('routine_checklist').notNull().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// ── Journal entries (normalised) ─────────────────────────────────────────
// Individual timestamped entries replacing the single concatenated
// posts.content field. Supports multiple entries per section per day
// and source tracking (web vs telegram). Added in #246.
export const journalEntries = pgTable('journal_entries', {
  id:        uuid('id').primaryKey().defaultRandom(),
  postId:    uuid('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  type:      text('type').notNull(),                   // 'intention' | 'gratitude' | 'great_at' | 'reflection'
  content:   text('content').notNull(),
  source:    text('source').notNull().default('web'),   // 'web' | 'telegram'
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => [
  index('journal_entries_post_type_idx').on(table.postId, table.type),
])

// ── Scale entries (normalised) ───────────────────────────────────────────
// Individual timestamped scale readings replacing morningState scale columns.
// Supports multiple readings per day and source tracking. Added in #246.
export const scaleEntries = pgTable('scale_entries', {
  id:        uuid('id').primaryKey().defaultRandom(),
  postId:    uuid('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  type:      text('type').notNull(),                   // 'brain' | 'body' | 'happy' | 'stress'
  value:     smallint('value').notNull(),               // 1–8
  source:    text('source').notNull().default('web'),   // 'web' | 'telegram'
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('scale_entries_post_type_idx').on(table.postId, table.type),
])

// Evening reflection was previously a separate table (evening_reflection).
// Consolidated into the posts table (eveningReflection, feelAboutToday columns) in the
// journal page redesign (March 2026). Run `npm run db:push` to drop the old table.

// ── Rituals ──────────────────────────────────────────────────────────────────
// Admin-managed morning ritual definitions. Each ritual has a unique camelCase
// key that matches the JSONB keys stored in morningState.routineChecklist.
// Keys are immutable after creation — archived rituals keep their key so
// historical journal data still renders correctly.
export const rituals = pgTable('rituals', {
  id:          uuid('id').primaryKey().defaultRandom(),
  key:         text('key').notNull().unique(),              // camelCase, immutable after creation
  label:       text('label').notNull(),                     // Display name e.g. "Sunlight"
  description: text('description').notNull(),               // Longer description shown in popups
  category:    text('category').notNull().default(''),      // e.g. "Mindfulness", "Physical", "Nourishment", "Connection"
  color:       text('color').notNull().default('#4A7FA5'),  // Hex colour for icon + UI accents
  svgContent:  text('svg_content'),                         // Inner SVG markup (paths, circles — no wrapping <svg> tag)
  emoji:       text('emoji'),                               // For social share e.g. "🌅"
  hashtag:     text('hashtag'),                             // For social share e.g. "#sunlight"
  sortOrder:   smallint('sort_order').notNull().default(0),
  isActive:    boolean('is_active').notNull().default(true), // false = archived (not selectable, data preserved)
  createdAt:   timestamp('created_at').notNull().defaultNow(),
  updatedAt:   timestamp('updated_at').notNull().defaultNow(),
})

// ── Site configuration ─────────────────────────────────────────────────────
// Singleton row (id always 1). Controls registration, messaging and UI mode.
// status: closed_alpha | closed_beta | open_beta | live
// userCap: max registrations (null = unlimited). Applies in open_beta and live.
export const siteConfig = pgTable('site_config', {
  id: integer('id').primaryKey().default(1),
  status: text('status').notNull().default('closed_alpha'),
  userCap: integer('user_cap'),           // null = no cap
  statusMessage: text('status_message'),  // optional custom closed/full message
  betaOpensAt: timestamp('beta_opens_at'), // drives countdowns when status = closed_beta
  betaEmailsSent: jsonb('beta_emails_sent').notNull().default({}), // { week_notice: true, go_live: true }
  currentRelease: text('current_release').notNull().default('closed_alpha_dev'), // active release milestone
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  updatedBy: text('updated_by'),          // admin user ID who last changed it
})

// ── Version history ────────────────────────────────────────────────────────
// Append-only log of deployments. Manually entered by admin after each deploy.
// version format: [site_state].[release_state].[feature_state].[minor_update]
// e.g. "0.1.0.0" = closed alpha baseline, "0.1.2.1" = 2nd feature, 1st bugfix
export const versionHistory = pgTable('version_history', {
  id:           serial('id').primaryKey(),
  version:      text('version').notNull(),            // "0.1.2.1"
  releasePhase: text('release_phase').notNull(),       // "closed_alpha" | "open_beta" | etc.
  releaseName:  text('release_name').notNull(),        // "Closed Alpha Development"
  commitHashes: text('commit_hashes').array(),         // ["abc1234", "def5678"]
  summary:      text('summary').notNull(),             // one-line summary
  changes:      jsonb('changes').notNull().default([]), // string[] — bullet point list
  deployedAt:   timestamp('deployed_at', { withTimezone: true }).notNull(),
  createdAt:    timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  createdBy:    uuid('created_by').references(() => users.id),
})

// ── Beta interest registrations ───────────────────────────────────────────
// Pre-registration interest list for the public beta (opens 1 May 2026).
// NOT the same as a user account — no auth, no passwords.
// source: 'beta-page' | 'login-page' | 'register-page'
// emailStatus: 'pending' | 'delivered' | 'bounced' | 'complained' — updated via Resend webhook
// Duplicate emails are silently ignored via onConflictDoNothing().
export const betaInterest = pgTable('beta_interest', {
  id:            serial('id').primaryKey(),
  email:         text('email').notNull().unique(),
  name:          text('name'),
  source:        text('source').notNull().default('beta-page'),
  emailStatus:   text('email_status').notNull().default('pending'),
  emailStatusAt: timestamp('email_status_at'),
  createdAt:     timestamp('created_at').notNull().defaultNow(),
})

// ── Wolfbot configuration ─────────────────────────────────────────────────
// Key-value config store for Wolfbot — the pixel art mascot.
// All values are JSONB for maximum flexibility as the config schema evolves.
// Admin-only read/write. Never exposed via public routes.
// Categories: identity | palette | sprite | emotions | events | pages
export const wolfbotConfig = pgTable('wolfbot_config', {
  id:          serial('id').primaryKey(),
  key:         text('key').notNull().unique(),
  category:    text('category').notNull(),
  label:       text('label').notNull(),
  value:       jsonb('value').notNull(),
  description: text('description'),
  updatedAt:   timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

// ── WOLF|BOT prompt version log ───────────────────────────────────────────
// Append-only audit log. One row per admin prompt/token-cap save.
// version mirrors the prompt_version counter in wolfbot_config at time of change.
export const wolfbotVersionLog = pgTable('wolfbot_version_log', {
  id:         serial('id').primaryKey(),
  version:    integer('version').notNull(),
  keyChanged: text('key_changed').notNull(),
  oldValue:   jsonb('old_value'),
  newValue:   jsonb('new_value').notNull(),
  changedAt:  timestamp('changed_at').notNull().defaultNow(),
  changedBy:  uuid('changed_by').references(() => users.id),
})

// ── WOLF|BOT personality reviews ──────────────────────────────────────────
// One row per post — single review generated in a user-triggered action.
// Admin can re-trigger to regenerate. Unique on postId.
// Legacy columns (reviewHelpful, reviewSassy) retained for backward compat — still displayed by LegacyTerminal.
export const wolfbotReviews = pgTable('wolfbot_reviews', {
  id:                 uuid('id').primaryKey().defaultRandom(),
  postId:             uuid('post_id').notNull().unique().references(() => posts.id, { onDelete: 'cascade' }),
  // Current: single review
  review:             text('review'),             // the generated review text
  reviewRating:       smallint('review_rating'),  // null=unrated, 1=👎, 2=👍, 3=🔥
  themeWords:         text('theme_words'),        // comma-separated recurring themes across recent posts
  moodSignal:         text('mood_signal'),        // one-line morning state interpretation
  profileNote:        text('profile_note'),       // how user's profile shapes the review lens
  journalContext:     jsonb('journal_context'),    // structured summary for trend context (JSONB)
  // Legacy (pre-refactor): kept for backward compat, no longer written
  reviewHelpful:      text('review_helpful'),
  reviewSassy:        text('review_sassy'),
  generatedAt:        timestamp('generated_at').notNull().defaultNow(),
  triggeredBy:        uuid('triggered_by').references(() => users.id),
  modelUsed:          text('model_used'),
  inputTokensTotal:   integer('input_tokens_total'),
  outputTokensTotal:  integer('output_tokens_total'),
  // Engagement counters
  triggerCount:       integer('trigger_count').notNull().default(0),
  countHelpful:       integer('count_helpful').notNull().default(0),
  countIntellectual:  integer('count_intellectual').notNull().default(0),
  countLovely:        integer('count_lovely').notNull().default(0),
  countSassy:         integer('count_sassy').notNull().default(0),
  countPlay:          integer('count_play').notNull().default(0),
})

// ── Claude-generated synthesis ────────────────────────────────────────────
// Claude-generated synthesis — scores stored as flexible JSONB to allow the
// scoring model to evolve without schema changes. The model field allows
// regeneration with newer Claude versions while preserving history.
// Example scores: { "intention_alignment": 4.2, "inner_vitality": 3.8 }
// data_completeness values: 'post_only' | 'post_morning' | 'post_morning_evening'
export const dayScores = pgTable('day_scores', {
  id: uuid('id').primaryKey().defaultRandom(),
  postId: uuid('post_id').notNull().unique().references(() => posts.id, { onDelete: 'cascade' }),
  scores: jsonb('scores').notNull().default({}),
  synthesis: text('synthesis').notNull(),
  model: text('model').notNull(),
  dataCompleteness: text('data_completeness').notNull().default('post_only'),
  generatedAt: timestamp('generated_at').notNull().defaultNow(),
})

// ── Journal Analytics (Release 0.5) ───────────────────────────────────────
// Aggregated per-user analytics table. Populated by a background job / cron
// that re-aggregates on each new post or scale update.
// NOT YET DEPLOYED — schema design for Release 0.5. Run db:push when ready.
//
// Design rationale:
//   - Store rolling aggregates so profile/stats pages don't need heavy queries.
//   - JSONB `streakData` holds current/longest streak + last activity date.
//   - JSONB `scaleAverages` holds 30d/90d/all-time averages per scale.
//   - JSONB `ritualFrequency` holds per-ritual completion rates (0.0–1.0).
//   - JSONB `wolfbotThemes` accumulates rolling themeWords from WOLF|BOT reviews.
//   - `lastCalculatedAt` guards against redundant recalculations.
//
// export const journalAnalytics = pgTable('journal_analytics', {
//   id:                uuid('id').primaryKey().defaultRandom(),
//   userId:            uuid('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
//   totalPosts:        integer('total_posts').notNull().default(0),
//   publishedPosts:    integer('published_posts').notNull().default(0),
//   currentStreak:     integer('current_streak').notNull().default(0),
//   longestStreak:     integer('longest_streak').notNull().default(0),
//   streakData:        jsonb('streak_data').notNull().default({}),      // { lastPostDate, streakStart }
//   scaleAverages:     jsonb('scale_averages').notNull().default({}),   // { brain30d, body30d, happy30d, stress30d, brainAll, ... }
//   ritualFrequency:   jsonb('ritual_frequency').notNull().default({}), // { sunlight: 0.72, breathwork: 0.55, ... }
//   wolfbotThemes:     jsonb('wolfbot_themes').notNull().default({}),   // { words: [{word, count}], lastUpdated }
//   lastCalculatedAt:  timestamp('last_calculated_at'),
//   updatedAt:         timestamp('updated_at').notNull().defaultNow(),
// })
