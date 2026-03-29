// Investment model — all financial projections for /investment page
// Pure computation, no side effects. Run server-side and pass data to client charts.

export const PRICE_MONTHLY = 4       // £4/month
export const PRICE_YEARLY  = 36      // £36/year (25% off £48 — equivalent to £3/month)

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export interface ScenarioParams {
  Z:          number  // new free signups per month
  X_new:      number  // % of new signups who upgrade immediately
  X_existing: number  // % of existing free pool who upgrade each month
  Y:          number  // monthly premium churn rate
  W:          number  // % of new premium choosing the yearly plan
}

export interface MonthlyPoint {
  month:          number
  label:          string   // "Apr 2026"
  shortLabel:     string   // "Apr '26"
  newFree:        number
  cumFree:        number
  newConversions: number
  newMonthly:     number
  newYearly:      number
  churn:          number
  premiumMonthly: number
  premiumYearly:  number
  totalPremium:   number
  monthlyRevenue: number
  annualRunRate:  number
}

// Start month: April 2026 = month 1
export function runModel(params: ScenarioParams, months = 24): MonthlyPoint[] {
  const { Z, X_new, X_existing, Y, W } = params
  let F = 0, P_m = 0, P_y = 0
  const results: MonthlyPoint[] = []

  for (let m = 1; m <= months; m++) {
    const idx  = (3 + m - 1) % 12
    const year = 2026 + Math.floor((3 + m - 1) / 12)
    const label      = `${MONTH_NAMES[idx]} ${year}`
    const shortLabel = `${MONTH_NAMES[idx]} '${String(year).slice(2)}`

    const new_conv = X_new * Z + X_existing * F
    const new_m    = new_conv * (1 - W)
    const new_y    = new_conv * W
    const churn_m  = Y * P_m
    const churn_y  = (Y / 12) * P_y

    F   = F   + Z     - new_conv
    P_m = P_m + new_m - churn_m
    P_y = P_y + new_y - churn_y

    const monthRevenue  = P_m * PRICE_MONTHLY + P_y * (PRICE_YEARLY / 12)
    const annualRunRate = monthRevenue * 12

    results.push({
      month:          m,
      label,
      shortLabel,
      newFree:        Math.round(Z),
      cumFree:        Math.round(F),
      newConversions: Math.round(new_conv),
      newMonthly:     Math.round(new_m),
      newYearly:      Math.round(new_y),
      churn:          Math.round(churn_m + churn_y),
      premiumMonthly: Math.round(P_m),
      premiumYearly:  Math.round(P_y),
      totalPremium:   Math.round(P_m + P_y),
      monthlyRevenue: Math.round(monthRevenue),
      annualRunRate:  Math.round(annualRunRate),
    })
  }
  return results
}

export const SCENARIO_PARAMS: Record<'conservative' | 'base' | 'optimistic', ScenarioParams> = {
  conservative: { Z: 400,  X_new: 0.03, X_existing: 0.005, Y: 0.05, W: 0.15 },
  base:         { Z: 953,  X_new: 0.05, X_existing: 0.010, Y: 0.04, W: 0.20 },
  optimistic:   { Z: 1800, X_new: 0.07, X_existing: 0.020, Y: 0.03, W: 0.25 },
}

export const SCENARIO_LABELS = {
  conservative: 'Conservative',
  base:         'Base Case',
  optimistic:   'Optimistic',
}

export const ASSUMPTIONS = [
  {
    variable: 'Z',
    name:     'New free signups per month',
    value:    '953',
    note:     'The primary growth driver — roughly 32 new registrations per day',
  },
  {
    variable: 'X_new',
    name:     '% of new signups upgrading immediately',
    value:    '5%',
    note:     'Industry range: 3–8% for niche wellness apps',
  },
  {
    variable: 'X_existing',
    name:     '% of existing free users upgrading each month',
    value:    '1%',
    note:     'Habit-driven conversion — people upgrade after experiencing the value',
  },
  {
    variable: 'Y',
    name:     'Monthly premium churn rate',
    value:    '4%',
    note:     '~39% annual — in line with typical consumer subscriptions',
  },
  {
    variable: 'W',
    name:     '% of new premium subscribers choosing the yearly plan',
    value:    '20%',
    note:     'Yearly subscribers pay £36 upfront and churn at a much lower rate',
  },
]

export const THREE_YEAR_TARGETS = [
  { year: 'December 2027', month: 21, target: 100_000 },
  { year: 'December 2028', month: 33, target: 250_000 },
  { year: 'December 2029', month: 45, target: 500_000 },
]

// Pre-computed datasets used by charts — exported as constants so server
// component can pass them straight to the client without re-running the model.
export const DATA_CONSERVATIVE = runModel(SCENARIO_PARAMS.conservative, 24)
export const DATA_BASE         = runModel(SCENARIO_PARAMS.base,         24)
export const DATA_OPTIMISTIC   = runModel(SCENARIO_PARAMS.optimistic,   24)

// Combined chart-friendly format: one row per month, all three scenarios
export const CHART_REVENUE: { label: string; conservative: number; base: number; optimistic: number }[] =
  DATA_BASE.map((_, i) => ({
    label:        DATA_BASE[i].shortLabel,
    conservative: DATA_CONSERVATIVE[i].annualRunRate,
    base:         DATA_BASE[i].annualRunRate,
    optimistic:   DATA_OPTIMISTIC[i].annualRunRate,
  }))

export const CHART_USERS: { label: string; free: number; premium: number }[] =
  DATA_BASE.map(d => ({
    label:   d.shortLabel,
    free:    d.cumFree,
    premium: d.totalPremium,
  }))

// Three-year milestone snapshots per scenario
export function getThreeYearSnapshot(scenario: 'conservative' | 'base' | 'optimistic') {
  const data = runModel(SCENARIO_PARAMS[scenario], 45)
  return THREE_YEAR_TARGETS.map(t => ({
    ...t,
    annualRunRate: data[t.month - 1].annualRunRate,
    totalPremium:  data[t.month - 1].totalPremium,
    cumFree:       data[t.month - 1].cumFree,
  }))
}
