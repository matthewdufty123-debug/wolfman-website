# Telegram Integration — GitHub Issue Drafts

These are draft issues for review before creation. Once approved, they'll be raised on GitHub.

---

## Issue 1: Schema redesign — parent post, journal entries, and scale entries tables

**Labels:** `enhancement`, `planned`, `infrastructure`
**Milestone:** Release 0.1 — Journaling

### Description

Redesign the journal data model from a flat `posts` table into a normalised structure that supports timestamped, multi-entry journaling throughout the day.

**See:** `docs/SCHEMA.md`, `lib/db/schema.ts`

### New tables

#### `journalEntries`

Replaces the single `content` field on `posts`. Each entry is timestamped and typed, allowing multiple entries per section per day.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| postId | UUID | FK → posts |
| type | text | `intention` / `gratitude` / `great_at` / `reflection` |
| content | text | The journal text |
| source | text | `web` / `telegram` — where this entry was created |
| sortOrder | int | Ordering within a type for the same post |
| createdAt | timestamp | When the entry was written — this is the key timestamp |
| updatedAt | timestamp | |

- Composite index on `(postId, type)` for efficient grouping queries
- `reflection` type replaces the old `eveningReflection` field on `posts` — this brings back the "how did the day go" section naturally

#### `scaleEntries`

Replaces the `morningState` scale columns. Each reading is timestamped, allowing multiple mood/energy readings per day.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| postId | UUID | FK → posts |
| type | text | `brain` / `body` / `happy` / `stress` |
| value | int | 1–8 |
| source | text | `web` / `telegram` |
| createdAt | timestamp | When this reading was taken |

- Composite index on `(postId, type)`
- Daily averages are computed at query time, not stored
- The existing `feelAboutToday` (1–6 evening sentiment) could become a `scaleEntries` row with type `day_sentiment`, or remain on the parent post — to be decided during implementation

#### Changes to `posts` table

The `posts` table becomes the parent/header record. Fields to be removed after migration:

- `content` → moved to `journalEntries`
- `eveningReflection` → moved to `journalEntries` (type: `reflection`)
- `feelAboutToday` → moved to `scaleEntries` (type: `day_sentiment`) or kept
- `wordCountIntention`, `wordCountGratitude`, `wordCountGreatAt`, `wordCountTotal` → computed from `journalEntries` at query time

Fields that stay on `posts`: id, slug, title, date, category, excerpt, image, videoId, review, authorId, status, isPublic, publishedAt, createdAt, updatedAt, titleSuggestionsUsed, titleTokensInput, titleTokensOutput.

#### Changes to `morningState` table

Scale columns (`brainScale`, `bodyScale`, `happyScale`, `stressScale`) are replaced by `scaleEntries`. The `routineChecklist` JSONB field remains on `morningState` — rituals are a binary daily checklist, not timestamped readings.

`morningState` becomes:

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| postId | UUID | Unique FK → posts |
| routineChecklist | JSONB | `{ sunlight?: bool, breathwork?: bool, ... }` |
| createdAt | timestamp | |

### Acceptance criteria

- [ ] `journalEntries` table created in `lib/db/schema.ts`
- [ ] `scaleEntries` table created in `lib/db/schema.ts`
- [ ] `morningState` scale columns marked for removal (removed in migration issue)
- [ ] `posts` content columns marked for removal (removed in migration issue)
- [ ] Drizzle relations defined
- [ ] `docs/SCHEMA.md` updated with new table definitions
- [ ] `npm run db:push` applies cleanly

---

## Issue 2: Data migration — reshape existing posts into new schema

**Labels:** `planned`, `infrastructure`
**Milestone:** Release 0.1 — Journaling

### Description

Migrate all existing journal data from the flat `posts` + `morningState` structure into the new normalised `journalEntries` and `scaleEntries` tables. This is a full cutover — no legacy code remains after this.

**Depends on:** Issue 1 (schema redesign)
**See:** `docs/SCHEMA.md`, `lib/db/schema.ts`

### Migration plan

1. **Write migration script** (`scripts/migrate-to-entries.ts`) that:
   - For each existing post:
     - Parses `content` field to extract intention, gratitude, and great_at sections (these are currently delimited by section headers in the HTML/markdown)
     - Creates one `journalEntries` row per section, with `source: 'web'` and `createdAt` matching the post's `createdAt`
     - If `eveningReflection` is non-null, creates a `journalEntries` row with `type: 'reflection'`
   - For each `morningState` row:
     - Creates `scaleEntries` rows for each non-null scale (brain, body, happy, stress), with `source: 'web'` and `createdAt` matching the morning state's `createdAt`
   - Logs counts and any anomalies

