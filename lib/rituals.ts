import { db } from '@/lib/db'
import { rituals } from '@/lib/db/schema'
import { eq, asc } from 'drizzle-orm'

export type Ritual = typeof rituals.$inferSelect

/**
 * Fetch all rituals from DB, sorted by sortOrder.
 * Includes both active and archived.
 */
export async function getAllRituals(): Promise<Ritual[]> {
  return db.select().from(rituals).orderBy(asc(rituals.sortOrder))
}

/**
 * Fetch only active (non-archived) rituals, sorted by sortOrder.
 * Used by the journal form to show selectable rituals.
 */
export async function getActiveRituals(): Promise<Ritual[]> {
  return db
    .select()
    .from(rituals)
    .where(eq(rituals.isActive, true))
    .orderBy(asc(rituals.sortOrder))
}

/**
 * Build a key→Ritual map from all rituals (active + archived).
 * Used by display components that need to render historical data.
 */
export async function getRitualMap(): Promise<Record<string, Ritual>> {
  const rows = await getAllRituals()
  const map: Record<string, Ritual> = {}
  for (const r of rows) map[r.key] = r
  return map
}

/**
 * Group active rituals by category.
 * Returns entries sorted by category appearance order (based on lowest sortOrder
 * ritual in each category), with rituals sorted by sortOrder within each group.
 */
export async function getRitualsByCategory(): Promise<Map<string, Ritual[]>> {
  const rows = await getActiveRituals()
  const map = new Map<string, Ritual[]>()
  for (const r of rows) {
    const list = map.get(r.category) ?? []
    list.push(r)
    map.set(r.category, list)
  }
  return map
}
