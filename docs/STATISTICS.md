# Statistics — Wolfman.blog

> **Placeholder** — this file will be populated when the Statistics feature is built.

---

## Current State

The following stats are already live on the user profile page (`/[username]`):

- Total journals logged
- Current streak
- Longest streak
- Journals this month
- Morning Zone scatter chart (body vs brain vs happiness)
- Trend charts (via `StatsCharts.tsx`)

## Planned Scope

- Profile stats finalised and polished
- Site-wide statistics (community-level data)
- WOLF|BOT data layer (aggregate insights from WOLF|BOT reviews)
- Achievements foundation (Statistics provides the data layer that Achievements depends on)
- Day score scatter chart (`DayScoreScatter.tsx`)

## Key Decisions (to be defined)

- Which site-wide stats are public vs private
- WOLF|BOT aggregate data — what is meaningful to surface
- How statistics feed into the Achievements system
- Chart library and visual design standards

## Related Features

- **Achievements** — depends on the Statistics data layer. See `docs/ACHIEVEMENTS.md`.
- **WOLF|BOT** — contributes data to the Statistics layer. See `docs/WOLFBOT.md`.

## GitHub Issues

When raising issues for the Statistics feature, reference this file (`docs/STATISTICS.md`).