2. **Verify data integrity:**
   - Count posts vs journal entry groups — every post should have at least one entry
   - Count morning states vs scale entries — every non-null scale should have a corresponding entry
   - Spot-check 10 random posts: compare original content with reconstructed content from entries

3. **Remove old columns** from schema after verification:
   - `posts.content`, `posts.eveningReflection`, `posts.feelAboutToday`, `posts.wordCountIntention`, `posts.wordCountGratitude`, `posts.wordCountGreatAt`, `posts.wordCountTotal`
   - `morningState.brainScale`, `morningState.bodyScale`, `morningState.happyScale`, `morningState.stressScale`

4. **Run `npm run db:push`** to apply column removals

### Content parsing

The current `content` field contains all three sections as formatted text. The migration script needs to identify section boundaries. Current structure in the content field:

- Sections are separated by headers (e.g. "Today's Intention", "I'm Grateful For", "Something I'm Great At")
- The script should handle posts where not all sections are present
- If parsing fails for a post, log it and skip — don't lose data

### Acceptance criteria

- [ ] Migration script written and tested against a data snapshot
- [ ] All existing posts have corresponding `journalEntries` rows
- [ ] All existing morning state scales have corresponding `scaleEntries` rows
- [ ] Data integrity verified (counts match, spot-checks pass)
- [ ] Old columns removed from schema
- [ ] `npm run db:push` applies cleanly
- [ ] No references to removed columns remain in codebase

---

## Issue 3: Update website to read/write from new schema

**Labels:** `enhancement`, `planned`
**Milestone:** Release 0.1 — Journaling

### Description

Update all website pages, components, and API routes to use the new `journalEntries` and `scaleEntries` tables instead of the old flat `posts.content` and `morningState` scale columns.

**Depends on:** Issue 2 (data migration)
**See:** `docs/ARCHITECTURE.md`, `docs/SCHEMA.md`

### Areas to update

#### Journal reading page (`app/(main)/[username]/[slug]/`)
- `JournalWithReviewSection.tsx` — fetch `journalEntries` grouped by type instead of parsing `posts.content`
- `JournalTextSection.tsx` — render entries per type, showing timestamps when multiple entries exist for a type
- `HowIShowedUpSection.tsx` — fetch from `scaleEntries`, compute averages if multiple readings exist
- Display individual timestamped readings with the option to see the breakdown

#### Write/edit form (`app/(post)/write/`, `app/(post)/edit/[id]/`)
- `PostForm.tsx` — save to `journalEntries` table (one row per section) instead of concatenating into `posts.content`
- Scale inputs save to `scaleEntries` instead of `morningState` scale columns
- Routine checklist continues to save to `morningState.routineChecklist`

#### Feed cards (home page)
- Update feed queries to join or count `journalEntries` for word counts and excerpts
- Scale display on cards reads from `scaleEntries`

#### Profile stats (`app/(main)/[username]/`)
- Scale trend charts read from `scaleEntries`
- Word count stats computed from `journalEntries`

#### WOLF|BOT review generation (`api/posts/[id]/wolfbot-reviews/`)
- Fetch `journalEntries` for the post instead of reading `posts.content`
- Pass all entries (with types and timestamps) to the review prompt

#### API routes
- `api/morning-stats/` — read from `scaleEntries`
- `api/admin/evening-reflection/` — write to `journalEntries` with type `reflection`
- `api/evening-reflection/` — write to `journalEntries` with type `reflection`

#### Components
- `MorningScaleBar.tsx` — read from `scaleEntries`
- `StatsCharts.tsx` — read from `scaleEntries`
- `EveningReflection.tsx` — read/write `journalEntries` with type `reflection`

### Acceptance criteria

- [ ] Journal reading page renders entries from `journalEntries` table
- [ ] Write/edit form saves entries to `journalEntries` and `scaleEntries`
- [ ] Feed cards display correct data from new tables
- [ ] Profile stats and charts work with new tables
- [ ] WOLF|BOT review generation reads from new tables
- [ ] All API routes updated
- [ ] No remaining references to `posts.content` or `morningState` scale columns
- [ ] Mobile reading experience unchanged

