import { parseContent } from './parse-content'

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length
}

export function calculateWordCounts(content: string) {
  const { intention, grateful, greatAt } = parseContent(content)
  const wordCountIntention = countWords(intention)
  const wordCountGratitude = countWords(grateful)
  const wordCountGreatAt   = countWords(greatAt)
  return {
    wordCountIntention,
    wordCountGratitude,
    wordCountGreatAt,
    wordCountTotal: wordCountIntention + wordCountGratitude + wordCountGreatAt,
  }
}
