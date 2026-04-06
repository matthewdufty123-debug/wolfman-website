# Morning Routines & Data — Wolfman.blog

This file covers the morning ritual system, morning scales, evening reflection,
and all related data capture. These are core to the journalling experience.

---

## The 10 Morning Rituals

Stored in `ROUTINE_ICON_MAP` in `components/RoutineIcons.tsx`. This is the single source of truth
for ritual metadata — do not define ritual names, descriptions, or colours anywhere else.

| Key | Display Name | Description | Brand Colour |
|-----|-------------|-------------|-------------|
| `sunlight` | Sunlight | Natural light for circadian rhythm | `#C8B020` (gold) |
| `breathwork` | Breathwork | Pranayama / Wim Hof for nervous system | `#70C0C8` (teal) |
| `cacao` | Ceremonial Drink | Cacao / Matcha ceremonial drink | `#A0622A` (bronze) |
| `meditation` | Still Meditation | Sitting in stillness | `#4A7FA5` (slate) |
| `coldShower` | Cold Shower | Cold exposure for presence | `#2A6AB0` (steel blue) |
| `walk` | Outside Walk | Nature walk to ground mind | `#3AB87A` (green) |
| `animalLove` | Animal Love | Connecting with animals | `#C87840` (copper) |
| `caffeine` | Drink Caffeine | Tea / coffee mindful brew | `#7A5030` (brown) |
| `yoga` | Yoga Movement | Yoga to stretch and arrive in body | `#8070B0` (purple) |
| `workout` | Workout | Physical training for strength | `#C05828` (orange) |

### Key naming

Ritual keys use **camelCase** in the database and throughout the codebase.
Always use `coldShower` and `animalLove` — never `cold_shower` or `animal_love`.

---

## Morning Scales

Four scales captured at publish time via the PostForm "After Waking" tab.

| Field | Range | What it measures |
|-------|-------|-----------------|
| `brainScale` | 1–8 | Brain activity / mental clarity |
| `bodyScale` | 1–8 | Body energy / physical readiness |
| `happyScale` | 1–8 | Happiness / mood |
| `stressScale` | 1–8 | Stress level |

All scales run **1–8**. Any reference to 1–6 elsewhere is incorrect.

---

## Evening Reflection

Two fields, both stored directly on the `posts` table (not a separate table):

| Field | Type | Notes |
|-------|------|-------|
| `eveningReflection` | text | Free-text reflection on the day |
| `feelAboutToday` | int | 1–6 sentiment scale |

### feelAboutToday values

| Value | Meaning |
|-------|---------|
| 1 | Want to Forget |
| 2 | Rough Day |
| 3 | Just OK |
| 4 | Pretty Good |
| 5 | Great Day |
| 6 | Best Day Ever |

Captured via PostForm "Before Bed" tab, or inline on the journal reading page.

---

## Database Table — `morningState`

One row per post. Captured at publish time.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| postId | UUID | Unique FK → posts |
| brainScale | int | 1–8, nullable |
| bodyScale | int | 1–8, nullable |
| happyScale | int | 1–8, nullable |
| stressScale | int | 1–8, nullable |
| routineChecklist | JSONB | `{ sunlight?: bool, breathwork?: bool, … }` — all 10 ritual keys |
| createdAt | timestamp | |

### routineChecklist shape

```json
{
  "sunlight": true,
  "breathwork": false,
  "cacao": true,
  "meditation": true,
  "coldShower": false,
  "walk": true,
  "animalLove": false,
  "caffeine": true,
  "yoga": false,
  "workout": true
}
```

Missing keys = not completed. Boolean `true` = ritual completed that morning.

---

## PostForm Tabs

The write/edit form (`PostForm.tsx`) has two tabs:

**After Waking tab** — captured at or near publish time:
- Brain, body, happy, stress scales (1–8 sliders)
- Routine checklist (10 ritual toggles)
- Journal photo upload (Vercel Blob)

**Before Bed tab** — captured at end of day:
- Evening reflection (free text)
- Feel about today picker (1–6)

---

## Pages & Routes

| Route | Purpose |
|-------|---------|
| `/morning-ritual/[key]` | Filter journals by ritual key — e.g. `/morning-ritual/coldShower` |
| `/rituals` | Rituals overview placeholder — full build is the Rituals feature |

There is **no root page** at `/morning-ritual/` — always use `/rituals` for the overview.

---

## Key Components

| Component | Purpose |
|-----------|---------|
| `RoutineIcons.tsx` | Central registry (`ROUTINE_ICON_MAP`) + `RoutineIconSet` and `RoutineIconBar` display components |
| `MorningRitualIconBar.tsx` | Interactive icon bar on journal page — hover animations, click popup with ritual details + "see all journals" link |
| `AnimatedRoutineIcons.tsx` | Intersection observer animation — staggered fade-in of completed ritual icons on scroll |
| `MorningScaleBar.tsx` | Scale display component (brain/body/happy) |

---

## GitHub Issues

When raising issues for morning routines, scales, or evening reflection, reference this file
(`docs/ROUTINES.md`) and the feature name **Routines** or **Morning Data** in the issue.
