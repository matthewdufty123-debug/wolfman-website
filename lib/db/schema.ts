import { pgTable, text, integer, timestamp, uuid, boolean, date, smallint, jsonb, serial } from 'drizzle-orm/pg-core'

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
  videoId: text('video_id'),
  review: text('review'),
  authorId: uuid('author_id').references(() => users.id),
  status: text('status').notNull().default('draft'),  // 'draft' | 'published'
  isPublic: boolean('is_public').notNull().default(false),  // visible in community feed
  publishedAt: timestamp('published_at').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// Captured at publish time — how Matthew arrived at the day
// Brain (My Thoughts): 1 (Peaceful) → 6 (Manic)
// Body:  1 (Lethargic) → 6 (Buzzing)
// Happy: 1 (Far from happy) → 6 (Joyful)
// Routine: { sunlight, breathwork, cacao, meditation, coldShower, walk, animalLove } — true/false
export const morningState = pgTable('morning_state', {
  id: uuid('id').primaryKey().defaultRandom(),
  postId: uuid('post_id').notNull().unique().references(() => posts.id, { onDelete: 'cascade' }),
  brainScale: smallint('brain_scale').notNull(),   // 1–6
  bodyScale: smallint('body_scale').notNull(),     // 1–6
  happyScale: smallint('happy_scale'),             // 1–6, nullable (added later)
  routineChecklist: jsonb('routine_checklist').notNull().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// Logged at end of day — how it actually went
export const eveningReflection = pgTable('evening_reflection', {
  id: uuid('id').primaryKey().defaultRandom(),
  postId: uuid('post_id').notNull().unique().references(() => posts.id, { onDelete: 'cascade' }),
  reflection: text('reflection').notNull(),
  wentToPlan: boolean('went_to_plan').notNull(),
  dayRating: smallint('day_rating').notNull(),   // 1–6
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
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
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  updatedBy: text('updated_by'),          // admin user ID who last changed it
})

// ── Beta interest registrations ───────────────────────────────────────────
// Pre-registration interest list for the public beta (opens 1 May 2026).
// NOT the same as a user account — no auth, no passwords.
// source: 'beta-page' | 'login-page' | 'register-page'
// Duplicate emails are silently ignored via onConflictDoNothing().
export const betaInterest = pgTable('beta_interest', {
  id:        uuid('id').primaryKey().defaultRandom(),
  email:     text('email').notNull().unique(),
  name:      text('name').notNull(),
  source:    text('source').notNull().default('beta-page'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
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
