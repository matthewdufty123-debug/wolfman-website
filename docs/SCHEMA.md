# Database Schema — Wolfman.blog

**Database:** Neon PostgreSQL (serverless)
**ORM:** Drizzle ORM with `@neondatabase/serverless` HTTP driver
**Schema file:** `lib/db/schema.ts`
**Apply changes:** `npm run db:push` after editing the schema file

---

## Schema Change Process

1. Edit `lib/db/schema.ts`
2. Run `npm run db:push` to apply changes to Neon
3. Update this file to reflect the change
4. Note any dropped/renamed columns so the team knows what's legacy

---

## Tables

### `users`

Core user accounts.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| email | text | Unique |
| emailVerified | timestamp | Auth.js |
| passwordHash | text | bcrypt |
| name | text | Full name |
| displayName | text | Shown publicly |
| bio | text | Profile bio |
| image | text | OAuth avatar URL |
| avatar | text | Uploaded avatar (Vercel Blob URL) |
| username | text | Unique, URL-safe slug |
| role | text | 'customer' (default) or 'admin' |
| preferences | JSONB | Theme, font size, font family |
| communityEnabled | bool | |
| defaultPublic | bool | |
| onboardingComplete | bool | |
| profession | text | WOLF|BOT personalisation |
| humourSource | text | WOLF|BOT personalisation |
| morningReminderEnabled | bool | Opt-in morning reminders |
| morningReminderTime | text | e.g. "07:30" |
| morningReminderTimezone | text | e.g. "Europe/London" |
| lastReminderSentAt | timestamp | Prevents duplicate sends |
| createdAt | timestamp | |

### `posts`

Journal entries. The `posts/` markdown directory is empty — all content is DB-backed.
User-facing copy uses "journal" not "post".

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| slug | text | Unique URL slug |
| title | text | |
| date | text | ISO date string |
| category | text | |
| content | text | Full journal content |
| excerpt | text | SEO excerpt (auto-generated) |
| image | text | Vercel Blob URL |
| videoId | text | |
| review | text | Internal review notes |
| authorId | UUID | FK → users |
| status | text | 'draft' or 'published' |
| isPublic | bool | |
| publishedAt | timestamp | |
| createdAt | timestamp | |
| updatedAt | timestamp | |
| eveningReflection | text | Free-text end-of-day reflection |
| feelAboutToday | int | 1–6 sentiment scale |
| titleSuggestionsUsed | int | Token tracking |
| titleTokensInput | int | Token tracking |
| titleTokensOutput | int | Token tracking |

### `morningState`

One row per post. Captured at publish time via PostForm "After Waking" tab.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| postId | UUID | Unique FK → posts |
| brainScale | int | 1–8 |
| bodyScale | int | 1–8 |
| happyScale | int | 1–8 |
| stressScale | int | 1–8 |
| routineChecklist | JSONB | `{ sunlight?: bool, breathwork?: bool, … }` |
| createdAt | timestamp | |

See `docs/ROUTINES.md` for full ritual key list and checklist shape.

### `wolfbotReviews`

One row per post. WOLF|BOT review and rating. Full column detail in `docs/WOLFBOT.md`.

### `wolfbotConfig`

Key-value config store for WOLF|BOT. Admin-only. See `docs/WOLFBOT.md` for key list.

| Column | Type | Notes |
|--------|------|-------|
| id | serial | PK |
| key | text | Unique |
| category | text | |
| label | text | |
| value | JSONB | |
| description | text | |
| updatedAt | timestamp | |

### `wolfbotVersionLog`

Append-only audit log. Written on every prompt or token cap save.

| Column | Type | Notes |
|--------|------|-------|
| id | serial | PK |
| version | int | Auto-incremented |
| keyChanged | text | Which config key changed |
| oldValue | JSONB | |
| newValue | JSONB | |
| changedAt | timestamp | |
| changedBy | UUID | FK → users |

### `dayScores` — LEGACY

**This table is superseded by WOLF|BOT. Do not add new features that write to or read from
this table.** It remains in the schema for historical data only.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| postId | UUID | Unique FK → posts |
| scores | JSONB | |
| synthesis | text | |
| model | text | |
| dataCompleteness | text | 'post_only' / 'post_morning' / 'post_morning_evening' |
| generatedAt | timestamp | |

### `versionHistory`

Deployment log for the `/dev` page release notes. Must be manually populated via
`/admin` → "Log version entry" after each deploy. Table will be empty until entries are logged.

| Column | Type | Notes |
|--------|------|-------|
| id | serial | PK |
| version | text | e.g. "0.1.10.14" |
| releasePhase | text | |
| releaseName | text | |
| commitHashes | text[] | Array |
| summary | text | |
| changes | JSONB | |
| deployedAt | timestamp | |
| createdAt | timestamp | |
| createdBy | UUID | FK → users |

### `siteConfig`

Singleton (id = 1). Global site configuration.

| Column | Type | Notes |
|--------|------|-------|
| status | text | |
| userCap | int | Max registered users (51 for beta) |
| statusMessage | text | |
| betaOpensAt | timestamp | |
| betaEmailsSent | JSONB | |
| currentRelease | text | |
| updatedAt | timestamp | |
| updatedBy | UUID | FK → users |

### `betaInterest`

Pre-registration interest during Closed Alpha.

| Column | Type | Notes |
|--------|------|-------|
| id | serial | PK |
| email | text | Unique |
| name | text | |
| source | text | |
| emailStatus | text | |
| emailStatusAt | timestamp | |
| createdAt | timestamp | |

### `orders` / `orderItems`

Stripe/Printful commerce. Standard e-commerce tables.

| Key fields | Notes |
|------------|-------|
| `stripePaymentIntentId` | Unique — used for duplicate prevention |
| `orderItems.printfulSyncVariantId` | Links to Printful product |

### Auth.js adapter tables

`accounts`, `sessions`, `verificationTokens` — standard Auth.js tables. Do not modify.

### `journalAnalytics` — NOT YET DEPLOYED

Commented out in schema. Planned for the Statistics feature. Aggregated per-user analytics:
streaks, scale averages, ritual frequency, WOLF|BOT themes. Do not reference until built.

---

## GitHub Issues

When raising schema-related issues, reference this file (`docs/SCHEMA.md`).
