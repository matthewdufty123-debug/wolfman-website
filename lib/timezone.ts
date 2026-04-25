/**
 * Returns the current date in the user's timezone as 'YYYY-MM-DD'.
 * Uses en-CA locale which natively formats as YYYY-MM-DD.
 */
export function getUserLocalDate(timezone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

/** Regex for validating IANA timezone format (Continent/City or Continent/Region/City) */
export const VALID_TZ_RE = /^[A-Za-z_]+\/[A-Za-z_]+(?:\/[A-Za-z_]+)?$/

/** Validates that a timezone string is a real IANA timezone */
export function isValidTimezone(tz: string): boolean {
  if (!VALID_TZ_RE.test(tz)) return false
  try {
    new Intl.DateTimeFormat('en', { timeZone: tz })
    return true
  } catch {
    return false
  }
}
