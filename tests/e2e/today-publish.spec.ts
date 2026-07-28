import { test, expect } from '@playwright/test'
import { login, shot, resetJournals } from './helpers'

/**
 * The morning journalling flow, end to end, against a real database.
 *
 * Covers the bug reported on 28 Jul 2026: writing typed into a section but not
 * yet added left Publish disabled under "Write at least one entry above".
 */

test.describe('/today — writing and publishing', () => {
  test.beforeEach(async ({ page }) => {
    await resetJournals()
    await login(page)
  })

  test('publishes a journal written straight into the form', async ({ page }, testInfo) => {
    await page.goto('/today')

    const publish = page.getByRole('button', { name: /^(Publish|Republish)$/ })
    await expect(publish).toBeDisabled()
    await shot(page, 'today-empty', testInfo.project.name)

    // Open the intention editor and write, without pressing Add.
    await page.getByRole('button', { name: "Add Today's Intention" }).click()
    await page
      .getByPlaceholder('What is your intention for today?')
      .fill('Set an intention, log how I feel, and let the day do the rest.')

    // The reported bug: this stayed disabled.
    await expect(publish).toBeEnabled()
    await expect(page.getByText(/unsaved writing will be saved/)).toBeVisible()
    await shot(page, 'today-unsaved-writing', testInfo.project.name)

    await publish.click()

    // The entry is saved and the journal published — confirmed on the button.
    await expect(page.getByRole('button', { name: /✓ Published/ })).toBeVisible()
    await expect(
      page.getByText('Set an intention, log how I feel, and let the day do the rest.'),
    ).toBeVisible()
    await shot(page, 'today-published', testInfo.project.name)

    // And it survives a reload — it really reached the database.
    await page.reload()
    await expect(
      page.getByText('Set an intention, log how I feel, and let the day do the rest.'),
    ).toBeVisible()
    await expect(page.getByText('Published')).toBeVisible()
  })

  test('saves an entry pressed through Add', async ({ page }) => {
    await page.goto('/today')

    await page.getByRole('button', { name: "Add I'm Grateful For" }).click()
    await page
      .getByPlaceholder('What are you grateful for right now?')
      .fill('The person who turned up with a bike.')
    await page.getByRole('button', { name: 'Add', exact: true }).click()

    await expect(page.getByText('The person who turned up with a bike.')).toBeVisible()
    await expect(page.getByRole('button', { name: /^Publish$/ })).toBeEnabled()
  })

  test('records a scale and keeps it after reload', async ({ page }) => {
    await page.goto('/today')

    // The pill updates optimistically, so wait for the write to land before
    // reloading — otherwise the test races the request and proves nothing.
    const [response] = await Promise.all([
      page.waitForResponse(
        r => r.url().includes('/scale-entries') && r.request().method() === 'PUT',
      ),
      page.locator('.td-scale-pill').filter({ hasText: '5' }).first().click(),
    ])
    expect(response.ok()).toBe(true)
    await expect(page.locator('.td-scale-pill--selected').first()).toBeVisible()

    await page.reload()
    await expect(page.locator('.td-scale-pill--selected').first()).toBeVisible()
  })
})

test.describe('the reading experience stays sacred', () => {
  test('a published journal shows the words and no navigation', async ({ page }, testInfo) => {
    await resetJournals()
    await login(page)
    await page.goto('/today')

    await page.getByRole('button', { name: "Add Today's Intention" }).click()
    await page.getByPlaceholder('What is your intention for today?').fill('Words on a page.')
    await page.getByRole('button', { name: /^(Publish|Republish)$/ }).click()
    await expect(page.getByRole('button', { name: /✓/ })).toBeVisible()

    await page.getByRole('link', { name: 'View journal' }).click()
    await expect(page.getByText('Words on a page.')).toBeVisible({ timeout: 45_000 })
    // Streams in behind a Suspense boundary, after every other section.
    await expect(page.getByText(/you have been reading/i)).toBeVisible({ timeout: 45_000 })
    await shot(page, 'journal-reading', testInfo.project.name)
  })
})
