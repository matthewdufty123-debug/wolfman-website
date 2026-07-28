import type { TodayData, TodayEntry } from '@/lib/actions/today'
import type { RitualDef } from '@/app/(post)/today/TodayHub'

/**
 * A journal as it looks the moment you open /today — created, untitled work
 * done, nothing written yet. Override anything you need per test.
 */
export function makeTodayData(overrides: Partial<TodayData> = {}): TodayData {
  return {
    post: {
      id: 'post-test-1',
      date: '2026-07-28',
      title: "Today's Intentional Journal — 28th Jul '26",
      slug: '2026-07-28-todays-intentional-journal',
      status: 'draft',
      image: null,
      imageCaption: null,
      videoId: null,
      feelAboutToday: null,
      titleSuggestionsUsed: null,
      isPublic: false,
      publishedAt: null,
      ...overrides.post,
    },
    entries: overrides.entries ?? [],
    scales: {
      brainScale: null,
      bodyScale: null,
      happyScale: null,
      stressScale: null,
      ...overrides.scales,
    },
    rituals: overrides.rituals ?? {},
  }
}

export function makeEntry(overrides: Partial<TodayEntry> = {}): TodayEntry {
  return {
    id: 'entry-test-1',
    type: 'intention',
    content: 'Something already written and saved.',
    source: 'web',
    sortOrder: 0,
    createdAt: new Date('2026-07-28T06:00:00Z'),
    updatedAt: new Date('2026-07-28T06:00:00Z'),
    ...overrides,
  }
}

export const testRituals: RitualDef[] = [
  {
    key: 'meditate',
    label: 'Meditate',
    description: 'Sit with it',
    category: 'mind',
    color: '#4A7FA5',
    svgContent: null,
    sortOrder: 0,
  },
]
