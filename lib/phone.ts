const E164_REGEX = /^\+[1-9]\d{6,14}$/

/** Strip whitespace, dashes and parens, return E.164 string or null if invalid */
export function normalisePhone(raw: string): string | null {
  const cleaned = raw.replace(/[\s\-()]/g, '')
  return E164_REGEX.test(cleaned) ? cleaned : null
}

/** Mask phone for admin display: +44****0000 */
export function maskPhone(phone: string): string {
  if (phone.length < 7) return '***'
  return phone.slice(0, 3) + '****' + phone.slice(-4)
}
