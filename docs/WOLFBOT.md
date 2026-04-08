# WOLF|BOT — Wolfman.blog

WOLF|BOT is the AI journalling assistant built into the site. It reads a user's journal entry
and generates a personalised review. Always written as **WOLF|BOT** — never "Wolfbot" or "Wolf Bot".

---

## Current System (Single Review)

WOLF|BOT generates **one review per journal**. The review is a single AI-generated text,
personalised to the author's profession and humour style. Users can rate the review with a
3-point widget: 👎 👍 🔥

### Legacy Note

The database still contains fields from an earlier 4-personality system
(`reviewHelpful`, `reviewIntellectual`, `reviewLovely`, `reviewSassy`). These are **legacy** —
do not add new features that use these fields. The active field is `review` (+ `reviewRating`).
The `WolfBotSection` component has a `LegacyTerminal` sub-component for backwards-compatible
display of old entries only.

---

## Terminal UI

The journal reading page shows WOLF|BOT in a terminal-style component (`journal/WolfBotSection.tsx`):

- **Boot sequence** — plays on first render
- **WOLF BRAIN vN** — version number pulled from `wolfbot_config.prompt_version`, shown in boot
- **Typewriter effect** — review text types out character by character
- **Rating widget** — 👎 👍 🔥 (stored as `reviewRating`: null, 1, 2, 3)
- **Voice synthesis** — Web Speech API reads the review aloud (browser voice selection)
- **10 random loading quips** — shown while review generates (`WOLFBOT_QUIPS` in WolfBotSection)
- **Eye-scan animation** — `WolfBotLoadingOverlay.tsx` shown during generation

### Trigger

- Users trigger once per journal via a button in `PostForm` or the journal reading page
- Admin can re-trigger at any time
- `isPremium()` stub in the API route — all users treated as premium until the Subscriptions
  feature ships. Do not gate WOLF|BOT behind premium until that feature is built.

---

## User Personalisation

Users set two profile fields on `/account` that personalise every WOLF|BOT review:

- **Profession** — 16 options (e.g. Developer, Teacher, Artist, Entrepreneur…)
- **Humour style** — 6 options (e.g. Dry, Warm, Sarcastic…)

Component: `AccountWolfBotProfileForm.tsx`
DB fields: `users.profession`, `users.humourSource`

These are included in the prompt context when generating a review.

---

## Config System

All live WOLF|BOT configuration is stored in the `wolfbot_config` table (key-value store).
Admin-only. Edited via `/admin/wolfbot`.

### Config Keys

| Key | Purpose |
|-----|---------|
| `prompt_core` | Main review prompt |
| `title_prompt` | Title suggestion prompt |
| `model` | Claude model for reviews (Haiku/Sonnet/Opus) |
| `title_model` | Claude model for title suggestions |
| `max_tokens` | Token limit for reviews |
| `title_max_tokens` | Token limit for title suggestions |
| `title_max_words` | Max words in suggested title |
| `title_max_chars` | Max characters in suggested title |
| `context_post_count` | Number of recent posts included as context (default 5) |
| `context_day_limit` | Max age in days for context entries (default 30) |
| `grid` | 25×25 pixel art grid (JSONB) |
| `palette` | 10-colour palette (JSONB) |

### Supported Models

- `claude-haiku-4-5-20251001` — fastest, cheapest (default for reviews)
- `claude-sonnet-4-6` — balanced
- `claude-opus-4-6` — most capable

---

## Prompt Versioning

Every time a prompt or token cap is saved via the admin panel:

1. `prompt_version` in `wolfbot_config` auto-increments
2. A row is written to `wolfbot_version_log` (append-only audit log)
3. The new version number shows as **WOLF BRAIN vN** in the terminal boot sequence

Never manually edit `prompt_version` — it is managed by the API route.

---

## Pixel Art

The WOLF|BOT sprite is a 25×25 pixel grid with a 10-colour palette.

**Single source of truth:** `lib/wolfbot-pixel-data.ts`
- `WOLFBOT_GRID` — 25×25 array of colour keys
- `WOLFBOT_PALETTE` — map of key → hex colour
- `LEFT_EYE_CELLS` / `RIGHT_EYE_CELLS` — coordinate sets used for eye animation

**Never hardcode pixel data anywhere else.** All components import from this file.

The admin panel (`/admin/wolfbot`) has a live pixel art editor. Edited grid/palette values
are saved to `wolfbot_config` as JSONB and override the defaults from `wolfbot-pixel-data.ts`
at render time. `WolfBotIcon.tsx` accepts optional grid/palette props — if provided (from
live config), it renders those; otherwise falls back to the hardcoded defaults.

### Palette (default colours)

| Key | Hex | Role |
|-----|-----|------|
| 1 | transparent | Background |
| 2 | `#C2C2C2` | Main fur |
| 3 | `#2E2E2E` | Core facial dark |
| 4 | `#585858` | Alt facial mid-grey |
| 5 | `#4A90C4` | Outer eye |
| 6 | `#C6DDEA` | Inner eye |
| 7 | `#BB9040` | Tongue / bronze |
| 8 | `#E8A0B0` | Heart / blush |
| 9 | `#BF7E54` | Object / copper |
| 10 | `#A72525` | Angry |

---

## Admin Panel — `/admin/wolfbot`