---

## Issue 4: Add phone number field to user registration and account settings

**Labels:** `enhancement`, `planned`
**Milestone:** Release 0.1 — Journaling

### Description

Add a `phoneNumber` field to the `users` table, capture it during registration, and allow editing in account settings. Phone number is required for new registrations and acts as a prerequisite for Telegram linking (which verifies the number).

**See:** `docs/SCHEMA.md`, `lib/db/schema.ts`

### Schema changes

Add to `users` table:

| Column | Type | Notes |
|--------|------|-------|
| phoneNumber | text | International format, e.g. `+447700900000` |
| phoneVerified | bool | Default `false` — set `true` when Telegram links successfully |
| telegramChatId | text | Populated when Telegram account is linked |

### Implementation

#### Registration (`app/(main)/register/`)
- Add phone number input to registration form
- International format validation (E.164): starts with `+`, 7-15 digits
- Required field — cannot register without it
- Store normalised (strip spaces, dashes)

#### Account settings (`app/(main)/account/`)
- New section: "Phone & Telegram"
- Display current phone number with edit capability
- Show Telegram link status: "Not linked" / "Linked" with chat ID
- If phone number changes after Telegram is linked, unlink Telegram and reset `phoneVerified`

#### Existing users
- Phone number is nullable for existing users (they registered before this requirement)
- Show a prompt on login: "Add your phone number to unlock Telegram features"
- Do not block existing users from using the site

### Acceptance criteria

- [ ] `phoneNumber`, `phoneVerified`, `telegramChatId` columns added to `users`
- [ ] Registration form captures phone number (required for new users)
- [ ] E.164 format validation
- [ ] Account settings shows phone + Telegram status
- [ ] Changing phone number resets verification
- [ ] Existing users prompted but not blocked
- [ ] `docs/SCHEMA.md` updated

---

## Issue 5: Telegram bot setup — BotFather, webhook, API route

**Labels:** `enhancement`, `planned`, `infrastructure`
**Milestone:** Release 0.1 — Journaling

### Description

Set up the Wolfman Telegram bot infrastructure: register the bot, create the webhook endpoint, and establish basic message send/receive capability.

### Steps

#### 1. Register bot with BotFather
- Create bot via Telegram's @BotFather
- Set bot name, description, and profile picture (Wolfman wolf logo)
- Store bot token as `TELEGRAM_BOT_TOKEN` in environment variables
- Add to `.env.local` for development, Vercel dashboard for production

#### 2. Create webhook API route

`app/api/telegram/webhook/route.ts`

- POST handler that receives Telegram webhook updates
- Verify webhook authenticity (Telegram sends from known IPs, optionally verify with secret token)
- Parse incoming message: extract `chatId`, `text`, `contact` (phone number)
- Log received messages for debugging during development
- Return 200 OK promptly (Telegram retries on failure)

#### 3. Webhook registration

- Script or API route to register the webhook URL with Telegram: `https://api.telegram.org/bot<token>/setWebhook?url=<webhook_url>`
- Development: use a tunnel service (ngrok or similar) or test via Telegram's getUpdates polling
- Production: `https://wolfman.app/api/telegram/webhook`

#### 4. Outbound message helper

`lib/telegram.ts`

- `sendMessage(chatId: string, text: string, options?: { replyMarkup?: InlineKeyboard })` — sends a text message
- `sendMessageWithButtons(chatId: string, text: string, buttons: Button[][])` — sends a message with inline keyboard
- Types for Telegram API responses and webhook payloads

#### 5. Environment variables

| Variable | Purpose |
|----------|---------|
| `TELEGRAM_BOT_TOKEN` | Bot API token from BotFather |
| `TELEGRAM_WEBHOOK_SECRET` | Optional secret for webhook verification |

### Acceptance criteria

- [ ] Bot registered and accessible on Telegram
- [ ] Webhook endpoint receives messages and logs them
- [ ] Outbound message sending works (test: bot can reply to a message)
- [ ] `lib/telegram.ts` utility functions created
- [ ] Environment variables documented
- [ ] Bot profile set up with Wolfman branding

---

## Issue 6: Telegram account linking — phone number verification

**Labels:** `enhancement`, `planned`
**Milestone:** Release 0.1 — Journaling

### Description

When a user messages the Wolfman Telegram bot, match their Telegram phone number against stored phone numbers in the `users` table to link their account. This simultaneously verifies the phone number and enables Telegram features.

