import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TodayHub from '@/app/(post)/today/TodayHub'
import { makeTodayData, makeEntry, testRituals } from '../fixtures/today'

/**
 * The /today publish gate.
 *
 * The bug these cover: text typed into a section lived only inside the form
 * until "Add" was pressed, and Publish counted committed entries only — so a
 * journal full of writing sat behind a dead button reading "Write at least one
 * entry above to publish your journal."
 */

function renderHub(data = makeTodayData()) {
  return render(
    <TodayHub
      initialData={data}
      rituals={testRituals}
      communityEnabled
      username="matthew"
    />,
  )
}

/** Mock fetch so each API route returns something plausible. */
function mockApi(overrides: Record<string, () => Response> = {}) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString()
    for (const [pattern, respond] of Object.entries(overrides)) {
      if (url.includes(pattern)) return respond()
    }
    if (url.includes('/entries')) {
      const body = init?.body ? JSON.parse(init.body as string) : {}
      return Response.json(
        { entry: makeEntry({ id: `entry-${Math.random()}`, type: body.type, content: body.content }) },
        { status: 201 },
      )
    }
    if (url.includes('/publish')) {
      return Response.json({
        slug: '2026-07-28-todays-intentional-journal',
        title: "Today's Intentional Journal — 28th Jul '26",
        publishedAt: new Date('2026-07-28T06:30:00Z').toISOString(),
      })
    }
    return Response.json({})
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

const publishButton = () => screen.getByRole('button', { name: /^(Publish|Republish|✓)/ })

async function typeIntoSection(user: ReturnType<typeof userEvent.setup>, label: string, text: string) {
  await user.click(screen.getByRole('button', { name: `Add ${label}` }))
  const editor = screen.getByPlaceholderText(
    label === "Today's Intention" ? 'What is your intention for today?' : /.*/,
  )
  await user.type(editor, text)
}

describe('/today — publishing', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  it('disables Publish on a genuinely empty journal', () => {
    mockApi()
    renderHub()
    expect(publishButton()).toBeDisabled()
    expect(screen.getByText(/Write at least one entry above/)).toBeInTheDocument()
  })

  it('enables Publish once an entry has been added', () => {
    mockApi()
    renderHub(makeTodayData({ entries: [makeEntry()] }))
    expect(publishButton()).toBeEnabled()
    expect(screen.queryByText(/Write at least one entry above/)).not.toBeInTheDocument()
  })

  // The reported bug.
  it('enables Publish when writing is typed but not yet added', async () => {
    mockApi()
    const user = userEvent.setup()
    renderHub()

    expect(publishButton()).toBeDisabled()

    await typeIntoSection(user, "Today's Intention", 'Set an intention and log how I feel.')

    expect(publishButton()).toBeEnabled()
    expect(screen.queryByText(/Write at least one entry above/)).not.toBeInTheDocument()
    expect(screen.getByText(/unsaved writing will be saved when you publish/)).toBeInTheDocument()
  })

  // The heart of it: pressing Publish must not lose what is on screen.
  it('saves writing left in an open editor before publishing', async () => {
    const fetchMock = mockApi()
    const user = userEvent.setup()
    renderHub()

    await typeIntoSection(user, "Today's Intention", 'My intention for today.')
    await user.click(publishButton())

    await waitFor(() => {
      const calls = fetchMock.mock.calls.map(c => String(c[0]))
      expect(calls.some(u => u.includes('/entries'))).toBe(true)
      expect(calls.some(u => u.includes('/publish'))).toBe(true)
    })

    // The entry must be saved *before* the publish call, never after.
    const urls = fetchMock.mock.calls.map(c => String(c[0]))
    expect(urls.findIndex(u => u.includes('/entries')))
      .toBeLessThan(urls.findIndex(u => u.includes('/publish')))

    const entryCall = fetchMock.mock.calls.find(c => String(c[0]).includes('/entries'))
    expect(JSON.parse(entryCall![1]!.body as string)).toMatchObject({
      type: 'intention',
      content: 'My intention for today.',
    })
  })

  it('confirms with a tick once published', async () => {
    mockApi()
    const user = userEvent.setup()
    renderHub(makeTodayData({ entries: [makeEntry()] }))

    await user.click(publishButton())

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /✓ Published/ })).toBeInTheDocument()
    })
  })
})

describe('/today — failures never lose writing', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  it('keeps the text on screen when adding an entry fails', async () => {
    mockApi({ '/entries': () => Response.json({ error: 'nope' }, { status: 500 }) })
    const user = userEvent.setup()
    renderHub()

    await typeIntoSection(user, "Today's Intention", 'Writing that must not vanish.')
    await user.click(screen.getByRole('button', { name: 'Add' }))

    await waitFor(() => {
      expect(screen.getByText(/Couldn't save that/)).toBeInTheDocument()
    })
    // The editor is still open and still holds every word.
    expect(screen.getByDisplayValue('Writing that must not vanish.')).toBeInTheDocument()
  })

  it('keeps the text and publishes nothing when the pre-publish save fails', async () => {
    const fetchMock = mockApi({ '/entries': () => Response.json({}, { status: 500 }) })
    const user = userEvent.setup()
    renderHub()

    await typeIntoSection(user, "Today's Intention", 'Writing that must not vanish.')
    await user.click(publishButton())

    await waitFor(() => {
      expect(screen.getByText(/could not be saved, so nothing was published/)).toBeInTheDocument()
    })
    expect(screen.getByDisplayValue('Writing that must not vanish.')).toBeInTheDocument()
    expect(fetchMock.mock.calls.map(c => String(c[0])).some(u => u.includes('/publish'))).toBe(false)
  })

  it('shows no success tick when publishing fails', async () => {
    mockApi({ '/publish': () => Response.json({}, { status: 500 }) })
    const user = userEvent.setup()
    renderHub(makeTodayData({ entries: [makeEntry()] }))

    await user.click(publishButton())

    await waitFor(() => {
      expect(screen.getByText(/Couldn't publish just now/)).toBeInTheDocument()
    })
    expect(screen.queryByRole('button', { name: /✓/ })).not.toBeInTheDocument()
  })
})