- Prompt editor (core review prompt, title prompt)
- Model selector (per-task)
- Token limits and context count
- Pixel art canvas (25×25 grid editor + palette colour picker)
- Live version history table (from `wolfbot_version_log`)

---

## API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/posts/[id]/wolfbot-reviews` | POST | Generate review for a post |
| `/api/posts/[id]/wolfbot-rating` | PATCH | Update rating (null / 1 / 2 / 3) |
| `/api/posts/[id]/wolfbot-event` | — | Event tracking |
| `/api/admin/wolfbot-config` | GET | Fetch all config rows |
| `/api/admin/wolfbot-config` | PATCH | Upsert config value by key |
| `/api/admin/wolfbot-version-log` | GET | Fetch version audit log |
| `/api/admin/wolfbot-reviews` | GET | Fetch 20 most recent reviews with post context |

---

## Journal Context System

When WOLF|BOT generates a review, it also produces a `journalContext` JSONB object stored on the
`wolfbotReviews` row. This structured summary replaces the old 200-character raw content truncation
and provides richer signal for future reviews.

### journalContext shape

```json
{
  "tone": "reflective",
  "scores": "brain busy, body sluggish, happy joyful, stress peaceful",
  "rituals": ["breathwork", "coldShower", "walk"],
  "wordCountBand": "long",
  "themes": "physical recovery, long-term planning"
}
```

### Two-phase context fetch

When generating a review, the route fetches context in two phases:
1. **Rich context** from `wolfbotReviews` rows with `journalContext` (formatted as structured prose)
2. **Fallback** from `posts` table (200-char raw content) for entries without `journalContext`

The `context_day_limit` config key (default 30) limits how far back the context fetch looks.

### Context tiers (hardcoded in route)

| journalContextCount | Tier | Behaviour |
|---------------------|------|-----------|
| Under 7 | NEW USER | Review today only, no trend analysis, brief acknowledgement |
| 7 to 14 | EMERGING | Early comparisons, framed as developing |
| 14+ | FULL | Full capability, no reference to data building |

### Streak signal

| daysSinceLastEntry | Signal |
|--------------------|--------|
| null | First journal entry — warm welcome |
| 0 | Wrote twice today |
| 1 | Consecutive day — no special instruction |
| 2+ | Gap — warm welcome back, no guilt |

Tier and streak instructions are hardcoded in the API route, not in `prompt_core`. The admin
controls the creative voice via `prompt_core`; the code controls structural behaviour.

---

## Word Count

Word counts are calculated at save time (drafts and published) using `parseContent()` from
`lib/parse-content.ts`. Four columns on `posts`: `wordCountIntention`, `wordCountGratitude`,
`wordCountGreatAt`, `wordCountTotal`. The API route derives `wordCountBand` (short/medium/long)
from `wordCountTotal` and passes it to Claude.

A stacked bar chart on the profile page shows the percentage breakdown per journal.
Utility: `lib/word-count.ts`.

---

## Database Tables

### `wolfbotReviews` — one row per post

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| postId | UUID | Unique FK → posts (cascade delete) |
| review | text | The generated review (current system) |
| reviewRating | int | null / 1 (👎) / 2 (👍) / 3 (🔥) |
| themeWords | — | Theme keywords extracted |
| moodSignal | — | Mood signal extracted |
| profileNote | — | Profile-relevant note |
| journalContext | JSONB | Structured summary for trend context (tone, scores, rituals, wordCountBand, themes) |
| generatedAt | timestamp | When the review was generated |
| triggeredBy | UUID | FK → users |
| modelUsed | text | Which Claude model was used |
| inputTokensTotal | int | Token usage |
| outputTokensTotal | int | Token usage |
| triggerCount | int | How many times triggered |
| reviewHelpful | text | **LEGACY** — do not use |
| reviewIntellectual | text | **LEGACY** — do not use |
| reviewLovely | text | **LEGACY** — do not use |
| reviewSassy | text | **LEGACY** — do not use |
| countHelpful/Intellectual/Lovely/Sassy | int | **LEGACY** — do not use |

### `wolfbotConfig` — key-value store

| Column | Type | Notes |
|--------|------|-------|
| id | serial | PK |
| key | text | Unique — see Config Keys table above |
| category | text | Grouping |
| label | text | Human-readable label |
| value | JSONB | The config value |
| description | text | What it does |
| updatedAt | timestamp | |

### `wolfbotVersionLog` — append-only audit log

| Column | Type | Notes |
|--------|------|-------|
| id | serial | PK |
| version | int | Auto-incremented prompt version |
| keyChanged | text | Which config key was changed |
| oldValue | JSONB | Previous value |
| newValue | JSONB | New value |
| changedAt | timestamp | |
| changedBy | UUID | FK → users |

---

## Key Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `WolfBotSection` | `components/journal/WolfBotSection.tsx` | Main review UI on journal page |
| `WolfBotIcon` | `components/WolfBotIcon.tsx` | Pixel-art SVG sprite |
| `WolfBotLoadingOverlay` | `components/WolfBotLoadingOverlay.tsx` | Eye-scan animation during generation |
| `AccountWolfBotProfileForm` | `components/AccountWolfBotProfileForm.tsx` | Profession + humour style pickers on /account |

---

## GitHub Issues

When raising issues for WOLF|BOT, reference this file (`docs/WOLFBOT.md`) and the feature name
**WOLF|BOT** in the issue title and description.