**Depends on:** Issue 4 (phone number field), Issue 5 (Telegram bot setup)
**See:** `docs/SCHEMA.md`

### Flow

1. User has added their phone number in Wolfman account settings
2. User opens Telegram and searches for the Wolfman bot
3. User taps "Start" or sends any message
4. Bot receives the message — Telegram provides the user's phone number via the `contact` object (only if the user shares it)
5. **Important:** Telegram does NOT automatically share phone numbers. The bot must request it:
   - Bot sends: "Welcome to Wolfman! To link your account, please share your phone number."
   - Bot sends a special keyboard with a "Share Phone Number" button (`request_contact: true`)
   - User taps the button → Telegram sends their verified phone number to the bot
6. Bot matches the phone number against `users.phoneNumber`
7. On match:
   - Store `telegramChatId` on the user record
   - Set `phoneVerified = true`
   - Bot confirms: "You're linked! I'll send your morning check-ins here."
8. On no match:
   - Bot responds: "I couldn't find an account with that number. Check your phone number in your Wolfman account settings at wolfman.app/account."

### Unlinking

- User can unlink from account settings
- Clears `telegramChatId`, keeps `phoneVerified = true` (the number was still verified)
- Bot is notified and stops sending prompts

### Edge cases

- User changes phone number after linking → unlink automatically, require re-linking
- Multiple users with the same phone number → reject, phone numbers must be unique
- User messages bot without having a Wolfman account → friendly message directing them to register

### Acceptance criteria

- [ ] Bot requests phone number share on first interaction
- [ ] Phone number matching works against `users.phoneNumber`
- [ ] Successful link stores `telegramChatId` and sets `phoneVerified = true`
- [ ] Failed match shows helpful error message
- [ ] Unlink flow works from account settings
- [ ] Phone number uniqueness enforced
- [ ] Edge cases handled gracefully

---

## Issue 7: Telegram conversation state machine

**Labels:** `enhancement`, `planned`
**Milestone:** Release 0.1 — Journaling

### Description

Build the structured conversation flow that guides users from opening the bot to submitting journal entries and scale readings. The state machine controls what the bot asks and how it processes responses. This is the fixed skeleton — Haiku personalisation is added in Issue 8.

**Depends on:** Issue 6 (account linking)

### States

```
IDLE
  → User sends message or taps menu
  → Show action menu

ACTION_MENU
  → Display buttons: [Mood Score] [Energy Score] [Focus Score] [Stress Score]
                      [Intention] [Gratitude] [Great At] [Reflection]
                      [Done]

PROMPTING_SCALE (type: brain/body/happy/stress)
  → Display: "How's your [type]?" + [1] [2] [3] [4] [5] [6] [7] [8]
  → User taps number → save to scaleEntries → return to ACTION_MENU

PROMPTING_JOURNAL (type: intention/gratitude/great_at/reflection)
  → Display: prompt for this entry type + [Skip]
  → User sends text → save to journalEntries → return to ACTION_MENU
  → User taps Skip → return to ACTION_MENU

DONE
  → Confirm what was logged → return to IDLE
```

### State storage

