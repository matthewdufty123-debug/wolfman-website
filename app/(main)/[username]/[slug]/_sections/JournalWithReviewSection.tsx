import { db } from '@/lib/db'
import { dayScores, wolfbotReviews as wolfbotReviewsTable, wolfbotConfig } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import type { ProcessedPost } from '@/lib/posts'
import { getEntriesForPost } from '@/lib/db/queries'
import JournalTextSection from '@/components/journal/JournalTextSection'
import JournalEntriesSection from '@/components/journal/JournalEntriesSection'
import WolfBotSection, { type WolfBotReviews } from '@/components/journal/WolfBotSection'

interface Props {
  post: ProcessedPost
  postId: string
  isOwner: boolean
}

export default async function JournalWithReviewSection({ post, postId, isOwner }: Props) {
  const [wbr, ds, promptVersionRow, pixelGridRow, pixelPaletteRow, entries] = await Promise.all([
    db.select({
      review:        wolfbotReviewsTable.review,
      reviewRating:  wolfbotReviewsTable.reviewRating,
      reviewHelpful: wolfbotReviewsTable.reviewHelpful,
      reviewSassy:   wolfbotReviewsTable.reviewSassy,
    })
      .from(wolfbotReviewsTable)
      .where(eq(wolfbotReviewsTable.postId, postId))
      .then(r => r[0] ?? null),
    db.select().from(dayScores).where(eq(dayScores.postId, postId)).then(r => r[0] ?? null),
    db.select({ value: wolfbotConfig.value })
      .from(wolfbotConfig)
      .where(eq(wolfbotConfig.key, 'prompt_version'))
      .then(r => r[0] ?? null),
    db.select({ value: wolfbotConfig.value })
      .from(wolfbotConfig)
      .where(eq(wolfbotConfig.key, 'pixel_grid'))
      .then(r => r[0] ?? null),
    db.select({ value: wolfbotConfig.value })
      .from(wolfbotConfig)
      .where(eq(wolfbotConfig.key, 'pixel_palette'))
      .then(r => r[0] ?? null),
    getEntriesForPost(postId),
  ])

  const promptVersion = (promptVersionRow?.value as number) ?? 1
  const pixelGrid     = pixelGridRow?.value    ? (pixelGridRow.value    as number[][])             : undefined
  const pixelPalette  = pixelPaletteRow?.value ? (pixelPaletteRow.value as Record<string, string>) : undefined

  const synthesis = ds?.synthesis ?? post.review ?? null
  const wolfbotReviews: WolfBotReviews | null = wbr

  // Use entry-based rendering if normalised entries exist, otherwise fall back to markdown
  const hasEntries = entries.length > 0 && entries.some(e => e.type !== 'reflection')

  return (
    <>
      <section id="the-journal" className="journal-section journal-section--text">
        {hasEntries
          ? <JournalEntriesSection post={post} entries={entries} />
          : <JournalTextSection post={post} />
        }
      </section>

      <WolfBotSection
        synthesis={synthesis}
        wolfbotReviews={wolfbotReviews}
        isOwnPost={isOwner}
        postId={postId}
        promptVersion={promptVersion}
        pixelGrid={pixelGrid}
        pixelPalette={pixelPalette}
      />
    </>
  )
}
