// Shared utility — parse a post's markdown content back into the three named sections.
// Used by the edit page and the wolfbot-reviews API route.

export function parseContent(content: string): { intention: string; grateful: string; greatAt: string } {
  const sections: Record<string, string> = {}
  const blocks = content.split(/^## /m).filter(Boolean)
  for (const block of blocks) {
    const newline = block.indexOf('\n')
    if (newline === -1) continue
    const heading = block.slice(0, newline).trim().toLowerCase()
    const body = block.slice(newline + 1).trim()
    if (heading.includes('intention')) sections.intention = body
    else if (heading.includes('grateful')) sections.grateful = body
    else if (heading.includes('great')) sections.greatAt = body
  }
  return {
    intention: sections.intention ?? content,
    grateful: sections.grateful ?? '',
    greatAt: sections.greatAt ?? '',
  }
}