- Store current conversation state per user: `telegramState` JSONB column on `users`, or a separate `telegramSessions` table
- State includes: `currentState`, `currentType`, `postId` (the day's parent post)
- State resets daily or on timeout

### Auto-create daily post

- When the user's first interaction of the day comes in, auto-create the parent `posts` record for today (status: `draft`, date: today)
- All subsequent entries and scales attach to this post
- If the user later opens the website to write their journal, it's already there with their Telegram entries pre-populated

### Processing user input

- **Button taps** — deterministic, the callback data tells us exactly what was selected
- **Free text** — attempt to parse:
  - If in `PROMPTING_SCALE` state and text contains a number 1-8, extract it
  - If in `PROMPTING_JOURNAL` state, save the text as the entry content
  - If in `IDLE` state, show the action menu
  - Unparseable input → friendly fallback: "I didn't catch that — here are your options:" + buttons

### Acceptance criteria

- [ ] State machine handles all defined states and transitions
- [ ] Scale entries saved to `scaleEntries` with `source: 'telegram'`
- [ ] Journal entries saved to `journalEntries` with `source: 'telegram'`
- [ ] Daily post auto-created on first interaction of the day
- [ ] Button and free-text input both work
- [ ] State persists between messages within a session
- [ ] Graceful fallback for unparseable input
- [ ] Action menu accessible at any time

---

## Issue 8: Haiku integration — contextual prompt generation and input parsing

**Labels:** `enhancement`, `planned`
**Milestone:** Release 0.1 — Journaling

### Description

Add Claude Haiku to the Telegram bot flow to generate warm, personalised prompt text and parse freeform user responses. Haiku wraps the fixed state machine (Issue 7) — it doesn't control the flow, it makes it feel human.

**Depends on:** Issue 7 (state machine)
**See:** `docs/WOLFBOT.md` (for existing Anthropic API usage patterns)

### Prompt generation

When the state machine needs to send a message (e.g. "ask about mood"), Haiku generates the actual text.

**Input to Haiku:**
```
System: You are the Wolfman Telegram bot. Generate a short, warm
check-in message for {userName}. Keep it 1-2 sentences. Match the
Wolfman tone: honest, warm, self-aware, never preachy. Reference
context only if it adds something genuine — don't force it.

Context:
- Current state: prompting_scale (mood)
- Time of day: morning
- Yesterday's scales: mood 7, energy 5, stress 3
- Yesterday's WOLF|BOT excerpt: "strong creative output but physically drained"
- Active streaks: meditation 12 days, sunlight 8 days
- Last gratitude entry: "the light through the trees on my ride"
- Day of week: Tuesday

Generate a check-in message. End with the scale prompt.
```

**Output:** 1-2 sentences + the scale options are appended by the system (not generated by Haiku).

### Context engine

`lib/telegram-context.ts`

Fetches lightweight context for the current user:
- Yesterday's `scaleEntries` (averaged by type)
- Yesterday's WOLF|BOT review excerpt (from `wolfbotReviews`)
- Active ritual streaks (from `morningState` routine checklist history)
- Last 3 `journalEntries` of each type (for continuity)
- Current time of day and day of week
- User's name and any WOLF|BOT personalisation fields (profession, humour source)

This context payload should be small — under 500 tokens. Haiku processes it fast and cheap.

### Input parsing

When a user sends free text in a scale prompt context, Haiku extracts structured data:

```
System: The user is responding to a mood scale prompt (1-8).
Extract the numeric value if present. Return JSON: { "value": N }
or { "value": null } if no clear number.

User message: "I'm feeling about a 6 today, bit tired but good"
```

Response: `{ "value": 6 }`

### Fallback

- If the Anthropic API is unavailable, fall back to fixed prompt text (e.g. "How's your mood right now?")
- Never block the user from logging data because the AI is down
- Log API failures for monitoring

### Cost management

- Each Haiku call: ~100-200 tokens in, ~50 tokens out
- At current Haiku pricing, this is fractions of a penny per interaction
- Track token usage in logs for monitoring
- Consider caching: if the same user gets the same prompt type within 5 minutes (e.g. they cancelled and retried), reuse the previous generated text

### Acceptance criteria

- [ ] Haiku generates contextual prompts for each state machine transition
- [ ] Context engine fetches relevant historical data per user
- [ ] Freeform input parsing extracts structured data correctly
- [ ] Fallback to fixed prompts when API is unavailable
- [ ] Token usage logged
- [ ] Wolfman tone of voice consistent in generated messages
- [ ] Response generation completes within 2 seconds

---

## Issue 9: Scheduled prompts — morning, midday, and evening check-ins

**Labels:** `enhancement`, `planned`
**Milestone:** Release 0.1 — Journaling

### Description

Send scheduled Telegram messages that prompt users to log data at configured times throughout the day. This replaces (or supplements) the existing email morning reminder system.

**Depends on:** Issue 8 (Haiku integration)
**See:** `docs/NOTIFICATIONS.md`, `lib/email.ts`

### Default schedule

| Time | Prompt | Data collected |
|------|--------|----------------|
| Morning (user-configured, default 07:00) | Mood + intention prompt | `scaleEntries` (mood) + optional `journalEntries` (intention) |
| Midday (13:00) | Energy + gratitude prompt | `scaleEntries` (energy) + optional `journalEntries` (gratitude) |
| Evening (20:00) | Reflection prompt | `journalEntries` (reflection) + optional `scaleEntries` (stress) |

### User configuration

Extend existing reminder settings (`users` table fields or `preferences` JSONB):

| Setting | Options |
|---------|---------|
| `telegramPromptsEnabled` | bool — master toggle |
| `telegramMorningTime` | time string, e.g. "07:30" |
| `telegramMiddayEnabled` | bool |
| `telegramEveningEnabled` | bool |
| `telegramTimezone` | reuse existing `morningReminderTimezone` |

Settings UI in `/settings` page — new "Telegram Prompts" section.

### Implementation

#### Cron job

`app/api/cron/telegram-prompts/route.ts`

- Runs every 15 minutes (same pattern as existing `morning-reminder` cron)
- Queries users where:
  - `telegramChatId` is not null (linked)
  - `telegramPromptsEnabled` is true
  - Current time in user's timezone matches a configured prompt window
  - No prompt of this type sent in the last hour (prevent duplicates)
- For each matched user:
  - Generate contextual prompt via Haiku (Issue 8)
  - Send via Telegram with appropriate action buttons
  - Set user's conversation state to the relevant prompting state
  - Record `lastTelegramPromptSentAt` to prevent duplicates

#### Relationship to email reminders

- Email morning reminders (`api/cron/morning-reminder/`) continue to work independently
- Users can have both email and Telegram reminders, or just one
- If a user has Telegram linked and enabled, default to Telegram only (email as fallback)
- Setting on `/settings`: "Receive reminders via: Email / Telegram / Both"

### Acceptance criteria

- [ ] Cron job sends prompts at configured times per user timezone
- [ ] Morning, midday, and evening prompts configurable independently
- [ ] Settings UI for prompt preferences
- [ ] Duplicate prevention (no repeated prompts within an hour)
- [ ] Coexistence with email reminders
- [ ] Prompts trigger the correct conversation state for responses
- [ ] Respects user's timezone correctly

---

## Issue 10: Journal page redesign — timestamped entries building through the day

**Labels:** `enhancement`, `planned`, `ux`
**Milestone:** Release 0.1 — Journaling

### Description

Redesign the journal reading page to display timestamped entries that build throughout the day. Instead of one static block of text per section, the page shows a growing collection of entries with timestamps and source indicators.

**Depends on:** Issue 3 (website reads from new tables)
**See:** `docs/ARCHITECTURE.md`

### Design

#### Section rendering

Each journal section (Intention, Gratitude, Great At, Reflection) now renders as a list of entries:

**Single entry (most common for Intention):**
Renders as it does today — clean text, no timestamp clutter. Indistinguishable from current design.

**Multiple entries (likely for Gratitude, Great At):**
```
I'm Grateful For

  "My daughter's laugh at breakfast"
  7:15am

  "A stranger held the door and smiled"
  12:40pm · via Telegram

  "The sunset through my office window"
  5:30pm · via Telegram
```

- Timestamps shown subtly (small, muted text)
- Source shown only for Telegram entries (`via Telegram`) — web entries show no source tag
- Entries ordered chronologically
- The reading experience must remain clean — timestamps are supplementary, never competing with the words

#### Scale display

**Single reading per type:** Shows as current ring/number display.

**Multiple readings per type:**
- Display the daily average prominently
- Small sparkline or dot trail showing readings through the day (e.g. mood: 5 → 7 → 6, avg 6)
- Tap/hover to see individual readings with timestamps

#### "How did the day go" section

New section on the journal page (below Morning Rituals, above Post Info):
- Renders `journalEntries` with `type: 'reflection'`
- Only shows if entries exist
- Warm section header: "How Did The Day Go" or similar

#### Source indicators

Subtle icon or text showing where an entry came from:
- Web entries: no indicator (default)
- Telegram entries: small Telegram icon or "via Telegram" text
- This helps the user see the journey of their day across platforms

### Sacred reading experience

**Critical:** The journal reading page is sacred. These changes must enhance, never clutter:

- Single-entry posts must look identical to today
- Timestamps and source tags must be subtle — think `text-xs text-muted`
- Multiple entries should feel like a natural flow, not a chat log
- White space between entries is generous
- The "You have been reading..." footer and wolf logo are unchanged
- Mobile experience is the primary design target

### Acceptance criteria

- [ ] Multiple entries per section render with timestamps
- [ ] Single-entry sections look identical to current design
- [ ] Scale averages displayed with breakdown available
- [ ] "How Did The Day Go" section renders when reflection entries exist
- [ ] Source indicators shown subtly for Telegram entries
- [ ] Reading experience remains clean and uncluttered
- [ ] Mobile-first design
- [ ] No regressions to existing journal page behaviour
