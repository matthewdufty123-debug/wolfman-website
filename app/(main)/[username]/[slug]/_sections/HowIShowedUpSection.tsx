import HumanScoresSection from '@/components/journal/HumanScoresSection'
import { getScalesForPost, getScaleHistory, getScaleEntriesForPost } from '@/lib/db/queries'

interface Props {
  postId: string
  authorId: string
  postDate: string
}

export interface ScaleHistoryEntry {
  brainScale: number | null
  bodyScale: number | null
  happyScale: number | null
  stressScale: number | null
  date: string
}

// Build the ordered 14-slot date array: oldest (slot 0) → postDate (slot 13)
function buildSlotDates(postDate: string): string[] {
  const slots: string[] = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date(postDate + 'T00:00:00')
    d.setDate(d.getDate() - i)
    slots.push(d.toISOString().split('T')[0])
  }
  return slots
}

export default async function HowIShowedUpSection({ postId, authorId, postDate }: Props) {
  const [currentScales, scaleEntries] = await Promise.all([
    getScalesForPost(postId),
    getScaleEntriesForPost(postId),
  ])

  const hasScales = currentScales.brainScale != null || currentScales.bodyScale != null ||
    currentScales.happyScale != null || currentScales.stressScale != null
  if (!hasScales) return null

  const slotDates = buildSlotDates(postDate)
  const windowStart = slotDates[0]

  let history: ScaleHistoryEntry[] = []
  try {
    if (authorId) {
      const byDate = await getScaleHistory(authorId, windowStart, postDate)
      history = slotDates.map(date => {
        const scales = byDate.get(date)
        return scales
          ? { ...scales, date }
          : { brainScale: null, bodyScale: null, happyScale: null, stressScale: null, date }
      })
    }
  } catch (err) {
    console.error('[HowIShowedUp] History query failed:', err)
  }

  if (history.length === 0) {
    history = slotDates.map(date => ({
      brainScale: date === postDate ? currentScales.brainScale : null,
      bodyScale: date === postDate ? currentScales.bodyScale : null,
      happyScale: date === postDate ? currentScales.happyScale : null,
      stressScale: date === postDate ? currentScales.stressScale : null,
      date,
    }))
  }

  const postEntry = history[history.length - 1]

  return (
    <HumanScoresSection
      brainScale={postEntry.brainScale}
      bodyScale={postEntry.bodyScale}
      happyScale={postEntry.happyScale ?? null}
      stressScale={postEntry.stressScale ?? null}
      history={history}
      scaleEntries={scaleEntries}
    />
  )
}
