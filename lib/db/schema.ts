import { pgTable, text, integer, timestamp, uuid, boolean, date, smallint, jsonb } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').unique(),
  emailVerified: timestamp('email_verified', { mode: 'date' }),
  passwordHash: text('password_hash'),
  name: text('name'),
  image: text('image'),
  role: text('role').notNull().default('customer'),
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
  authorId: uuid('author_id').references(() => users.id),
  publishedAt: timestamp('published_at').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// Captured at publish time — how Matthew arrived at the day
// Brain: 1 (Peaceful) → 5 (Manic)
// Body:  1 (Lethargic) → 5 (Buzzing)
// Routine: { sunlight, breathwork, cacao, meditation, coldShower, walk, animalLove } — true/false
export const morningState = pgTable('morning_state', {
  id: uuid('id').primaryKey().defaultRandom(),
  postId: uuid('post_id').notNull().unique().references(() => posts.id, { onDelete: 'cascade' }),
  brainScale: smallint('brain_scale').notNull(),   // 1–5
  bodyScale: smallint('body_scale').notNull(),     // 1–5
  routineChecklist: jsonb('routine_checklist').notNull().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// Logged at end of day — how it actually went
export const eveningReflection = pgTable('evening_reflection', {
  id: uuid('id').primaryKey().defaultRandom(),
  postId: uuid('post_id').notNull().unique().references(() => posts.id, { onDelete: 'cascade' }),
  reflection: text('reflection').notNull(),
  wentToPlan: boolean('went_to_plan').notNull(),
  dayRating: smallint('day_rating').notNull(),   // 1–5
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// Claude-generated synthesis — scores stored as flexible JSONB to allow the
// scoring model to evolve without schema changes. The model field allows
// regeneration with newer Claude versions while preserving history.
// Example scores: { "intention_alignment": 4.2, "inner_vitality": 3.8 }
export const dayScores = pgTable('day_scores', {
  id: uuid('id').primaryKey().defaultRandom(),
  postId: uuid('post_id').notNull().unique().references(() => posts.id, { onDelete: 'cascade' }),
  scores: jsonb('scores').notNull().default({}),
  synthesis: text('synthesis').notNull(),
  model: text('model').notNull(),
  generatedAt: timestamp('generated_at').notNull().defaultNow(),
})
